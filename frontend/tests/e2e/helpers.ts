import { type Page, expect } from '@playwright/test'

/**
 * Shared E2E helpers. Uses the application's built-in demo-login bypass so tests
 * never send real credentials or mutate the real Supabase database.
 */
export const WORKER = { email: 'worker@clinic.org', password: 'password123' }
export const ADMIN = { email: 'admin@healstats.org', password: 'Admin@123456' }

/** Log in as the demo worker and land on the worker dashboard. */
export async function loginAsWorker(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Log in' }).first().click()
  await page.getByPlaceholder('e.g. name@clinic.org').fill(WORKER.email)
  await page.getByPlaceholder('Enter your password').fill(WORKER.password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  // The worker dashboard sidebar exposes a "Record Visit" nav action once authenticated.
  await expect(page.getByRole('button', { name: 'Record Visit' })).toBeVisible({ timeout: 15_000 })
}

/** Log in as the demo admin and land on the admin dashboard. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: 'Admin', exact: true }).first().click()
  await page.getByPlaceholder('admin@healthdistrict.org').fill(ADMIN.email)
  await page.getByPlaceholder('Enter your password').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Sign In to Admin' }).click()
  await expect(page.getByText('Clinic Overview')).toBeVisible({ timeout: 15_000 })
}
