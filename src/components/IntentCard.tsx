'use client';

import { useState, useRef, useEffect } from 'react';
import { TagInput } from './TagInput';
import { DurationInput, formatDurationShort } from './DurationInput';
import type { Tag, TagCategory, TagWithCategory, IntentWithTags, IntentUpdate } from '@/types/database';

interface IntentCardProps {
  intent: IntentWithTags;
  categories: TagWithCategory[];
  tagCategories?: TagCategory[];
  onUpdate: (id: string, updates: IntentUpdate) => Promise<void>;
  onOpenPanel: (intent: IntentWithTags) => void;
  onCreateCategory: (name: string) => Promise<Tag | null>;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_CONFIG = {
  planned: { color: 'bg-slate-100 text-slate-600', label: 'Planned', icon: '○' },
  in_progress: { color: 'bg-blue-100 text-blue-700', label: 'In Progress', icon: '●' },
  completed: { color: 'bg-green-100 text-green-700', label: 'Completed', icon: '✓' },
  skipped: { color: 'bg-gray-100 text-gray-400 line-through', label: 'Skipped', icon: '—' },
};

export function IntentCard({ intent, categories, tagCategories, onUpdate, onOpenPanel, onCreateCategory, onDelete }: IntentCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(intent.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const status = intent.status || 'planned';
  const statusConfig = STATUS_CONFIG[status];
  const isPrivate = intent.is_private || false;

  const formattedDate = new Date(intent.created_at).toLocaleDateString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
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

  const cycleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const statuses = Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[];
    const currentIndex = statuses.indexOf(status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    await onUpdate(intent.id, { status: nextStatus });
  };

  const togglePrivacy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onUpdate(intent.id, { is_private: !isPrivate });
  };

  const handleDurationChange = async (minutes: number | null) => {
    await onUpdate(intent.id, { duration_minutes: minutes });
  };

  // Helper to add opacity to hex color
  const getBackgroundTint = (color: string) => {
    if (color.startsWith('#') && color.length === 7) {
      return `${color}10`; // approx 6% opacity
    }
    return undefined;
  };

  const primaryCategory = intent.categories?.[0];
  const tintColor = primaryCategory ? getBackgroundTint(primaryCategory.color) : undefined;
  const borderColor = primaryCategory ? primaryCategory.color : '#e5e7eb';

  return (
    <div
      className={`rounded-xl border transition-all group ${status === 'completed' ? 'opacity-80' : 'shadow-sm hover:shadow-md'
        }`}
      style={{
        backgroundColor: status === 'completed' ? '#f8fafc' : (tintColor || '#ffffff'),
        borderColor: status === 'completed' ? '#f1f5f9' : (primaryCategory ? `${borderColor}40` : '#f3f4f6')
      }}
    >
      <div className="p-3 flex items-start gap-3">
        {/* Status Badge */}
        <button
          onClick={cycleStatus}
          className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${statusConfig.color}`}
          title={`Status: ${statusConfig.label}`}
        >
          {statusConfig.icon}
        </button>

        <div className="flex-1 min-w-0 grid gap-1">
          {/* Header Row: Title + Duration + Actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {/* Title */}
              <div className="min-w-0 flex-1">
                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyDown}
                    className="w-full text-sm font-semibold text-gray-900 bg-transparent border-b-2 border-indigo-500 focus:outline-none py-0"
                  />
                ) : (
                  <h3
                    onClick={() => setIsEditingTitle(true)}
                    className={`text-sm font-semibold truncate cursor-text hover:text-indigo-600 transition-colors ${status === 'completed' || status === 'skipped' ? 'text-gray-500 line-through decoration-gray-300' : 'text-gray-900'
                      }`}
                  >
                    {isPrivate ? '••••••••' : intent.title}
                  </h3>
                )}
              </div>

              {/* Duration Pill (Inline with title) */}
              <div className="flex-shrink-0">
                <DurationInput
                  value={intent.duration_minutes}
                  onChange={handleDurationChange}
                  compact
                  className="bg-white/50 text-gray-700 px-1.5 py-0 rounded text-[10px] font-medium border border-gray-200/50"
                />
              </div>
            </div>

            {/* Timestamp & Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-gray-400">{formattedDate}</span>

              {/* Privacy Toggle */}
              <button
                onClick={togglePrivacy}
                className={`p-1 rounded text-gray-400/70 transition-colors ${isPrivate ? 'text-indigo-500 opacity-100' : 'opacity-0 group-hover:opacity-100 hover:text-gray-600'}`}
                title="Toggle Privacy"
              >
                {isPrivate ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Tags Row */}
          <div className="scale-95 origin-left">
            <TagInput
              categories={categories}
              tagCategories={tagCategories}
              selectedCategoryIds={intent.categories.map(c => c.id)}
              onChange={(ids) => onUpdate(intent.id, { category_ids: ids })}
              onCreate={onCreateCategory}
            />
          </div>
        </div>

        {/* Action Menu (Expand/Delete) */}
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onOpenPanel(intent)}
            className="p-1 rounded text-gray-400 hover:bg-black/5 hover:text-indigo-600"
            title="View Details"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this intent?')) onDelete(intent.id);
            }}
            className="p-1 rounded text-gray-300 hover:bg-red-50 hover:text-red-500"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
