import { test, expect } from '@playwright/test'
const BASE = 'https://deveway-teal.vercel.app'

test.describe('UI Theme & Responsiveness', () => {
  test('dark mode toggle exists', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    const toggle = page.locator('[aria-label*="theme"], button:has([class*="sun"]), button:has([class*="moon"]), [class*="theme"]')
    const count = await toggle.count()
    expect(count).toBeGreaterThan(0)
  })

  test('mobile layout renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/ar`)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('no horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/ar`)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = 375
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
  })

  test('footer visible on desktop', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.locator('footer')).toBeVisible()
  })

  test('Twitter image meta present', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content')
    expect(twitterImage).toBeTruthy()
  })
})
