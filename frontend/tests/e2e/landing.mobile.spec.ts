import { test, expect } from '@playwright/test'

test.describe('Mobile landing', () => {
  for (const width of [320, 393, 768, 1024, 1280]) {
    for (const language of ['en', 'bn'] as const) {
      test(`navigation and auth controls are usable at ${width}px in ${language}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 851 })
        await page.goto('/')
        const header = page.locator('header')
        await expect(header.getByRole('link', { name: 'HealStats', exact: true })).toBeVisible()
        if (language === 'bn') await header.getByRole('button', { name: 'বাংলা', exact: true }).click()
        await header.getByRole('button', { name: 'Switch to dark mode' }).click()

        const toggle = header.getByRole('button', { name: 'Toggle navigation menu' })
        const loginLabel = language === 'bn' ? 'লগ ইন' : 'Log In'
        const signupLabel = language === 'bn' ? 'সাইন আপ' : 'Sign Up'
        if (width < 1280) {
          await toggle.click()
          await expect(toggle).toHaveAttribute('aria-expanded', 'true')
          const drawer = page.locator('#landing-mobile-menu')
          await expect(drawer.getByRole('button', { name: loginLabel, exact: true })).toBeVisible()
          await expect(drawer.getByRole('button', { name: signupLabel, exact: true })).toBeVisible()
          await toggle.click()
          await expect(drawer).toHaveCount(0)
          await toggle.click()
        } else {
          await expect(toggle).toBeHidden()
        }

        const controlsFit = await header.evaluate(element =>
          Array.from(element.querySelectorAll('button, a')).every(control => {
            const rect = control.getBoundingClientRect()
            return rect.width === 0 || (rect.left >= 0 && rect.right <= innerWidth)
          }),
        )
        expect(controlsFit).toBe(true)
        const signupHeading = language === 'bn' ? 'স্বাস্থ্যকর্মী সাইন আপ' : 'Healthcare Worker Sign Up'
        const loginHeading = language === 'bn' ? 'স্বাস্থ্যকর্মী পোর্টাল' : 'Healthcare Worker Portal'
        await header.getByRole('button', { name: signupLabel, exact: true }).click()
        await expect(page.getByText(signupHeading)).toBeVisible()
        await page.goto('/')
        if (width < 1280) await toggle.click()
        await header.getByRole('button', { name: loginLabel, exact: true }).click()
        await expect(page.getByText(loginHeading)).toBeVisible()
      })
    }
  }
})
