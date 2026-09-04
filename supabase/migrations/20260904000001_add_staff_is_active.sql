-- ============================================================
-- Migration: Add is_active column to staff table
-- File:      20260904000001_add_staff_is_active.sql
--
-- PURPOSE:
--   Enables soft-deactivation of staff members from the Admin UI
--   without hard-deleting their records or orphaning related data.
--
-- HOW TO APPLY:
--   Option A (Supabase Dashboard):
--     1. Open your Supabase project → SQL Editor
--     2. Paste and run this SQL
--
--   Option B (Supabase CLI, if configured):
--     supabase db push
--
-- SAFE TO RUN MULTIPLE TIMES:
--   The IF NOT EXISTS guard prevents duplicate errors.
-- ============================================================

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill: mark all existing staff as active
UPDATE public.staff SET is_active = TRUE WHERE is_active IS NULL;

-- Optional: index for filtering active staff efficiently
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON public.staff(is_active);
