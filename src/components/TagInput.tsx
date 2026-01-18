'use client';

import { useState, useRef, useEffect } from 'react';
import type { Category } from '@/types/database';

interface TagInputProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onChange: (categoryIds: string[]) => void;
  onCreate: (name: string) => Promise<Category | null>;
}

export function TagInput({ categories, selectedCategoryIds, onChange, onCreate }: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCategories = categories.filter(c => selectedCategoryIds.includes(c.id));

  const filteredCategories = inputValue
    ? categories.filter(c => c.name.toLowerCase().includes(inputValue.toLowerCase()))
    : categories;

  const showCreateOption = inputValue && !categories.some(
    c => c.name.toLowerCase() === inputValue.toLowerCase()
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setInputValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onChange(selectedCategoryIds.filter(id => id !== categoryId));
    } else {
      onChange([...selectedCategoryIds, categoryId]);
      setIsOpen(false);
      setInputValue('');
    }
  };

  const handleCreate = async () => {
    if (!inputValue.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const newCategory = await onCreate(inputValue.trim());
      if (newCategory) {
        onChange([...selectedCategoryIds, newCategory.id]);
        setIsOpen(false);
        setInputValue('');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showCreateOption) {
        handleCreate();
      } else if (filteredCategories.length === 1) {
        handleToggle(filteredCategories[0].id);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" ref={containerRef}>
      {selectedCategories.map(cat => (
        <span
          key={cat.id}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white transition-transform hover:scale-105"
          style={{ backgroundColor: cat.color }}
        >
          {cat.name}
          <button
            onClick={() => handleToggle(cat.id)}
            className="hover:opacity-75 focus:outline-none ml-1"
          >
            ×
          </button>
        </span>
      ))}

      <div className="relative">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            + Add Tag
          </button>
        ) : (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tag..."
              className="w-32 px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 max-h-60 overflow-y-auto">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleToggle(cat.id)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 justify-between group"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate">{cat.name}</span>
                </div>
                {selectedCategoryIds.includes(cat.id) && (
                  <span className="text-indigo-600 text-xs font-bold">✓</span>
                )}
              </button>
            ))}

            {showCreateOption && (
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full px-3 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 border-t border-gray-100"
              >
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {isCreating ? 'Creating...' : `Create "${inputValue}"`}
              </button>
            )}

            {filteredCategories.length === 0 && !showCreateOption && (
              <div className="px-3 py-2 text-sm text-gray-400">
                No tags found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
