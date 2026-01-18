'use client';

import { useState, useRef, useEffect } from 'react';
import { TagInput } from './TagInput';
import { DurationInput, formatDurationShort } from './DurationInput';
import type { Category, IntentWithCategory, IntentUpdate } from '@/types/database';

interface IntentCardProps {
  intent: IntentWithCategory;
  categories: Category[];
  onUpdate: (id: string, updates: IntentUpdate) => Promise<void>;
  onOpenPanel: (intent: IntentWithCategory) => void;
  onCreateCategory: (name: string) => Promise<Category | null>;
  onDelete: (id: string) => Promise<void>;
}

export function IntentCard({ intent, categories, onUpdate, onOpenPanel, onCreateCategory, onDelete }: IntentCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(intent.title);
  const [isDeleting, setIsDeleting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const formattedDate = new Date(intent.created_at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    setEditedTitle(intent.title);
  }, [intent.title]);

  const handleTitleSave = async () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== intent.title) {
      await onUpdate(intent.id, { title: trimmed });
    } else {
      setEditedTitle(intent.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(intent.title);
      setIsEditingTitle(false);
    }
  };



  const handleDurationChange = async (minutes: number | null) => {
    await onUpdate(intent.id, { duration_minutes: minutes });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onDelete(intent.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(false);
  };

  const hasDetails = intent.description;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all group">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Tag, duration, and timestamp row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <TagInput
              categories={categories}
              selectedCategoryIds={intent.categories.map(c => c.id)}
              onChange={(ids) => onUpdate(intent.id, { category_ids: ids })}
              onCreate={onCreateCategory}
            />

            <DurationInput
              value={intent.duration_minutes}
              onChange={handleDurationChange}
              compact
            />

            <span className="text-xs text-gray-400">{formattedDate}</span>
          </div>

          {/* Title - inline editable */}
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="w-full text-base font-medium text-gray-900 bg-transparent border-b-2 border-indigo-500 focus:outline-none py-0.5"
            />
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="text-base font-medium text-gray-900 cursor-text hover:text-indigo-600 transition-colors"
              title="Click to edit"
            >
              {intent.title}
            </h3>
          )}

          {/* Description preview */}
          {intent.description && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-1">{intent.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isDeleting ? (
            <>
              <button
                onClick={handleConfirmDelete}
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                title="Confirm delete"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={handleCancelDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                title="Cancel"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete intent"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Expand button */}
          <button
            onClick={() => onOpenPanel(intent)}
            className={`p-1.5 rounded-lg transition-all ${hasDetails
              ? 'text-indigo-500 hover:bg-indigo-50'
              : 'text-gray-300 hover:text-gray-400 hover:bg-gray-50'
              }`}
            title="View details"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
