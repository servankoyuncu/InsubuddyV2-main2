-- Migration: Add extracted_text column to policies table
-- Run this once in the Supabase SQL Editor

ALTER TABLE policies
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Optional: Create a GIN index for full-text search later
-- CREATE INDEX IF NOT EXISTS idx_policies_extracted_text ON policies USING GIN(to_tsvector('german', COALESCE(extracted_text, '')));
