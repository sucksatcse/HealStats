import Dexie, { Table } from "dexie"

export interface PendingRecord {
  id: string
  type: "patient" | "visit"
  payload: any
  status: "pending" | "syncing" | "failed"
  createdAt: number
  /** ISO timestamp of the local record's last modification, used for LWW conflict resolution */
  last_modified_at?: string
  /** Monotonic client version counter for ordering concurrent edits */
  client_version?: number
}

export interface SyncConflict {
  id?: number // auto-increment primary key
  record_type: "patient" | "visit"
  record_id: string
  local_payload: any
  remote_payload: any
  resolution_strategy: "lww_local_wins" | "lww_remote_wins" | "upsert_duplicate"
  resolved_at: string // ISO timestamp
  synced_to_server?: boolean
}

export class OfflineDB extends Dexie {
  pendingRecords!: Table<PendingRecord, string>
  syncConflicts!: Table<SyncConflict, number>

  constructor() {
    super("HealStatsOfflineDB")
    // Schema v1: original pending records table
    this.version(1).stores({
      pendingRecords: "id, type, status, createdAt",
    })
    // Schema v2: add last_modified_at, client_version fields and syncConflicts audit table
    this.version(2).stores({
      pendingRecords: "id, type, status, createdAt, last_modified_at",
      syncConflicts: "++id, record_type, record_id, resolved_at",
    }).upgrade((tx) => {
      // Migrate existing pending records — add missing fields with sensible defaults
      return tx.table("pendingRecords").toCollection().modify((record: PendingRecord) => {
        if (!record.last_modified_at) {
          record.last_modified_at = new Date(record.createdAt || Date.now()).toISOString()
        }
        if (record.client_version === undefined) {
          record.client_version = 1
        }
      })
    })
  }
}

export const offlineDb = new OfflineDB()
