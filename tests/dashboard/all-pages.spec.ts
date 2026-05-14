import { test, expect } from '@playwright/test'
const BASE = 'https://deveway-teal.vercel.app'
const STUDENT = { email: 'test.student@deveway.com', password: 'Test123456!' }

test.describe('Dashboard Pages - No Crashes', () => {
  test.setTimeout(120000)

  async function loginAsStudent(page: any) {
    await page.goto(`${BASE}/ar/login`)
    await page.fill('#email', STUDENT.email)
    await page.fill('#password', STUDENT.password)
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click()
    await page.waitForFunction(() => /dashboard/.test(window.location.href), { timeout: 80000 })
  }

  const dashboardPages = [
    '/ar/dashboard',
    '/ar/dashboard/my-courses',
    '/ar/dashboard/certificates',
    '/ar/dashboard/wallet',
    '/ar/dashboard/settings',
    '/ar/dashboard/ai-chat',
    '/ar/dashboard/career-path',
    '/ar/dashboard/my-sessions',
    '/ar/dashboard/client-sessions',
    '/ar/dashboard/earnings',
    '/ar/dashboard/notifications',
  ]

  for (const route of dashboardPages) {
    test(`${route} loads without React errors`, async ({ page }) => {
      await loginAsStudent(page)

      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error' && (msg.text().includes('#321') || msg.text().includes('Minified React error'))) {
          errors.push(msg.text())
        }
      })

      page.on('pageerror', err => {
        errors.push(err.message)
      })

      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(4000)

      expect(errors.length).toBe(0)
    })
  }
})
