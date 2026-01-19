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
            <div className="flex h-2 rounded-full overflow-hidden w-full bg-gray-100">
                {distribution.map(d => (
                    <div
                        key={d.name}
                        style={{ width: `${d.pct}%`, backgroundColor: d.color }}
                        title={`${d.name}: ${d.mins}m`}
                    />
                ))}
            </div>
        </div>
    );
}

export function DayView({ intents, onOpenPanel, onUpdate }: DayViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
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

        // INVERTED LOGIC: Moving Mouse DOWN (positive deltaY) -> Time DECREASES.
        const deltaMinutes = Math.round((-deltaY / pixelsPerMinute) / SNAP_MINUTES) * SNAP_MINUTES;

        if (draggingId) {
            const newDate = new Date(dragStartRef.current.originalDate.getTime() + deltaMinutes * 60000);
            setDraftState(prev => ({ ...prev, startTime: newDate }));
        }

        if (resizingId) {
            // Dragging TOP handle UP (negative deltaY, positive deltaMinutes) -> Increases Duration (Later End Time)
            const newDuration = Math.max(SNAP_MINUTES, dragStartRef.current.originalDuration + deltaMinutes);
            setDraftState(prev => ({ ...prev, duration: newDuration }));
        }
    };

    const handleMouseUp = async () => {
        const targetId = draggingId || resizingId;

        if (targetId && draftState) {
            const update: IntentUpdate = {};
            if (draggingId && draftState.startTime) {
                update.created_at = draftState.startTime.toISOString();
            }
            if (resizingId && draftState.duration) {
                update.duration_minutes = draftState.duration;
            }
            await onUpdate(targetId, update);
        }

        setDraggingId(null);
        setResizingId(null);
        setDraftState(null);
        dragStartRef.current = null;
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
        dragStartRef.current = {
            y: e.clientY,
            originalDate: new Date(intent.created_at),
            originalDuration: intent.duration_minutes || 15
        };
        setDraftState({ startTime: new Date(intent.created_at) });
    };

    const startResize = (e: React.MouseEvent, intent: IntentWithTags) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingId(intent.id);
        dragStartRef.current = {
            y: e.clientY,
            originalDate: new Date(intent.created_at),
            originalDuration: intent.duration_minutes || 15
        };
        setDraftState({ duration: intent.duration_minutes || 15 });
    };

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
                <div style={{ height: MINUTES_IN_DAY * pixelsPerMinute }} className="relative w-full">
                    {/* Background Grid - Descending: 24 (Top) -> 00 (Bottom) */}
                    {Array.from({ length: 25 }).map((_, i) => {
                        const hour = 24 - i; // 24, 23, ... 0
                        return (
                            <div
                                key={hour}
                                className="absolute w-full border-t border-gray-50 flex items-center"
                                style={{ top: i * 60 * pixelsPerMinute, height: 60 * pixelsPerMinute }}
                            >
                                <span className="text-[10px] text-gray-300 font-mono ml-4 -mt-[calc(60*var(--ppm))] transform -translate-y-1/2 select-none"
                                    style={{ '--ppm': pixelsPerMinute } as React.CSSProperties}>
                                    {hour === 24 ? '00:00 (Next)' : `${hour.toString().padStart(2, '0')}:00`}
                                </span>
                            </div>
                        );
                    })}

                    {/* Current Time Indicator */}
                    {now && (
                        <div
                            className="absolute w-full border-t-2 border-red-400 z-30 pointer-events-none flex items-center"
                            style={{ top: getTopFromTime(now) }}
                        >
                            <div className="w-2 h-2 rounded-full bg-red-400 -ml-1" />
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

                        return (
                            <div
                                key={intent.id}
                                className={`absolute left-14 right-2 rounded-md border text-xs overflow-hidden group select-none transition-shadow ${isDragging ? 'z-50 shadow-lg opacity-90' : 'z-10 hover:z-20'}`}
                                style={{
                                    top,
                                    height: Math.max(height, isZoomed ? 20 : 10), // Smaller min height in Fit mode
                                    backgroundColor: isDragging ? '#fff' : `${primaryColor}15`,
                                    borderColor: `${primaryColor}40`,
                                    borderLeftWidth: 4,
                                    borderLeftColor: primaryColor,
                                    cursor: 'grab'
                                }}
                                onMouseDown={(e) => startDrag(e, intent)}
                                onClick={() => {
                                    if (!isDragging && !isResizing) onOpenPanel(intent);
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

                                {/* Content - Force to bottom with absolute positioning */}
                                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 pointer-events-none">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 truncate leading-tight">
                                            {intent.title}
                                        </div>
                                        {/* Hide time if too short for readability in Fit mode */}
                                        {height > (isZoomed ? 30 : 15) && (
                                            <div className="text-[10px] text-gray-500 font-mono leading-tight">
                                                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
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
