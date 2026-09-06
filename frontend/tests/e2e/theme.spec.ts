import { test, expect } from '@playwright/test'

// Task 19 — dark mode toggle + persistence.
test.describe('Dark mode', () => {
  test('toggles dark mode and persists across reload', async ({ page }) => {
    await page.goto('/')
    const html = page.locator('html')

    // Starts in light mode.
    await expect(html).not.toHaveClass(/dark/)

    // Switch to dark.
    await page.getByRole('button', { name: 'Switch to dark mode' }).first().click()
    await expect(html).toHaveClass(/dark/)

    // Persists after a reload (localStorage hs-theme + pre-paint guard).
    await page.reload()
    await expect(html).toHaveClass(/dark/)

    // Switch back to light.
    await page.getByRole('button', { name: 'Switch to light mode' }).first().click()
    await expect(html).not.toHaveClass(/dark/)
  })
})
