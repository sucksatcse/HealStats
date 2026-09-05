import { test, expect } from '@playwright/test'

// Responsive smoke check on a mobile viewport (Pixel 5 project).
test.describe('Mobile landing', () => {
  test('renders and exposes the mobile menu', async ({ page }) => {
    await page.goto('/')

    // Brand wordmark visible.
    await expect(page.getByText('HealthStats').first()).toBeVisible()

    // Mobile menu toggle is available and opens the menu.
    const menuToggle = page.getByRole('button', { name: 'Toggle menu' })
    await expect(menuToggle).toBeVisible()
    await menuToggle.click()

    // A navigation entry appears in the opened mobile menu (Get Started is a link).
    await expect(page.getByRole('link', { name: /Get Started/i }).first()).toBeVisible()
  })
})
