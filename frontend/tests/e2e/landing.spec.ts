import { test, expect } from '@playwright/test'

// Public landing page renders its core marketing structure.
test.describe('Landing page', () => {
  test('loads with hero and primary CTAs', async ({ page }) => {
    await page.goto('/')

    // Brand wordmark in the navbar.
    await expect(page.getByText('HealthStats').first()).toBeVisible()

    // Hero headline copy (English default).
    await expect(page.getByText('Healthcare records', { exact: false }).first()).toBeVisible()

    // Primary CTA present (the Get Started call-to-action is a link to #get-started).
    await expect(page.getByRole('link', { name: /Get Started/i }).first()).toBeVisible()
  })

  test('unauthenticated visitor is not shown the dashboard', async ({ page }) => {
    await page.goto('/')
    // Worker dashboard greeting must NOT be visible before login.
    await expect(page.getByText('Sr. Amara Diallo')).toHaveCount(0)
    // A login entry point is available instead.
    await expect(page.getByRole('button', { name: 'Log in' }).first()).toBeVisible()
  })
})
