-- ==========================================
-- ROUND 3: ADD STORAGE BUCKET FOR ATTACHMENTS
-- ==========================================

-- 1. Create a new public bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket_attachments',
  'ticket_attachments',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Setup Row Level Security for the bucket
-- Note: As a public-facing helpdesk, anyone logged in can upload, but the URL is public for viewing (or we can secure the bucket but for LIFF it's simpler to use public bucket and randomize names)
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING ( bucket_id = 'ticket_attachments' );

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'ticket_attachments'
    -- If using Supabase Auth for agents this would be `auth.uid() = owner`
    -- Since customers use custom JWT, we might allow any authenticated user or anonymous policy,
    -- but because it involves custom JWT, we just allow inserts. We'll enforce validation on application layer and rely on unpredictable UUID filenames.
  );
