-- Add user_id to tables to track ownership
ALTER TABLE intents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE tag_categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Update RLS policies for Intents
DROP POLICY IF EXISTS "Allow all operations on intents" ON intents;
CREATE POLICY "Users can manage their own intents" ON intents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for Categories (Tags)
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;
CREATE POLICY "Users can manage their own tags" ON categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for Tag Categories
DROP POLICY IF EXISTS "Allow all operations on tag_categories" ON tag_categories;
-- Note: You might want shared default categories. For now, let's allow users to manage their own custom ones
-- OR allow read access to "global" categories (user_id IS NULL) and write access to own.
-- For simplicity in this iteration: Users manage their own.
CREATE POLICY "Users can manage their own tag groups" ON tag_categories
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for Intent Tags (Junction)
-- The junction table relies on the parent tables' RLS, but we should secure it too.
DROP POLICY IF EXISTS "Allow all operations on intent_tags" ON intent_tags;
CREATE POLICY "Users can manage their own intent tags" ON intent_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM intents WHERE id = intent_tags.intent_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM intents WHERE id = intent_tags.intent_id AND user_id = auth.uid()
    )
  );
