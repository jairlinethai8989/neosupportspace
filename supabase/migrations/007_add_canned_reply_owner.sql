-- ==========================================
-- ROUND 8: PHASE 4 - CANNED REPLIES MANAGEMENT
-- ==========================================

-- Add created_by to link replies to the agent who created them
ALTER TABLE canned_replies 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES agent_users(id) ON DELETE SET NULL;
