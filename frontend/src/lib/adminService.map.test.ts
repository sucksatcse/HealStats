import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fetchClinicMapData, saveClinic } from "./adminService"

const client = vi.hoisted(() => ({ from: vi.fn(), auth: { getUser: vi.fn() } }))
vi.mock("./supabase", () => ({ supabase: client }))

type Row = Record<string, unknown>
type Query = {
  table: string
  columns?: string
  operation?: "insert" | "update"
  payload?: Row
  filters: Array<[string, string, unknown]>
  orders: Array<[string, { ascending: boolean }]>
  range?: [number, number]
  single?: boolean
}
type Result = {
  data: unknown
  error: unknown
}
let rows: Record<string, Row[]>
let queries: Query[]
let intercept: (query: Query) => Result | undefined
let serverCap: number
const now = new Date("2026-09-08T12:00:00.000Z")
const clinic = {
  id: "c1",
  name: "ঢাকা Clinic",
  zone: "Dhaka",
  address: "Clinic road",
  latitude: 23.81,
  longitude: 90.41,
}
const input = {
  name: " New Clinic ",
  zone: " Dhaka ",
  address: " Road ",
  latitude: 23.81,
  longitude: 90.41,
}
const missingLatitude = {
  code: "42703",
  message: "column clinics.latitude does not exist",
}

/** Fluent in-memory Supabase mock: no real client, auth, database or geocoding traffic. */
function from(table: string) {
  const query: Query = { table, filters: [], orders: [] }
  const chain = {
    select(columns: string) {
      query.columns = columns
      return chain
    },
    order(column: string, options: { ascending: boolean }) {
      query.orders.push([column, options])
      return chain
    },
    range(start: number, end: number) {
      query.range = [start, end]
      return chain
    },
    returns() {
      return chain
    },
    gte(column: string, value: unknown) {
      query.filters.push(["gte", column, value])
      return chain
    },
    is(column: string, value: unknown) {
      query.filters.push(["is", column, value])
      return chain
    },
    eq(column: string, value: unknown) {
      query.filters.push(["eq", column, value])
      return chain
    },
    insert(payload: Row) {
      query.operation = "insert"
      query.payload = payload
      return chain
    },
    update(payload: Row) {
      query.operation = "update"
      query.payload = payload
      return chain
    },
    single() {
      query.single = true
      return chain
    },
    maybeSingle() {
      query.single = true
      return chain
    },
    then(
      resolve: (result: Result) => unknown,
      reject: (error: unknown) => unknown,
    ) {
      return Promise.resolve()
        .then(() => {
          queries.push(query)
          const result = intercept(query)
          if (result) return result
          if (query.operation)
            return {
              data: { id: "saved-clinic", ...query.payload },
              error: null,
            }
          let data = [...(rows[table] ?? [])]
          for (const [operator, column, value] of query.filters) {
            data = data.filter((row) =>
              operator === "gte"
                ? String(row[column]) >= String(value)
                : row[column] === value,
            )
          }
          data.sort((a, b) => {
            for (const [column, { ascending }] of query.orders) {
              const comparison = String(a[column]).localeCompare(
                String(b[column]),
              )
              if (comparison) return ascending ? comparison : -comparison
            }
            return 0
          })
          if (query.range) {
            const [start, end] = query.range
            data = data.slice(start, Math.min(end + 1, start + serverCap))
          }
          return { data: query.single ? (data[0] ?? null) : data, error: null }
        })
        .then(resolve, reject)
    },
  }
  return chain
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(now)
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Network forbidden in map unit tests")
    }),
  )
  vi.clearAllMocks()
  queries = []
  intercept = () => undefined
  serverCap = 1000
  rows = {
    clinics: [clinic],
    patients: [],
    visits: [],
    staff: [
      {
        role: "admin",
        designation: "administrator",
        is_active: true,
        auth_user_id: "auth-admin",
      },
    ],
  }
  client.from.mockImplementation(from)
  client.auth.getUser.mockResolvedValue({
    data: { user: { id: "auth-admin" } },
    error: null,
  })
})

afterEach(() => {
  expect(fetch).not.toHaveBeenCalled()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe("fetchClinicMapData", () => {
  it("maps stored coordinates and preserves patient, visit, activity and server-only pending semantics", async () => {
    rows.clinics.push(
      { ...clinic, id: "c2", latitude: null, longitude: null },
      { ...clinic, id: "c3" },
    )
    rows.patients = [
      { id: "p1", clinic_id: "c1" },
      { id: "p2", clinic_id: "c1" },
      { id: "p3", clinic_id: "c2" },
      { id: "orphan", clinic_id: null },
    ]
    rows.visits = [
      {
        id: "v1",
        created_at: now.toISOString(),
        synced_at: now.toISOString(),
        urgency_score: 4,
        patients: { clinic_id: "c1" },
      },
      {
        id: "v2",
        created_at: "2026-09-07T12:00:00.000Z",
        synced_at: null,
        urgency_score: 5,
        patients: [{ clinic_id: "c1" }],
      },
      {
        id: "v3",
        created_at: "2026-09-01T12:00:00.000Z",
        synced_at: now.toISOString(),
        urgency_score: 3,
        patients: { clinic_id: "c2" },
      },
      {
        id: "v4",
        created_at: "2026-08-01T00:00:00.000Z",
        synced_at: null,
        urgency_score: 5,
        patients: { clinic_id: "c3" },
      },
      {
        id: "v5",
        created_at: now.toISOString(),
        synced_at: null,
        urgency_score: 5,
        patients: null,
      },
    ]
    const result = await fetchClinicMapData()
    expect(result.error).toBeNull()
    expect(result.coordinatesAvailable).toBe(true)
    expect(result.clinics[0]).toMatchObject({
      ...clinic,
      patientCount: 2,
      visitsLast24h: 2,
      visitsLast7d: 2,
      highRisk: 2,
      pendingSync: 1,
      activity: "active",
      lastVisitAt: now.toISOString(),
    })
    expect(result.clinics[1]).toMatchObject({
      latitude: null,
      longitude: null,
      visitsLast7d: 1,
      highRisk: 0,
      activity: "recent",
    })
    expect(result.clinics[2]).toMatchObject({
      activity: "quiet",
      pendingSync: 1,
      highRisk: 0,
      lastVisitAt: null,
    })
    expect(result.totals).toEqual({
      clinics: 3,
      patients: 3,
      visitsLast7d: 3,
      pendingSync: 2,
    })
    expect(queries.find((q) => q.table === "clinics")?.columns).toContain(
      "latitude, longitude",
    )
    expect(
      queries.filter((q) => q.table === "visits")[0].filters,
    ).toContainEqual(["gte", "created_at", "2026-09-01T12:00:00.000Z"])
  })

  it.each([
    missingLatitude,
    { code: "42703", message: "column clinics.longitude does not exist" },
    {
      code: "PGRST204",
      message:
        "Could not find the 'latitude' column of 'clinics' in the schema cache",
    },
  ])("falls back only for missing coordinate columns: %j", async (error) => {
    intercept = (q) =>
      q.table === "clinics" && q.columns?.includes("latitude")
        ? { data: null, error }
        : undefined
    const result = await fetchClinicMapData()
    expect(result.error).toBeNull()
    expect(result.coordinatesAvailable).toBe(false)
    expect(result.clinics[0]).toMatchObject({
      latitude: null,
      longitude: null,
      activity: "quiet",
    })
    expect(queries.some((q) => q.columns === "id, name, zone, address")).toBe(
      true,
    )
  })

  it.each([
    { code: "42501", message: "permission denied for clinics latitude" },
    { code: "42703", message: "column clinics.address does not exist" },
    { code: "PGRST204", message: "Could not find the 'zone' column" },
  ])(
    "reports unrelated clinic errors without legacy fallback: %j",
    async (error) => {
      intercept = (q) =>
        q.table === "clinics" ? { data: null, error } : undefined
      expect((await fetchClinicMapData()).error).toBeTruthy()
      expect(queries.filter((q) => q.table === "clinics")).toHaveLength(1)
    },
  )

  it("reports a failed legacy fallback instead of returning an empty success", async () => {
    intercept = (q) =>
      q.table === "clinics"
        ? {
            data: null,
            error: q.columns?.includes("latitude")
              ? missingLatitude
              : { code: "42501" },
          }
        : undefined
    expect((await fetchClinicMapData()).error).toBeTruthy()
  })

  it.each(["patients", "recent", "pending"])(
    "invalidates the whole map when %s metrics fail",
    async (target) => {
      intercept = (q) =>
        (
          target === "patients"
            ? q.table === "patients"
            : q.table === "visits" &&
              q.filters.some(
                ([op]) => op === (target === "recent" ? "gte" : "is"),
              )
        )
          ? {
              data: null,
              error: { code: "42501", message: "Permission denied" },
            }
          : undefined
      const result = await fetchClinicMapData()
      expect(result.error).toBeTruthy()
      expect(result.clinics).toEqual([])
    },
  )

  it("reports rejected network promises and null data", async () => {
    intercept = (q) => {
      if (q.table === "patients") throw new Error("offline")
      return undefined
    }
    expect((await fetchClinicMapData()).error).toBeTruthy()
    intercept = (q) =>
      q.table === "patients" ? { data: null, error: null } : undefined
    expect((await fetchClinicMapData()).error).toBeTruthy()
  })

  it("uses ordered ranges for all datasets, even when server caps are below the requested size", async () => {
    serverCap = 2
    rows.clinics = Array.from({ length: 5 }, (_, i) => ({
      ...clinic,
      id: `c${i}`,
    }))
    rows.patients = Array.from({ length: 5 }, (_, i) => ({
      id: `p${i}`,
      clinic_id: `c${i}`,
    }))
    rows.visits = Array.from({ length: 5 }, (_, i) => ({
      id: `v${i}`,
      created_at: now.toISOString(),
      synced_at: null,
      urgency_score: 4,
      patients: { clinic_id: `c${i}` },
    }))
    const result = await fetchClinicMapData()
    expect(result.totals).toEqual({
      clinics: 5,
      patients: 5,
      visitsLast7d: 5,
      pendingSync: 5,
    })
    for (const q of queries) {
      expect(q.orders).toContainEqual(["id", { ascending: true }])
      expect(q.range).toBeDefined()
    }
    for (const table of ["clinics", "patients", "visits"]) {
      expect(
        queries.filter((q) => q.table === table).map((q) => q.range?.[0]),
      ).toContain(5)
    }
    expect(
      queries.filter((q) => q.table === "clinics").map((q) => q.range),
    ).toEqual([
      [0, 999],
      [2, 1001],
      [4, 1003],
      [5, 1004],
    ])
  })

  it("does not expose partial totals if a later page fails", async () => {
    serverCap = 1
    rows.patients = [
      { id: "p1", clinic_id: "c1" },
      { id: "p2", clinic_id: "c1" },
    ]
    intercept = (q) =>
      q.table === "patients" && q.range?.[0] === 1
        ? { data: null, error: { message: "failed page" } }
        : undefined
    expect((await fetchClinicMapData()).error).toBeTruthy()
  })

  it("reports genuinely empty datasets as a successful empty map", async () => {
    rows.clinics = []
    expect(await fetchClinicMapData()).toEqual({
      clinics: [],
      coordinatesAvailable: true,
      totals: { clinics: 0, patients: 0, visitsLast7d: 0, pendingSync: 0 },
      error: null,
    })
  })
})

describe("saveClinic", () => {
  it.each([undefined, "existing-clinic"])(
    "saves and returns a trimmed record after verified admin lookup (id=%s)",
    async (id) => {
      const result = await saveClinic({ ...input, ...(id ? { id } : {}) })
      expect(client.auth.getUser).toHaveBeenCalledOnce()
      expect(queries[0]).toMatchObject({
        table: "staff",
        filters: [["eq", "auth_user_id", "auth-admin"]],
      })
      expect(queries[1]).toMatchObject({
        table: "clinics",
        operation: id ? "update" : "insert",
        payload: {
          name: "New Clinic",
          zone: "Dhaka",
          address: "Road",
          latitude: 23.81,
          longitude: 90.41,
        },
      })
      expect(queries[1].payload).not.toHaveProperty("id")
      expect(queries[1].filters).toEqual(id ? [["eq", "id", id]] : [])
      expect(result).toEqual({
        data: { id: "saved-clinic", ...queries[1].payload },
        error: null,
      })
    },
  )

  it.each([
    { name: "  ", error: "map:clinicNameRequired" },
    { latitude: NaN, error: "map:invalidCoordinates" },
    { longitude: Infinity, error: "map:invalidCoordinates" },
    { latitude: 0, error: "map:invalidCoordinates" },
    { longitude: 93, error: "map:invalidCoordinates" },
    { id: " ", error: "map:saveError" },
  ])(
    "rejects invalid input before any requests: %j",
    async ({ error, ...invalid }) => {
      expect(await saveClinic({ ...input, ...invalid })).toEqual({
        data: null,
        error,
      })
      expect(client.auth.getUser).not.toHaveBeenCalled()
      expect(client.from).not.toHaveBeenCalled()
    },
  )

  it.each([
    null,
    { role: "worker", designation: "community_health_worker" },
    { role: "admin", designation: "nurse" },
    { role: "admin", designation: "clinical_officer" },
    { role: "admin", designation: "administrator", is_active: false },
  ])(
    "denies missing, non-admin, clinical or inactive staff regardless of metadata: %j",
    async (staff) => {
      client.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: "auth-admin",
            user_metadata: { role: "admin", designation: "administrator" },
          },
        },
        error: null,
      })
      rows.staff = staff ? [{ ...staff, auth_user_id: "auth-admin" }] : []
      expect(await saveClinic(input)).toEqual({
        data: null,
        error: "map:adminRequired",
      })
      expect(queries.some((q) => q.table === "clinics")).toBe(false)
    },
  )

  it("does not use metadata instead of staff designation", async () => {
    client.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: "auth-admin",
          user_metadata: { role: "worker", designation: "nurse" },
        },
      },
      error: null,
    })
    expect((await saveClinic(input)).error).toBeNull()
  })

  it.each([
    "signed-out",
    "auth-error",
    "auth-rejection",
    "staff-error",
    "staff-rejection",
  ])("fails closed on %s", async (failure) => {
    if (failure === "signed-out")
      client.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })
    if (failure === "auth-error")
      client.auth.getUser.mockResolvedValue({
        data: { user: { id: "auth-admin" } },
        error: { message: "Expired" },
      })
    if (failure === "auth-rejection")
      client.auth.getUser.mockRejectedValue(new Error("Offline"))
    if (failure.startsWith("staff"))
      intercept = (q) => {
        if (q.table !== "staff") return undefined
        if (failure === "staff-rejection") throw new Error("Offline")
        return {
          data: null,
          error: { message: "Ambiguous or inaccessible staff" },
        }
      }
    expect(await saveClinic(input)).toEqual({
      data: null,
      error: "map:adminRequired",
    })
    expect(queries.some((q) => q.table === "clinics")).toBe(false)
  })

  it.each([
    { dbError: missingLatitude, expected: "map:migrationRequired" },
    {
      dbError: {
        code: "PGRST204",
        message:
          "Could not find the 'longitude' column of 'clinics' in the schema cache",
      },
      expected: "map:migrationRequired",
    },
    {
      dbError: { code: "42501", message: "RLS denied" },
      expected: "map:saveError",
    },
    {
      dbError: { code: "23514", message: "constraint failed" },
      expected: "map:saveError",
    },
    {
      dbError: { code: "42703", message: "column address does not exist" },
      expected: "map:saveError",
    },
    {
      dbError: { code: "PGRST116", message: "No record returned" },
      expected: "map:saveError",
    },
  ])(
    "returns safe translation keys for mutation errors: %j",
    async ({ dbError, expected }) => {
      intercept = (q) =>
        q.table === "clinics" ? { data: null, error: dbError } : undefined
      expect(await saveClinic(input)).toEqual({ data: null, error: expected })
      expect(queries.filter((q) => q.table === "clinics")).toHaveLength(1)
    },
  )

  it("reports network failures and absent save records without a false success", async () => {
    intercept = (q) => {
      if (q.table === "clinics") throw new Error("offline")
      return undefined
    }
    expect(await saveClinic(input)).toEqual({
      data: null,
      error: "map:saveError",
    })
    intercept = (q) =>
      q.table === "clinics" ? { data: null, error: null } : undefined
    expect(await saveClinic(input)).toEqual({
      data: null,
      error: "map:saveError",
    })
  })
})
