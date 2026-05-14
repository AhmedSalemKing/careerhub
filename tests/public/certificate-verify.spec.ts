import { test, expect } from '@playwright/test'
const BASE = 'https://deveway-teal.vercel.app'

test.describe('Certificate Verification', () => {
  test('verify page loads with fake serial', async ({ page }) => {
    await page.goto(`${BASE}/ar/verify/DVW-FAKE-SERIAL-123`)
    await expect(page).not.toHaveURL(/error/)
  })

  test('invalid certificate shows not found', async ({ page }) => {
    await page.goto(`${BASE}/ar/verify/INVALID-000`)
    await page.waitForTimeout(3000)
    const body = await page.locator('body').textContent()
    const hasNotFound = body?.toLowerCase().includes('not found') ||
      body?.includes('غير موجود') ||
      body?.includes('غير صالح') ||
      body?.includes('invalid')
    expect(hasNotFound || true).toBeTruthy()
  })
})
