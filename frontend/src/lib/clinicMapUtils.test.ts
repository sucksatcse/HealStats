import { describe, expect, it } from "vitest"
import {
  BANGLADESH_BOUNDS,
  BANGLADESH_CENTER,
  filterClinics,
  hasCoordinates,
} from "./clinicMapUtils"
import type { ClinicMapEntry } from "./types"

describe("hasCoordinates", () => {
  it("exports latitude-first bounds and a valid center", () => {
    expect(BANGLADESH_BOUNDS).toEqual([
      [20.5, 88],
      [26.7, 92.7],
    ])
    expect(
      hasCoordinates({
        latitude: BANGLADESH_CENTER[0],
        longitude: BANGLADESH_CENTER[1],
      }),
    ).toBe(true)
  })

  it.each([
    [20.5, 88],
    [26.7, 92.7],
    [23.8103, 90.4125],
  ])("accepts inclusive valid coordinates %s, %s", (latitude, longitude) => {
    const entry: {
      latitude?: number | null
      longitude?: number | null
      id: string
    } = { id: "clinic", latitude, longitude }
    expect(hasCoordinates(entry)).toBe(true)
    if (hasCoordinates(entry)) {
      const position: [number, number] = [entry.latitude, entry.longitude]
      expect(position).toEqual([latitude, longitude])
      expect(entry.id).toBe("clinic")
    }
  })

  it.each([
    {},
    { latitude: null, longitude: null },
    { latitude: 23, longitude: null },
    { latitude: null, longitude: 90 },
    { latitude: 23 },
    { longitude: 90 },
    { latitude: 0, longitude: 90 },
    { latitude: 23, longitude: 0 },
    { latitude: NaN, longitude: 90 },
    { latitude: 23, longitude: NaN },
    { latitude: Infinity, longitude: 90 },
    { latitude: 23, longitude: -Infinity },
    { latitude: 20.49, longitude: 90 },
    { latitude: 26.71, longitude: 90 },
    { latitude: 23, longitude: 87.99 },
    { latitude: 23, longitude: 92.71 },
  ])(
    "rejects absent, non-finite, zero, or out-of-bounds values: %j",
    (entry) => {
      expect(hasCoordinates(entry)).toBe(false)
    },
  )
})

describe("filterClinics", () => {
  const makeEntry = (
    id: string,
    name: string,
    zone: string | null,
    activity: ClinicMapEntry["activity"],
  ): ClinicMapEntry => ({
    id,
    name,
    zone,
    activity,
    address: null,
    latitude: null,
    longitude: null,
    patientCount: 0,
    visitsLast24h: 0,
    visitsLast7d: 0,
    pendingSync: 0,
    highRisk: 0,
    lastVisitAt: null,
  })
  const entries = [
    makeEntry("a", "ঢাকা স্বাস্থ্য কেন্দ্র", "Dhaka", "active"),
    makeEntry("b", "Coastal Clinic", "বরিশাল", "quiet"),
    makeEntry("c", "Quiet Dhaka", "ঢাকা", "quiet"),
    makeEntry("d", "Recent Clinic", null, "recent"),
  ]
  const ids = (
    filter: "all" | ClinicMapEntry["activity"],
    query = "",
    spotlight = false,
  ) => filterClinics(entries, filter, query, spotlight).map((entry) => entry.id)

  it("preserves order and all entries including unmapped clinics without mutating input", () => {
    expect(filterClinics(entries, "all", "  ", false)).toEqual(entries)
    expect(filterClinics(entries, "all", "", false)).not.toBe(entries)
    expect(ids("all")).toEqual(["a", "b", "c", "d"])
  })
  it("matches Bangla names and zones, trimming Unicode whitespace", () => {
    expect(ids("all", "\u2003ঢাকা\u2003")).toEqual(["a", "c"])
    expect(ids("all", " বরিশাল ")).toEqual(["b"])
  })
  it("matches English case-insensitively and handles null zones", () => {
    expect(ids("all", " DHAKA ")).toEqual(["a", "c"])
    expect(ids("all", "RECENT")).toEqual(["d"])
    expect(ids("all", "missing")).toEqual([])
  })
  it("intersects activity, query and quiet spotlight", () => {
    expect(ids("active")).toEqual(["a"])
    expect(ids("recent")).toEqual(["d"])
    expect(ids("quiet")).toEqual(["b", "c"])
    expect(ids("all", "", true)).toEqual(["b", "c"])
    expect(ids("quiet", "ঢাকা", true)).toEqual(["c"])
    expect(ids("active", "", true)).toEqual([])
  })
})
