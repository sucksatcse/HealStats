import { test, expect } from "@playwright/test"
import { loginAsWorker, loginAsAdmin } from "./helpers"

test.describe("Staff profile", () => {
  test("worker can open My Profile from the user menu", async ({ page }) => {
    await loginAsWorker(page)
    await page.getByRole("button", { name: "Your profile" }).click()
    await page.getByRole("button", { name: "My Profile" }).click()
    await expect(page.getByRole("heading", { name: "Account details" })).toBeVisible()
    await expect(page.getByText("Health Worker").first()).toBeVisible()
  })

  test("admin can open My Profile and sees the Administrator role", async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole("button", { name: "Your profile" }).click()
    await page.getByRole("button", { name: "My Profile" }).click()
    await expect(page.getByRole("heading", { name: "Account details" })).toBeVisible()
    await expect(page.getByText("Administrator").first()).toBeVisible()
  })
})
