-- Storage Policies für policy-documents Bucket
-- Run this in your Supabase SQL Editor

-- Users können ihre eigenen Dateien hochladen
DROP POLICY IF EXISTS "Users can upload own policy documents" ON storage.objects;
CREATE POLICY "Users can upload own policy documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'policy-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users können ihre eigenen Dateien lesen
DROP POLICY IF EXISTS "Users can read own policy documents" ON storage.objects;
CREATE POLICY "Users can read own policy documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'policy-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users können ihre eigenen Dateien löschen
DROP POLICY IF EXISTS "Users can delete own policy documents" ON storage.objects;
CREATE POLICY "Users can delete own policy documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'policy-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Alle können öffentliche Policy-Dokumente lesen (falls public bucket)
DROP POLICY IF EXISTS "Public can read policy documents" ON storage.objects;
CREATE POLICY "Public can read policy documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'policy-documents');
