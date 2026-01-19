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
        // Inverted: Full day (top=0) is 24:00. 00:00 is at top=2880.
        // Formula: (24*60 - minutes) * Scale
        return (MINUTES_IN_DAY - minutes) * PIXELS_PER_MINUTE;
    };

    // Auto-scroll logic for descending
    useEffect(() => {
        if (containerRef.current && !hasScrolledRef.current && now) {
            const top = getTopFromTime(now);
            // Scroll to center 'now' if possible, or have it near top since we look down for history
            const scrollTarget = Math.max(0, top - 300);
            containerRef.current.scrollTop = scrollTarget;
            hasScrolledRef.current = true;
        }
    }, [now]);

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragStartRef.current || !containerRef.current) return;

        const deltaY = e.clientY - dragStartRef.current.y;

        // INVERTED LOGIC: Moving Mouse DOWN (positive deltaY) -> Time DECREASES.
        const deltaMinutes = Math.round((-deltaY / PIXELS_PER_MINUTE) / SNAP_MINUTES) * SNAP_MINUTES;

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
    }, [draggingId, resizingId]);

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
            <div className="px-6 pt-4 pb-2 bg-white z-20 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Timeline</h2>
            </div>

            <DailyPulse intents={todaysIntents} />
            <div className="border-b border-gray-100 w-full mb-0 flex-shrink-0" />

            <div
                ref={containerRef}
                className="relative w-full flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
            >
                <div style={{ height: MINUTES_IN_DAY * PIXELS_PER_MINUTE }} className="relative w-full">
                    {/* Background Grid - Descending: 24 (Top) -> 00 (Bottom) */}
                    {Array.from({ length: 25 }).map((_, i) => {
                        const hour = 24 - i; // 24, 23, ... 0
                        return (
                            <div
                                key={hour}
                                className="absolute w-full border-t border-gray-50 flex items-center"
                                style={{ top: i * 60 * PIXELS_PER_MINUTE, height: 60 * PIXELS_PER_MINUTE }}
                            >
                                <span className="text-[10px] text-gray-300 font-mono ml-4 -mt-[calc(60*PIXELS_PER_MINUTE)] transform -translate-y-1/2 select-none">
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
                        const height = duration * PIXELS_PER_MINUTE;
                        const primaryColor = intent.categories?.[0]?.color || '#9ca3af';

                        return (
                            <div
                                key={intent.id}
                                className={`absolute left-14 right-2 rounded-md border text-xs overflow-hidden group select-none transition-shadow ${isDragging ? 'z-50 shadow-lg opacity-90' : 'z-10 hover:z-20'
                                    }`}
                                style={{
                                    top,
                                    height: Math.max(height, 20),
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
                                        className="absolute top-0 left-0 right-0 h-2 hover:bg-black/5 cursor-ns-resize flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                        onMouseDown={(e) => startResize(e, intent)}
                                    >
                                        <div className="w-6 h-0.5 rounded-full bg-gray-300" />
                                    </div>
                                )}

                                {/* Content - Force to bottom with absolute positioning */}
                                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 pointer-events-none">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 truncate leading-tight">
                                            {intent.title}
                                        </div>
                                        {height > 30 && (
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
