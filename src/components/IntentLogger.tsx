'use client';

import { useState, useEffect } from 'react';
import { useIntents } from '@/hooks/useIntents';
import { QuickCapture } from './QuickCapture';
import { IntentList } from './IntentList';
import { CategoryFilter } from './CategoryFilter';
import { SidePanel } from './SidePanel';
import { TagManager } from './TagManager';
import type { IntentWithTags, TagWithCategory } from '@/types/database';

export function IntentLogger() {
  const {
    intents,
    categories,
    tagCategories,
    isLoading,
    error,
    addIntent,
    updateIntent,
    deleteIntent,
    fetchIntents,
    createCategory,
    updateCategory,
    deleteCategory,
    createTagCategory
  } = useIntents();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<IntentWithTags | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);

  // Keep selectedIntent in sync with intents state
  useEffect(() => {
    if (selectedIntent) {
      const updated = intents.find(i => i.id === selectedIntent.id);
      if (updated) {
        setSelectedIntent(updated);
      }
    }
  }, [intents, selectedIntent?.id]);

  const handleAddIntent = async (intent: Parameters<typeof addIntent>[0]) => {
    setIsSubmitting(true);
    try {
      await addIntent(intent);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    fetchIntents(categoryId);
  };

  // Cast categories to TagWithCategory[] for components that need it
  const tagsWithCategory = categories as unknown as import('@/types/database').TagWithCategory[];

  return (
    <div>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex justify-between items-start">
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <QuickCapture onSubmit={handleAddIntent} isLoading={isSubmitting} />
        <button
          onClick={() => setShowTagManager(true)}
          className="ml-4 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Manage Tags"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </button>
      </div>

      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={handleCategorySelect}
        />
      )}

      <IntentList
        intents={intents}
        categories={tagsWithCategory}
        tagCategories={tagCategories}
        onUpdate={updateIntent}
        onOpenPanel={setSelectedIntent}
        onCreateCategory={createCategory}
        onDelete={deleteIntent}
        isLoading={isLoading}
      />

      <SidePanel
        intent={selectedIntent}
        categories={tagsWithCategory}
        tagCategories={tagCategories}
        onClose={() => setSelectedIntent(null)}
        onUpdate={updateIntent}
        onDelete={deleteIntent}
        onCreateCategory={createCategory}
        onUpdateCategory={updateCategory}
      />

      {showTagManager && (
        <TagManager
          tags={tagsWithCategory}
          tagCategories={tagCategories}
          onCreateTag={createCategory}
          onCreateTagCategory={createTagCategory}
          onUpdateTag={updateCategory}
          onDeleteTag={deleteCategory}
          onClose={() => setShowTagManager(false)}
        />
      )}
    </div>
  );
}
