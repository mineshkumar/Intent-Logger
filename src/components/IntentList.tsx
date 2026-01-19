'use client';

import { IntentCard } from './IntentCard';
import type { Tag, TagCategory, TagWithCategory, IntentWithTags, IntentUpdate } from '@/types/database';
import { useState, useMemo } from 'react';

interface IntentListProps {
  intents: IntentWithTags[];
  categories: TagWithCategory[];
  tagCategories?: TagCategory[];
  onUpdate: (id: string, updates: IntentUpdate) => Promise<void>;
  onOpenPanel: (intent: IntentWithTags) => void;
  onCreateCategory: (name: string) => Promise<Tag | null>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

type DateGroup = 'Today' | 'Yesterday' | 'Earlier this week' | 'Last week' | 'Last month' | 'Older';

function getIntentGroup(date: Date): DateGroup {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const intentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (intentDate.getTime() === today.getTime()) return 'Today';
  if (intentDate.getTime() === yesterday.getTime()) return 'Yesterday';

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

  if (intentDate >= startOfWeek) return 'Earlier this week';

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  if (intentDate >= startOfLastWeek) return 'Last week';

  const startOfLastMonth = new Date(today);
  startOfLastMonth.setMonth(today.getMonth() - 1);

  if (intentDate >= startOfLastMonth) return 'Last month';

  return 'Older';
}

function CollapsibleSection({
  title,
  count,
  children,
  defaultOpen = true
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 mb-3 group w-full text-left"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-green-600 font-semibold">{title}</span>
        <span className="text-gray-400 text-xs font-normal ml-auto">{count} items</span>
      </button>

      {isOpen && (
        <div className="space-y-3 pl-2 border-l-2 border-gray-50 ml-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function IntentList({ intents, categories, tagCategories, onUpdate, onOpenPanel, onCreateCategory, onDelete, isLoading }: IntentListProps) {
  const groupedIntents = useMemo(() => {
    const groups: Record<string, IntentWithTags[]> = {
      'Today': [],
      'Yesterday': [],
      'Earlier this week': [],
      'Last week': [],
      'Last month': [],
      'Older': []
    };

    intents.forEach(intent => {
      const date = new Date(intent.created_at);
      const group = getIntentGroup(date);
      groups[group].push(intent);
    });

    return groups;
  }, [intents]);

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

  const groupsOrder: DateGroup[] = ['Today', 'Yesterday', 'Earlier this week', 'Last week', 'Last month', 'Older'];

  return (
    <div className="space-y-1">
      {groupsOrder.map(groupName => {
        const groupIntents = groupedIntents[groupName];
        if (groupIntents.length === 0) return null;

        return (
          <CollapsibleSection
            key={groupName}
            title={groupName}
            count={groupIntents.length}
            defaultOpen={groupName === 'Today' || groupName === 'Yesterday'}
          >
            {groupIntents.map((intent) => (
              <IntentCard
                key={intent.id}
                intent={intent}
                categories={categories}
                tagCategories={tagCategories}
                onUpdate={onUpdate}
                onOpenPanel={onOpenPanel}
                onCreateCategory={onCreateCategory}
                onDelete={onDelete}
              />
            ))}
          </CollapsibleSection>
        );
      })}
    </div>
  );
}
