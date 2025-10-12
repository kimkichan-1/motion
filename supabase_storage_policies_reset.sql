-- Storage Policies RESET Script
-- Run this ONLY if you want to completely reset storage policies

-- ============================================
-- DELETE ALL EXISTING POLICIES (OPTIONAL)
-- ============================================

-- Drop models bucket policies
DROP POLICY IF EXISTS "Users can view own models" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload models" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own models" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own models" ON storage.objects;

-- Drop motions bucket policies
DROP POLICY IF EXISTS "Users can view own motions" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload motions" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own motions" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own motions" ON storage.objects;

-- ============================================
-- CREATE POLICIES (SAME AS BEFORE)
-- ============================================

-- MODELS BUCKET POLICIES
CREATE POLICY "Users can view own models"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own models"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own models"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'models'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- MOTIONS BUCKET POLICIES
CREATE POLICY "Users can view own motions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'motions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload motions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'motions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own motions"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'motions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own motions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'motions'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;
