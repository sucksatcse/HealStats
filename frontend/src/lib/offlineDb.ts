import Dexie, { Table } from "dexie"

export interface PendingRecord {
  id: string
  type: "patient" | "visit"
  payload: any
  status: "pending" | "syncing" | "failed"
  createdAt: number
}

export class OfflineDB extends Dexie {
  pendingRecords!: Table<PendingRecord, string>

  constructor() {
    super("HealthStatsOfflineDB")
    // Define the schema. Only indexed fields need to be specified.
    // 'id' is the primary key. 'type' and 'status' are indexed for easy querying.
    this.version(1).stores({
      pendingRecords: "id, type, status, createdAt",
    })
  }
}

export const offlineDb = new OfflineDB()
