'use client';

import { useState, useRef, useEffect } from 'react';
import type { IntentInsert, TagWithCategory, Tag } from '@/types/database';

interface QuickCaptureProps {
  onSubmit: (intent: IntentInsert) => Promise<void>;
  isLoading?: boolean;
  categories?: TagWithCategory[] | Tag[];
}

const DURATION_PRESETS = [5, 15, 30, 45, 60];

export function QuickCapture({ onSubmit, isLoading, categories = [] }: QuickCaptureProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [isError, setIsError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const parseInput = (text: string) => {
    let cleanTitle = text;
    let detectedDuration = duration;
    let detectedCategoryIds: string[] = [];

    // 1. Parse Duration (e.g., "30m", "1h", "1.5h")
    // Match "30m" or "30 min"
    const minMatch = text.match(/\b(\d+)\s*(m|min|mins)\b/i);
    if (minMatch) {
      detectedDuration = parseInt(minMatch[1]);
      cleanTitle = cleanTitle.replace(minMatch[0], '');
    }

    // Match "1h" or "1.5h"
    const hourMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(h|hr|hrs)\b/i);
    if (hourMatch) {
      detectedDuration = Math.round(parseFloat(hourMatch[1]) * 60);
      cleanTitle = cleanTitle.replace(hourMatch[0], '');
    }

    // 2. Parse Tags (e.g., "#Work", "#Deep Work")
    // Simple hash regex
    const tagMatches = text.match(/#([a-zA-Z0-9_]+)/g);
    if (tagMatches && categories.length > 0) {
      tagMatches.forEach(tagStr => {
        const tagName = tagStr.substring(1).toLowerCase();
        // Try strict match first, then case-insensitive
        const category = categories.find(c => c.name.toLowerCase() === tagName);
        if (category) {
          detectedCategoryIds.push(category.id);
          cleanTitle = cleanTitle.replace(tagStr, '');
        }
      });
    }

    // Cleanup extra spaces
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

    return { cleanTitle, detectedDuration, detectedCategoryIds };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading) return;

    if (!title.trim()) {
      setIsError(true);
      setTimeout(() => setIsError(false), 2000);
      inputRef.current?.focus();
      return;
    }

    const { cleanTitle, detectedDuration, detectedCategoryIds } = parseInput(title);

    const finalTitle = cleanTitle || title;

    await onSubmit({
      title: finalTitle,
      duration_minutes: detectedDuration,
      status: 'planned',
      category_ids: detectedCategoryIds.length > 0 ? detectedCategoryIds : undefined
    });

    setTitle('');
    setDuration(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mb-0">
      <form onSubmit={handleSubmit} className="flex gap-3 mb-2">
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
            placeholder={isError ? "Please enter an intent..." : "What will you do? (e.g. 'Coding 30m #Work')"}
            className={`w-full px-4 py-3 text-lg border-2 rounded-xl focus:ring-0 focus:outline-none transition-colors shadow-sm bg-white/80 backdrop-blur-sm
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
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap shadow-md"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : 'Log Intent'}
        </button>
      </form>

      {/* Duration and Help Text */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mr-1">Time:</span>
          {DURATION_PRESETS.map(mins => (
            <button
              key={mins}
              onClick={() => setDuration(d => d === mins ? null : mins)}
              className={`
                px-2 py-0.5 rounded-full text-xs font-medium transition-all border
                ${duration === mins
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white/50 border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
                }
              `}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
