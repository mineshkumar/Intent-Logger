'use client';

import { useState, useRef, useEffect } from 'react';

interface DurationInputProps {
  value: number | null;
  onChange: (minutes: number | null) => void;
  compact?: boolean;
  className?: string; // Added className support
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min${mins !== 1 ? 's' : ''}`;
  if (mins === 0) return `${hours} hr${hours !== 1 ? 's' : ''}`;
  return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
}

export function formatDurationShort(minutes: number | null): string {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function parseDuration(input: string): number | null {
  if (!input.trim()) return null;

  const cleaned = input.trim().toLowerCase();

  // Match patterns like "1h 30m", "1h30m", "1h", "30m", "90", "1.5h"
  const hourMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*h/);
  const minMatch = cleaned.match(/(\d+)\s*m/);
  const justNumber = cleaned.match(/^(\d+)$/);

  let totalMinutes = 0;

  if (hourMatch) {
    totalMinutes += parseFloat(hourMatch[1]) * 60;
  }
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1]);
  }
  if (justNumber && !hourMatch && !minMatch) {
    // Just a number = assume minutes
    totalMinutes = parseInt(justNumber[1]);
  }

  return totalMinutes > 0 ? Math.round(totalMinutes) : null;
}

export function DurationInput({ value, onChange, compact = false, className = '' }: DurationInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleSave();
      }
    };
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing, inputValue]);

  const handleStartEdit = () => {
    setInputValue(value ? formatDurationShort(value) : '');
    setIsEditing(true);
  };

  const handleSave = () => {
    const parsed = parseDuration(inputValue);
    onChange(parsed);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., 45, 1h"
          className={`text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none ${compact ? 'w-24 px-2 py-0.5 text-xs' : 'w-32 px-3 py-1.5 text-sm'
            }`}
        />
        {inputValue && (
          <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
            {parseDuration(inputValue) ? formatDuration(parseDuration(inputValue)) : 'Invalid'}
          </div>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={handleStartEdit}
        className={`px-1.5 py-0.5 rounded text-xs transition-colors ${value
            ? 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
          } ${className}`}
      >
        {value ? formatDurationShort(value) : '+ time'}
      </button>
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${value
          ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          : 'text-gray-400 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-500'
        } ${className}`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {value ? formatDuration(value) : 'Add duration'}
    </button>
  );
}
