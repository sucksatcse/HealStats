import { type Page, expect } from '@playwright/test'

/**
 * Shared E2E test helpers.
 * Intercepts Supabase Auth and REST network requests at the Playwright test level,
 * ensuring tests run reliably in an isolated test harness without any production code bypasses.
 */
export const WORKER = { email: 'worker@clinic.org', password: 'password123' }
export const ADMIN = { email: 'admin@healstats.org', password: 'Admin@123456' }
export const UNLINKED = { email: 'unlinked@clinic.org', password: 'password123' }

export async function setupAuthMockRoutes(page: Page): Promise<void> {
  // Always clear local storage before mock auth flows so tests are completely isolated
  await page.addInitScript(() => {
    try {
      window.localStorage.clear()
      window.sessionStorage.clear()
    } catch {
      // ignore
    }
  })

  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (url.includes('/auth/v1/token') && method === 'POST') {
      let postData: any = {}
      try {
        postData = route.request().postDataJSON() || {}
      } catch {
        postData = {}
      }
      const email = postData.email
      const password = postData.password

      if (email === WORKER.email && password === WORKER.password) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-worker-jwt',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: {
              id: '00000000-0000-0000-0000-000000000001',
              aud: 'authenticated',
              role: 'authenticated',
              email: WORKER.email,
              app_metadata: { provider: 'email', providers: ['email'] },
              user_metadata: {},
              created_at: '2026-09-01T00:00:00.000Z',
              updated_at: '2026-09-01T00:00:00.000Z',
            },
          }),
        })
      }

      if (email === ADMIN.email && password === ADMIN.password) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-admin-jwt',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: {
              id: '00000000-0000-0000-0000-000000000002',
              aud: 'authenticated',
              role: 'authenticated',
              email: ADMIN.email,
              app_metadata: { provider: 'email', providers: ['email'] },
              user_metadata: {},
              created_at: '2026-09-01T00:00:00.000Z',
              updated_at: '2026-09-01T00:00:00.000Z',
            },
          }),
        })
      }

      if (email === UNLINKED.email && password === UNLINKED.password) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-unlinked-jwt',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: {
              id: '00000000-0000-0000-0000-000000000099',
              aud: 'authenticated',
              role: 'authenticated',
              email: UNLINKED.email,
              app_metadata: { provider: 'email', providers: ['email'] },
              user_metadata: {},
              created_at: '2026-09-01T00:00:00.000Z',
              updated_at: '2026-09-01T00:00:00.000Z',
            },
          }),
        })
      }

      if (url.includes('grant_type=signup')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-signup-jwt',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: {
              id: '00000000-0000-0000-0000-000000000003',
              aud: 'authenticated',
              role: 'authenticated',
              email: postData.email,
              created_at: '2026-09-01T00:00:00.000Z',
            },
          }),
        })
      }

      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
          message: 'Invalid login credentials',
        }),
      })
    }

    if (url.includes('/auth/v1/signup') && method === 'POST') {
      let postData: any = {}
      try {
        postData = route.request().postDataJSON() || {}
      } catch {
        postData = {}
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '00000000-0000-0000-0000-000000000003',
          aud: 'authenticated',
          role: 'authenticated',
          email: postData.email,
          created_at: '2026-09-01T00:00:00.000Z',
        }),
      })
    }

    if (url.includes('/auth/v1/logout') && method === 'POST') {
      return route.fulfill({
        status: 204,
        body: '',
      })
    }

    return route.continue()
  })

  await page.route('**/rest/v1/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (url.includes('/rest/v1/staff') && method === 'GET') {
      const acceptHeader = route.request().headers()['accept'] || ''
      const isSingle = acceptHeader.includes('application/vnd.pgrst.object+json')

      if (
        url.includes('auth_user_id=eq.00000000-0000-0000-0000-000000000001') ||
        url.includes('id=eq.staff-worker-1')
      ) {
        const row = {
          id: 'staff-worker-1',
          name: 'Test Worker',
          role: 'worker',
          clinic_id: '11111111-1111-1111-1111-111111111111',
          email: WORKER.email,
          auth_user_id: '00000000-0000-0000-0000-000000000001',
          clinics: {
            id: '11111111-1111-1111-1111-111111111111',
            name: "Cox's Bazar Camp Clinic 1",
            zone: 'Camp 4',
            address: 'Block B, Camp 4',
          },
        }
        return route.fulfill({
          status: 200,
          contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
          headers: { 'content-range': '0-0/1' },
          body: JSON.stringify(isSingle ? row : [row]),
        })
      }

      if (
        url.includes('auth_user_id=eq.00000000-0000-0000-0000-000000000002') ||
        url.includes('id=eq.staff-admin-1')
      ) {
        const row = {
          id: 'staff-admin-1',
          name: 'System Admin',
          role: 'admin',
          clinic_id: null,
          email: ADMIN.email,
          auth_user_id: '00000000-0000-0000-0000-000000000002',
          clinics: null,
        }
        return route.fulfill({
          status: 200,
          contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
          headers: { 'content-range': '0-0/1' },
          body: JSON.stringify(isSingle ? row : [row]),
        })
      }

      if (url.includes('auth_user_id=eq.00000000-0000-0000-0000-000000000099')) {
        return route.fulfill({
          status: isSingle ? 406 : 200,
          contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
          headers: { 'content-range': '0-0/0' },
          body: isSingle
            ? JSON.stringify({
                code: 'PGRST116',
                details: 'The result contains 0 rows',
                message: 'JSON object requested, multiple (or no) rows returned',
              })
            : JSON.stringify([]),
        })
      }

      // Default staff directory list for admin directory view
      const allStaff = [
        {
          id: 'staff-worker-1',
          name: 'Test Worker',
          role: 'worker',
          clinic_id: '11111111-1111-1111-1111-111111111111',
          email: WORKER.email,
          clinics: {
            id: '11111111-1111-1111-1111-111111111111',
            name: "Cox's Bazar Camp Clinic 1",
            zone: 'Camp 4',
          },
        },
        {
          id: 'staff-admin-1',
          name: 'System Admin',
          role: 'admin',
          clinic_id: null,
          email: ADMIN.email,
          clinics: null,
        },
      ]
      return route.fulfill({
        status: 200,
        contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
        headers: { 'content-range': `0-${allStaff.length - 1}/${allStaff.length}` },
        body: JSON.stringify(isSingle ? allStaff[0] : allStaff),
      })
    }

    if (url.includes('/rest/v1/clinics') && method === 'GET') {
      const acceptHeader = route.request().headers()['accept'] || ''
      const isSingle = acceptHeader.includes('application/vnd.pgrst.object+json')
      const clinic = {
        id: '11111111-1111-1111-1111-111111111111',
        name: "Cox's Bazar Camp Clinic 1",
        zone: 'Camp 4',
        address: 'Block B, Camp 4',
      }
      return route.fulfill({
        status: 200,
        contentType: isSingle ? 'application/vnd.pgrst.object+json' : 'application/json',
        headers: { 'content-range': '0-0/1' },
        body: JSON.stringify(isSingle ? clinic : [clinic]),
      })
    }

    if (url.includes('/rest/v1/visits') && (method === 'GET' || method === 'HEAD')) {
      if (method === 'HEAD') {
        return route.fulfill({
          status: 200,
          headers: { 'content-range': '0-0/5' },
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-0/1' },
        body: JSON.stringify([
          {
            id: 'visit-1',
            created_at: '2026-09-07T10:00:00.000Z',
          },
        ]),
      })
    }

    if (url.includes('/rest/v1/staff') && method === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'new-staff-id',
            name: 'New Worker',
            role: 'worker',
          },
        ]),
      })
    }

    return route.continue()
  })
}

/** Log in as the test worker and land on the worker dashboard. */
export async function loginAsWorker(page: Page): Promise<void> {
  await setupAuthMockRoutes(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Get Started' }).first().click()
  await page.getByPlaceholder('e.g. name@clinic.org').fill(WORKER.email)
  await page.getByPlaceholder('Enter your password').fill(WORKER.password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  // The worker dashboard sidebar exposes a "Record Visit" nav action once authenticated.
  await expect(page.getByRole('button', { name: 'Record Visit' })).toBeVisible({ timeout: 15_000 })
}

/** Log in as the test admin and land on the admin dashboard. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await setupAuthMockRoutes(page)
  await page.goto('/admin')
  await page.getByPlaceholder('admin@healthdistrict.org').fill(ADMIN.email)
  await page.getByPlaceholder('Enter your password').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Sign In to Admin' }).click()
  await expect(page.getByText('Clinic Overview')).toBeVisible({ timeout: 15_000 })
}

