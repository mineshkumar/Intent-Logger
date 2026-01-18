'use client';

import type { Category } from '@/types/database';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  counts?: Record<string, number>;
}

export function CategoryFilter({ categories, selectedCategoryId, onSelect, counts }: CategoryFilterProps) {
  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
      <div className="flex gap-2">
        <button
          onClick={() => onSelect(null)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${selectedCategoryId === null
              ? 'bg-gray-900 border-gray-900 text-white shadow-md transform scale-105'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
        >
          <span>All</span>
          {counts && <span className={`text-xs ml-1 ${selectedCategoryId === null ? 'text-gray-300' : 'text-gray-400'}`}>{counts['all'] || 0}</span>}
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1 self-center" />

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${selectedCategoryId === category.id
                ? 'text-white border-transparent shadow-md transform scale-105'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            style={
              selectedCategoryId === category.id
                ? { backgroundColor: category.color }
                : undefined
            }
          >
            {/* Dot for unselected state to show color hint */}
            {selectedCategoryId !== category.id && (
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} />
            )}
            <span>{category.name}</span>
            {counts && counts[category.id] !== undefined && (
              <span className={`text-xs ml-1 opacity-80`}>{counts[category.id]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
