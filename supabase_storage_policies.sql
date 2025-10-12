-- Storage Policies for Motion Capture Platform
-- Run this in Supabase SQL Editor AFTER creating buckets

-- ============================================
-- MODELS BUCKET POLICIES
-- ============================================

-- Policy 1: SELECT (Users can view their own models)
CREATE POLICY "Users can view own models"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: INSERT (Users can upload models)
CREATE POLICY "Users can upload models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: UPDATE (Users can update their own models)
CREATE POLICY "Users can update own models"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: DELETE (Users can delete their own models)
CREATE POLICY "Users can delete own models"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- MOTIONS BUCKET POLICIES
-- ============================================

-- Policy 1: SELECT (Users can view their own motion recordings)
CREATE POLICY "Users can view own motions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'motions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: INSERT (Users can upload motion recordings)
CREATE POLICY "Users can upload motions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'motions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: UPDATE (Users can update their own motion recordings)
CREATE POLICY "Users can update own motions"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'motions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: DELETE (Users can delete their own motion recordings)
CREATE POLICY "Users can delete own motions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'motions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if policies are created successfully
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- You should see 8 policies total:
-- 4 for 'models' bucket (SELECT, INSERT, UPDATE, DELETE)
-- 4 for 'motions' bucket (SELECT, INSERT, UPDATE, DELETE)
