import { test, expect } from '@playwright/test'

// Public landing page renders its core marketing structure.
test.describe('Landing page', () => {
  test('loads with hero and primary CTAs', async ({ page }) => {
    await page.goto('/')

    // Brand wordmark in the navbar.
    await expect(page.getByText('HealStats').first()).toBeVisible()

    // Hero headline copy (English default).
    await expect(page.getByText('Healthcare records', { exact: false }).first()).toBeVisible()

    // The hero CTA opens self-registration.
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible()
  })

  test('guest navbar exposes login and signup without protected content', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Record Visit' })).toHaveCount(0)
    await page.locator('header').getByRole('button', { name: 'Sign Up', exact: true }).click()
    await expect(page.getByText('Healthcare Worker Sign Up')).toBeVisible()
    await page.goto('/')
    await page.locator('header').getByRole('button', { name: 'Log In', exact: true }).click()
    await expect(page.getByText('Healthcare Worker Portal')).toBeVisible()
    await page.getByRole('button', { name: 'Create an account' }).click()
    await expect(page.getByText('Healthcare Worker Sign Up')).toBeVisible()
  })
})
