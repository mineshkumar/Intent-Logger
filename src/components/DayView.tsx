'use client';

import { useMemo } from 'react';
import type { IntentWithTags } from '@/types/database';

interface DayViewProps {
    intents: IntentWithTags[];
    onOpenPanel: (intent: IntentWithTags) => void;
}

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
        <div className="mb-6">
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

export function DayView({ intents, onOpenPanel }: DayViewProps) {
    // Filter for today's intents, sort newest first
    const todaysIntents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return intents
            .filter(intent => {
                const date = new Date(intent.created_at);
                return date.toDateString() === today.toDateString();
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [intents]);

    const sections = useMemo(() => {
        const groups: Record<string, IntentWithTags[]> = {
            Evening: [],
            Afternoon: [],
            Morning: []
        };
        todaysIntents.forEach(intent => {
            const date = new Date(intent.created_at);
            const hour = date.getHours();
            if (hour >= 17) groups.Evening.push(intent);
            else if (hour >= 12) groups.Afternoon.push(intent);
            else groups.Morning.push(intent);
        });

        return [
            { title: 'Evening', data: groups.Evening },
            { title: 'Afternoon', data: groups.Afternoon },
            { title: 'Morning', data: groups.Morning }
        ].filter(s => s.data.length > 0);
    }, [todaysIntents]);


    if (todaysIntents.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Timeline</h2>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <span className="text-2xl">☀️</span>
                    </div>
                    <p className="text-gray-900 font-medium">Ready to start?</p>
                    <p className="text-sm text-gray-500 mt-1">Log your first intent for today.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Timeline</h2>

            <DailyPulse intents={todaysIntents} />

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

                        <div className="space-y-0"> {/* Removed space-y, handling manually */}
                            {section.data.map((intent, index) => {
                                const nextIntent = section.data[index + 1];
                                const date = new Date(intent.created_at);
                                const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const primaryColor = intent.categories?.[0]?.color || '#9ca3af';

                                // Calculate gap to next item (which is previous in time)
                                let gapHeight = 16; // default base gap
                                if (nextIntent) {
                                    const prevDate = new Date(nextIntent.created_at);
                                    // Time difference in minutes
                                    const diffMins = (date.getTime() - prevDate.getTime()) / 60000;
                                    // Scale: 1 min = 1px? capped at some value
                                    gapHeight = Math.min(Math.max(16, diffMins), 120);
                                }

                                return (
                                    <div key={intent.id} style={{ marginBottom: index === section.data.length - 1 ? 0 : gapHeight }}>
                                        <div
                                            className="relative flex gap-4 group cursor-pointer"
                                            onClick={() => onOpenPanel(intent)}
                                        >
                                            {/* Item Dot */}
                                            <div
                                                className="absolute left-[-1.125rem] mt-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10 transition-transform group-hover:scale-125"
                                                style={{ backgroundColor: primaryColor }}
                                            />

                                            <div className="flex-1 min-w-0 pl-2">
                                                <span className="text-[10px] font-medium text-gray-400 block mb-0.5 uppercase tracking-wide">
                                                    {timeString}
                                                </span>
                                                <div className="p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 -ml-2">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {intent.title}
                                                    </p>
                                                    {intent.duration_minutes && (
                                                        <span className="text-xs text-gray-500 mt-0.5 block">
                                                            {intent.duration_minutes}m
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Visual Gap Line is actually the main line. We just adding space. 
                                            Maybe add a 'dashed' line if gap is large? */}
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
