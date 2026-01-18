'use client';

import { useState, useRef, useEffect } from 'react';
import type { IntentInsert } from '@/types/database';

interface QuickCaptureProps {
  onSubmit: (intent: IntentInsert) => Promise<void>;
  isLoading?: boolean;
}

const DURATION_PRESETS = [5, 15, 30, 45, 60];

export function QuickCapture({ onSubmit, isLoading }: QuickCaptureProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [isError, setIsError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading) return;

    if (!title.trim()) {
      setIsError(true);
      setTimeout(() => setIsError(false), 2000);
      inputRef.current?.focus();
      return;
    }

    await onSubmit({
      title: title.trim(),
      duration_minutes: duration,
      status: 'planned' // default status for new intents
    });

    setTitle('');
    setDuration(null); // reset duration
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="flex gap-3 mb-3">
        <div className={`relative flex-1 transition-transform ${isError ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (isError) setIsError(false);
            }}
            onKeyDown={handleKeyDown}
            placeholder={isError ? "Please enter an intent..." : "What will you do in the next 15 minutes?"}
            className={`w-full px-4 py-3 text-lg border-2 rounded-xl focus:ring-0 focus:outline-none transition-colors 
              ${isError
                ? 'border-red-300 text-red-900 placeholder:text-red-300 focus:border-red-500 bg-red-50'
                : 'text-gray-900 border-gray-200 focus:border-indigo-500 placeholder:text-gray-400'
              }`}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap shadow-sm"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : 'Log Intent'}
        </button>
      </form>

      {/* Duration Controls */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mr-1">Time:</span>
        {DURATION_PRESETS.map(mins => (
          <button
            key={mins}
            onClick={() => setDuration(d => d === mins ? null : mins)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all border
              ${duration === mins
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
              }
            `}
          >
            {mins}m
          </button>
        ))}
      </div>
    </div>
  );
}
