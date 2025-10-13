-- Fix storage bucket policy for models bucket
-- Allow authenticated users to upload and read their own files
-- Allow public read access to all model files

-- First, let's make the bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'models';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload own models" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own models" ON storage.objects;
DROP POLICY IF EXISTS "Public can read models" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own models" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to read from models bucket (public access)
CREATE POLICY "Public can read models"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'models');

-- Allow users to delete their own models
CREATE POLICY "Users can delete own models"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
