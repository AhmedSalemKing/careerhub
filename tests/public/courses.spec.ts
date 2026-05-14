import { test, expect } from '@playwright/test'
const BASE = 'https://deveway-teal.vercel.app'

test.describe('Courses Public Page', () => {
  test('courses page loads', async ({ page }) => {
    await page.goto(`${BASE}/ar/courses`)
    await expect(page).toHaveURL(/courses/)
  })

  test('search button exists', async ({ page }) => {
    await page.goto(`${BASE}/ar/courses`)
    await expect(page.locator('button').filter({ hasText: 'ابحث' })).toBeVisible({ timeout: 10000 })
  })

  test('page has content', async ({ page }) => {
    await page.goto(`${BASE}/ar/courses`)
    await page.waitForTimeout(3000)
    const bodyLen = await page.evaluate(() => document.body.textContent?.length || 0)
    expect(bodyLen).toBeGreaterThan(100)
  })

  test('course cards section is rendered', async ({ page }) => {
    await page.goto(`${BASE}/ar/courses`)
    await page.waitForTimeout(3000)
    const grid = page.locator('[class*="grid"]').first()
    await expect(grid).toBeVisible({ timeout: 10000 })
  })

  test('English courses page loads', async ({ page }) => {
    await page.goto(`${BASE}/en/courses`)
    await expect(page).toHaveURL(/en\/courses/)
  })
})
