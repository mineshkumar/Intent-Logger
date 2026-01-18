-- Intent Logger Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create intents table
CREATE TABLE IF NOT EXISTS intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS intents_created_at_idx ON intents(created_at DESC);
CREATE INDEX IF NOT EXISTS intents_category_id_idx ON intents(category_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to intents table
DROP TRIGGER IF EXISTS update_intents_updated_at ON intents;
CREATE TRIGGER update_intents_updated_at
  BEFORE UPDATE ON intents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default categories
INSERT INTO categories (name, color) VALUES
  ('Work', '#3b82f6'),
  ('Personal', '#10b981'),
  ('Learning', '#f59e0b'),
  ('Side Project', '#8b5cf6'),
  ('Health', '#ef4444')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE intents ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since no auth)
CREATE POLICY "Allow all operations on categories" ON categories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on intents" ON intents
  FOR ALL USING (true) WITH CHECK (true);
