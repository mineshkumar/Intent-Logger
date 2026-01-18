'use client';

import { useState } from 'react';
import { TAG_COLORS } from '@/lib/colors';
import type { Tag, TagCategory, TagWithCategory } from '@/types/database';

interface TagManagerProps {
  tags: TagWithCategory[];
  tagCategories: TagCategory[];
  onCreateTag: (name: string, tagCategoryId: string | null) => Promise<Tag | null>;
  onCreateTagCategory: (name: string, icon?: string) => Promise<TagCategory | null>;
  onUpdateTag: (id: string, updates: { name?: string; color?: string; tag_category_id?: string | null }) => Promise<void>;
  onDeleteTag: (id: string) => Promise<void>;
  onClose: () => void;
}

export function TagManager({
  tags,
  tagCategories,
  onCreateTag,
  onCreateTagCategory,
  onUpdateTag,
  onDeleteTag,
  onClose
}: TagManagerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategoryId, setNewTagCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tags' | 'categories'>('tags');

  const handleCreateTag = async () => {
    if (!newTagName.trim() || isCreatingTag) return;
    setIsCreatingTag(true);
    try {
      await onCreateTag(newTagName.trim(), newTagCategoryId);
      setNewTagName('');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || isCreatingCategory) return;
    setIsCreatingCategory(true);
    try {
      await onCreateTagCategory(newCategoryName.trim(), newCategoryIcon || undefined);
      setNewCategoryName('');
      setNewCategoryIcon('');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleColorChange = async (tagId: string, color: string) => {
    await onUpdateTag(tagId, { color });
    setEditingColor(null);
  };

  const handleCategoryChange = async (tagId: string, tagCategoryId: string | null) => {
    await onUpdateTag(tagId, { tag_category_id: tagCategoryId });
  };

  // Group tags by category
  const tagsByCategory = tagCategories.map(cat => ({
    category: cat,
    tags: tags.filter(t => t.tag_category_id === cat.id)
  }));
  const uncategorizedTags = tags.filter(t => !t.tag_category_id);

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Manage Tags</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('tags')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'tags'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tags
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'categories'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tag Groups
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'tags' ? (
            <div className="space-y-6">
              {/* Create new tag */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Add New Tag</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Tag name..."
                    className="flex-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  />
                  <select
                    value={newTagCategoryId || ''}
                    onChange={(e) => setNewTagCategoryId(e.target.value || null)}
                    className="px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">No group</option>
                    {tagCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || isCreatingTag}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Tags grouped by category */}
              {tagsByCategory.map(({ category, tags: catTags }) => (
                catTags.length > 0 && (
                  <div key={category.id}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {category.icon} {category.name}
                    </h3>
                    <div className="space-y-1">
                      {catTags.map(tag => (
                        <TagRow
                          key={tag.id}
                          tag={tag}
                          tagCategories={tagCategories}
                          editingColor={editingColor}
                          setEditingColor={setEditingColor}
                          onColorChange={handleColorChange}
                          onCategoryChange={handleCategoryChange}
                          onDelete={onDeleteTag}
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}

              {uncategorizedTags.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Uncategorized
                  </h3>
                  <div className="space-y-1">
                    {uncategorizedTags.map(tag => (
                      <TagRow
                        key={tag.id}
                        tag={tag}
                        tagCategories={tagCategories}
                        editingColor={editingColor}
                        setEditingColor={setEditingColor}
                        onColorChange={handleColorChange}
                        onCategoryChange={handleCategoryChange}
                        onDelete={onDeleteTag}
                      />
                    ))}
                  </div>
                </div>
              )}

              {tags.length === 0 && (
                <p className="text-center text-gray-400 py-8">No tags yet. Create one above.</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Create new category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Add New Tag Group</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    placeholder="Icon"
                    className="w-16 px-3 py-2 text-sm text-center text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Group name..."
                    className="flex-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                  />
                  <button
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || isCreatingCategory}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-400">Use an emoji for the icon (e.g., 😊, ⏰, 📍)</p>
              </div>

              {/* Existing categories */}
              <div className="space-y-2">
                {tagCategories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon || '📁'}</span>
                      <span className="font-medium text-gray-900">{cat.name}</span>
                      <span className="text-xs text-gray-400">
                        {tags.filter(t => t.tag_category_id === cat.id).length} tags
                      </span>
                    </div>
                  </div>
                ))}
                {tagCategories.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No tag groups yet. Create one above.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TagRow({
  tag,
  tagCategories,
  editingColor,
  setEditingColor,
  onColorChange,
  onCategoryChange,
  onDelete
}: {
  tag: TagWithCategory;
  tagCategories: TagCategory[];
  editingColor: string | null;
  setEditingColor: (id: string | null) => void;
  onColorChange: (id: string, color: string) => void;
  onCategoryChange: (id: string, categoryId: string | null) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg group">
      <div className="relative">
        <button
          onClick={() => setEditingColor(editingColor === tag.id ? null : tag.id)}
          className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
          style={{ backgroundColor: tag.color }}
        />
        {editingColor === tag.id && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border z-10">
            <div className="grid grid-cols-6 gap-1">
              {TAG_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => onColorChange(tag.id, color)}
                  className={`w-5 h-5 rounded-full hover:scale-110 transition-transform ${
                    tag.color === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <span className="flex-1 text-sm text-gray-900">{tag.name}</span>
      <select
        value={tag.tag_category_id || ''}
        onChange={(e) => onCategoryChange(tag.id, e.target.value || null)}
        className="text-xs text-gray-500 border-0 bg-transparent focus:ring-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <option value="">No group</option>
        {tagCategories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      {isDeleting ? (
        <div className="flex gap-1">
          <button
            onClick={async () => { await onDelete(tag.id); setIsDeleting(false); }}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={() => setIsDeleting(false)}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsDeleting(true)}
          className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
