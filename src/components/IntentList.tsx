'use client';

import { IntentCard } from './IntentCard';
import type { Category, IntentWithCategory, IntentUpdate } from '@/types/database';

interface IntentListProps {
  intents: IntentWithCategory[];
  categories: Category[];
  onUpdate: (id: string, updates: IntentUpdate) => Promise<void>;
  onOpenPanel: (intent: IntentWithCategory) => void;
  onCreateCategory: (name: string) => Promise<Category | null>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function IntentList({ intents, categories, onUpdate, onOpenPanel, onCreateCategory, onDelete, isLoading }: IntentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-14 bg-gray-200 rounded-full" />
              <div className="h-4 w-28 bg-gray-200 rounded" />
            </div>
            <div className="h-5 w-3/4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (intents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-300 mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <p className="text-gray-400">Your intents will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {intents.map((intent) => (
        <IntentCard
          key={intent.id}
          intent={intent}
          categories={categories}
          onUpdate={onUpdate}
          onOpenPanel={onOpenPanel}
          onCreateCategory={onCreateCategory}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
