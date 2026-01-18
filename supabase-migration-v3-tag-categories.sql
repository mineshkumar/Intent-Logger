-- Migration: Add tag categories (groups of tags)
-- Run this in your Supabase SQL Editor

-- Create tag_categories table (groups like "Mood", "Time", "Place", etc.)
CREATE TABLE IF NOT EXISTS tag_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT, -- optional emoji or icon identifier
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add tag_category_id to categories (tags) table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tag_category_id UUID REFERENCES tag_categories(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS categories_tag_category_id_idx ON categories(tag_category_id);

-- Insert default tag categories
INSERT INTO tag_categories (name, icon, sort_order) VALUES
  ('Activity', '📋', 1),
  ('Mood', '😊', 2),
  ('Time', '⏰', 3),
  ('Place', '📍', 4)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE tag_categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since no auth)
CREATE POLICY "Allow all operations on tag_categories" ON tag_categories
  FOR ALL USING (true) WITH CHECK (true);

-- Update existing categories to be in "Activity" category by default
UPDATE categories
SET tag_category_id = (SELECT id FROM tag_categories WHERE name = 'Activity')
WHERE tag_category_id IS NULL;
