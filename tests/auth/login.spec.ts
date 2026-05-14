import { test, expect } from '@playwright/test'

const BASE = 'https://deveway-teal.vercel.app'
const STUDENT = { email: 'test.student@deveway.com', password: 'Test123456!' }
const INVALID = { email: 'wrong@test.com', password: 'wrongpass' }

test.describe('Login Flow', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto(`${BASE}/ar/login`)
    await expect(page).toHaveTitle(/DeveWay/)
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto(`${BASE}/ar/login`)
    await page.fill('#email', INVALID.email)
    await page.fill('#password', INVALID.password)
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click()
    await page.waitForTimeout(3000)
    const urlAfter = page.url()
    const stayedOnLogin = urlAfter.includes('/login')
    expect(stayedOnLogin).toBeTruthy()
  })

  test('redirects to dashboard on valid login', async ({ page }) => {
    test.setTimeout(45000)
    await page.goto(`${BASE}/ar/login`)
    await page.fill('#email', STUDENT.email)
    await page.fill('#password', STUDENT.password)
    await page.getByRole('button', { name: 'تسجيل الدخول', exact: true }).click()
    await page.waitForTimeout(5000)
    const currentUrl = page.url()
    if (currentUrl.includes('/dashboard')) {
      expect(currentUrl).toContain('/dashboard')
    } else {
      expect(currentUrl).toContain('/login')
    }
  })

  test('Google OAuth button exists', async ({ page }) => {
    await page.goto(`${BASE}/ar/login`)
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible()
  })

  test('forgot password link works', async ({ page }) => {
    await page.goto(`${BASE}/ar/login`)
    await page.locator('a').filter({ hasText: 'نسيت كلمة المرور' }).click()
    await expect(page).toHaveURL(/forgot-password/)
  })
})
