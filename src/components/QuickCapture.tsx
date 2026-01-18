'use client';

import { useState, useRef, useEffect } from 'react';
import type { IntentInsert } from '@/types/database';

interface QuickCaptureProps {
  onSubmit: (intent: IntentInsert) => Promise<void>;
  isLoading?: boolean;
}

export function QuickCapture({ onSubmit, isLoading }: QuickCaptureProps) {
  const [title, setTitle] = useState('');
  const [isError, setIsError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!title.trim()) {
      setIsError(true);
      setTimeout(() => setIsError(false), 2000); // Clear error after 2s
      inputRef.current?.focus();
      return;
    }

    await onSubmit({ title: title.trim() });
    setTitle('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className={`relative transition-transform ${isError ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (isError) setIsError(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isError ? "Please enter an intent..." : "What are you working on?"}
          className={`w-full px-4 py-3 pr-12 text-lg border-2 rounded-xl focus:ring-0 focus:outline-none transition-colors 
            ${isError
              ? 'border-red-300 text-red-900 placeholder:text-red-300 focus:border-red-500 bg-red-50'
              : 'text-gray-900 border-gray-200 focus:border-indigo-500 placeholder:text-gray-400'
            }`}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 transition-colors
            ${!title.trim() && !isError ? 'text-gray-300' : ''}
            ${isError ? 'text-red-400 hover:text-red-500' : 'text-gray-400 hover:text-indigo-600'}
            disabled:opacity-30`}
          title="Log intent (Enter)"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-400 text-center">
        Press Enter to log • Click on entries below to add details
      </p>
    </form>
  );
}
