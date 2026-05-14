import { test, expect } from '@playwright/test'
const BASE = 'https://deveway-teal.vercel.app'
const STUDENT = { email: 'test.student@deveway.com', password: 'Test123456!' }

test.describe('Student Dashboard', () => {
  test.setTimeout(45000)

  async function loginAsStudent(page: any) {
    await page.goto(`${BASE}/ar/login`)
    await page.fill('#email', STUDENT.email)
    await page.fill('#password', STUDENT.password)
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click()
    await page.waitForFunction(() => /dashboard/.test(window.location.href), { timeout: 25000 })
  }

  test('dashboard loads after login', async ({ page }) => {
    await loginAsStudent(page)
    await expect(page).toHaveURL(/dashboard/)
  })

  test('dashboard has content after login', async ({ page }) => {
    await loginAsStudent(page)
    await page.waitForTimeout(2000)
    const bodyLen = await page.evaluate(() => document.body.textContent?.trim().length || 0)
    expect(bodyLen).toBeGreaterThan(100)
  })

  test('my-courses page loads', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsStudent(page)
    await page.goto(`${BASE}/ar/dashboard/my-courses`)
    await expect(page).toHaveURL(/my-courses/, { timeout: 20000 })
  })

  test('certificates page loads', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto(`${BASE}/ar/dashboard/certificates`)
    await expect(page).toHaveURL(/certificates/)
  })

  test('AI chat page loads', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto(`${BASE}/ar/dashboard/ai-chat`)
    await expect(page.locator('textarea, input[type="text"]')).toBeVisible({ timeout: 8000 })
  })

  test('wallet page loads', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto(`${BASE}/ar/dashboard/wallet`)
    await expect(page).toHaveURL(/wallet/)
  })

  test('settings page loads', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto(`${BASE}/ar/dashboard/settings`)
    await expect(page).toHaveURL(/settings/)
  })
})
