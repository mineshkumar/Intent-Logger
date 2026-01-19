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

export function DayView({ intents, onOpenPanel, onUpdate }: DayViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [resizingId, setResizingId] = useState<string | null>(null);

    // Draft state for immediate visual feedback
    const [draftState, setDraftState] = useState<{
        startTime?: Date;
        duration?: number;
    } | null>(null);

    // Initial drag/resize position
    const dragStartRef = useRef<{ y: number; originalDate: Date; originalDuration: number } | null>(null);

    // Filter for today's intents
    const todaysIntents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return intents.filter(intent => {
            const date = new Date(intent.created_at);
            return date.toDateString() === today.toDateString();
        });
    }, [intents]);

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragStartRef.current || !containerRef.current) return;

        const deltaY = e.clientY - dragStartRef.current.y;
        const deltaMinutes = Math.round((deltaY / PIXELS_PER_MINUTE) / SNAP_MINUTES) * SNAP_MINUTES;

        if (draggingId) {
            const newDate = new Date(dragStartRef.current.originalDate.getTime() + deltaMinutes * 60000);

            // Clamp to today (optional, but good for UX)
            // For now, just ensure we don't switch days if we can help it, 
            // but the UI logic mainly cares about time within the day.

            setDraftState(prev => ({ ...prev, startTime: newDate }));
        }

        if (resizingId) {
            const newDuration = Math.max(SNAP_MINUTES, dragStartRef.current.originalDuration + deltaMinutes);
            setDraftState(prev => ({ ...prev, duration: newDuration }));
        }
    };

    const handleMouseUp = async () => {
        const targetId = draggingId || resizingId;

        if (targetId && draftState) {
            const update: IntentUpdate = {};

            if (draggingId && draftState.startTime) {
                update.created_at = draftState.startTime.toISOString(); // created_at acts as start time
            }

            if (resizingId && draftState.duration) {
                update.duration_minutes = draftState.duration;
            }

            // Optimistic update locally? 
            // The parent component should handle data refresh, but we can await here.
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
    }, [draggingId, resizingId]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Helper to get vertical position from time
    const getTopFromDate = (date: Date) => {
        const minutes = date.getHours() * 60 + date.getMinutes();
        return minutes * PIXELS_PER_MINUTE;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-fit sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-100 flex-shrink-0 z-20 bg-white">
                Today&apos;s Timeline
            </h2>

            <div
                ref={containerRef}
                className="relative w-full flex-1"
                style={{ height: 24 * 60 * PIXELS_PER_MINUTE }}
            >
                {/* Background Grid */}
                {Array.from({ length: 24 }).map((_, hour) => (
                    <div
                        key={hour}
                        className="absolute w-full border-t border-gray-50 flex items-center"
                        style={{ top: hour * 60 * PIXELS_PER_MINUTE, height: 60 * PIXELS_PER_MINUTE }}
                    >
                        <span className="text-[10px] text-gray-300 font-mono ml-2 -mt-[calc(60*PIXELS_PER_MINUTE)] transform -translate-y-1/2">
                            {hour.toString().padStart(2, '0')}:00
                        </span>
                    </div>
                ))}

                {/* Current Time Indicator (mocked position for now, or real if we want) */}
                {/* We could add logic to show current time line */}

                {/* Intents */}
                {todaysIntents.map(intent => {
                    const isDragging = draggingId === intent.id;
                    const isResizing = resizingId === intent.id;

                    const date = (isDragging && draftState?.startTime)
                        ? draftState.startTime
                        : new Date(intent.created_at);

                    const duration = (isResizing && draftState?.duration)
                        ? draftState.duration
                        : (intent.duration_minutes || 15); // Default visual duration

                    const top = getTopFromDate(date);
                    const height = duration * PIXELS_PER_MINUTE;
                    const primaryColor = intent.categories?.[0]?.color || '#9ca3af';

                    return (
                        <div
                            key={intent.id}
                            className={`absolute left-10 right-2 rounded-md border text-xs overflow-hidden group select-none transition-shadow ${isDragging ? 'z-50 shadow-lg opacity-90' : 'z-10 hover:z-20'
                                }`}
                            style={{
                                top,
                                height,
                                backgroundColor: `${primaryColor}15`, // very light tint
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
                            <div className="px-2 py-1 flex justify-between items-start pointer-events-none">
                                <div>
                                    <div className="font-semibold text-gray-900 truncate">
                                        {intent.title}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono">
                                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {' - '}
                                        {new Date(date.getTime() + duration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            {/* Resize Handle */}
                            <div
                                className="absolute bottom-0 left-0 right-0 h-3 hover:bg-black/5 cursor-ns-resize flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity"
                                onMouseDown={(e) => startResize(e, intent)}
                            >
                                <div className="w-8 h-1 rounded-full bg-gray-300" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
