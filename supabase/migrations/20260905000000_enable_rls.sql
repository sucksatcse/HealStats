-- ============================================================================
-- Enable Row Level Security (RLS) with clinic-scoped isolation
-- ============================================================================
--
-- STATUS: PREPARED, NOT YET APPLIED.
--   This migration turns RLS ON and defines production isolation policies.
--   Do NOT apply it until you have:
--     1. Reworked the demo-login bypass to use a REAL Supabase session, OR
--        accepted that demo mode (worker@clinic.org / admin@healstats.org)
--        will return empty data once RLS is on — demo bypass has no auth.uid().
--     2. Verified every signed-in flow (signup, patient/visit create, admin
--        dashboards, map, staff CRUD) against these policies on a test project.
--
-- Relies on the SECURITY DEFINER helpers already created in
-- 20260831000000_initial_schema.sql:
--   get_current_user_role(), get_current_user_clinic_id(),
--   get_current_user_staff_id()
--
-- Isolation model:
--   admin  (staff.role = 'admin', clinic_id may be NULL) -> full access
--   worker (staff.role = 'worker')                        -> own clinic only
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enable RLS on all tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.clinics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. clinics
--    Readable by anyone (needed for the pre-auth signup clinic dropdown).
--    Only admins may modify.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS clinics_select ON public.clinics;
CREATE POLICY clinics_select ON public.clinics
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS clinics_admin_write ON public.clinics;
CREATE POLICY clinics_admin_write ON public.clinics
  FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 3. staff
--    SELECT: own row, or admin (all), or same-clinic co-workers.
--    INSERT: self-signup only — the new row must link to the caller and be a
--            'worker' (never admin) as a privilege-escalation safeguard.
--    UPDATE/DELETE: admin only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS staff_select ON public.staff;
CREATE POLICY staff_select ON public.staff
  FOR SELECT
  USING (
    auth_user_id = auth.uid()
    OR public.get_current_user_role() = 'admin'
    OR clinic_id = public.get_current_user_clinic_id()
  );

DROP POLICY IF EXISTS staff_self_insert ON public.staff;
CREATE POLICY staff_self_insert ON public.staff
  FOR INSERT
  WITH CHECK (
    auth_user_id = auth.uid()
    AND role = 'worker'
  );

DROP POLICY IF EXISTS staff_admin_update ON public.staff;
CREATE POLICY staff_admin_update ON public.staff
  FOR UPDATE
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS staff_admin_delete ON public.staff;
CREATE POLICY staff_admin_delete ON public.staff
  FOR DELETE
  USING (public.get_current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 4. patients
--    Admin: all clinics. Worker: only their own clinic.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS patients_select ON public.patients;
CREATE POLICY patients_select ON public.patients
  FOR SELECT
  USING (
    public.get_current_user_role() = 'admin'
    OR clinic_id = public.get_current_user_clinic_id()
  );

DROP POLICY IF EXISTS patients_insert ON public.patients;
CREATE POLICY patients_insert ON public.patients
  FOR INSERT
  WITH CHECK (
    public.get_current_user_role() = 'admin'
    OR clinic_id = public.get_current_user_clinic_id()
  );

DROP POLICY IF EXISTS patients_update ON public.patients;
CREATE POLICY patients_update ON public.patients
  FOR UPDATE
  USING (
    public.get_current_user_role() = 'admin'
    OR clinic_id = public.get_current_user_clinic_id()
  )
  WITH CHECK (
    public.get_current_user_role() = 'admin'
    OR clinic_id = public.get_current_user_clinic_id()
  );

DROP POLICY IF EXISTS patients_admin_delete ON public.patients;
CREATE POLICY patients_admin_delete ON public.patients
  FOR DELETE
  USING (public.get_current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 5. visits
--    Scoped through the parent patient's clinic. Admin sees all.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS visits_select ON public.visits;
CREATE POLICY visits_select ON public.visits
  FOR SELECT
  USING (
    public.get_current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = visits.patient_id
        AND p.clinic_id = public.get_current_user_clinic_id()
    )
  );

DROP POLICY IF EXISTS visits_insert ON public.visits;
CREATE POLICY visits_insert ON public.visits
  FOR INSERT
  WITH CHECK (
    public.get_current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = visits.patient_id
        AND p.clinic_id = public.get_current_user_clinic_id()
    )
  );

DROP POLICY IF EXISTS visits_admin_update ON public.visits;
CREATE POLICY visits_admin_update ON public.visits
  FOR UPDATE
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS visits_admin_delete ON public.visits;
CREATE POLICY visits_admin_delete ON public.visits
  FOR DELETE
  USING (public.get_current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 6. sync_log
--    A user reads/writes only their own rows; admin sees all.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS sync_log_select ON public.sync_log;
CREATE POLICY sync_log_select ON public.sync_log
  FOR SELECT
  USING (
    staff_id = public.get_current_user_staff_id()
    OR public.get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS sync_log_insert ON public.sync_log;
CREATE POLICY sync_log_insert ON public.sync_log
  FOR INSERT
  WITH CHECK (staff_id = public.get_current_user_staff_id());

-- ============================================================================
-- To roll back (re-open the MVP demo state), disable RLS on every table:
--   ALTER TABLE public.<table> DISABLE ROW LEVEL SECURITY;
-- ============================================================================
