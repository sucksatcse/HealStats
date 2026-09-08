import { test, expect } from "@playwright/test"
import {
  clinicFixtures,
  expectMapCenter,
  expectMarkerProjection,
  expectNoHorizontalOverflow,
  openMockMap,
} from "./mapHelpers"

test.describe("Mobile clinic operations map — mocked network only", () => {
  for (const width of [393, 320]) {
    for (const language of ["en", "bn"] as const) {
      test(`${width}px ${language}: accessible collapsible directory, search, map and editor fit`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 851 })
        const mock = await openMockMap(page)
        if (language === "bn")
          await page.getByRole("button", { name: "বাংলা", exact: true }).click()
        const labels =
          language === "bn"
            ? {
                title: "ক্লিনিক অপারেশন ম্যাপ",
                map: "বাংলাদেশের ক্লিনিক অপারেশন ম্যাপ",
                toggle: "4টি ক্লিনিক · তালিকা দেখান / লুকান",
                filters: "ক্লিনিক কার্যক্রমের ফিল্টার",
                active: "সক্রিয়",
                all: "সব",
                fallback: "ম্যাপে নেই",
                search: "নাম বা জোন দিয়ে ক্লিনিক খুঁজুন",
                add: "ক্লিনিক যোগ করুন",
                name: "ক্লিনিকের নাম",
                latitude: "অক্ষাংশ",
                cancel: "বাতিল",
                zoomIn: "বড় করুন",
                zoomOut: "ছোট করুন",
                reset: "বাংলাদেশ দেখুন",
                clear: "মুছুন",
              }
            : {
                title: "Clinic Operations Map",
                map: "Bangladesh clinic operations map",
                toggle: "4 Clinics · Show / hide list",
                filters: "Clinic activity filter",
                active: "Active",
                all: "All",
                fallback: "Not on Map",
                search: "Search clinics by name or zone",
                add: "Add clinic",
                name: "Clinic name",
                latitude: "Latitude",
                cancel: "Cancel",
                zoomIn: "Zoom in",
                zoomOut: "Zoom out",
                reset: "Bangladesh view",
                clear: "Clear",
              }
        const panel = page.getByRole("region", {
          name: labels.title,
          exact: true,
        })
        await expect(
          panel.getByRole("heading", { name: labels.title, exact: true }),
        ).toBeVisible()
        await expect(page.locator(".hs-leaflet-map")).toHaveAttribute(
          "aria-label",
          labels.map,
        )
        const toggle = panel.getByRole("button", {
          name: labels.toggle,
          exact: true,
        })
        await expect(toggle).toHaveAttribute("aria-expanded", "false")
        await expect(toggle).toHaveAttribute("aria-controls", "ops-clinic-list")
        await expect(page.locator("#ops-clinic-list")).toBeHidden()
        await expectNoHorizontalOverflow(page)

        await toggle.tap()
        await expect(toggle).toHaveAttribute("aria-expanded", "true")
        const filters = panel.getByRole("group", {
          name: labels.filters,
          exact: true,
        })
        await filters
          .getByRole("button", { name: labels.active, exact: true })
          .tap()
        await expect(
          filters.getByRole("button", { name: labels.active, exact: true }),
        ).toHaveAttribute("aria-pressed", "true")
        await expect(
          page.locator(".leaflet-marker-pane .hs-clinic-marker"),
        ).toHaveCount(1)
        await expect(
          panel
            .getByRole("region", { name: labels.fallback, exact: true })
            .getByRole("button", { name: "Unmapped Rangpur Clinic" }),
        ).toBeVisible()
        await filters
          .getByRole("button", { name: labels.all, exact: true })
          .tap()
        await expectNoHorizontalOverflow(page)
        await toggle.tap()
        await expect(page.locator("#ops-clinic-list")).toBeHidden()

        await panel.getByLabel(labels.search, { exact: true }).fill("Dhaka")
        await panel
          .locator(".hs-map-search-results")
          .getByRole("button", {
            name: "Dhaka Community Clinic · Dhaka",
            exact: true,
          })
          .tap()
        await expectMapCenter(page, 23.8103, 90.4125, 14)
        await expectMarkerProjection(page, clinicFixtures()[0])
        await expect(page.locator(".leaflet-popup")).toContainText(
          "Dhaka Community Clinic",
        )
        await expectNoHorizontalOverflow(page)
        await panel
          .getByRole("button", { name: labels.clear, exact: true })
          .tap()
        // Leaflet's real zoom controls retain localized accessible names.
        await panel
          .getByRole("button", { name: labels.zoomIn, exact: true })
          .tap()
        await expect(page.locator(".hs-leaflet-map")).toHaveAttribute(
          "data-zoom",
          "15",
        )
        await panel
          .getByRole("button", { name: labels.zoomOut, exact: true })
          .tap()
        await expect(page.locator(".hs-leaflet-map")).toHaveAttribute(
          "data-zoom",
          "14",
        )
        await panel
          .getByRole("button", { name: labels.reset, exact: true })
          .tap()
        await expectMapCenter(page, 23.6, 90.35, 7)

        await page
          .getByRole("button", { name: "Switch to dark mode", exact: true })
          .tap()
        await expect(page.locator("html")).toHaveClass(/dark/)
        await expect
          .poll(() =>
            mock.tiles.some((url) =>
              url.includes("basemaps.cartocdn.com/dark_all/"),
            ),
          )
          .toBe(true)
        await panel.getByRole("button", { name: labels.add, exact: true }).tap()
        const editor = panel.getByRole("form", {
          name: labels.add,
          exact: true,
        })
        await expect(editor.getByRole("heading")).toBeFocused()
        await editor
          .getByLabel(labels.name, { exact: true })
          .fill("Mobile Test Clinic")
        await editor.getByLabel(labels.latitude, { exact: true }).fill("23.8")
        await expectNoHorizontalOverflow(page)
        await editor
          .getByRole("button", { name: labels.cancel, exact: true })
          .tap()
        await expect(editor).toHaveCount(0)
        await expectNoHorizontalOverflow(page)
        expect(mock.geocodeCalls).toHaveLength(0)
        expect(mock.writes).toHaveLength(0)
        expect(mock.unexpectedApi).toEqual([])
      })
    }
  }
})
