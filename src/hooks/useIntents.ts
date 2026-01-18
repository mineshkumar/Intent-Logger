'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { getNextColor } from '@/lib/colors';
import type { Category, IntentWithCategory, IntentInsert, IntentUpdate } from '@/types/database';

export function useIntents() {
  const [intents, setIntents] = useState<IntentWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        setError(error.message);
        return;
      }

      if (data) {
        setCategories(data as unknown as Category[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    }
  }, []);

  const fetchIntents = useCallback(async (categoryId?: string | null) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();


      // Note: We are fetching all intents and their tags. 
      // If filtering by categoryId is needed at DB level, it requires more complex query or different approach
      // For now, simpler to fetch all and filter in memory if needed, or rely on UI filtering.
      // However, to keep existing API contract:

      const { data, error } = await supabase
        .from('intents')
        .select(`
          *,
          intent_tags (
            categories (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      if (data) {
        // Transform the nested data structure
        const formattedIntents = data.map((item: any) => ({
          ...item,
          categories: item.intent_tags.map((t: any) => t.categories).filter(Boolean),
        })) as IntentWithCategory[];

        if (categoryId) {
          // Filter in memory for now
          setIntents(formattedIntents.filter(i => i.categories.some(c => c.id === categoryId)));
        } else {
          setIntents(formattedIntents);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch intents');
    }
    setIsLoading(false);
  }, []);

  const addIntent = useCallback(async (intent: IntentInsert) => {
    const supabase = getSupabase();
    // 1. Insert intent
    const { data: newIntent, error: intentError } = await supabase
      .from('intents')
      .insert({
        title: intent.title,
        description: intent.description,
        duration_minutes: intent.duration_minutes
      })
      .select()
      .single();

    if (intentError) {
      setError(intentError.message);
      throw intentError;
    }

    if (!newIntent) throw new Error('Failed to create intent');

    // 2. Insert tags if any
    let attachedCategories: Category[] = [];
    if (intent.category_ids && intent.category_ids.length > 0) {
      const tagInserts = intent.category_ids.map(catId => ({
        intent_id: newIntent.id,
        category_id: catId
      }));

      const { error: tagError } = await supabase
        .from('intent_tags')
        .insert(tagInserts);

      if (tagError) {
        // Should probably rollback/delete intent here in strict system
        console.error('Failed to add tags', tagError);
      }

      // We need the category objects to update state optimistically/correctly
      // For simplicity, we can refetch or just find them from existing categories state
      // Here we rely on refetching or just allow the UI update to wait for refresh
    }

    // Re-fetch to get complete object with tags
    await fetchIntents();
  }, [fetchIntents]);

  const updateIntent = useCallback(async (id: string, updates: IntentUpdate) => {
    const supabase = getSupabase();

    // 1. Update fields on intent table
    const { title, description, duration_minutes } = updates;
    const intentUpdates: any = {};
    if (title !== undefined) intentUpdates.title = title;
    if (description !== undefined) intentUpdates.description = description;
    if (duration_minutes !== undefined) intentUpdates.duration_minutes = duration_minutes;

    if (Object.keys(intentUpdates).length > 0) {
      const { error } = await supabase
        .from('intents')
        .update(intentUpdates)
        .eq('id', id);

      if (error) {
        setError(error.message);
        throw error;
      }
    }

    // 2. Update tags if provided
    if (updates.category_ids) {
      // Delete existing
      await supabase.from('intent_tags').delete().eq('intent_id', id);

      // Insert new
      if (updates.category_ids.length > 0) {
        const tagInserts = updates.category_ids.map(catId => ({
          intent_id: id,
          category_id: catId
        }));
        await supabase.from('intent_tags').insert(tagInserts);
      }
    }

    // Re-fetch to ensure sync
    await fetchIntents();
  }, [fetchIntents]);

  const deleteIntent = useCallback(async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('intents').delete().eq('id', id);

    if (error) {
      setError(error.message);
      throw error;
    }

    setIntents((prev: IntentWithCategory[]) => prev.filter((intent) => intent.id !== id));
  }, []);

  const createCategory = useCallback(async (name: string): Promise<Category | null> => {
    const supabase = getSupabase();
    const usedColors = categories.map(c => c.color);
    const color = getNextColor(usedColors);

    const { data, error } = await supabase
      .from('categories')
      .insert({ name, color } as never)
      .select('*')
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    if (data) {
      const newCategory = data as unknown as Category;
      setCategories((prev) => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
      return newCategory;
    }
    return null;
  }, [categories]);

  const updateCategory = useCallback(async (id: string, updates: { name?: string; color?: string }) => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('categories')
      .update(updates as never)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      setError(error.message);
      throw error;
    }

    if (data) {
      const updatedCategory = data as unknown as Category;
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? updatedCategory : cat))
      );
      // Refresh intents to update colors
      fetchIntents();
    }
  }, [fetchIntents]);

  useEffect(() => {
    fetchCategories();
    fetchIntents();
  }, [fetchCategories, fetchIntents]);

  return {
    intents,
    categories,
    isLoading,
    error,
    addIntent,
    updateIntent,
    deleteIntent,
    fetchIntents,
    createCategory,
    updateCategory,
  };
}
