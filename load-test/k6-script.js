import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Override with: k6 run -e BASE_URL=... -e API_URL=... -e LEARN_URL=...
//   -e LEARNER_EMAIL=... -e LEARNER_PASSWORD=... -e MENTOR_EMAIL=... -e MENTOR_PASSWORD=...
// Without credentials the authenticated journeys fall back to anonymous endpoints
// and the auth metrics only report the single bad-credentials probe from setup().
const ENV = __ENV.ENV || 'production'
const BASE_URL = __ENV.BASE_URL || 'https://deveway-teal.vercel.app'
const LEARN_URL = __ENV.LEARN_URL || 'https://devewayhub.vercel.app'
const API_URL = __ENV.API_URL || 'https://api.deveways.com'

const LEARNER = { email: __ENV.LEARNER_EMAIL || '', password: __ENV.LEARNER_PASSWORD || '' }
const MENTOR = { email: __ENV.MENTOR_EMAIL || '', password: __ENV.MENTOR_PASSWORD || '' }

// ─── METRICS ──────────────────────────────────────────────────────────────────
const pageErrors = new Rate('page_errors')
const apiErrors = new Rate('api_errors')
const authSuccess = new Rate('auth_success')
const pageLoad = new Trend('page_load_time', true)
const apiLoadTime = new Trend('api_load_time', true)
const pageRequests = new Counter('page_requests')
const apiRequests = new Counter('api_requests')
const authAttempts = new Counter('auth_attempts')

// 401/403 on authenticated routes are expected when test users are missing; 429 means rate limited.
const EXPECTED_AUTH = { 401: true, 403: true, 429: true }

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: {
    // ~30% of traffic
    anonymous_browsing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 30 },
        { duration: '3m', target: 30 },
        { duration: '1m', target: 0 },
      ],
      exec: 'anonymousBrowsing',
    },
    // ~10% of traffic
    auth_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '3m', target: 10 },
        { duration: '1m', target: 0 },
      ],
      exec: 'authFlow',
    },
    // ~25% of traffic
    authenticated_learner: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 25 },
        { duration: '3m', target: 25 },
        { duration: '1m', target: 0 },
      ],
      exec: 'authenticatedLearner',
    },
    // ~20% of traffic
    api_load: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
      exec: 'apiLoad',
    },
    // ~5% of traffic
    mentor_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '3m', target: 5 },
        { duration: '1m', target: 0 },
      ],
      exec: 'mentorFlow',
    },
    // ~10% of traffic: 0 -> 100 VUs in 10s, hold 30s, back to 0
    spike: {
      executor: 'ramping-vus',
      startTime: '4m',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '10s', target: 0 },
      ],
      exec: 'anonymousBrowsing',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    page_errors: ['rate<0.05'],
    api_errors: ['rate<0.10'],
    'http_req_duration{type:page}': ['p(95)<3000'],
    'http_req_duration{type:api}': ['p(95)<2000'],
  },
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 k6-loadtest'

function headers(token) {
  const h = { 'User-Agent': UA, 'Accept': 'text/html,application/json,*/*', 'Accept-Language': 'ar,en;q=0.9' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

function page(url, name) {
  const res = http.get(url, { headers: headers(), redirects: 5, tags: { type: 'page', name } })
  const ok = res.status >= 200 && res.status < 400
  check(res, { [`${name} status ok`]: () => ok })
  pageErrors.add(!ok)
  pageLoad.add(res.timings.duration)
  pageRequests.add(1)
  return res
}

// Authenticated page: the web app gates dashboards client-side or by redirect, so 3xx/401/403 are accepted.
function authedPage(url, name) {
  const res = http.get(url, { headers: headers(), redirects: 5, tags: { type: 'page', name } })
  const ok = (res.status >= 200 && res.status < 400) || EXPECTED_AUTH[res.status] === true
  check(res, { [`${name} status ok`]: () => ok })
  pageErrors.add(!ok)
  pageLoad.add(res.timings.duration)
  pageRequests.add(1)
  return res
}

function api(path, name, token) {
  const res = http.get(`${API_URL}/api${path}`, { headers: headers(token), tags: { type: 'api', name } })
  const ok = (res.status >= 200 && res.status < 400) || (token && EXPECTED_AUTH[res.status] === true)
  check(res, { [`${name} status ok`]: () => ok })
  apiErrors.add(!ok)
  apiLoadTime.add(res.timings.duration)
  apiRequests.add(1)
  return res
}

function body(res) {
  try {
    return res.json()
  } catch (e) {
    return null
  }
}

// Returns an access token, or null. A 401/403 (unknown test user) is expected and not an error.
function login(creds) {
  if (!creds.email || !creds.password) return null
  const res = http.post(`${API_URL}/api/auth/login`, JSON.stringify(creds), {
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers()),
    tags: { type: 'auth', name: 'login' },
  })
  authAttempts.add(1)
  const json = body(res)
  const token = json && (json.data && json.data.accessToken ? json.data.accessToken : json.data && json.data.data && json.data.data.accessToken)
  const ok = res.status === 200 && !!token
  check(res, {
    'login status expected': () => res.status === 200 || EXPECTED_AUTH[res.status] === true,
    'login returns token': () => ok || EXPECTED_AUTH[res.status] === true,
  })
  authSuccess.add(ok)
  return ok ? token : null
}

function firstSlug(res) {
  const json = body(res)
  const data = json && (json.data && json.data.data ? json.data.data : json.data)
  const list = Array.isArray(data) ? data : data && Array.isArray(data.paths) ? data.paths : []
  return list.length && list[0].slug ? list[0].slug : null
}

// ─── SETUP ────────────────────────────────────────────────────────────────────
// One deliberately bad login. The API blocks an IP after 10 failures in 15 minutes,
// so bad credentials are never sent from the VU loops.
export function setup() {
  const res = http.post(`${API_URL}/api/auth/login`, JSON.stringify({ email: 'k6-nobody@example.com', password: 'wrong-password' }), {
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers()),
    tags: { type: 'auth', name: 'login_bad_credentials' },
  })
  authAttempts.add(1)
  check(res, { 'bad login rejected (401/403/429)': () => EXPECTED_AUTH[res.status] === true })

  const paths = http.get(`${API_URL}/api/career/paths`, { headers: headers(), tags: { type: 'api', name: 'setup_paths' } })
  return { slug: firstSlug(paths) }
}

// ─── SCENARIOS ────────────────────────────────────────────────────────────────

// Scenario 1 and 6: anonymous browsing (also used by the spike)
export function anonymousBrowsing() {
  group('anonymous_browsing', () => {
    page(`${BASE_URL}/ar`, 'home_ar')
    sleep(1 + Math.random() * 2)
    page(`${BASE_URL}/ar/careers`, 'careers_ar')
    sleep(1 + Math.random() * 2)
    page(`${BASE_URL}/ar/coaching`, 'coaching_ar')
    sleep(1 + Math.random() * 2)
    page(`${BASE_URL}/en`, 'home_en')
    sleep(1 + Math.random())
    page(`${BASE_URL}/en/careers`, 'careers_en')
  })
  sleep(1 + Math.random() * 2)
}

// Scenario 2: authentication flow
export function authFlow() {
  group('auth_flow', () => {
    const token = login(LEARNER)
    if (token) {
      const me = http.get(`${API_URL}/api/auth/me`, { headers: headers(token), tags: { type: 'auth', name: 'me' } })
      authSuccess.add(me.status === 200)
      check(me, { 'me status ok': () => me.status === 200 || EXPECTED_AUTH[me.status] === true })
      api('/notifications/unread-count', 'unread_count', token)
    }
  })
  // Slow down: every login attempt counts toward the API's per-IP failure limiter if credentials are wrong.
  sleep(5 + Math.random() * 5)
}

// Scenario 3: authenticated learner
export function authenticatedLearner() {
  group('authenticated_learner', () => {
    const token = login(LEARNER)
    authedPage(`${BASE_URL}/ar/dashboard`, 'dashboard')
    sleep(1 + Math.random() * 2)
    authedPage(`${BASE_URL}/ar/dashboard/my-courses`, 'dashboard_my_courses')
    sleep(1 + Math.random())
    api('/career/paths/my', 'career_paths_my', token || 'none')
    api('/notifications', 'notifications', token || 'none')
  })
  sleep(2 + Math.random() * 3)
}

// Scenario 4: public API endpoints
export function apiLoad(data) {
  group('api_load', () => {
    const list = api('/career/paths', 'career_paths')
    const slug = firstSlug(list) || (data && data.slug)
    if (slug) api(`/career/paths/${slug}`, 'career_path_detail')
    api('/courses?status=PUBLISHED&limit=10', 'courses')
    api('/coaching/coaches', 'coaches')
    api('/consulting/consultants', 'consultants')
    api('/health', 'health')
  })
  sleep(0.5 + Math.random())
}

// Scenario 5: mentor flow
export function mentorFlow() {
  group('mentor_flow', () => {
    const token = login(MENTOR)
    api('/consulting/sessions/my', 'mentor_sessions', token || 'none')
    authedPage(`${BASE_URL}/ar/dashboard`, 'mentor_dashboard')
    api('/notifications/unread-count', 'mentor_unread', token || 'none')
  })
  sleep(3 + Math.random() * 3)
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const m = data.metrics
  const v = (name, key) => (m[name] && m[name].values ? m[name].values[key] : undefined)
  const ms = (x) => (x === undefined ? 'N/A' : Math.round(x) + 'ms')
  const pct = (x) => (x === undefined ? 'N/A' : (x * 100).toFixed(1) + '%')

  const failed = []
  for (const [metric, mm] of Object.entries(m)) {
    for (const [expr, ok] of Object.entries(mm.thresholds || {})) {
      if (!ok) failed.push(`${metric}: ${expr}`)
    }
  }

  const authCount = v('auth_attempts', 'count') || 0
  const summary = `
==================================================
 DeveWay Load Test Results
 Tested: ${new Date().toISOString()}   (${ENV})
==================================================
 Overall: ${failed.length === 0 ? 'PASSED' : 'FAILED'}
${failed.map((t) => ' - threshold failed: ' + t).join('\n')}
 Pages: ${v('page_requests', 'count') || 0} requests, ${pct(v('page_errors', 'rate'))} error rate, p95=${ms(v('page_load_time', 'p(95)'))}
 APIs:  ${v('api_requests', 'count') || 0} requests, ${pct(v('api_errors', 'rate'))} error rate, p95=${ms(v('api_load_time', 'p(95)'))}
 Auth:  ${authCount} attempts, ${pct(v('auth_success', 'rate'))} success rate
==================================================
 All requests: p95=${ms(v('http_req_duration', 'p(95)'))} p99=${ms(v('http_req_duration', 'p(99)'))} failed=${pct(v('http_req_failed', 'rate'))}
==================================================
`
  return {
    'load-test/results.json': JSON.stringify(data, null, 2),
    stdout: summary,
  }
}
