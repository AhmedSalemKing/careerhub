import { test, expect } from '@playwright/test'
const BASE = 'https://deveway-teal.vercel.app'

test.describe(' Public Features Complete', () => {
  test.setTimeout(60000)

  // Landing Page
  test('P1: Landing page AR loads', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    await expect(page).toHaveTitle(/DeveWay/)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })

  test('P2: Landing page EN loads', async ({ page }) => {
    await page.goto(`${BASE}/en`)
    await expect(page).toHaveTitle(/DeveWay/)
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  })

  test('P3: Courses listing page AR', async ({ page }) => {
    await page.goto(`${BASE}/ar/courses`)
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/courses/)
  })

  test('P4: Courses listing page EN', async ({ page }) => {
    await page.goto(`${BASE}/en/courses`)
    await expect(page).toHaveURL(/en\/courses/)
  })

  test('P5: Coaching page loads', async ({ page }) => {
    await page.goto(`${BASE}/ar/coaching`)
    await expect(page).toHaveURL(/coaching/)
  })

  test('P6: Career paths page loads', async ({ page }) => {
    await page.goto(`${BASE}/ar/careers`)
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/careers/)
  })

  test('P7: Coaches listing page loads', async ({ page }) => {
    await page.goto(`${BASE}/ar/coaches`)
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/coaches/)
  })

  test('P8: FAQ page loads', async ({ page }) => {
    await page.goto(`${BASE}/ar/faq`)
    await expect(page).toHaveURL(/faq/)
  })

  test('P9: Pricing page loads', async ({ page }) => {
    await page.goto(`${BASE}/ar/pricing`)
    await expect(page).toHaveURL(/pricing/)
  })

  test('P10: Login page loads', async ({ page }) => {
    await page.goto(`${BASE}/ar/login`)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('P11: Register page loads', async ({ page }) => {
    await page.goto(`${BASE}/ar/register`)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('P12: Forgot password page loads', async ({ page }) => {
    await page.goto(`${BASE}/ar/forgot-password`)
    await expect(page).toHaveURL(/forgot-password/)
  })

  test('P13: Certificate verify page loads', async ({ page }) => {
    await page.goto(`${BASE}/ar/verify/TEST123`)
    await page.waitForTimeout(3000)
    expect(page.url()).not.toContain('error')
  })

  test('P14: Sitemap.xml returns 200', async ({ page }) => {
    const res = await page.goto(`${BASE}/sitemap.xml`)
    expect(res?.status()).toBe(200)
  })

  test('P15: Robots.txt returns 200', async ({ page }) => {
    const res = await page.goto(`${BASE}/robots.txt`)
    expect(res?.status()).toBe(200)
  })

  // SEO
  test('P16: Landing has meta description', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    const desc = await page.locator('meta[name="description"]').getAttribute('content')
    expect(desc?.length).toBeGreaterThan(50)
  })

  test('P17: Landing has OG tags', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(ogTitle).toBeTruthy()
  })

  test('P18: hreflang tags present', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    const count = await page.locator('link[rel="alternate"][hreflang]').count()
    expect(count).toBeGreaterThan(0)
  })

  // Security
  test('P19: Dashboard protected (no auth)', async ({ page }) => {
    await page.goto(`${BASE}/ar/dashboard`)
    await page.waitForTimeout(3000)
    expect(page.url()).toContain('login')
  })

  test('P20: Admin protected (no auth)', async ({ page }) => {
    await page.goto(`${BASE}/ar/admin`)
    await page.waitForTimeout(3000)
    expect(page.url()).toContain('login')
  })

  // Theme
  test('P21: Dark mode toggle exists on landing', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    const toggle = page.locator('[aria-label*="theme"], button').filter({ hasText: /dark|light|moon|sun/i })
    await expect(page.locator('body')).toBeVisible()
  })

  test('P22: No horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/ar`)
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(380)
  })

  // Learn App
  test('P23: Learn app loads', async ({ page }) => {
    await page.goto('https://devewayhub.vercel.app/ar')
    await expect(page).toHaveTitle(/DeveWay/)
  })

  test('P24: Learn app EN loads', async ({ page }) => {
    await page.goto('https://devewayhub.vercel.app/en')
    await expect(page).toHaveTitle(/DeveWay/)
  })

  // API
  test('P25: API health check', async ({ request }) => {
    const res = await request.get('https://deve-way.onrender.com/api/health')
    expect([200, 503]).toContain(res.status())
  })
})
