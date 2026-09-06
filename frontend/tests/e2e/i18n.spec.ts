import { test, expect } from '@playwright/test'

// Task 18 — English/Bangla switching + persistence.
test.describe('Language switching', () => {
  test('switches to Bangla and persists across reload', async ({ page }) => {
    await page.goto('/')

    // English nav CTA present (Get Started is a link to #get-started).
    await expect(page.getByRole('link', { name: /Get Started/i }).first()).toBeVisible()

    // Switch to Bangla via the accessible language button.
    await page.getByRole('button', { name: 'বাংলা' }).click()

    // A core landing CTA now reads in Bangla ("শুরু করুন" = Get Started).
    await expect(page.getByText('শুরু করুন').first()).toBeVisible({ timeout: 10_000 })

    // Persists after reload (localStorage hs-lang via i18next detector).
    await page.reload()
    await expect(page.getByText('শুরু করুন').first()).toBeVisible({ timeout: 10_000 })

    // Switch back to English.
    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.getByRole('link', { name: /Get Started/i }).first()).toBeVisible()
  })
})
