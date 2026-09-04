import { offlineDb } from "./offlineDb"
import { supabase } from "./supabase"

class SyncService {
  private isSyncing = false

  constructor() {
    if (typeof window !== "undefined") {
      // Listen for when the browser comes back online
      window.addEventListener("online", () => this.syncPendingRecords())
      
      // Also try to sync on initialization if we are currently online
      if (navigator.onLine) {
        this.syncPendingRecords()
      }
    }
  }

  async syncPendingRecords() {
    // Prevent overlapping sync operations
    if (this.isSyncing || !navigator.onLine) return
    this.isSyncing = true

    try {
      // Fetch all records that are currently in a "pending" state
      const pendingRecords = await offlineDb.pendingRecords
        .where("status")
        .equals("pending")
        .toArray()

      for (const record of pendingRecords) {
        try {
          // 1. Mark as syncing to avoid duplicate processing
          await offlineDb.pendingRecords.update(record.id, { status: "syncing" })

          let error = null

          // 2. Dispatch to the correct Supabase table based on record type
          if (record.type === "patient") {
            const res = await supabase.from("patients").insert([record.payload])
            error = res.error
          } else if (record.type === "visit") {
            // Re-stamp the synced_at time right before we actually send it
            const payload = { ...record.payload, synced_at: new Date().toISOString() }
            const res = await supabase.from("visits").insert([payload])
            error = res.error
          }

          // 3. Handle result
          if (error) {
            // Determine if the error is a network/connectivity issue
            if (error.message === "Failed to fetch" || error.message.includes("fetch")) {
              // Revert to pending so it will be retried next time we come online
              await offlineDb.pendingRecords.update(record.id, { status: "pending" })
            } else {
              // It's a hard error (e.g. database constraint, duplicate key, validation)
              // Mark as failed to prevent an infinite retry loop that blocks the queue
              await offlineDb.pendingRecords.update(record.id, { status: "failed" })
              console.error(`[SyncService] Hard error syncing record ${record.id}:`, error)
            }
          } else {
            // Success! The record safely exists in Supabase. Remove from local queue.
            await offlineDb.pendingRecords.delete(record.id)
            console.log(`[SyncService] Successfully synced record ${record.id}`)
          }
        } catch (err) {
          // Catch any unexpected exceptions during processing of a single record
          console.error(`[SyncService] Unexpected error processing record ${record.id}:`, err)
          await offlineDb.pendingRecords.update(record.id, { status: "pending" })
        }
      }
    } finally {
      this.isSyncing = false
    }
  }
}

// Export a singleton instance
export const syncService = new SyncService()
