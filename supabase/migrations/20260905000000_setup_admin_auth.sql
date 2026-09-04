-- ============================================================
-- Migration: Setup Admin Role, Initial Admin User & Auth Trigger
-- File:      20260905000000_setup_admin_auth.sql
--
-- PURPOSE:
--   1. Ensures `is_active` column exists on public.staff
--   2. Creates an automated trigger on auth.users for new signups
--   3. Seeds a functional initial Admin user in Supabase Auth & public.staff
--   4. Creates a public.admins view so admins appear as a dedicated table/view in Supabase Table Editor
-- ============================================================

-- 1. Ensure `is_active` exists on staff
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Create an `admins` view so you can view all Admin accounts directly in Table Editor
CREATE OR REPLACE VIEW public.admins AS
SELECT 
  s.id,
  s.name,
  s.email,
  s.role,
  s.clinic_id,
  c.name AS clinic_name,
  s.auth_user_id,
  s.is_active
FROM public.staff s
LEFT JOIN public.clinics c ON s.clinic_id = c.id
WHERE s.role = 'admin';

-- 3. Automatic Trigger: Whenever a user signs up or is created in Supabase Auth,
--    automatically insert their staff record with the matching role and auth_user_id.
CREATE OR REPLACE FUNCTION public.handle_new_staff_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.staff (
    name,
    email,
    auth_user_id,
    role,
    is_active
  )
  VALUES (
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'admin'),
    true
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Prevent signup failures if staff already exists
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_staff_user();

-- 4. Seed an Initial Functional Admin User
--    Email:    admin@healstats.org
--    Password: Admin@123456
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  new_auth_id UUID := gen_random_uuid();
  admin_email TEXT := 'admin@healstats.org';
  admin_pass TEXT  := 'Admin@123456';
  existing_auth_id UUID;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO existing_auth_id FROM auth.users WHERE email = admin_email;

  IF existing_auth_id IS NULL THEN
    -- Insert user into Supabase Auth
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at
    ) VALUES (
      new_auth_id,
      '00000000-0000-0000-0000-000000000000',
      admin_email,
      crypt(admin_pass, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"System Admin","role":"admin"}'::jsonb,
      'authenticated',
      'authenticated',
      NOW(),
      NOW()
    );
    existing_auth_id := new_auth_id;
  END IF;

  -- Ensure record exists in public.staff with role = 'admin'
  IF NOT EXISTS (SELECT 1 FROM public.staff WHERE auth_user_id = existing_auth_id) THEN
    INSERT INTO public.staff (
      name,
      role,
      email,
      auth_user_id,
      is_active
    ) VALUES (
      'System Administrator',
      'admin',
      admin_email,
      existing_auth_id,
      true
    );
  ELSE
    UPDATE public.staff
    SET role = 'admin', is_active = true
    WHERE auth_user_id = existing_auth_id;
  END IF;
END $$;
