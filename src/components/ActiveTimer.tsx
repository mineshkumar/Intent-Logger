'use client';

import { useState, useEffect } from 'react';
import type { IntentWithTags } from '@/types/database';

interface ActiveTimerProps {
    intent: IntentWithTags;
    onComplete: () => void;
}

export function ActiveTimer({ intent, onComplete }: ActiveTimerProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const createdAt = new Date(intent.created_at);
    const durationMins = intent.duration_minutes || 0;
    const expectedEnd = new Date(createdAt.getTime() + durationMins * 60000);

    const isOverdue = now > expectedEnd;
    const totalSeconds = durationMins * 60;

    // Calculate remaining or elapsed
    let displayTime = '';
    let progress = 0; // 0 to 100

    if (durationMins > 0) {
        const diffMs = expectedEnd.getTime() - now.getTime();
        if (diffMs > 0) {
            // Countdown
            const diffSecs = Math.floor(diffMs / 1000);
            const h = Math.floor(diffSecs / 3600);
            const m = Math.floor((diffSecs % 3600) / 60);
            const s = diffSecs % 60;
            displayTime = h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;

            const elapsedSecs = totalSeconds - diffSecs;
            progress = (elapsedSecs / totalSeconds) * 100;
        } else {
            // Overdue
            displayTime = '00:00';
            progress = 100;
        }
    } else {
        // Stopwatch (Elapsed)
        const diffMs = now.getTime() - createdAt.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const h = Math.floor(diffSecs / 3600);
        const m = Math.floor((diffSecs % 3600) / 60);
        // const s = diffSecs % 60;
        displayTime = `${h}h ${m}m`; // Simplified for stopwatch
        progress = 100; // undefined progress
    }

    return (
        <div className="bg-indigo-600 text-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between animate-fade-in relative overflow-hidden">
            {/* Background Progress/Pulse Effect could go here */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-800" />

            <div className="relative z-10 flex items-center gap-4">
                {/* Progress Ring / Icon */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-indigo-400 opacity-30" />
                        <circle
                            cx="24" cy="24" r="20"
                            stroke="currentColor" strokeWidth="4" fill="none"
                            className="text-white transition-all duration-1000"
                            strokeDasharray={126}
                            strokeDashoffset={126 - (126 * progress) / 100}
                        />
                    </svg>
                    <span className="absolute text-[10px] font-bold">{Math.round(progress)}%</span>
                </div>

                <div>
                    <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-0.5">Current Focus</p>
                    <h3 className="font-bold text-lg leading-tight truncate max-w-[200px] md:max-w-xs">{intent.title}</h3>
                </div>
            </div>

            <div className="relative z-10 flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-mono font-bold tracking-tight">{displayTime}</p>
                    <p className="text-indigo-200 text-xs">{isOverdue && durationMins > 0 ? 'Overdue' : 'Remaining'}</p>
                </div>

                <button
                    onClick={onComplete}
                    className="bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
                >
                    Complete Use
                </button>
            </div>
        </div>
    );
}
