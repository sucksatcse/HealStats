import { test, expect } from '@playwright/test'
import { loginAsWorker, loginAsAdmin, setupAuthMockRoutes, WORKER, UNLINKED } from './helpers'

test.describe('Authentication', () => {
  test('worker can sign in and reach the worker dashboard', async ({ page }) => {
    await loginAsWorker(page)
    // The login form is gone once authenticated.
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Record Visit' })).toBeVisible()
  })

  test('admin can sign in and reach the admin dashboard', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByText('Clinic Overview')).toBeVisible()
  })

  test('worker can log out and is returned to the sign-in screen', async ({ page }) => {
    await loginAsWorker(page)
    // Log out via the navbar profile menu
    await page.getByRole('button', { name: 'Your profile' }).click()
    await page.getByRole('button', { name: 'Log Out', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible({ timeout: 15_000 })
    // The authenticated dashboard is gone.
    await expect(page.getByRole('button', { name: 'Record Visit' })).toHaveCount(0)
  })

  test('worker account is denied access at admin login via /admin', async ({ page }) => {
    await setupAuthMockRoutes(page)
    await page.goto('/admin')
    await page.getByPlaceholder('admin@healthdistrict.org').fill(WORKER.email)
    await page.getByPlaceholder('Enter your password').fill(WORKER.password)
    await page.getByRole('button', { name: 'Sign In to Admin' }).click()

    await expect(page.getByText('This account is not authorized for admin access.')).toBeVisible({ timeout: 10_000 })
    // Admin dashboard is not reached
    await expect(page.getByText('Clinic Overview')).toHaveCount(0)
  })

  test('public landing navbar has no Admin button and direct URL /admin loads admin login', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header').getByRole('button', { name: 'Admin', exact: true })).toHaveCount(0)
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Sign in to admin' })).toBeVisible()
    await expect(page.getByPlaceholder('admin@healthdistrict.org')).toBeVisible()
  })

  test('invalid credentials displays authentication error', async ({ page }) => {
    await setupAuthMockRoutes(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Get Started' }).first().click()
    await page.getByPlaceholder('e.g. name@clinic.org').fill('unknown@clinic.org')
    await page.getByPlaceholder('Enter your password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await expect(page.getByText('Invalid login credentials')).toBeVisible({ timeout: 10_000 })
  })

  test('authenticated user with missing staff record sees Account Not Linked', async ({ page }) => {
    await setupAuthMockRoutes(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Get Started' }).first().click()
    await page.getByPlaceholder('e.g. name@clinic.org').fill(UNLINKED.email)
    await page.getByPlaceholder('Enter your password').fill(UNLINKED.password)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await expect(page.getByText('Account not linked')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/no staff profile is linked/i)).toBeVisible()
    await page.getByRole('button', { name: 'Sign out' }).click()
  })

  test('public signup provides worker designations only (no admin, no patient)', async ({ page }) => {
    await setupAuthMockRoutes(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Get Started' }).first().click()
    await page.getByRole('button', { name: 'Create an account' }).click()

    // Verify title and admin disclaimer
    await expect(page.getByText('Healthcare Worker Sign Up')).toBeVisible()
    await expect(page.getByText(/Administrator accounts are provisioned by your district coordinator/i)).toBeVisible()

    // Verify options do NOT include District Administrator or Patient
    await expect(page.getByRole('button', { name: /Community Health Worker/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Nurse/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Clinical Officer/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'District Administrator', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Patient', exact: true })).toHaveCount(0)
  })
})

