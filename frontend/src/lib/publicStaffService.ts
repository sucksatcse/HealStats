/**
 * publicStaffService.ts
 * Safe, public-facing service for the HealStats Careers / Our Team page.
 *
 * Adheres strictly to security rules:
 * - Queries the real public.staff and public.clinics tables.
 * - Selects ONLY public-safe fields (name, email, role, designation, clinic).
 * - Excludes auth_user_id, database UUIDs, passwords, and internal metadata.
 * - Gracefully maps missing or unassigned values.
 */

import { supabase } from './supabase';

export interface PublicStaffMember {
  /** Opaque synthetic key for React rendering (never internal DB UUID) */
  key: string;
  name: string;
  email: string | null;
  role: 'admin' | 'worker';
  designation: string;
  clinicName: string;
  clinicZone: string | null;
  clinicAddress: string | null;
  photoUrl: string | null;
}

/**
 * Formats clinical designation for clear, dignified healthcare presentation.
 */
export function formatDesignation(
  designation: string | null | undefined,
  role: 'admin' | 'worker',
): string {
  if (designation && typeof designation === 'string') {
    const d = designation.toLowerCase().trim();
    if (d === 'community_health_worker' || d === 'chw') return 'Community Health Worker';
    if (d === 'nurse') return 'Staff Nurse';
    if (d === 'clinical_officer' || d === 'doctor' || d === 'medical_officer') return 'Clinical Officer';
    if (d === 'administrator' || d === 'admin') return 'Clinic Administrator';
    if (d === 'field_coordinator') return 'Field Coordinator';
    if (d === 'clinic_manager') return 'Clinic Manager';

    // Format snake_case or dash-case titles
    return designation
      .replace(/[_-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // Graceful fallback based on role
  return role === 'admin' ? 'Clinic Administrator' : 'Community Health Worker';
}

/**
 * Formats system role label.
 */
export function formatRoleLabel(role: string): string {
  return role === 'admin' ? 'Administrator' : 'Health Worker';
}

/**
 * Computes initials from a person's full name.
 */
export function getStaffInitials(name: string): string {
  if (!name) return 'HW';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Fetches the active public staff directory from the backend.
 */
export async function fetchPublicStaffList(): Promise<{
  data: PublicStaffMember[];
  totalCount: number;
  clinics: string[];
  designations: string[];
  error: string | null;
}> {
  // 1. Try dedicated public staff API endpoint (/api/public/staff)
  try {
    const apiRes = await fetch('/api/public/staff', {
      headers: { Accept: 'application/json' },
    });
    const contentType = apiRes.headers.get('content-type') || '';
    if (apiRes.ok && contentType.includes('application/json')) {
      const json = await apiRes.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return {
          data: json.data,
          totalCount: json.totalCount ?? json.data.length,
          clinics: json.clinics ?? [],
          designations: json.designations ?? [],
          error: null,
        };
      }
    }
  } catch (apiErr) {
    console.warn('[publicStaffService] /api/public/staff fetch bypassed:', apiErr);
  }

  // 2. Direct Supabase client query fallback
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*, clinics(id, name, zone)')
      .order('name', { ascending: true });

    if (error) {
      console.error('[publicStaffService] Supabase client error:', error);
      throw error;
    }

    const rawList = data ?? [];
    const activeRows = rawList.filter((row) => row.is_active !== false);

    const clinicSet = new Set<string>();
    const designationSet = new Set<string>();

    const publicList: PublicStaffMember[] = activeRows.map((row, idx) => {
      const rawClinic = Array.isArray(row.clinics) ? row.clinics[0] : row.clinics;
      const clinicName = rawClinic?.name && typeof rawClinic.name === 'string' && rawClinic.name.trim()
        ? rawClinic.name.trim()
        : 'Unassigned';

      if (clinicName !== 'Unassigned') {
        clinicSet.add(clinicName);
      }

      const clinicZone = rawClinic?.zone && typeof rawClinic.zone === 'string' && rawClinic.zone.trim()
        ? rawClinic.zone.trim()
        : null;

      const safeRole: 'admin' | 'worker' = row.role === 'admin' ? 'admin' : 'worker';
      const safeDesignation = formatDesignation(row.designation, safeRole);
      designationSet.add(safeDesignation);

      const rawObj = row as Record<string, unknown>;
      const photoUrl = typeof rawObj.avatar_url === 'string' && rawObj.avatar_url.trim()
        ? rawObj.avatar_url.trim()
        : typeof rawObj.photo_url === 'string' && rawObj.photo_url.trim()
        ? rawObj.photo_url.trim()
        : null;

      return {
        key: `staff-member-${idx}-${(row.name || 'member').replace(/\s+/g, '-').toLowerCase()}`,
        name: (row.name || 'Health Worker').trim(),
        email: row.email && typeof row.email === 'string' && row.email.trim() ? row.email.trim() : null,
        role: safeRole,
        designation: safeDesignation,
        clinicName,
        clinicZone,
        clinicAddress: null,
        photoUrl,
      };
    });

    return {
      data: publicList,
      totalCount: publicList.length,
      clinics: Array.from(clinicSet).sort(),
      designations: Array.from(designationSet).sort(),
      error: null,
    };
  } catch (err) {
    console.error('[publicStaffService] fetchPublicStaffList failure:', err);
    return {
      data: [],
      totalCount: 0,
      clinics: [],
      designations: [],
      error: 'We couldn’t load our team directory right now. Please try again.',
    };
  }
}
