export interface Patient {
  id: string;
  facilityId: string;
  nationalId?: string;
  name: string;
  dateOfBirth?: string;
  sex?: 'male' | 'female' | 'other';
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

export interface Encounter {
  id: string;
  patientId: string;
  facilityId: string;
  visitDate: string;
  chiefComplaint?: string;
  diagnosis?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

export interface Prescription {
  id: string;
  encounterId: string;
  patientId: string;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

export interface User {
  id: string;
  name: string;
  role: 'doctor' | 'admin' | 'nurse' | 'staff';
  facilityId: string;
  phone?: string;
  email?: string;
  active: boolean;
}

export interface Facility {
  id: string;
  name: string;
  code: string;
  district?: string;
  upazila?: string;
  active: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface SyncPayload {
  deviceId: string;
  facilityId: string;
  lastSyncAt?: string;
  patients: Patient[];
  encounters: Encounter[];
  prescriptions: Prescription[];
  auditLogs: AuditLog[];
}