-- ==========================================
-- ROUND 6: AGENT USERNAME LOGIN SYSTEM
-- ==========================================

-- 1. Add username column to agent_users
ALTER TABLE agent_users 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Make email optional since we are moving towards username-based login
-- Actually, Supabase Auth still needs a unique identifier, so we will use username@admin.local in the email field.
-- But it's good to have a dedicated username column for cleaner UI.
CREATE INDEX IF NOT EXISTS idx_agent_users_username ON agent_users(username);
