import Dexie, { type Table } from 'dexie';

export interface OfflinePatient {
  id: string;
  name: string;
  fullName: string;
  dateOfBirth?: string;
  sex?: string;
  district?: string;
  upazila?: string;
  unionName?: string;
  phoneNumber?: string;
  photoName?: string;
  refugeeMode?: boolean;
  campName?: string;
  shelterBlock?: string;
  nationality?: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'conflict';
  _dirty: boolean;
}

export interface OfflineEncounter {
  id: string;
  patientId: string;
  createdAt: string;
  vitals: {
    systolic: string;
    diastolic: string;
    temperature: string;
    pulse: string;
    weight: string;
    height: string;
  };
  chiefComplaint: string;
  diagnosis: {
    code: string;
    name: string;
    nameBn: string;
  };
  prescriptions: Array<{
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  _dirty: boolean;
}

export interface OfflineQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: unknown;
  createdAt: string;
}

class HealthStatsDb extends Dexie {
  patients!: Table<OfflinePatient, string>;
  encounters!: Table<OfflineEncounter, string>;
  queue!: Table<OfflineQueueItem, string>;

  constructor() {
    super('healthstats');
    this.version(2).stores({
      patients: 'id, name, fullName, updatedAt, syncStatus, _dirty',
      encounters: 'id, patientId, createdAt, _dirty',
      queue: 'id, entityType, entityId, operation, createdAt'
    });
  }
}

export const db = new HealthStatsDb();