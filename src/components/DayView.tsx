'use client';

import { useMemo } from 'react';
import type { IntentWithTags, TagWithCategory } from '@/types/database';

interface DayViewProps {
    intents: IntentWithTags[];
    onOpenPanel: (intent: IntentWithTags) => void;
}

export function DayView({ intents, onOpenPanel }: DayViewProps) {
    // Filter for today's intents and sort chronologically (oldest first)
    const todaysIntents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return intents
            .filter(intent => {
                const date = new Date(intent.created_at);
                return date >= today;
            })
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }, [intents]);

    if (todaysIntents.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Timeline</h2>
                <p className="text-gray-400 text-sm text-center py-8">
                    No activity yet today.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Today's Timeline</h2>

            <div className="relative pl-4 space-y-6">
                {/* Vertical line through the timeline */}
                <div className="absolute top-2 bottom-2 left-[19px] w-0.5 bg-gray-100" />

                {todaysIntents.map((intent, index) => {
                    const date = new Date(intent.created_at);
                    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    // Use the color of the first category, or gray if none
                    const primaryColor = intent.categories?.[0]?.color || '#9ca3af';

                    return (
                        <div
                            key={intent.id}
                            className="relative flex gap-4 group cursor-pointer"
                            onClick={() => onOpenPanel(intent)}
                        >
                            {/* Timeline dot */}
                            <div
                                className="absolute left-0 mt-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-125"
                                style={{ backgroundColor: primaryColor }}
                            />

                            {/* Content */}
                            <div className="flex-1 min-w-0 pl-2">
                                <span className="text-xs font-medium text-gray-400 block mb-0.5">
                                    {timeString}
                                </span>
                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                    {intent.title}
                                </p>
                                {intent.duration_minutes && (
                                    <span className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                        {intent.duration_minutes}m
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
