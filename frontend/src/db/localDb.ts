import Dexie, { type Table } from 'dexie';

export interface OfflinePatient {
  id: string;
  name: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'conflict';
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
  queue!: Table<OfflineQueueItem, string>;

  constructor() {
    super('healthstats');
    this.version(1).stores({
      patients: 'id, name, updatedAt, syncStatus',
      queue: 'id, entityType, entityId, operation, createdAt'
    });
  }
}

export const db = new HealthStatsDb();