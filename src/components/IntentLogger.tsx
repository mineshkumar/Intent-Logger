'use client';

import { useState, useEffect } from 'react';
import { useIntents } from '@/hooks/useIntents';
import { QuickCapture } from './QuickCapture';
import { IntentList } from './IntentList';
import { CategoryFilter } from './CategoryFilter';
import { SidePanel } from './SidePanel';
import type { IntentWithCategory } from '@/types/database';

export function IntentLogger() {
  const { intents, categories, isLoading, error, addIntent, updateIntent, deleteIntent, fetchIntents, createCategory, updateCategory } =
    useIntents();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<IntentWithCategory | null>(null);

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

      <QuickCapture onSubmit={handleAddIntent} isLoading={isSubmitting} />

      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={handleCategorySelect}
        />
      )}

      <IntentList
        intents={intents}
        categories={categories}
        onUpdate={updateIntent}
        onOpenPanel={setSelectedIntent}
        onCreateCategory={createCategory}
        onDelete={deleteIntent}
        isLoading={isLoading}
      />

      <SidePanel
        intent={selectedIntent}
        categories={categories}
        onClose={() => setSelectedIntent(null)}
        onUpdate={updateIntent}
        onDelete={deleteIntent}
        onCreateCategory={createCategory}
        onUpdateCategory={updateCategory}
      />
    </div>
  );
}
