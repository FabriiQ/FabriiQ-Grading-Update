-- Supabase Storage RLS Policies Setup
-- Run this script in your Supabase SQL editor to set up proper storage policies

-- Enable RLS on storage.objects table (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "social_wall_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "social_wall_view_policy" ON storage.objects;
DROP POLICY IF EXISTS "social_wall_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "avatars_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_view_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "documents_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_view_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "assessments_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "assessments_view_policy" ON storage.objects;
DROP POLICY IF EXISTS "assessments_delete_policy" ON storage.objects;

-- Social Wall Bucket Policies
-- Allow authenticated users to upload to social-wall bucket
CREATE POLICY "social_wall_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'social-wall');

-- Allow everyone to view social-wall content (public bucket)
CREATE POLICY "social_wall_view_policy" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'social-wall');

-- Allow users to delete their own uploads or admins to delete any
CREATE POLICY "social_wall_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'social-wall' AND (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'userType' IN ('SYSTEM_ADMIN', 'CAMPUS_ADMIN')
      )
    )
  );

-- Avatars Bucket Policies
-- Allow authenticated users to upload avatars
CREATE POLICY "avatars_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Allow everyone to view avatars (public bucket)
CREATE POLICY "avatars_view_policy" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "avatars_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

-- Allow users to delete their own avatars or admins to delete any
CREATE POLICY "avatars_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'userType' IN ('SYSTEM_ADMIN', 'CAMPUS_ADMIN')
      )
    )
  );

-- Documents Bucket Policies (Private bucket)
-- Allow authenticated users to upload documents
CREATE POLICY "documents_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow users to view documents they own or that are shared with them
CREATE POLICY "documents_view_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents' AND (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'userType' IN ('SYSTEM_ADMIN', 'CAMPUS_ADMIN', 'CAMPUS_TEACHER')
      )
    )
  );

-- Allow users to delete their own documents or admins to delete any
CREATE POLICY "documents_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents' AND (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'userType' IN ('SYSTEM_ADMIN', 'CAMPUS_ADMIN')
      )
    )
  );

-- Assessments Bucket Policies (Private bucket)
-- Allow teachers and admins to upload assessment materials
CREATE POLICY "assessments_upload_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assessments' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'userType' IN ('SYSTEM_ADMIN', 'CAMPUS_ADMIN', 'CAMPUS_TEACHER')
    )
  );

-- Allow teachers and admins to view assessment materials
CREATE POLICY "assessments_view_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'assessments' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'userType' IN ('SYSTEM_ADMIN', 'CAMPUS_ADMIN', 'CAMPUS_TEACHER', 'CAMPUS_STUDENT')
    )
  );

-- Allow teachers and admins to delete assessment materials
CREATE POLICY "assessments_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'assessments' AND (
      owner = auth.uid() OR
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'userType' IN ('SYSTEM_ADMIN', 'CAMPUS_ADMIN')
      )
    )
  );

-- Create a function to check if user has admin privileges
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'userType' IN ('SYSTEM_ADMIN', 'CAMPUS_ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user is a teacher
CREATE OR REPLACE FUNCTION public.is_teacher_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'userType' IN ('SYSTEM_ADMIN', 'CAMPUS_ADMIN', 'CAMPUS_TEACHER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_user() TO authenticated;

-- Create storage bucket configurations if they don't exist
-- Note: These should be created via the application or Supabase dashboard
-- This is just for reference

/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('social-wall', 'social-wall', true, 10485760, ARRAY['image/*', 'video/*']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/*']),
  ('documents', 'documents', false, 52428800, ARRAY['application/*', 'text/*']),
  ('assessments', 'assessments', false, 26214400, ARRAY['application/*', 'text/*', 'image/*'])
ON CONFLICT (id) DO NOTHING;
*/

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_owner ON storage.objects(bucket_id, owner);
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_name ON storage.objects(bucket_id, name);

-- Comments for documentation
COMMENT ON POLICY "social_wall_upload_policy" ON storage.objects IS 'Allow authenticated users to upload to social-wall bucket';
COMMENT ON POLICY "social_wall_view_policy" ON storage.objects IS 'Allow public access to view social-wall content';
COMMENT ON POLICY "social_wall_delete_policy" ON storage.objects IS 'Allow users to delete their own uploads or admins to delete any';

COMMENT ON POLICY "avatars_upload_policy" ON storage.objects IS 'Allow authenticated users to upload avatars';
COMMENT ON POLICY "avatars_view_policy" ON storage.objects IS 'Allow public access to view avatars';
COMMENT ON POLICY "avatars_delete_policy" ON storage.objects IS 'Allow users to delete their own avatars or admins to delete any';

COMMENT ON POLICY "documents_upload_policy" ON storage.objects IS 'Allow authenticated users to upload documents';
COMMENT ON POLICY "documents_view_policy" ON storage.objects IS 'Allow users to view documents they own or have access to';
COMMENT ON POLICY "documents_delete_policy" ON storage.objects IS 'Allow users to delete their own documents or admins to delete any';

COMMENT ON POLICY "assessments_upload_policy" ON storage.objects IS 'Allow teachers and admins to upload assessment materials';
COMMENT ON POLICY "assessments_view_policy" ON storage.objects IS 'Allow teachers, admins, and students to view assessment materials';
COMMENT ON POLICY "assessments_delete_policy" ON storage.objects IS 'Allow teachers and admins to delete assessment materials';

-- Success message
SELECT 'Supabase Storage RLS policies have been successfully configured!' as message;
