import { test, expect } from '@playwright/test'
const BASE = 'https://deveway-teal.vercel.app'

test.describe('SEO Meta Tags', () => {
  test('landing page has meta description', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    const desc = await page.locator('meta[name="description"]').getAttribute('content')
    expect(desc).toBeTruthy()
    expect(desc!.length).toBeGreaterThan(50)
  })

  test('landing page has OG tags', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(ogTitle).toBeTruthy()
  })

  test('landing page has Twitter card', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content')
    expect(twitterCard).toBeTruthy()
  })

  test('courses page has correct title', async ({ page }) => {
    await page.goto(`${BASE}/ar/courses`)
    const title = await page.title()
    expect(title).toContain('DeveWay')
  })

  test('hreflang tags present', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    const hreflang = await page.locator('link[rel="alternate"][hreflang]').count()
    expect(hreflang).toBeGreaterThan(0)
  })

  test('canonical tag present', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toBeTruthy()
  })
})
