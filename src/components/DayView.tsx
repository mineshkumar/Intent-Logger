'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import type { IntentWithTags, IntentUpdate } from '@/types/database';

interface DayViewProps {
    intents: IntentWithTags[];
    onOpenPanel: (intent: IntentWithTags) => void;
    onUpdate: (id: string, updates: IntentUpdate) => Promise<void>;
}

const PIXELS_PER_MINUTE = 2;
const SNAP_MINUTES = 5;
const MINUTES_IN_DAY = 24 * 60;

function DailyPulse({ intents }: { intents: IntentWithTags[] }) {
    const distribution = useMemo(() => {
        const total = intents.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
        if (total === 0) return [];

        const byCategory: Record<string, { mins: number; color: string; name: string }> = {};

        intents.forEach(i => {
            const cat = i.categories?.[0];
            const name = cat ? cat.name : 'Uncategorized';
            const color = cat ? cat.color : '#cbd5e1';
            const key = name;

            if (!byCategory[key]) byCategory[key] = { mins: 0, color, name };
            byCategory[key].mins += (i.duration_minutes || 0);
        });

        return Object.values(byCategory)
            .sort((a, b) => b.mins - a.mins)
            .map(c => ({
                ...c,
                pct: (c.mins / total) * 100
            }));
    }, [intents]);

    if (distribution.length === 0) return null;

    return (
        <div className="mb-6 px-6 pt-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Daily Pulse</h3>
            <div className="flex h-3 rounded-full overflow-hidden w-full bg-gray-100 shadow-inner">
                {distribution.map(d => (
                    <div
                        key={d.name}
                        className="transition-all duration-500 hover:opacity-90"
                        style={{
                            width: `${d.pct}%`,
                            backgroundColor: d.color,
                            boxShadow: `0 0 10px ${d.color}40` // Glow effect
                        }}
                        title={`${d.name}: ${d.mins}m`}
                    />
                ))}
            </div>
        </div>
    );
}

export function DayView({ intents, onOpenPanel, onUpdate }: DayViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const hasMovedRef = useRef(false);
    const [containerHeight, setContainerHeight] = useState(800);
    const [isZoomed, setIsZoomed] = useState(false);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [resizingId, setResizingId] = useState<string | null>(null);
    const [now, setNow] = useState<Date | null>(null);

    // Draft state for immediate visual feedback
    const [draftState, setDraftState] = useState<{
        startTime?: Date;
        duration?: number;
    } | null>(null);

    // Ref to track draft state for event handlers (avoids stale closure)
    const draftValuesRef = useRef<{
        startTime?: Date;
        duration?: number;
    } | null>(null);

    // Initial drag/resize position
    const dragStartRef = useRef<{ y: number; originalDate: Date; originalDuration: number } | null>(null);
    const hasScrolledRef = useRef(false);

    const pixelsPerMinute = useMemo(() => {
        if (isZoomed) return 2; // Fixed detailed view
        // Fit 24h into the container height
        return Math.max(0.2, containerHeight / MINUTES_IN_DAY);
    }, [isZoomed, containerHeight]);

    // Measure container height for dynamic scaling
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Clock
    useEffect(() => {
        setNow(new Date());
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Filter for today's intents
    const todaysIntents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return intents.filter(intent => {
            const date = new Date(intent.created_at);
            return date.toDateString() === today.toDateString();
        });
    }, [intents]);

    // Helpers for Descending Timeline (00:00 at bottom, 24:00 at top)
    const getTopFromTime = (date: Date) => {
        const minutes = date.getHours() * 60 + date.getMinutes();
        return (MINUTES_IN_DAY - minutes) * pixelsPerMinute;
    };

    // Auto-scroll logic (only for Zoomed mode, or initial load? Fit mode doesn't need scroll)
    useEffect(() => {
        if (isZoomed && containerRef.current && !hasScrolledRef.current && now) {
            const top = getTopFromTime(now);
            const scrollTarget = Math.max(0, top - containerHeight / 2);
            containerRef.current.scrollTop = scrollTarget;
            hasScrolledRef.current = true;
        }
    }, [now, isZoomed, containerHeight, pixelsPerMinute]);

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragStartRef.current || !containerRef.current) return;

        const deltaY = e.clientY - dragStartRef.current.y;

        // Track if moved significantly to prevent click
        if (Math.abs(deltaY) > 2) {
            hasMovedRef.current = true;
        }

        // INVERTED LOGIC: Moving Mouse DOWN (positive deltaY) -> Time DECREASES.
        // We want to snap the *final* time, not just the delta.
        // Raw change in minutes
        const rawDeltaMinutes = (-deltaY / pixelsPerMinute);

        if (draggingId) {
            const originalTime = dragStartRef.current.originalDate.getTime();
            const newRawTime = originalTime + rawDeltaMinutes * 60000;

            // Snap the NEW time to nearest 5 minutes
            const snappedTime = Math.round(newRawTime / (SNAP_MINUTES * 60000)) * (SNAP_MINUTES * 60000);
            const newDate = new Date(snappedTime);

            setDraftState(prev => ({ ...prev, startTime: newDate }));
            // Update ref for logic
            draftValuesRef.current = { ...draftValuesRef.current, startTime: newDate };
        }

        if (resizingId) {
            // Dragging TOP handle UP (negative deltaY) -> Increases Duration (Later End Time)
            // Resize logic: (change in minutes) + original duration
            const deltaMinutes = Math.round(rawDeltaMinutes / SNAP_MINUTES) * SNAP_MINUTES;
            const newDuration = Math.max(SNAP_MINUTES, dragStartRef.current.originalDuration + deltaMinutes);

            // Note: Since we drag the top handle, changing duration actually changes the End Time in a descending timeline?
            // Wait, in Descending (Top=Future, Bottom=Past):
            // The card is anchored at `top` (EndTime). 
            // `top` = (MINUTES_IN_DAY - endTimeMinutes) * Scale.
            // StartTime is at `bottom` of card. 
            // In the previous logic:
            // Intent: { created_at: StartTime, duration }
            // If I pull the top handle UP (negative deltaY), I am moving to a LATER time (closer to 24:00).
            // So `endTime` increases. Duration increases. StartTime stays same?
            // "Resize Handle - AT TOP for Descending".
            // Yes. Top = EndTime. Dragging Up = Later EndTime = Longer Duration.

            setDraftState(prev => ({ ...prev, duration: newDuration }));
            // Update ref for logic
            draftValuesRef.current = { ...draftValuesRef.current, duration: newDuration };
        }
    };

    const handleMouseUp = async () => {
        const targetId = draggingId || resizingId;
        const finalValues = draftValuesRef.current;

        if (targetId && finalValues) {
            const update: IntentUpdate = {};
            if (draggingId && finalValues.startTime) {
                update.created_at = finalValues.startTime.toISOString();
            }
            if (resizingId && finalValues.duration) {
                update.duration_minutes = finalValues.duration;
            }
            // Fire and forget update
            onUpdate(targetId, update);
        }

        setDraggingId(null);
        setResizingId(null);
        setDraftState(null);
        draftValuesRef.current = null;
        dragStartRef.current = null;

        // Reset move tracker after a tick to allow click handler to check it
        setTimeout(() => {
            if (hasMovedRef.current) hasMovedRef.current = false;
        }, 0);
    };

    useEffect(() => {
        if (draggingId || resizingId) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = draggingId ? 'grabbing' : 'ns-resize';
            document.body.style.userSelect = 'none';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [draggingId, resizingId, pixelsPerMinute]); // Added pixelsPerMinute dep logic

    const startDrag = (e: React.MouseEvent, intent: IntentWithTags) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingId(intent.id);
        hasMovedRef.current = false;
        dragStartRef.current = {
            y: e.clientY,
            originalDate: new Date(intent.created_at),
            originalDuration: intent.duration_minutes || 15
        };
        // Initialize draft state and ref
        const initialDate = new Date(intent.created_at);
        setDraftState({ startTime: initialDate });
        draftValuesRef.current = { startTime: initialDate };
    };

    const startResize = (e: React.MouseEvent, intent: IntentWithTags) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingId(intent.id);
        hasMovedRef.current = false;
        dragStartRef.current = {
            y: e.clientY,
            originalDate: new Date(intent.created_at),
            originalDuration: intent.duration_minutes || 15
        };
        // Initialize draft state and ref
        const initialDuration = intent.duration_minutes || 15;
        setDraftState({ duration: initialDuration });
        draftValuesRef.current = { duration: initialDuration };
    };

    const timeZones = [
        { name: 'Night', start: 0, end: 6, color: 'bg-[#F8FAFC]' }, // Slate-50 solid
        { name: 'Morning', start: 6, end: 12, color: 'bg-[#FFF7ED]' }, // Orange-50 solid
        { name: 'Afternoon', start: 12, end: 18, color: 'bg-[#EFF6FF]' }, // Blue-50 solid
        { name: 'Evening', start: 18, end: 24, color: 'bg-[#F5F3FF]' }, // Violet-50 solid
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-4 h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
            <div className="px-6 pt-4 pb-2 bg-white z-20 flex-shrink-0 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Timeline</h2>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button
                        onClick={() => setIsZoomed(false)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${!isZoomed ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Fit
                    </button>
                    <button
                        onClick={() => setIsZoomed(true)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${isZoomed ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Zoom
                    </button>
                </div>
            </div>

            <DailyPulse intents={todaysIntents} />
            <div className="border-b border-gray-100 w-full mb-0 flex-shrink-0" />

            <div
                ref={containerRef}
                className={`relative w-full flex-1 overflow-x-hidden ${isZoomed ? 'overflow-y-auto scroll-smooth' : 'overflow-hidden'}`}
            >
                <div
                    style={{
                        height: MINUTES_IN_DAY * pixelsPerMinute,
                        // Clean grid: removed radial-gradient
                    }}
                    className="relative w-full"
                >
                    {/* Time Zones (Background) */}
                    {timeZones.map(zone => {
                        // Descending: 24 at top, 0 at bottom.
                        // Zone Start (e.g. 6) is closer to bottom than End (12).
                        // Top = (24 - zone.end) * 60 * pixelsPerMinute;
                        // Height = (zone.end - zone.start) * 60 * pixelsPerMinute;
                        const top = (MINUTES_IN_DAY - (zone.end * 60)) * pixelsPerMinute;
                        const height = (zone.end - zone.start) * 60 * pixelsPerMinute;

                        return (
                            <div
                                key={zone.name}
                                className={`absolute w-full left-0 right-0 ${zone.color} flex justify-end items-start pr-4 pt-2`}
                                style={{ top, height }}
                            >
                                <span className="text-[10px] uppercase font-bold tracking-widest text-black/5 writing-mode-vertical">
                                    {zone.name}
                                </span>
                            </div>
                        );
                    })}

                    {/* Background Grid - Descending: 24 (Top) -> 00 (Bottom) */}
                    {Array.from({ length: 25 }).map((_, i) => {
                        const hour = 24 - i; // 24, 23, ... 0

                        // Smart labels: 12h format
                        let label = `${hour}`;
                        if (hour === 0 || hour === 24) label = '12';
                        else if (hour > 12) label = `${hour - 12}`;

                        // Hide 24/0 redundancy at edges if preferred, but usually 12 is fine.
                        // User wants "11" instead of "11:00". "1" instead of "13:00".

                        return (
                            <div
                                key={hour}
                                className="absolute w-full border-t border-gray-100/50 flex items-center"
                                style={{ top: i * 60 * pixelsPerMinute, height: 60 * pixelsPerMinute }}
                            >
                                <span className="text-xs font-semibold text-gray-300 ml-4 -mt-[calc(60*var(--ppm))] transform -translate-y-1/2 select-none w-6 text-center"
                                    style={{ '--ppm': pixelsPerMinute } as React.CSSProperties}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}

                    {/* Current Time Indicator */}
                    {now && (
                        <div
                            className="absolute w-full border-t-2 border-red-400 z-[60] flex items-center shadow-[0_0_8px_rgba(248,113,113,0.6)] transition-all duration-1000 ease-linear group"
                            style={{ top: getTopFromTime(now) }}
                        >
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 border-2 border-white shadow-sm" />

                            {/* Hover Tooltip for Time */}
                            <div className="absolute left-4 -top-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </div>
                        </div>
                    )}

                    {/* Intents */}
                    {todaysIntents.map(intent => {
                        const isDragging = draggingId === intent.id;
                        const isResizing = resizingId === intent.id;

                        const date = (isDragging && draftState?.startTime)
                            ? draftState.startTime
                            : new Date(intent.created_at);

                        const duration = (isResizing && draftState?.duration)
                            ? draftState.duration
                            : (intent.duration_minutes || 15);

                        // Position calculation for Descending
                        // Top of Div should be the LATER time (End Time)
                        const endTime = new Date(date.getTime() + duration * 60000);
                        const top = getTopFromTime(endTime);
                        const height = duration * pixelsPerMinute;
                        const primaryColor = intent.categories?.[0]?.color || '#9ca3af';

                        // Check if Active (Current Time is within this intent)
                        const isActive = now && date <= now && endTime > now;

                        return (
                            <div
                                key={intent.id}
                                className={`absolute left-14 right-2 rounded-md border text-xs overflow-hidden group select-none transition-shadow ${isDragging ? 'z-50 shadow-lg opacity-90' : 'z-10 hover:z-20'
                                    } ${isActive ? 'ring-2 ring-indigo-400/50 shadow-md z-30' : ''}`}
                                style={{
                                    top,
                                    // Google Style: Force min-height to ensure text is visible (approx 22px for 1 line)
                                    // Visually it might overlap the next time slot, which is standard behavior
                                    height: Math.max(height, 24),
                                    backgroundColor: isDragging ? '#fff' : `${primaryColor}15`,
                                    borderColor: isActive ? '#818cf8' : `${primaryColor}40`,
                                    borderLeftWidth: 4,
                                    borderLeftColor: primaryColor,
                                    cursor: 'grab'
                                }}
                                onMouseDown={(e) => startDrag(e, intent)}
                                onClick={() => {
                                    if (!isDragging && !isResizing && !hasMovedRef.current) onOpenPanel(intent);
                                }}
                            >
                                {/* Resize Handle - AT TOP for Descending */}
                                {!isDragging && (
                                    <div
                                        className="absolute top-0 left-0 right-0 h-3 -mt-1 hover:bg-black/5 cursor-ns-resize flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity z-50"
                                        onMouseDown={(e) => startResize(e, intent)}
                                    >
                                        <div className="w-6 h-0.5 rounded-full bg-gray-400 shadow-sm" />
                                    </div>
                                )}

                                {/* Content - Google Style: Always inside */}
                                <div className="absolute top-0 bottom-0 left-0 right-0 px-2 flex items-center pointer-events-none">
                                    <div className="min-w-0 w-full">
                                        <div className="flex items-baseline gap-1.5">
                                            {/* Title */}
                                            <span className="font-semibold text-gray-900 truncate leading-tight block">
                                                {intent.title}
                                            </span>

                                            {/* Duration (only if space permits width-wise, or effectively just secondary text) */}
                                            <span className="text-[10px] text-gray-500 font-normal whitespace-nowrap">
                                                {duration}m
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
