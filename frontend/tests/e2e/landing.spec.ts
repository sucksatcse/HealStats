import { test, expect } from '@playwright/test'

// Public landing page renders its core marketing structure.
test.describe('Landing page', () => {
  test('loads with hero and primary CTAs', async ({ page }) => {
    await page.goto('/')

    // Brand wordmark in the navbar.
    await expect(page.getByText('HealStats').first()).toBeVisible()

    // Hero headline copy (English default).
    await expect(page.getByText('Healthcare records', { exact: false }).first()).toBeVisible()

    // Primary CTA present (Get Started button in navbar).
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible()
  })

  test('unauthenticated visitor is not shown the dashboard and navbar has no Log in button', async ({ page }) => {
    await page.goto('/')
    // Worker dashboard must NOT be visible before login.
    await expect(page.getByRole('button', { name: 'Record Visit' })).toHaveCount(0)
    // The navbar has NO separate "Log in" button; "Get Started" is the primary authentication entry.
    await expect(page.locator('header').getByRole('button', { name: 'Log in' })).toHaveCount(0)
    // Clicking "Get Started" in the navbar opens the sign-in / worker authentication page.
    await page.locator('header').getByRole('button', { name: 'Get Started' }).click()
    await expect(page.getByText('Healthcare Worker Portal')).toBeVisible()
  })
})
