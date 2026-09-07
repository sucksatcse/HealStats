import { test, expect } from "@playwright/test"
import { loginAsWorker, loginAsAdmin } from "./helpers"

test.describe("Staff & Patient profiles", () => {
  test("worker can open My Profile from the user menu and navigate back", async ({ page }) => {
    await loginAsWorker(page)
    await page.getByRole("button", { name: "Your profile" }).click()
    await page.getByRole("button", { name: "My Profile" }).click()
    await expect(page.getByRole("heading", { name: "Account details" })).toBeVisible()
    await expect(page.getByText("Health Worker").first()).toBeVisible()
    await expect(page.getByText("Clinical Activity Summary")).toBeVisible()

    // Back to dashboard
    await page.getByRole("button", { name: /Back to Dashboard/i }).click()
    await expect(page.getByRole("button", { name: "Record Visit" })).toBeVisible()
  })

  test("admin can open My Profile and sees the Administrator role", async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole("button", { name: "Your profile" }).click()
    await page.getByRole("button", { name: "My Profile" }).click()
    await expect(page.getByRole("heading", { name: "Account details" })).toBeVisible()
    await expect(page.getByText("Administrator").first()).toBeVisible()
    await expect(page.getByText("Clinical Activity Summary")).toBeVisible()

    // Back to dashboard
    await page.getByRole("button", { name: /Back to Dashboard/i }).click()
    await expect(page.getByText("Clinic Overview")).toBeVisible()
  })

  test("admin can navigate to Staff Management and see directory", async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole("button", { name: "Staff", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Staff Management" })).toBeVisible()
  })
})
