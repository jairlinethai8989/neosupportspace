-- ==========================================
-- ROUND 2: CREATE SUPABASE DATABASE SCHEMA
-- ==========================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'assigned', 'pending_customer', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sender_type AS ENUM ('customer', 'agent', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Create Tables

-- Hospitals
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g., 'H001'
    name TEXT NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Users (LINE Users)
CREATE TABLE IF NOT EXISTS customer_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_user_id TEXT UNIQUE NOT NULL, -- LINE userId
    display_name TEXT, -- LINE display name
    full_name TEXT,
    phone TEXT,
    department TEXT,
    hospital_id UUID REFERENCES hospitals(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Users (Staff)
-- Note: Usually linked to auth.users in Supabase, but for Round 2 we define the public profile
CREATE TABLE IF NOT EXISTS agent_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- REFERENCES auth.users(id)
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT DEFAULT 'agent', -- 'agent', 'admin'
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number SERIAL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'Hardware', 'Software', 'Network'
    priority ticket_priority DEFAULT 'medium',
    status ticket_status DEFAULT 'open',
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    customer_id UUID NOT NULL REFERENCES customer_users(id),
    assigned_agent_id UUID REFERENCES agent_users(id),
    
    -- Timestamps
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket Messages (Conversations)
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL, -- Generic UUID (can be customer_id or agent_id)
    sender_type sender_type NOT NULL,
    message_body TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- Store attachment info, buttons, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket Events (Audit Trail)
CREATE TABLE IF NOT EXISTS ticket_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'ticket_created', 'status_changed', 'agent_assigned', etc.
    actor_id UUID, -- Actor ID (agent/customer/system)
    actor_type sender_type NOT NULL,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canned Replies (Quick Replies for Agents)
CREATE TABLE IF NOT EXISTS canned_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_hospital_id ON tickets(hospital_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_agent_id ON tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_last_message_at ON tickets(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_id ON ticket_events(ticket_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_users_line_id ON customer_users(line_user_id);

-- 5. Add Update Triggers
CREATE TRIGGER trigger_update_hospitals_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_customer_users_at BEFORE UPDATE ON customer_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_agent_users_at BEFORE UPDATE ON agent_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_tickets_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_canned_replies_at BEFORE UPDATE ON canned_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
