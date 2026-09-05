import { test, expect } from '@playwright/test'
import { loginAsWorker, loginAsAdmin } from './helpers'

test.describe('Authentication', () => {
  test('demo worker can sign in and reach the worker dashboard', async ({ page }) => {
    await loginAsWorker(page)
    // The login form is gone once authenticated.
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toHaveCount(0)
  })

  test('demo admin can sign in and reach the admin dashboard', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByText('Clinic Overview')).toBeVisible()
  })

  test('worker can log out and is returned to the sign-in screen', async ({ page }) => {
    await loginAsWorker(page)
    // Log out via the navbar profile menu ("Log Out" clears the session; the
    // protected-route guard then redirects to the worker sign-in screen).
    await page.getByRole('button', { name: 'Your profile' }).click()
    await page.getByRole('button', { name: 'Log Out', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible({ timeout: 15_000 })
    // The authenticated dashboard is gone.
    await expect(page.getByText('Sr. Amara Diallo')).toHaveCount(0)
  })
})
