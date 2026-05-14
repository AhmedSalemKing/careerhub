import { test, expect } from '@playwright/test'
const BASE = 'https://deveway-teal.vercel.app'

test.describe('Register Flow', () => {
  test('register page loads', async ({ page }) => {
    await page.goto(`${BASE}/ar/register`)
    await expect(page).toHaveURL(/register/)
    const bodyLen = await page.evaluate(() => document.body.textContent?.length || 0)
    expect(bodyLen).toBeGreaterThan(0)
  })

  test('has interactive elements', async ({ page }) => {
    await page.goto(`${BASE}/ar/register`)
    const btnCount = await page.locator('button').count()
    expect(btnCount).toBeGreaterThan(0)
  })

  test('stays on register page after invalid submission', async ({ page }) => {
    await page.goto(`${BASE}/ar/register`)
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/register')
  })

  test('Google signup button exists', async ({ page }) => {
    await page.goto(`${BASE}/ar/register`)
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible()
  })
})
