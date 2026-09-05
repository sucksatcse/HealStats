import { test, expect } from '@playwright/test'

// Task 17 — AI assistant UI + a grounded public how-to reply (no DB, no secrets).
test.describe('AI chatbot', () => {
  test('opens, greets, and answers a starter question', async ({ page }) => {
    await page.goto('/')

    // Open the assistant.
    await page.getByRole('button', { name: 'Open chat assistant' }).click()
    const dialog = page.getByRole('dialog', { name: /HealthStats Assistant/i })
    await expect(dialog).toBeVisible()

    // Ask a public how-to starter question (scoped to the chat dialog).
    await dialog.getByRole('button', { name: 'How does offline sync work?' }).click()

    // The grounded platform answer mentions the offline-first design.
    await expect(dialog.getByText(/offline-first/i)).toBeVisible({ timeout: 10_000 })

    // Input remains usable after the exchange.
    await expect(page.getByPlaceholder('Ask a question…')).toBeEnabled()
  })
})
