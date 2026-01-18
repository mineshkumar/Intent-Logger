'use client';

import type { Category } from '@/types/database';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategoryId, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selectedCategoryId === null
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedCategoryId === category.id
              ? 'text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={
            selectedCategoryId === category.id
              ? { backgroundColor: category.color }
              : undefined
          }
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
