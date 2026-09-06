import { offlineDb, SyncConflict } from "./offlineDb"
import { supabase } from "./supabase"

/**
 * Compares two ISO timestamps and returns the newer one.
 * Returns "local" if local is newer or equal, "remote" if remote is newer.
 */
function compareTimestamps(localTs?: string, remoteTs?: string): "local" | "remote" {
  if (!remoteTs) return "local"
  if (!localTs) return "remote"
  return new Date(localTs) >= new Date(remoteTs) ? "local" : "remote"
}

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

  /**
   * Logs a resolved conflict to the local Dexie audit table and optionally
   * attempts to persist a summary to Supabase sync_log.
   */
  private async logConflict(conflict: Omit<SyncConflict, "id">): Promise<void> {
    try {
      await offlineDb.syncConflicts.add(conflict)
      // Best-effort server-side audit log — does not block sync on failure
      await supabase.from("sync_log").insert([
        {
          action: `conflict_resolved_${conflict.resolution_strategy}`,
          record_type: conflict.record_type,
          record_id: conflict.record_id,
          details: {
            strategy: conflict.resolution_strategy,
            resolved_at: conflict.resolved_at,
          },
        },
      ])
    } catch {
      // Silently swallow — conflict logging is non-critical
    }
  }

  /**
   * Attempt to resolve a duplicate-key conflict for a patient record.
   * Uses Last-Write-Wins (LWW): the record with the more recent `created_at`
   * or `updated_at` timestamp is kept as the canonical version.
   */
  private async resolvePatientConflict(
    recordId: string,
    localPayload: any,
    remoteData: any
  ): Promise<void> {
    const localTs: string | undefined =
      localPayload.updated_at ?? localPayload.created_at
    const remoteTs: string | undefined =
      remoteData?.updated_at ?? remoteData?.created_at

    const winner = compareTimestamps(localTs, remoteTs)

    if (winner === "local") {
      // Local is newer — overwrite remote via upsert
      const { error } = await supabase
        .from("patients")
        .upsert([{ ...localPayload, id: recordId }], { onConflict: "id" })
      if (!error) {
        await this.logConflict({
          record_type: "patient",
          record_id: recordId,
          local_payload: localPayload,
          remote_payload: remoteData,
          resolution_strategy: "lww_local_wins",
          resolved_at: new Date().toISOString(),
        })
      }
    } else {
      // Remote is newer — preserve remote, discard local (log for audit)
      await this.logConflict({
        record_type: "patient",
        record_id: recordId,
        local_payload: localPayload,
        remote_payload: remoteData,
        resolution_strategy: "lww_remote_wins",
        resolved_at: new Date().toISOString(),
      })
    }
  }

  /**
   * Attempt to resolve a duplicate-key conflict for a visit record.
   */
  private async resolveVisitConflict(
    recordId: string,
    localPayload: any,
    remoteData: any
  ): Promise<void> {
    const localTs: string | undefined =
      localPayload.updated_at ?? localPayload.synced_at ?? localPayload.created_at
    const remoteTs: string | undefined =
      remoteData?.updated_at ?? remoteData?.synced_at ?? remoteData?.created_at

    const winner = compareTimestamps(localTs, remoteTs)

    if (winner === "local") {
      const { error } = await supabase
        .from("visits")
        .upsert([{ ...localPayload, id: recordId, synced_at: new Date().toISOString() }], {
          onConflict: "id",
        })
      if (!error) {
        await this.logConflict({
          record_type: "visit",
          record_id: recordId,
          local_payload: localPayload,
          remote_payload: remoteData,
          resolution_strategy: "lww_local_wins",
          resolved_at: new Date().toISOString(),
        })
      }
    } else {
      await this.logConflict({
        record_type: "visit",
        record_id: recordId,
        local_payload: localPayload,
        remote_payload: remoteData,
        resolution_strategy: "lww_remote_wins",
        resolved_at: new Date().toISOString(),
      })
    }
  }

  /** Returns the total count of locally recorded conflicts. */
  async getConflictCount(): Promise<number> {
    return offlineDb.syncConflicts.count()
  }

  /** Returns all locally recorded conflict entries, newest first. */
  async getConflicts(): Promise<SyncConflict[]> {
    return offlineDb.syncConflicts.orderBy("resolved_at").reverse().toArray()
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

            // Handle duplicate key (conflict) — run LWW resolution
            if (error && (error.code === "23505" || error.message?.includes("duplicate"))) {
              // Fetch the current remote version for comparison
              const { data: remoteData } = await supabase
                .from("patients")
                .select("*")
                .eq("id", record.payload.id)
                .single()
              await this.resolvePatientConflict(record.payload.id, record.payload, remoteData)
              error = null // Handled — treat as resolved
            }
          } else if (record.type === "visit") {
            // Re-stamp the synced_at time right before we actually send it
            const payload = { ...record.payload, synced_at: new Date().toISOString() }
            const res = await supabase.from("visits").insert([payload])
            error = res.error

            // Handle duplicate key (conflict) — run LWW resolution
            if (error && (error.code === "23505" || error.message?.includes("duplicate"))) {
              const { data: remoteData } = await supabase
                .from("visits")
                .select("*")
                .eq("id", record.payload.id)
                .single()
              await this.resolveVisitConflict(record.payload.id, payload, remoteData)
              error = null // Handled — treat as resolved
            }
          }

          // 3. Handle result
          if (error) {
            // Determine if the error is a network/connectivity issue
            if (error.message === "Failed to fetch" || error.message.includes("fetch")) {
              // Revert to pending so it will be retried next time we come online
              await offlineDb.pendingRecords.update(record.id, { status: "pending" })
            } else {
              // It's a hard error (e.g. database constraint, validation)
              // Mark as failed to prevent an infinite retry loop that blocks the queue
              await offlineDb.pendingRecords.update(record.id, { status: "failed" })
              console.error(`[HealStats SyncService] Hard error syncing record ${record.id}:`, error)
            }
          } else {
            // Success! The record safely exists in Supabase. Remove from local queue.
            await offlineDb.pendingRecords.delete(record.id)
            console.log(`[HealStats SyncService] Successfully synced record ${record.id}`)
          }
        } catch (err) {
          // Catch any unexpected exceptions during processing of a single record
          console.error(`[HealStats SyncService] Unexpected error processing record ${record.id}:`, err)
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
