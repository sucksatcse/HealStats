import { expect, type Locator, type Page, type Route } from "@playwright/test"
import { ADMIN, loginAsAdmin } from "./helpers"

// Synthetic fixtures only. No patient, clinic, or credential comes from a real backend.
export type MapClinic = {
  id: string
  name: string
  zone: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
}

export function clinicFixtures(): MapClinic[] {
  return [
    {
      id: "a1000000-0000-4000-8000-000000000001",
      name: "Dhaka Community Clinic",
      zone: "Dhaka",
      address: "12 Test Clinic Road",
      latitude: 23.8103,
      longitude: 90.4125,
    },
    {
      id: "a1000000-0000-4000-8000-000000000002",
      name: "Sylhet Community Clinic",
      zone: "Sylhet",
      address: "24 Test Clinic Road",
      latitude: 24.8949,
      longitude: 91.8687,
    },
    {
      id: "a1000000-0000-4000-8000-000000000003",
      name: "Khulna Community Clinic",
      zone: "Khulna",
      address: "36 Test Clinic Road",
      latitude: 22.8456,
      longitude: 89.5403,
    },
    // A recognizable district must NOT cause inferred coordinates.
    {
      id: "a1000000-0000-4000-8000-000000000004",
      name: "Unmapped Rangpur Clinic",
      zone: "Rangpur",
      address: null,
      latitude: null,
      longitude: null,
    },
  ]
}

type Row = Record<string, unknown>
type Place = {
  id: string
  label: string
  latitude: number
  longitude: number
}
export type MapMockOptions = {
  clinics?: MapClinic[]
  missingSchema?: boolean
  failTable?: "clinics" | "patients" | "visits"
}
const ADMIN_ID = "00000000-0000-0000-0000-000000000002"
export const CREATED_CLINIC_ID = "a1000000-0000-4000-8000-000000000005"
// CRC-verified, transparent 1x1 RGBA PNG: successful tiles without external traffic.
const TILE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=",
  "base64",
)

/** Install before navigation; common auth routes are reused, never changed. */
export async function openMockMap(page: Page, options: MapMockOptions = {}) {
  const clinics = structuredClone(options.clinics ?? clinicFixtures())
  const fixtureIds = clinicFixtures().map((clinic) => clinic.id)
  const patientClinics = [
    fixtureIds[0],
    fixtureIds[0],
    fixtureIds[1],
    fixtureIds[2],
    fixtureIds[3],
  ]
  const patients = patientClinics
    .filter((id) => clinics.some((clinic) => clinic.id === id))
    .map((clinicId, index) => ({
      id: `b1000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      name: `Synthetic Patient ${index + 1}`,
      clinic_id: clinicId,
    }))
  const now = Date.now()
  const visits = [
    { clinicIndex: 0, hoursAgo: 2, urgency: 4, pending: true },
    { clinicIndex: 0, hoursAgo: 48, urgency: 2, pending: false },
    { clinicIndex: 1, hoursAgo: 72, urgency: 5, pending: false },
    { clinicIndex: 2, hoursAgo: 216, urgency: 1, pending: true },
  ]
    .filter((visit) =>
      clinics.some((clinic) => clinic.id === fixtureIds[visit.clinicIndex]),
    )
    .map((visit, index) => {
      const clinicId = fixtureIds[visit.clinicIndex]
      const joined = { clinic_id: clinicId }
      return {
        id: `c1000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        patient_id: patients.find((patient) => patient.clinic_id === clinicId)!
          .id,
        created_at: new Date(now - visit.hoursAgo * 3_600_000).toISOString(),
        synced_at: visit.pending
          ? null
          : new Date(now - visit.hoursAgo * 3_600_000).toISOString(),
        urgency_score: visit.urgency,
        // Exercise both supported PostgREST joined-relation shapes.
        patients: index === 1 ? [joined] : joined,
      }
    })
  const mock = {
    clinics,
    failTable: options.failTable as MapMockOptions["failTable"],
    saveFails: false,
    geocodeStatus: 200,
    geocodeResults: [] as Place[],
    geocodeCalls: [] as {
      query: string | null
      authorization: string | undefined
    }[],
    tiles: [] as string[],
    reads: [] as {
      table: string
      select: string
      offset: number
      returned: number
    }[],
    writes: [] as {
      method: string
      id: string | null
      payload: Row
    }[],
    unexpectedApi: [] as string[],
    getUserCalls: 0,
    staffChecks: 0,
  }

  await page.emulateMedia({ reducedMotion: "reduce" })
  // Only the isolated Playwright preview's static assets may reach a server.
  // Everything external is fulfilled locally or aborted, including unrecognized providers.
  await page.route("**/*", async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (
      ["tile.openstreetmap.org", "basemaps.cartocdn.com"].includes(url.hostname)
    ) {
      mock.tiles.push(url.href)
      return route.fulfill({
        status: 200,
        contentType: "image/png",
        body: TILE_PNG,
      })
    }
    if (url.pathname === "/api/geocode" && request.method() === "GET") {
      mock.geocodeCalls.push({
        query: url.searchParams.get("q"),
        authorization: request.headers().authorization,
      })
      return route.fulfill({
        status: mock.geocodeStatus,
        json:
          mock.geocodeStatus === 200
            ? mock.geocodeResults
            : { error: "Synthetic provider failure" },
      })
    }
    if (/\/(api|rest\/v1|auth\/v1|functions\/v1)\//.test(url.pathname)) {
      mock.unexpectedApi.push(`${request.method()} ${url.pathname}`)
      return route.abort("blockedbyclient")
    }
    if (url.origin === "http://localhost:4599" && request.method() === "GET")
      return route.continue()
    return route.abort("blockedbyclient")
  })

  // loginAsAdmin invokes setupAuthMockRoutes. Register overrides AFTER it because
  // Playwright resolves routes last-registered-first (the shared routes abort getUser).
  await loginAsAdmin(page)
  await page.route("**/auth/v1/user", async (route) => {
    expect(route.request().method()).toBe("GET")
    mock.getUserCalls += 1
    return route.fulfill({
      json: {
        id: ADMIN_ID,
        aud: "authenticated",
        role: "authenticated",
        email: ADMIN.email,
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: {},
        created_at: "2026-09-01T00:00:00.000Z",
      },
    })
  })
  await page.route("**/rest/v1/**", async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const table = url.pathname.split("/").pop()!
    const method = request.method()
    const select = url.searchParams.get("select") ?? ""
    if (
      table === "staff" &&
      method === "GET" &&
      url.searchParams.get("auth_user_id") === `eq.${ADMIN_ID}`
    ) {
      mock.staffChecks += 1
      return route.fulfill({
        json: {
          id: "d1000000-0000-4000-8000-000000000001",
          auth_user_id: ADMIN_ID,
          name: "System Admin",
          email: ADMIN.email,
          role: "admin",
          designation: "district_admin",
          is_active: true,
          clinic_id: null,
        },
        headers: { "content-range": "0-0/1" },
      })
    }
    if (table === "clinics" && ["POST", "PATCH"].includes(method)) {
      const payload = request.postDataJSON() as Row
      const id = url.searchParams.get("id")
      mock.writes.push({ method, id, payload })
      if (mock.saveFails)
        return route.fulfill({
          status: 503,
          json: { message: "Synthetic save failure" },
        })
      const saved = {
        ...payload,
        id: method === "POST" ? CREATED_CLINIC_ID : id?.replace(/^eq\./, ""),
      } as MapClinic
      if (method === "POST") clinics.push(saved)
      else {
        const index = clinics.findIndex((clinic) => clinic.id === saved.id)
        expect(index).toBeGreaterThanOrEqual(0)
        clinics[index] = saved
      }
      return route.fulfill({
        status: method === "POST" ? 201 : 200,
        json: saved,
        headers: { "content-range": "0-0/1" },
      })
    }
    if (!["GET", "HEAD"].includes(method)) {
      mock.unexpectedApi.push(`${method} ${url.pathname}`)
      return route.abort("blockedbyclient")
    }
    if (!["clinics", "patients", "visits"].includes(table))
      return route.fallback()
    if (mock.failTable === table)
      return route.fulfill({
        status: 500,
        json: { code: "XX000", message: "Synthetic database read failure" },
      })
    if (
      table === "clinics" &&
      options.missingSchema &&
      /latitude|longitude/.test(select)
    ) {
      return route.fulfill({
        status: 400,
        json: {
          code: "42703",
          message: "column clinics.latitude does not exist",
        },
      })
    }
    let rows: Row[] =
      table === "clinics" ? clinics : table === "patients" ? patients : visits
    for (const [key, value] of url.searchParams) {
      if (value.startsWith("eq."))
        rows = rows.filter((row) => String(row[key]) === value.slice(3))
      if (value.startsWith("gte."))
        rows = rows.filter((row) => String(row[key]) >= value.slice(4))
      if (value === "is.null") rows = rows.filter((row) => row[key] === null)
    }
    rows = [...rows].sort((a, b) =>
      String(a[table === "clinics" ? "name" : "id"]).localeCompare(
        String(b[table === "clinics" ? "name" : "id"]),
      ),
    )
    if (table === "clinics" && options.missingSchema)
      rows = rows.map(({ latitude: _lat, longitude: _lng, ...row }) => row)
    await fulfillPage(route, rows, (offset, returned) =>
      mock.reads.push({ table, select, offset, returned }),
    )
  })

  if ((page.viewportSize()?.width ?? 1280) < 1024)
    await page
      .getByRole("button", { name: "Open sidebar", exact: true })
      .click()
  await page
    .locator("aside nav")
    .getByRole("button", { name: "Ops Map", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Clinic Operations Map", exact: true }),
  ).toBeVisible()
  await expect(
    page.locator(".hs-ops-map").getByText("Loading clinics…", { exact: true }),
  ).toHaveCount(0)
  return mock
}

async function fulfillPage(
  route: Route,
  rows: Row[],
  record: (offset: number, returned: number) => void,
) {
  const request = route.request()
  const params = new URL(request.url()).searchParams
  const range = request.headers().range?.match(/(?:items=)?(\d+)-(\d+)/)
  const offset = Number(params.get("offset") ?? range?.[1] ?? 0)
  const limit = Number(
    params.get("limit") ??
      (range ? Number(range[2]) - offset + 1 : rows.length),
  )
  // Simulate a server cap smaller than the requested 1000; importantly, offset >=
  // total MUST return [], because the service deliberately reads until EMPTY.
  const batch = rows.slice(offset, offset + Math.min(limit, 2))
  record(offset, batch.length)
  const single = request
    .headers()
    .accept?.includes("application/vnd.pgrst.object+json")
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    headers: {
      "content-range": batch.length
        ? `${offset}-${offset + batch.length - 1}/${rows.length}`
        : `*/${rows.length}`,
    },
    body:
      request.method() === "HEAD"
        ? ""
        : JSON.stringify(single ? (batch[0] ?? null) : batch),
  })
}

export function clinicMarker(page: Page, name: string) {
  return page
    .locator(".leaflet-marker-pane .hs-clinic-marker")
    .and(page.getByTitle(name, { exact: true }))
}

export async function expectMapCenter(
  page: Page,
  latitude: number,
  longitude: number,
  zoom: number,
) {
  const map = page.locator(".hs-leaflet-map")
  await expect
    .poll(async () => Number(await map.getAttribute("data-zoom")))
    .toBe(zoom)
  await expect
    .poll(async () => Number(await map.getAttribute("data-latitude")))
    .toBeCloseTo(latitude, 4)
  await expect
    .poll(async () => Number(await map.getAttribute("data-longitude")))
    .toBeCloseTo(longitude, 4)
}

/** Independent EPSG:3857 projection, not application coordinates or Leaflet internals. */
export async function expectMarkerProjection(page: Page, clinic: MapClinic) {
  expect(clinic.latitude).not.toBeNull()
  expect(clinic.longitude).not.toBeNull()
  const marker = clinicMarker(page, clinic.name)
  await expect(marker).toHaveCount(1)
  await expect
    .poll(async () =>
      marker.evaluate((element, point) => {
        const map = element.closest(".hs-leaflet-map") as HTMLElement
        const zoom = Number(map.dataset.zoom)
        const project = (latitude: number, longitude: number) => {
          const scale = 256 * 2 ** zoom
          const sine = Math.sin((latitude * Math.PI) / 180)
          return {
            x: ((longitude + 180) / 360) * scale,
            y:
              (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale,
          }
        }
        const center = project(
          Number(map.dataset.latitude),
          Number(map.dataset.longitude),
        )
        const expected = project(point.latitude!, point.longitude!)
        const bounds = map.getBoundingClientRect()
        const actual = element.getBoundingClientRect()
        return Math.max(
          Math.abs(
            actual.left +
              actual.width / 2 -
              bounds.left -
              (bounds.width / 2 + expected.x - center.x),
          ),
          Math.abs(
            actual.top +
              actual.height / 2 -
              bounds.top -
              (bounds.height / 2 + expected.y - center.y),
          ),
        )
      }, clinic),
    )
    .toBeLessThan(2)
}

export async function expectMetric(
  details: Locator,
  label: string,
  count: number,
) {
  const metric = details
    .locator("dl > div")
    .filter({ has: details.page().getByText(label, { exact: true }) })
  await expect(metric.locator("dd")).toHaveText(String(count))
}

export async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.locator(".hs-ops-map").evaluate((panel) => {
    const bounds = panel.getBoundingClientRect()
    const map = panel.querySelector(".hs-leaflet-map")!.getBoundingClientRect()
    return {
      document: document.documentElement.scrollWidth - innerWidth,
      panel: panel.scrollWidth - panel.clientWidth,
      left: bounds.left,
      right: bounds.right,
      mapLeft: map.left,
      mapRight: map.right,
      viewport: innerWidth,
    }
  })
  expect(dimensions.document).toBeLessThanOrEqual(1)
  expect(dimensions.panel).toBeLessThanOrEqual(1)
  expect(dimensions.left).toBeGreaterThanOrEqual(0)
  expect(dimensions.right).toBeLessThanOrEqual(dimensions.viewport + 1)
  expect(dimensions.mapLeft).toBeGreaterThanOrEqual(dimensions.left)
  expect(dimensions.mapRight).toBeLessThanOrEqual(dimensions.right + 1)
}
