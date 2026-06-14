import Dexie, { type Table } from 'dexie';

export type PendingOperation = 'create' | 'update' | 'delete';
export type SyncTableName = 'patients' | 'encounters' | 'prescriptions' | 'reference_data';

export interface PatientRecord {
  id: string;
  full_name: string;
  date_of_birth?: string | null;
  upazila?: string | null;
  district?: string | null;
  synced_at?: string | null;
  _dirty: number;
}

export interface EncounterRecord {
  id: string;
  patient_id: string;
  facility_id: string;
  visit_date: string;
  diagnosis_code?: string | null;
  _dirty: number;
}

export interface PrescriptionRecord {
  id: string;
  encounter_id: string;
  _dirty: number;
}

export interface PendingSyncRecord {
  id: string;
  table_name: SyncTableName;
  record_id: string;
  operation: PendingOperation;
  created_at: string;
}

export interface ReferenceDataRecord {
  key: string;
  value: unknown;
}

export type PendingSyncInput = Omit<PendingSyncRecord, 'id' | 'created_at'> & {
  created_at?: string;
};

export function createUuid(): string {
  return crypto.randomUUID();
}

export class HealthStatsDB extends Dexie {
  patients!: Table<PatientRecord, string>;
  encounters!: Table<EncounterRecord, string>;
  prescriptions!: Table<PrescriptionRecord, string>;
  pending_sync!: Table<PendingSyncRecord, string>;
  reference_data!: Table<ReferenceDataRecord, string>;

  constructor() {
    super('healthstats');

    this.version(1).stores({
      patients: 'id, full_name, date_of_birth, upazila, district, synced_at, _dirty',
      encounters: 'id, patient_id, facility_id, visit_date, diagnosis_code, _dirty',
      prescriptions: 'id, encounter_id, _dirty',
      pending_sync: 'id, table_name, record_id, operation, created_at',
      reference_data: 'key'
    });
  }
}

export const db = new HealthStatsDB();

export async function markDirty(tableName: SyncTableName, id: string, operation: PendingOperation = 'update') {
  await db.pending_sync.add({
    id: createUuid(),
    table_name: tableName,
    record_id: id,
    operation,
    created_at: new Date().toISOString()
  });
}

export function getUnsyncedRecords() {
  return db.pending_sync.orderBy('created_at').toArray();
}