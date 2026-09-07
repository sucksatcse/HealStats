import { test, expect } from "@playwright/test"
import {
  CREATED_CLINIC_ID,
  clinicFixtures,
  clinicMarker,
  expectMapCenter,
  expectMarkerProjection,
  expectMetric,
  openMockMap,
} from "./mapHelpers"

test.describe("Clinic operations map — mocked network only", () => {
  test("zoom buttons, mouse wheel and dragging change the real map viewport", async ({
    page,
  }) => {
    await openMockMap(page)
    const map = page.locator(".hs-leaflet-map")
    await page.getByRole("button", { name: "Zoom in", exact: true }).click()
    await expect(map).toHaveAttribute("data-zoom", "8")
    const bounds = await map.boundingBox()
    expect(bounds).not.toBeNull()
    await page.mouse.move(
      bounds!.x + bounds!.width / 2,
      bounds!.y + bounds!.height / 2,
    )
    await page.mouse.wheel(0, -120)
    await expect
      .poll(async () => Number(await map.getAttribute("data-zoom")))
      .toBeGreaterThan(8)
    const before = Number(await map.getAttribute("data-longitude"))
    await page.mouse.move(
      bounds!.x + bounds!.width / 2,
      bounds!.y + bounds!.height / 2,
    )
    await page.mouse.down()
    await page.mouse.move(
      bounds!.x + bounds!.width / 2 + 100,
      bounds!.y + bounds!.height / 2,
      { steps: 10 },
    )
    await page.mouse.up()
    await expect
      .poll(async () =>
        Math.abs(Number(await map.getAttribute("data-longitude")) - before),
      )
      .toBeGreaterThan(0.01)
    await page
      .getByRole("button", { name: "Bangladesh view", exact: true })
      .click()
    await expectMapCenter(page, 23.6, 90.35, 7)
  })

  test("projects saved coordinates with Leaflet and aggregates all paginated metrics", async ({
    page,
  }, testInfo) => {
    const mock = await openMockMap(page)
    await expect(
      page.locator(".leaflet-marker-pane .hs-clinic-marker"),
    ).toHaveCount(3)
    for (const clinic of clinicFixtures().slice(0, 3))
      await expectMarkerProjection(page, clinic)
    for (const table of ["clinics", "patients", "visits"]) {
      expect(
        mock.reads.some((read) => read.table === table && read.offset > 0),
      ).toBe(true)
      expect(
        mock.reads.some((read) => read.table === table && read.returned === 0),
      ).toBe(true)
    }
    await page
      .locator(".hs-map-clinic-list")
      .getByRole("button", { name: /Dhaka Community Clinic/ })
      .click()
    const summary = page.getByRole("region", {
      name: "Selected clinic summary",
    })
    await expectMetric(summary, "patients", 2)
    await expectMetric(summary, "visits / 24h", 1)
    await expectMetric(summary, "visits / 7d", 2)
    await expectMetric(summary, "high-risk", 1)
    await expectMetric(summary, "pending sync", 1)
    await expect(summary).toContainText("last visit")
    expect(mock.geocodeCalls).toHaveLength(0)
    expect(mock.writes).toHaveLength(0)
    expect(mock.unexpectedApi).toEqual([])
    await page
      .locator(".hs-ops-map")
      .screenshot({ path: testInfo.outputPath("map-desktop.png") })
  })

  test("filters Active, Recent and Quiet while retaining the unmapped fallback", async ({
    page,
  }) => {
    await openMockMap(page)
    const filters = page.getByRole("group", { name: "Clinic activity filter" })
    for (const [label, name] of [
      ["Active", "Dhaka Community Clinic"],
      ["Recent", "Sylhet Community Clinic"],
      ["Quiet", "Khulna Community Clinic"],
    ]) {
      await filters.getByRole("button", { name: label, exact: true }).click()
      await expect(
        filters.getByRole("button", { name: label, exact: true }),
      ).toHaveAttribute("aria-pressed", "true")
      await expect(
        page.locator(".leaflet-marker-pane .hs-clinic-marker"),
      ).toHaveCount(1)
      await expect(clinicMarker(page, name)).toHaveCount(1)
      await expect(
        page
          .getByRole("region", { name: "Not on Map", exact: true })
          .getByRole("button", { name: "Unmapped Rangpur Clinic" }),
      ).toBeVisible()
    }
    await filters.getByRole("button", { name: "All", exact: true }).click()
    await expect(
      page.locator(".leaflet-marker-pane .hs-clinic-marker"),
    ).toHaveCount(3)
  })

  test("quiet spotlight intersects search and activity and clears without hiding fallback", async ({
    page,
  }) => {
    await openMockMap(page)
    const spotlight = page.getByRole("button", {
      name: "Quiet-clinic spotlight",
      exact: true,
    })
    await spotlight.click()
    await expect(spotlight).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator(".hs-clinic-marker.is-spotlit")).toHaveCount(1)
    await expect(
      page.getByText("2 clinics recorded no visits in the last 7 days", {
        exact: true,
      }),
    ).toBeVisible()
    await page
      .getByLabel("Search clinics by name or zone", { exact: true })
      .fill("Khulna")
    await expect(clinicMarker(page, "Khulna Community Clinic")).toHaveClass(
      /is-spotlit/,
    )
    await page
      .getByRole("group", { name: "Clinic activity filter" })
      .getByRole("button", { name: "Active", exact: true })
      .click()
    await expect(
      page.locator(".leaflet-marker-pane .hs-clinic-marker"),
    ).toHaveCount(0)
    await expect(
      page.getByRole("region", { name: "Not on Map", exact: true }),
    ).toBeVisible()
    await page
      .locator(".hs-ops-map")
      .getByRole("button", { name: "Clear", exact: true })
      .click()
    await expect(spotlight).toHaveAttribute("aria-pressed", "false")
    await expect(
      page.locator(".leaflet-marker-pane .hs-clinic-marker"),
    ).toHaveCount(3)
  })

  test("name and zone search fly to saved locations and open the selected popup using keyboard", async ({
    page,
  }) => {
    const mock = await openMockMap(page)
    for (const [query, clinic] of [
      ["Dhaka Community", clinicFixtures()[0]],
      ["sYLhEt", clinicFixtures()[1]],
    ] as const) {
      await page
        .getByLabel("Search clinics by name or zone", { exact: true })
        .fill(query)
      const result = page
        .locator(".hs-map-search-results")
        .getByRole("button", {
          name: `${clinic.name} · ${clinic.zone}`,
          exact: true,
        })
      await result.focus()
      await expect(result).toBeFocused()
      await result.press("Enter")
      await expectMapCenter(page, clinic.latitude!, clinic.longitude!, 14)
      await expectMarkerProjection(page, clinic)
      await expect(page.locator(".leaflet-popup")).toContainText(clinic.name)
      await expect(clinicMarker(page, clinic.name)).toHaveClass(/is-selected/)
    }
    expect(mock.geocodeCalls).toHaveLength(0)
    await page
      .getByRole("button", { name: "Bangladesh view", exact: true })
      .click()
    await expectMapCenter(page, 23.6, 90.35, 7)
  })

  test("hover tooltip contains clinic identity, activity and real fixture metrics", async ({
    page,
  }) => {
    await openMockMap(page)
    await clinicMarker(page, "Dhaka Community Clinic").hover()
    const tooltip = page.locator(".leaflet-tooltip")
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText("Dhaka Community Clinic")
    await expect(tooltip).toContainText("12 Test Clinic Road")
    await expect(tooltip).toContainText("Active")
    await expectMetric(tooltip, "patients", 2)
    await expectMetric(tooltip, "visits / 24h", 1)
    await expectMetric(tooltip, "visits / 7d", 2)
    await expectMetric(tooltip, "high-risk", 1)
    await expectMetric(tooltip, "pending sync", 1)
  })

  for (const [label, point] of [
    ["missing", { latitude: null, longitude: null }],
    ["partial", { latitude: 25.7, longitude: null }],
    ["outside Bangladesh", { latitude: 51.5, longitude: -0.12 }],
  ] as const) {
    test(`${label} coordinates never create a marker or a guessed district location`, async ({
      page,
    }) => {
      const clinics = clinicFixtures()
      clinics[3] = { ...clinics[3], ...point }
      const mock = await openMockMap(page, { clinics })
      await expect(clinicMarker(page, clinics[3].name)).toHaveCount(0)
      await page
        .getByLabel("Search clinics by name or zone", { exact: true })
        .fill("no such clinic")
      const fallback = page.getByRole("region", {
        name: "Not on Map",
        exact: true,
      })
      await expect(
        fallback.getByRole("button", { name: clinics[3].name }),
      ).toBeVisible()
      const before = await page
        .locator(".hs-leaflet-map")
        .getAttribute("data-latitude")
      await fallback.getByRole("button", { name: clinics[3].name }).click()
      await expect(
        page.getByRole("region", { name: "Selected clinic summary" }),
      ).toContainText("Not on map — coordinates needed")
      await expect(page.locator(".hs-leaflet-map")).toHaveAttribute(
        "data-latitude",
        before!,
      )
      await expect(
        page.locator(".leaflet-marker-pane .hs-clinic-marker"),
      ).toHaveCount(0)
      expect(mock.geocodeCalls).toHaveLength(0)
    })
  }

  test("42703 latitude falls back to the legacy schema with add and edit disabled", async ({
    page,
  }) => {
    const mock = await openMockMap(page, { missingSchema: true })
    await expect(
      page.getByText(
        /Clinic coordinates are not available in this database yet/,
      ),
    ).toBeVisible()
    await expect(
      page.locator(".leaflet-marker-pane .hs-clinic-marker"),
    ).toHaveCount(0)
    await expect(page.locator(".hs-map-clinic-list > button")).toHaveCount(4)
    await expect(
      page.getByRole("button", { name: "Add clinic", exact: true }),
    ).toBeDisabled()
    await page
      .getByRole("region", { name: "Not on Map", exact: true })
      .getByRole("button", { name: "Dhaka Community Clinic" })
      .click()
    await expect(
      page.getByRole("button", { name: "Edit clinic location", exact: true }),
    ).toBeDisabled()
    expect(
      mock.reads.some(
        (read) =>
          read.table === "clinics" &&
          !read.select.includes("latitude") &&
          read.returned === 0,
      ),
    ).toBe(true)
    expect(mock.writes).toHaveLength(0)
  })

  for (const failTable of ["clinics", "patients", "visits"] as const) {
    test(`${failTable} failure shows an error, not empty data; retry reloads markers`, async ({
      page,
    }) => {
      const mock = await openMockMap(page, { failTable })
      const alert = page.locator(".hs-map-sidebar").getByRole("alert")
      await expect(alert).toContainText(
        "Failed to load clinics from the database.",
      )
      await expect(
        page.getByText("No clinics found", { exact: true }),
      ).toHaveCount(0)
      await expect(
        page.locator(".leaflet-marker-pane .hs-clinic-marker"),
      ).toHaveCount(0)
      await expect(
        page.getByRole("button", { name: "Add clinic", exact: true }),
      ).toBeDisabled()
      mock.failTable = undefined
      await alert.getByRole("button", { name: "Retry", exact: true }).click()
      await expect(alert).toHaveCount(0)
      await expect(
        page.locator(".leaflet-marker-pane .hs-clinic-marker"),
      ).toHaveCount(3)
      await expect(
        page.getByRole("button", { name: "Add clinic", exact: true }),
      ).toBeEnabled()
    })
  }

  test("empty clinic dataset shows an honest empty state and no markers", async ({
    page,
  }) => {
    const mock = await openMockMap(page, { clinics: [] })
    await expect(
      page.getByText("No clinics found", { exact: true }),
    ).toBeVisible()
    await expect(
      page.locator(".leaflet-marker-pane .hs-clinic-marker"),
    ).toHaveCount(0)
    await expect(page.locator(".hs-ops-map").getByRole("alert")).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Add clinic", exact: true }),
    ).toBeEnabled()
    expect(mock.geocodeCalls).toHaveLength(0)
  })

  test("place lookup makes zero calls on typing; explicit submission uses mocked geocode and flies", async ({
    page,
  }) => {
    await page.clock.install()
    const mock = await openMockMap(page)
    const place = {
      id: "osm-test-1",
      label: "Test place, Barishal, Bangladesh",
      latitude: 22.701,
      longitude: 90.3535,
    }
    mock.geocodeResults = [place]
    const search = page.getByLabel("Search clinics by name or zone", {
      exact: true,
    })
    await search.pressSequentially("Barishal")
    await expect(
      page
        .locator(".hs-map-search-results")
        .getByText("No clinics match these filters.", { exact: true }),
    ).toBeVisible()
    // Advance browser timers as well, catching accidental debounced autocomplete.
    await page.clock.fastForward(1500)
    expect(mock.geocodeCalls).toHaveLength(0)
    await page
      .getByRole("button", { name: "Search places", exact: true })
      .click()
    const result = page.getByRole("button", { name: place.label, exact: true })
    await expect(result).toBeVisible()
    expect(mock.geocodeCalls).toEqual([
      { query: "Barishal", authorization: "Bearer mock-admin-jwt" },
    ])
    await result.click()
    await expectMapCenter(page, place.latitude, place.longitude, 13)
    await expect(search).toHaveValue("")
    await expect(
      page.locator(".leaflet-marker-pane .hs-clinic-marker"),
    ).toHaveCount(3)
    expect(mock.writes).toHaveLength(0)
    expect(mock.unexpectedApi).toEqual([])
  })

  for (const [status, message] of [
    [200, "No matching places found in Bangladesh."],
    [429, "Place search is busy. Please wait before trying again."],
    [
      503,
      "Place search is unavailable. Check connectivity and the geocoding server, then try again.",
    ],
  ] as const) {
    test(`place search handles ${
      status === 200 ? "no results" : status
    } without an automatic retry`, async ({ page }) => {
      await page.clock.install()
      const mock = await openMockMap(page)
      mock.geocodeStatus = status
      await page
        .getByLabel("Search clinics by name or zone", { exact: true })
        .fill("Test place")
      await page
        .getByRole("button", { name: "Search places", exact: true })
        .click()
      await expect(
        page
          .locator(".hs-map-search")
          .getByRole("status")
          .filter({ hasText: message }),
      ).toBeVisible()
      await page.clock.fastForward(3000)
      expect(mock.geocodeCalls).toHaveLength(1)
      await expect(
        page.getByRole("button", { name: "Search places", exact: true }),
      ).toBeEnabled()
      await expectMapCenter(page, 23.6, 90.35, 7)
    })
  }

  test("light OSM and dark Carto tiles are fulfilled locally, with attribution and unchanged markers", async ({
    page,
  }) => {
    const mock = await openMockMap(page)
    await expect
      .poll(() =>
        mock.tiles.some((url) =>
          /^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/.test(url),
        ),
      )
      .toBe(true)
    await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible()
    await page
      .getByRole("button", { name: "Switch to dark mode", exact: true })
      .click()
    await expect(page.locator("html")).toHaveClass(/dark/)
    await expect
      .poll(() =>
        mock.tiles.some((url) =>
          /^https:\/\/basemaps\.cartocdn\.com\/dark_all\/\d+\/\d+\/\d+\.png$/.test(
            url,
          ),
        ),
      )
      .toBe(true)
    await expect(page.locator(".leaflet-control-attribution")).toContainText(
      "CARTO",
    )
    await expect(page.locator(".hs-map-tile-error")).toHaveCount(0)
    await expectMarkerProjection(page, clinicFixtures()[0])
    await page
      .getByRole("button", { name: "Switch to light mode", exact: true })
      .click()
    await expect(
      page.locator(".leaflet-tile-pane img").first(),
    ).toHaveAttribute("src", /tile\.openstreetmap\.org/)
    await expect(page.locator(".leaflet-control-attribution")).toContainText(
      "OpenStreetMap",
    )
  })

  test("add editor validates coordinates, click-to-place projects the draft, and saves via mocked auth and REST", async ({
    page,
  }) => {
    const mock = await openMockMap(page)
    await page.getByRole("button", { name: "Add clinic", exact: true }).click()
    const editor = page.getByRole("form", { name: "Add clinic", exact: true })
    await expect(editor.getByRole("heading")).toBeFocused()
    await editor
      .getByLabel("Clinic name", { exact: true })
      .fill("  New Test Clinic  ")
    await editor.getByLabel("Zone / district", { exact: true }).fill("Dhaka")
    await editor
      .getByLabel("Clinic address", { exact: true })
      .fill("48 Test Clinic Road")
    const save = editor.getByRole("button", {
      name: "Save clinic",
      exact: true,
    })
    for (const [latitude, longitude] of [
      ["", "90.4"],
      ["0", "0"],
      ["27", "90.4"],
      ["23.8", "93"],
      ["23.8", ""],
    ]) {
      await editor.getByLabel("Latitude", { exact: true }).fill(latitude)
      await editor.getByLabel("Longitude", { exact: true }).fill(longitude)
      await expect(save).toBeDisabled()
      await expect(page.locator(".hs-clinic-marker.is-draft")).toHaveCount(0)
    }
    expect(mock.writes).toHaveLength(0)
    const placing = editor.getByRole("button", {
      name: "Place on map",
      exact: true,
    })
    await placing.click()
    await expect(placing).toHaveAttribute("aria-pressed", "true")
    const map = page.locator(".hs-leaflet-map")
    const size = await map.boundingBox()
    expect(size).not.toBeNull()
    // Keep the click inside Bangladesh regardless of desktop viewport width.
    await map.click({
      position: { x: size!.width / 2 + 45, y: size!.height / 2 + 60 },
    })
    await expect(placing).toHaveAttribute("aria-pressed", "false")
    const latitude = Number(
      await editor.getByLabel("Latitude", { exact: true }).inputValue(),
    )
    const longitude = Number(
      await editor.getByLabel("Longitude", { exact: true }).inputValue(),
    )
    await expectMarkerProjection(page, {
      ...clinicFixtures()[0],
      name: "Draft clinic location",
      latitude,
      longitude,
    })
    await expect(save).toBeEnabled()
    await save.click()
    await expect(editor).toHaveCount(0)
    await expect(
      page.getByText("Clinic saved to the database.", { exact: true }),
    ).toBeVisible()
    expect(mock.writes).toEqual([
      {
        method: "POST",
        id: null,
        payload: {
          name: "New Test Clinic",
          zone: "Dhaka",
          address: "48 Test Clinic Road",
          latitude,
          longitude,
        },
      },
    ])
    expect(mock.getUserCalls).toBe(1)
    expect(mock.staffChecks).toBe(1)
    expect(
      mock.clinics.find((clinic) => clinic.id === CREATED_CLINIC_ID)?.latitude,
    ).toBe(latitude)
    await expectMapCenter(page, latitude, longitude, 14)
    await expect(page.locator(".leaflet-popup")).toContainText(
      "New Test Clinic",
    )
    await expect(
      page.locator(".leaflet-marker-pane .hs-clinic-marker"),
    ).toHaveCount(4)
    expect(mock.geocodeCalls).toHaveLength(0)
    expect(mock.unexpectedApi).toEqual([])
  })

  test("edit preloads saved coordinates and mocked PATCH updates the existing marker", async ({
    page,
  }) => {
    const mock = await openMockMap(page)
    await page
      .locator(".hs-map-clinic-list")
      .getByRole("button", { name: /Dhaka Community Clinic/ })
      .click()
    await page
      .getByRole("button", { name: "Edit clinic location", exact: true })
      .click()
    const editor = page.getByRole("form", {
      name: "Edit clinic location",
      exact: true,
    })
    await expect(editor.getByLabel("Latitude", { exact: true })).toHaveValue(
      "23.8103",
    )
    await expect(editor.getByLabel("Longitude", { exact: true })).toHaveValue(
      "90.4125",
    )
    await editor.getByLabel("Latitude", { exact: true }).fill("23.82")
    await editor.getByLabel("Longitude", { exact: true }).fill("90.42")
    await editor
      .getByRole("button", { name: "Save clinic", exact: true })
      .click()
    await expect(editor).toHaveCount(0)
    expect(mock.writes).toEqual([
      {
        method: "PATCH",
        id: `eq.${clinicFixtures()[0].id}`,
        payload: {
          name: "Dhaka Community Clinic",
          zone: "Dhaka",
          address: "12 Test Clinic Road",
          latitude: 23.82,
          longitude: 90.42,
        },
      },
    ])
    expect(mock.getUserCalls).toBe(1)
    expect(mock.staffChecks).toBe(1)
    await expect(
      page.locator(".leaflet-marker-pane .hs-clinic-marker"),
    ).toHaveCount(3)
    await expectMapCenter(page, 23.82, 90.42, 14)
    await expectMarkerProjection(page, {
      ...clinicFixtures()[0],
      latitude: 23.82,
      longitude: 90.42,
    })
    expect(mock.geocodeCalls).toHaveLength(0)
  })

  test("editor address search is explicit, save failure retains inputs, and cancel never writes", async ({
    page,
  }) => {
    const mock = await openMockMap(page)
    mock.geocodeResults = [
      {
        id: "test-address",
        label: "Test Clinic Address, Dhaka",
        latitude: 23.75,
        longitude: 90.39,
      },
    ]
    await page.getByRole("button", { name: "Add clinic", exact: true }).click()
    const editor = page.getByRole("form", { name: "Add clinic", exact: true })
    await editor
      .getByLabel("Clinic name", { exact: true })
      .fill("Address Test Clinic")
    await editor.getByLabel("Zone / district", { exact: true }).fill("Dhaka")
    await editor
      .getByLabel("Clinic address", { exact: true })
      .fill("60 Test Clinic Road")
    expect(mock.geocodeCalls).toHaveLength(0)
    await editor
      .getByRole("button", { name: "Find clinic address", exact: true })
      .click()
    await page
      .getByRole("button", { name: "Test Clinic Address, Dhaka", exact: true })
      .click()
    await expect(editor.getByLabel("Latitude", { exact: true })).toHaveValue(
      "23.750000",
    )
    await expect(editor.getByLabel("Longitude", { exact: true })).toHaveValue(
      "90.390000",
    )
    expect(mock.geocodeCalls[0].query).toBe(
      "60 Test Clinic Road, Dhaka, Bangladesh",
    )
    mock.saveFails = true
    await editor
      .getByRole("button", { name: "Save clinic", exact: true })
      .click()
    await expect(editor.getByRole("alert")).toContainText(
      "Clinic could not be saved.",
    )
    await expect(editor.getByLabel("Clinic name", { exact: true })).toHaveValue(
      "Address Test Clinic",
    )
    await expect(
      page.getByText("Clinic saved to the database.", { exact: true }),
    ).toHaveCount(0)
    await editor.getByRole("button", { name: "Cancel", exact: true }).click()
    await expect(editor).toHaveCount(0)
    await expect(page.locator(".hs-clinic-marker.is-draft")).toHaveCount(0)
    expect(mock.writes).toHaveLength(1)
    expect(mock.clinics).toHaveLength(4)
  })
})
