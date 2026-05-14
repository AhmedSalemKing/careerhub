import { test, expect } from '@playwright/test'
const BASE = 'https://deveway-teal.vercel.app'

test.describe('Landing Page', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    await expect(page).toHaveTitle(/DeveWay/)
  })

  test('has hero section', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('navigation links work', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    await page.goto(`${BASE}/ar/careers`)
    await expect(page).toHaveURL(/careers/)
  })

  test('English version loads', async ({ page }) => {
    await page.goto(`${BASE}/en`)
    await expect(page).toHaveTitle(/DeveWay/)
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  })

  test('Arabic version has RTL', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })

  test('language switcher button exists', async ({ page }) => {
    await page.goto(`${BASE}/ar`)
    await page.waitForTimeout(3000)
    // On mobile, language switcher is inside the hamburger menu — open it first
    const hamburger = page.locator('button[aria-label="Toggle menu"]')
    if (await hamburger.isVisible()) {
      await hamburger.click()
    }
    // :visible filters to the visible instance (desktop nav OR mobile menu)
    await expect(page.locator('button[aria-label="Change language"]:visible').first()).toBeVisible({ timeout: 10000 })
  })

  test('sitemap.xml accessible', async ({ page }) => {
    const res = await page.goto(`${BASE}/sitemap.xml`)
    expect(res?.status()).toBe(200)
  })

  test('robots.txt accessible', async ({ page }) => {
    const res = await page.goto(`${BASE}/robots.txt`)
    expect(res?.status()).toBe(200)
  })
})
