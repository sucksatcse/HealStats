-- Migration: Create dedicated views for Admins, Nurses, and Clinical Officers
-- File:      20260907000000_create_role_views.sql

-- 1. Add `designation` column to public.staff
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'community_health_worker';

-- 2. Drop existing views to prevent column-order replacement errors
DROP VIEW IF EXISTS public.admins;
DROP VIEW IF EXISTS public.nurses;
DROP VIEW IF EXISTS public.clinical_officers;

-- 3. Create public.admins view (Administrator oversight only)
CREATE VIEW public.admins AS
SELECT 
  s.id,
  s.name,
  s.email,
  s.role,
  s.designation,
  s.clinic_id,
  c.name AS clinic_name,
  s.auth_user_id,
  s.is_active
FROM public.staff s
LEFT JOIN public.clinics c ON s.clinic_id = c.id
WHERE s.role = 'admin' 
  AND (s.designation IS NULL OR s.designation = 'administrator');

-- 4. Create public.nurses view (Staff Nurses only)
CREATE VIEW public.nurses AS
SELECT 
  s.id,
  s.name,
  s.email,
  s.designation,
  s.role,
  s.clinic_id,
  c.name AS clinic_name,
  s.auth_user_id,
  s.is_active
FROM public.staff s
LEFT JOIN public.clinics c ON s.clinic_id = c.id
WHERE s.designation = 'nurse';

-- 5. Create public.clinical_officers view (Clinical Officers only)
CREATE VIEW public.clinical_officers AS
SELECT 
  s.id,
  s.name,
  s.email,
  s.designation,
  s.role,
  s.clinic_id,
  c.name AS clinic_name,
  s.auth_user_id,
  s.is_active
FROM public.staff s
LEFT JOIN public.clinics c ON s.clinic_id = c.id
WHERE s.designation = 'clinical_officer';

-- 6. Trigger: Automatically populate role & designation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_staff_user()
RETURNS trigger AS $$
DECLARE
  user_designation TEXT;
  user_role TEXT;
BEGIN
  user_designation := COALESCE(new.raw_user_meta_data->>'designation', 'community_health_worker');

  IF user_designation = 'administrator' OR new.raw_user_meta_data->>'role' = 'admin' THEN
    user_role := 'admin';
  ELSE
    user_role := 'worker';
  END IF;

  INSERT INTO public.staff (
    name,
    email,
    auth_user_id,
    role,
    designation,
    is_active
  )
  VALUES (
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.id,
    user_role,
    user_designation,
    true
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    role = EXCLUDED.role,
    designation = EXCLUDED.designation;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
