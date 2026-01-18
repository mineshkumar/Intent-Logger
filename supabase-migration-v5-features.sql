-- Rename 'Regretful' category to 'Reflect'
UPDATE categories SET name = 'Reflect', color = '#64748b' WHERE name = 'Regretful';

-- Add status column
ALTER TABLE intents ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('planned', 'in_progress', 'completed', 'skipped')) DEFAULT 'planned';

-- Add privacy column
ALTER TABLE intents ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_intents_status ON intents(status);
