-- ==========================================
-- ROUND 5: ADD INTERNAL NOTES & NOTIFICATIONS
-- ==========================================

-- 1. Add is_internal toggle to ticket messages
ALTER TABLE ticket_messages
ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;

-- Add index to speed up filtering for customer UI (which excludes internal)
CREATE INDEX IF NOT EXISTS idx_ticket_messages_is_internal ON ticket_messages(is_internal);

-- 2. Create Notifications table for agents
CREATE TABLE IF NOT EXISTS agent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agent_users(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_notifications_agent_id ON agent_notifications(agent_id, is_read);
