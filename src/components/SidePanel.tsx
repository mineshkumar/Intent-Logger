'use client';

import { useState, useEffect, useRef } from 'react';
import { TAG_COLORS } from '@/lib/colors';
import { TagInput } from './TagInput';
import { DurationInput, formatDuration } from './DurationInput';
import type { Category, IntentWithCategory, IntentUpdate } from '@/types/database';

interface SidePanelProps {
  intent: IntentWithCategory | null;
  categories: Category[];
  onClose: () => void;
  onUpdate: (id: string, updates: IntentUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreateCategory: (name: string) => Promise<Category | null>;
  onUpdateCategory: (id: string, updates: { color?: string }) => Promise<void>;
}

export function SidePanel({ intent, categories, onClose, onUpdate, onDelete, onCreateCategory, onUpdateCategory }: SidePanelProps) {
  const [description, setDescription] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (intent) {
      setDescription(intent.description || '');
      setHasUnsavedChanges(false);
      setIsConfirmingDelete(false); // Reset delete state when intent changes
    }
  }, [intent]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if collecting clicks inside standard UI elements
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleColorPickerClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      document.addEventListener('mousedown', handleColorPickerClickOutside);
      return () => document.removeEventListener('mousedown', handleColorPickerClickOutside);
    }
  }, [showColorPicker]);

  if (!intent) return null;

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setHasUnsavedChanges(true);
  };

  const handleSaveDescription = async () => {
    if (!hasUnsavedChanges) return;
    setIsSaving(true);
    try {
      await onUpdate(intent.id, {
        description: description.trim() || null,
      });
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDurationChange = async (minutes: number | null) => {
    await onUpdate(intent.id, { duration_minutes: minutes });
  };

  const handleDelete = async () => {
    await onDelete(intent.id);
    onClose();
  };



  const formattedDate = new Date(intent.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/20">
      <div
        ref={panelRef}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col animate-slide-in"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Intent Details</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">{formattedDate}</p>
            <h3 className="text-xl font-medium text-gray-900">{intent.title}</h3>
          </div>

          {/* Tag section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex items-center gap-3">
              <TagInput
                categories={categories}
                selectedCategoryIds={intent.categories.map(c => c.id)}
                onChange={(ids) => onUpdate(intent.id, { category_ids: ids })}
                onCreate={onCreateCategory}
              />
            </div>
          </div>

          {/* Duration section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <DurationInput
              value={intent.duration_minutes}
              onChange={handleDurationChange}
            />
          </div>

          {/* Notes section */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              onBlur={handleSaveDescription}
              placeholder="Add notes or details..."
              rows={6}
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
            />
            {hasUnsavedChanges && (
              <p className="mt-1 text-xs text-amber-600">Unsaved changes</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-3">
            {isConfirmingDelete ? (
              <>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 py-2 px-4 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 px-4 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Confirm Delete
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="w-full text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                Delete Intent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
