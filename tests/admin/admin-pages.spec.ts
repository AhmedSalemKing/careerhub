import { test, expect } from '@playwright/test'
const BASE = 'https://deveway-teal.vercel.app'
const ADMIN = { email: 'admin@deveway.com', password: 'Admin123!' }

test.describe('Admin Pages - No Crashes', () => {
  test.setTimeout(120000)

  async function loginAsAdmin(page: any) {
    await page.goto('https://deveway-teal.vercel.app/ar/login')
    await page.waitForTimeout(3000)
    await page.fill('input[type="email"]', ADMIN.email)
    await page.fill('input[type="password"]', ADMIN.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/dashboard|admin/, { timeout: 90000 })
  }

  const adminPages = [
    '/ar/admin',
    '/ar/admin/users',
    '/ar/admin/courses',
    '/ar/admin/approvals',
    '/ar/admin/payments',
    '/ar/admin/sessions',
    '/ar/admin/certificates',
    '/ar/admin/analytics',
    '/ar/admin/activity',
    '/ar/admin/revenue',
    '/ar/admin/site-settings',
    '/ar/admin/coaches',
  ]

  for (const route of adminPages) {
    test(`${route} loads without errors`, async ({ page }) => {
      await loginAsAdmin(page)

      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error' && (msg.text().includes('#321') || msg.text().includes('Minified React error'))) {
          errors.push(msg.text())
        }
      })

      page.on('pageerror', err => {
        errors.push(err.message)
      })

      const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' })
      expect(response?.status()).not.toBe(500)
      await page.waitForTimeout(3000)

      expect(errors.length).toBe(0)
    })
  }
})
