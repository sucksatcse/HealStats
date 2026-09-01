-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Create Tables
-- ==========================================

CREATE TABLE public.clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    zone TEXT,
    address TEXT
);

CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('worker', 'admin')) NOT NULL DEFAULT 'worker',
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT
);

CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    age INTEGER,
    sex TEXT,
    village TEXT,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    vitals JSONB,
    symptoms TEXT,
    symptom_category TEXT,
    diagnosis TEXT,
    urgency_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    device_id TEXT,
    status TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. Helper Functions for RLS
-- ==========================================
-- We use SECURITY DEFINER to bypass RLS on the staff table when looking up user info.
-- This prevents infinite recursion errors.

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM staff WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_clinic_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id FROM staff WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_staff_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM staff WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ==========================================
-- 3. Enable RLS
-- ==========================================

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. Create Policies
-- ==========================================

-- Clinics Policy
DROP POLICY IF EXISTS "Admins can access all clinics, workers can access their own" ON public.clinics;
CREATE POLICY "Admins can access all clinics, workers can access their own"
ON public.clinics FOR ALL
USING (
  public.get_current_user_role() = 'admin' 
  OR id = public.get_current_user_clinic_id()
);

-- Staff Policy
DROP POLICY IF EXISTS "Admins can access all staff, workers can access staff in their clinic" ON public.staff;
CREATE POLICY "Admins can access all staff, workers can access staff in their clinic"
ON public.staff FOR ALL
USING (
  public.get_current_user_role() = 'admin' 
  OR clinic_id = public.get_current_user_clinic_id()
);

-- Patients Policy
DROP POLICY IF EXISTS "Admins can access all patients, workers can access patients in their clinic" ON public.patients;
CREATE POLICY "Admins can access all patients, workers can access patients in their clinic"
ON public.patients FOR ALL
USING (
  public.get_current_user_role() = 'admin' 
  OR clinic_id = public.get_current_user_clinic_id()
);

-- Visits Policy
DROP POLICY IF EXISTS "Admins can access all visits, workers can access visits for patients in their clinic" ON public.visits;
CREATE POLICY "Admins can access all visits, workers can access visits for patients in their clinic"
ON public.visits FOR ALL
USING (
  public.get_current_user_role() = 'admin'
  OR patient_id IN (SELECT id FROM public.patients WHERE clinic_id = public.get_current_user_clinic_id())
);

-- Sync Log Policy
DROP POLICY IF EXISTS "Admins can access all sync logs, workers can access their own logs" ON public.sync_log;
CREATE POLICY "Admins can access all sync logs, workers can access their own logs"
ON public.sync_log FOR ALL
USING (
  public.get_current_user_role() = 'admin'
  OR staff_id = public.get_current_user_staff_id()
);
