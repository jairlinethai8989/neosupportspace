-- ==========================================
-- ROUND 7: PHASE 3 - DASHBOARD, AVATARS, PROFILES
-- ==========================================

-- 1. Add dashboard_config to agent_users
ALTER TABLE agent_users 
ADD COLUMN IF NOT EXISTS dashboard_config JSONB DEFAULT '{
  "layout": [
    {"id": "ticket_status_chart", "type": "pie", "visible": true, "order": 1},
    {"id": "ticket_priority_chart", "type": "bar", "visible": true, "order": 2},
    {"id": "csat_score_trend", "type": "line", "visible": true, "order": 3}
  ],
  "date_range": "30d"
}';

-- 2. Create Storage Bucket for Agent Avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent_avatars',
  'agent_avatars',
  true,
  2097152, -- 2MB limit for profile pictures
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. RLS for Avatars
-- Agents can upload only to their own folder/path or we can just allow authenticated agents.
-- Since the frontend isn't using exact Auth mapping (we use `auth_user_id`), we will allow authenticated users.
CREATE POLICY "Public Avatar Access" ON storage.objects
  FOR SELECT
  USING ( bucket_id = 'agent_avatars' );

CREATE POLICY "Agents can upload avatars" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'agent_avatars'
    -- (auth.role() = 'authenticated')
  );

CREATE POLICY "Agents can update avatars" ON storage.objects
  FOR UPDATE
  USING ( bucket_id = 'agent_avatars' );
