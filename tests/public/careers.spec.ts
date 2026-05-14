import { test, expect } from '@playwright/test'
const BASE = 'https://deveway-teal.vercel.app'

test.describe('Career Paths', () => {
  test('careers page loads', async ({ page }) => {
    await page.goto(`${BASE}/ar/careers`)
    await expect(page).toHaveTitle(/DeveWay/)
  })

  test('career paths section is visible', async ({ page }) => {
    await page.goto(`${BASE}/ar/careers`)
    await page.waitForTimeout(3000)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('page has content', async ({ page }) => {
    await page.goto(`${BASE}/ar/careers`)
    await page.waitForTimeout(3000)
    const bodyLen = await page.evaluate(() => document.body.textContent?.length || 0)
    expect(bodyLen).toBeGreaterThan(100)
  })
})
