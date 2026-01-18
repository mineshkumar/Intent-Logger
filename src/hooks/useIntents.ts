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
      let query = supabase
        .from('intents')
        .select('*, categories(*)')
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      if (data) {
        setIntents(data as unknown as IntentWithCategory[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch intents');
    }
    setIsLoading(false);
  }, []);

  const addIntent = useCallback(async (intent: IntentInsert) => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('intents')
      .insert(intent as never)
      .select('*, categories(*)')
      .single();

    if (error) {
      setError(error.message);
      throw error;
    }

    if (data) {
      setIntents((prev) => [data as unknown as IntentWithCategory, ...prev]);
    }
  }, []);

  const updateIntent = useCallback(async (id: string, updates: IntentUpdate) => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('intents')
      .update(updates as never)
      .eq('id', id)
      .select('*, categories(*)')
      .single();

    if (error) {
      setError(error.message);
      throw error;
    }

    if (data) {
      setIntents((prev) =>
        prev.map((intent) =>
          intent.id === id ? (data as unknown as IntentWithCategory) : intent
        )
      );
    }
  }, []);

  const deleteIntent = useCallback(async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('intents').delete().eq('id', id);

    if (error) {
      setError(error.message);
      throw error;
    }

    setIntents((prev) => prev.filter((intent) => intent.id !== id));
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
      // Also update the category in intents
      setIntents((prev) =>
        prev.map((intent) =>
          intent.category_id === id
            ? { ...intent, categories: updatedCategory }
            : intent
        )
      );
    }
  }, []);

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
