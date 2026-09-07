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

  test('worker logout returns home and protected routes require login again', async ({ page }) => {
    await loginAsWorker(page)
    // Log out via the navbar profile menu
    await page.getByRole('button', { name: 'Your profile' }).click()
    await page.getByRole('button', { name: 'Log Out', exact: true }).click()
    await expect(page).toHaveURL('/')
    await expect(page.locator('header').getByRole('button', { name: 'Log In', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Record Visit' })).toHaveCount(0)
    await page.goto('/dashboard')
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Record Visit' })).toHaveCount(0)
  })

  test('worker account is denied access at admin login via /admin', async ({ page }) => {
    await setupAuthMockRoutes(page)
    await page.goto('/admin')
    await page.getByPlaceholder('admin@healthdistrict.org').fill(WORKER.email)
    await page.getByPlaceholder('Enter your password').fill(WORKER.password)
    await page.getByRole('button', { name: 'Sign In to Admin' }).click()

    await expect(page.getByText('This account is not authorized for admin access.')).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL('/admin')
    await expect(page.getByText('Clinic Overview')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Record Visit' })).toHaveCount(0)
  })

  test('admin denial survives a delayed staff lookup', async ({ page }) => {
    await setupAuthMockRoutes(page)
    await page.route('**/rest/v1/staff**', async route => {
      await new Promise(resolve => setTimeout(resolve, 300))
      await route.fallback()
    })
    await page.goto('/admin')
    await page.getByPlaceholder('admin@healthdistrict.org').fill(WORKER.email)
    await page.getByPlaceholder('Enter your password').fill(WORKER.password)
    await page.getByRole('button', { name: 'Sign In to Admin' }).click()
    await expect(page.getByRole('alert')).toHaveText('This account is not authorized for admin access.')
    await expect(page).toHaveURL('/admin')
    await expect(page.getByText('Clinic Overview')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Record Visit' })).toHaveCount(0)
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
    await page.locator('header').getByRole('button', { name: 'Log In', exact: true }).click()
    await page.getByPlaceholder('e.g. name@clinic.org').fill('unknown@clinic.org')
    await page.getByPlaceholder('Enter your password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await expect(page.getByText('Invalid login credentials')).toBeVisible({ timeout: 10_000 })
  })

  test('authenticated user with missing staff record sees Account Not Linked', async ({ page }) => {
    await setupAuthMockRoutes(page)
    const staffWrites: string[] = []
    page.on('request', request => {
      if (request.url().includes('/rest/v1/staff') && !['GET', 'HEAD'].includes(request.method())) {
        staffWrites.push(request.method())
      }
    })
    await page.goto('/')
    await page.locator('header').getByRole('button', { name: 'Log In', exact: true }).click()
    await page.getByPlaceholder('e.g. name@clinic.org').fill(UNLINKED.email)
    await page.getByPlaceholder('Enter your password').fill(UNLINKED.password)
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await expect(page.getByText('Account not linked')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/no staff profile is linked/i)).toBeVisible()
    expect(staffWrites).toEqual([])
    await expect(page.getByText('Clinic Overview')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Record Visit' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Sign out' }).click()
  })

  test('public signup provides worker designations only (no admin, no patient)', async ({ page }) => {
    await setupAuthMockRoutes(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Get Started' }).first().click()

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

