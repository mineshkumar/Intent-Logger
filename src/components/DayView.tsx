'use client';

import { useMemo } from 'react';
import type { IntentWithTags, TagWithCategory } from '@/types/database';

interface DayViewProps {
    intents: IntentWithTags[];
    onOpenPanel: (intent: IntentWithTags) => void;
}

export function DayView({ intents, onOpenPanel }: DayViewProps) {
    // Filter for today's intents, sort newest first, and group by time of day
    const groupedIntents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysList = intents
            .filter(intent => {
                const date = new Date(intent.created_at);
                return date >= today;
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const groups: Record<string, IntentWithTags[]> = {
            Evening: [],
            Afternoon: [],
            Morning: []
        };

        todaysList.forEach(intent => {
            const date = new Date(intent.created_at);
            const hour = date.getHours();

            if (hour >= 17) groups.Evening.push(intent);
            else if (hour >= 12) groups.Afternoon.push(intent);
            else groups.Morning.push(intent);
        });

        return groups;
    }, [intents]);

    const hasActivity = Object.values(groupedIntents).some(g => g.length > 0);

    if (!hasActivity) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Timeline</h2>
                <p className="text-gray-400 text-sm text-center py-8">
                    No activity yet today.
                </p>
            </div>
        );
    }

    const sections = [
        { title: 'Evening', data: groupedIntents.Evening },
        { title: 'Afternoon', data: groupedIntents.Afternoon },
        { title: 'Morning', data: groupedIntents.Morning }
    ].filter(s => s.data.length > 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Today&apos;s Timeline</h2>

            <div className="space-y-8">
                {sections.map(section => (
                    <div key={section.title} className="relative pl-4">
                        {/* Section Header */}
                        <div className="absolute left-0 -ml-1.5 mt-0.5 w-3 h-3 rounded-full bg-gray-200 border-2 border-white z-10" />
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 pl-2">
                            {section.title}
                        </h3>

                        {/* Timeline Line */}
                        <div className="absolute top-3 bottom-0 left-[3px] w-0.5 bg-gray-100" />

                        <div className="space-y-6">
                            {section.data.map((intent) => {
                                const date = new Date(intent.created_at);
                                const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const primaryColor = intent.categories?.[0]?.color || '#9ca3af';

                                return (
                                    <div
                                        key={intent.id}
                                        className="relative flex gap-4 group cursor-pointer"
                                        onClick={() => onOpenPanel(intent)}
                                    >
                                        {/* Item Dot */}
                                        <div
                                            className="absolute left-[-1.125rem] mt-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-125"
                                            style={{ backgroundColor: primaryColor }}
                                        />

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
                ))}
            </div>
        </div>
    );
}
