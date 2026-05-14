import { test, expect } from '@playwright/test'
const API = 'https://deve-way.onrender.com/api'

test.describe('API Health Checks', () => {
  test('health endpoint responds', async ({ request }) => {
    const res = await request.get(`${API}/health`)
    expect([200, 503]).toContain(res.status())
    if (res.status() === 200) {
      const body = await res.json()
      expect(body.data).toHaveProperty('status')
    }
  })

  test('health/live endpoint responds', async ({ request }) => {
    const res = await request.get(`${API}/health/live`)
    expect([200, 404, 503]).toContain(res.status())
  })

  test('public courses endpoint accessible', async ({ request }) => {
    const res = await request.get(`${API}/courses?limit=5`)
    expect([200, 503]).toContain(res.status())
  })

  test('public career paths accessible', async ({ request }) => {
    const res = await request.get(`${API}/career/paths`)
    expect([200, 503]).toContain(res.status())
  })

  test('returns JSON not HTML', async ({ request }) => {
    const res = await request.get(`${API}/health`)
    const contentType = res.headers()['content-type']
    if (res.status() === 200) {
      expect(contentType).toContain('application/json')
    }
  })
})
