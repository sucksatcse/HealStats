export interface DatabaseLike {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
      run(): Promise<unknown>;
    };
  };
}

export interface PatientRow {
  id: string;
  full_name: string;
  date_of_birth?: string | null;
  sex?: 'male' | 'female' | 'other' | null;
  union_name?: string | null;
  upazila?: string | null;
  district?: string | null;
  phone_number?: string | null;
  photo_url?: string | null;
  refugee_mode?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  synced_at?: string | null;
}

export interface EncounterRow {
  id: string;
  patient_id: string;
  facility_id: string;
  visit_date: string;
  chief_complaint?: string | null;
  vitals?: string | null;
  diagnosis_code?: string | null;
  diagnosis_label_bn?: string | null;
  notes?: string | null;
  triage_level?: string | null;
  created_by?: string | null;
  created_at?: string | null;
}

export interface DiagnosisCountFilter {
  facilityId?: string;
  from?: string;
  to?: string;
  diagnosisCode?: string;
}

export interface DiagnosisCountRow {
  diagnosis_code: string | null;
  count: number;
}

function normalizeLikeQuery(query: string) {
  return `%${query.trim()}%`;
}

export async function getPatientById(db: DatabaseLike, id: string) {
  return db.prepare('SELECT * FROM patients WHERE id = ?').bind(id).first<PatientRow>();
}

export async function searchPatients(db: DatabaseLike, query: string, facilityId: string) {
  return db
    .prepare(
      `SELECT DISTINCT p.*
       FROM patients p
       LEFT JOIN encounters e ON e.patient_id = p.id
       WHERE p.full_name LIKE ?
         AND e.facility_id = ?
       ORDER BY p.full_name ASC`
    )
    .bind(normalizeLikeQuery(query), facilityId)
    .all<PatientRow>();
}

export async function createPatient(db: DatabaseLike, patient: PatientRow) {
  return db
    .prepare(
      `INSERT INTO patients (
        id, full_name, date_of_birth, sex, union_name, upazila, district,
        phone_number, photo_url, refugee_mode, created_at, updated_at, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      patient.id,
      patient.full_name,
      patient.date_of_birth ?? null,
      patient.sex ?? null,
      patient.union_name ?? null,
      patient.upazila ?? null,
      patient.district ?? null,
      patient.phone_number ?? null,
      patient.photo_url ?? null,
      patient.refugee_mode ?? 0,
      patient.created_at ?? new Date().toISOString(),
      patient.updated_at ?? new Date().toISOString(),
      patient.synced_at ?? null
    )
    .run();
}

export async function upsertPatient(db: DatabaseLike, patient: PatientRow) {
  return db
    .prepare(
      `INSERT OR REPLACE INTO patients (
        id, full_name, date_of_birth, sex, union_name, upazila, district,
        phone_number, photo_url, refugee_mode, created_at, updated_at, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      patient.id,
      patient.full_name,
      patient.date_of_birth ?? null,
      patient.sex ?? null,
      patient.union_name ?? null,
      patient.upazila ?? null,
      patient.district ?? null,
      patient.phone_number ?? null,
      patient.photo_url ?? null,
      patient.refugee_mode ?? 0,
      patient.created_at ?? new Date().toISOString(),
      patient.updated_at ?? new Date().toISOString(),
      patient.synced_at ?? null
    )
    .run();
}

export async function getEncountersByPatient(db: DatabaseLike, patientId: string) {
  return db
    .prepare('SELECT * FROM encounters WHERE patient_id = ? ORDER BY visit_date DESC, created_at DESC')
    .bind(patientId)
    .all<EncounterRow>();
}

export async function createEncounter(db: DatabaseLike, encounter: EncounterRow) {
  return db
    .prepare(
      `INSERT INTO encounters (
        id, patient_id, facility_id, visit_date, chief_complaint, vitals,
        diagnosis_code, diagnosis_label_bn, notes, triage_level, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      encounter.id,
      encounter.patient_id,
      encounter.facility_id,
      encounter.visit_date,
      encounter.chief_complaint ?? null,
      encounter.vitals ?? null,
      encounter.diagnosis_code ?? null,
      encounter.diagnosis_label_bn ?? null,
      encounter.notes ?? null,
      encounter.triage_level ?? null,
      encounter.created_by ?? null,
      encounter.created_at ?? new Date().toISOString()
    )
    .run();
}

export async function getDiagnosisCounts(db: DatabaseLike, filters: DiagnosisCountFilter = {}) {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.facilityId) {
    conditions.push('facility_id = ?');
    values.push(filters.facilityId);
  }

  if (filters.from) {
    conditions.push('visit_date >= ?');
    values.push(filters.from);
  }

  if (filters.to) {
    conditions.push('visit_date <= ?');
    values.push(filters.to);
  }

  if (filters.diagnosisCode) {
    conditions.push('diagnosis_code = ?');
    values.push(filters.diagnosisCode);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return db
    .prepare(
      `SELECT diagnosis_code, COUNT(*) AS count
       FROM encounters
       ${whereClause}
       GROUP BY diagnosis_code
       ORDER BY count DESC, diagnosis_code ASC`
    )
    .bind(...values)
    .all<DiagnosisCountRow>();
}