-- ==========================================
-- PHASE 4: TICKET TRANSFER & TEAMS
-- ==========================================

-- Add assigned_team column to tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS assigned_team TEXT DEFAULT 'support';

-- Create an index for faster filtering by team
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_team ON tickets(assigned_team);

-- Create a comment for better understanding
COMMENT ON COLUMN tickets.assigned_team IS 'The team currently responsible for the ticket (e.g., support, programmer, sa)';
