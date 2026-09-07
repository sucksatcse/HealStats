import type { ClinicActivity, ClinicMapEntry } from "./types"

/** [south-west, north-east], latitude first. Rectangle, not a national border polygon. */
export const BANGLADESH_BOUNDS: [[number, number], [number, number]] = [
  [20.5, 88],
  [26.7, 92.7],
]

export const BANGLADESH_CENTER: [number, number] = [23.6, 90.35]

/** Never infer a location from the name/zone or coerce missing values to zero. */
export function hasCoordinates<T extends {
  latitude?: number | null
  longitude?: number | null
},>(entry: T): entry is T & {
  latitude: number
  longitude: number
} {
  const { latitude, longitude } = entry
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    latitude >= BANGLADESH_BOUNDS[0][0] &&
    latitude <= BANGLADESH_BOUNDS[1][0] &&
    longitude >= BANGLADESH_BOUNDS[0][1] &&
    longitude <= BANGLADESH_BOUNDS[1][1]
  )
}

/** Search stays Unicode-aware; spotlight intersects (rather than overrides) other filters. */
export function filterClinics(
  entries: ClinicMapEntry[],
  filter: "all" | ClinicActivity,
  query: string,
  spotlight: boolean,
): ClinicMapEntry[] {
  const term = query.trim().toLowerCase()
  return entries.filter(
    (entry) =>
      (filter === "all" || entry.activity === filter) &&
      (!spotlight || entry.activity === "quiet") &&
      (!term ||
        entry.name.toLowerCase().includes(term) ||
        (entry.zone ?? "").toLowerCase().includes(term)),
  )
}
