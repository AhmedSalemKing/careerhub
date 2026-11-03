import http from 'k6/http'
import exec from 'k6/execution'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter, Gauge } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('custom_errors')
const apiLatency = new Trend('api_latency', true)
const pageLatency = new Trend('page_latency', true)
const activeUsers = new Gauge('active_users')
const totalPageViews = new Counter('total_page_views')
const totalApiCalls = new Counter('total_api_calls')

export const options = {
  // Percentiles needed by handleSummary (p(50) is reported as "med").
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: {
    // Scenario 1: Gradual ramp to 90 users
    normal_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '2m', target: 90 },
        { duration: '3m', target: 90 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
    // Scenario 2: Spike test — sudden 50 users on top of normal load
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      startTime: '4m',
      gracefulRampDown: '30s',
    },
    // Scenario 3: Constant API load
    api_constant: {
      executor: 'constant-vus',
      vus: 10,
      duration: '6m',
    },
  },
  thresholds: {
    // Overall
    http_req_duration: ['p(50)<2000', 'p(95)<5000', 'p(99)<8000'],
    http_req_failed: ['rate<0.10'],
    custom_errors: ['rate<0.10'],
    // API specific
    api_latency: ['p(95)<3000'],
    // Page specific
    page_latency: ['p(95)<5000'],
  },
}

const BASE = 'https://deveway-teal.vercel.app'
const API  = 'https://api.deveways.com'
const LEARN = 'https://devewayhub.vercel.app'

const DESKTOP_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
const MOBILE_AGENT  = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'
const TABLET_AGENT  = 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'

function randomAgent() {
  const agents = [DESKTOP_AGENT, MOBILE_AGENT, TABLET_AGENT]
  return agents[Math.floor(Math.random() * agents.length)]
}

function getHeaders(extra = {}) {
  return {
    'User-Agent': randomAgent(),
    'Accept': 'text/html,application/json,*/*',
    'Accept-Language': 'ar,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    ...extra,
  }
}

// ─── PAGE HELPERS ─────────────────────────────────────────────────────────────

function visitPage(url, name) {
  const res = http.get(url, { headers: getHeaders(), tags: { name } })
  pageLatency.add(res.timings.duration)
  totalPageViews.add(1)
  const ok = res.status === 200 || res.status === 304
  check(res, {
    [`${name} status ok`]: () => ok,
    [`${name} not empty`]: () => res.body && res.body.length > 100,
  })
  errorRate.add(!ok)
  return res
}

function callApi(url, name, method = 'GET', body = null) {
  const params = { headers: getHeaders({ 'Content-Type': 'application/json' }), tags: { name } }
  const res = method === 'GET' ? http.get(url, params) : http.post(url, body, params)
  apiLatency.add(res.timings.duration)
  totalApiCalls.add(1)
  const ok = res.status >= 200 && res.status < 400
  check(res, {
    [`${name} success`]: () => ok,
    [`${name} under 3s`]: () => res.timings.duration < 3000,
  })
  errorRate.add(!ok)
  return res
}

// ─── JOURNEYS ─────────────────────────────────────────────────────────────────

// Journey 1: New visitor (no account)
function newVisitorJourney() {
  group('new_visitor', () => {
    // Lands on homepage
    visitPage(`${BASE}/ar`, 'homepage')
    sleep(2 + Math.random() * 2)

    // Checks careers
    visitPage(`${BASE}/ar/careers`, 'careers')
    sleep(2)

    // Checks coaching
    visitPage(`${BASE}/ar/coaching`, 'coaching')
    sleep(1)

    // Browses courses
    visitPage(`${LEARN}/ar/courses`, 'learn_courses')
    sleep(3)

    // Clicks on a course (API call)
    callApi(`${API}/api/courses?status=PUBLISHED&limit=6&language=ar`, 'courses_list')
    sleep(1)

    // Checks career paths
    callApi(`${API}/api/career/paths`, 'career_paths')
    sleep(2)
  })
}

// Journey 2: Returning student
function returningStudentJourney() {
  group('returning_student', () => {
    // Goes straight to courses
    callApi(`${API}/api/courses?status=PUBLISHED&limit=10`, 'student_courses')
    sleep(1)

    // Checks categories
    callApi(`${API}/api/courses/categories?language=ar`, 'course_categories')
    sleep(1)

    // Visits learn app
    visitPage(`${LEARN}/ar`, 'learn_home')
    sleep(2)

    // Browses courses page
    visitPage(`${LEARN}/ar/courses`, 'learn_courses_page')
    sleep(3)

    // Checks coaching
    callApi(`${API}/api/coaching/coaches`, 'coaches_list')
    sleep(1)
  })
}

// Journey 3: Mobile user browsing
function mobileUserJourney() {
  group('mobile_user', () => {
    const mobileHeaders = { 'User-Agent': MOBILE_AGENT }

    // Homepage on mobile
    const res1 = http.get(`${BASE}/ar`, { headers: mobileHeaders, tags: { name: 'mobile_home' } })
    pageLatency.add(res1.timings.duration)
    totalPageViews.add(1)
    check(res1, { 'mobile homepage ok': r => r.status === 200 })
    errorRate.add(res1.status !== 200)
    sleep(3)

    // Coaching on mobile
    const res2 = http.get(`${BASE}/ar/coaching`, { headers: mobileHeaders, tags: { name: 'mobile_coaching' } })
    pageLatency.add(res2.timings.duration)
    totalPageViews.add(1)
    check(res2, { 'mobile coaching ok': r => r.status === 200 })
    errorRate.add(res2.status !== 200)
    sleep(2)

    // Learn on mobile
    const res3 = http.get(`${LEARN}/ar/courses`, { headers: mobileHeaders, tags: { name: 'mobile_learn' } })
    pageLatency.add(res3.timings.duration)
    totalPageViews.add(1)
    check(res3, { 'mobile learn ok': r => r.status === 200 })
    errorRate.add(res3.status !== 200)
    sleep(2)
  })
}

// Journey 4: API power user
function apiPowerUserJourney() {
  group('api_power_user', () => {
    // Health check
    callApi(`${API}/api/health`, 'health_check')
    sleep(0.5)

    // Courses
    callApi(`${API}/api/courses?status=PUBLISHED&limit=10`, 'api_courses')
    sleep(0.5)

    // Categories
    callApi(`${API}/api/courses/categories?language=ar`, 'api_categories')
    sleep(0.5)

    // Career paths
    callApi(`${API}/api/career/paths`, 'api_career_paths')
    sleep(0.5)

    // Coaches
    callApi(`${API}/api/coaching/coaches`, 'api_coaches')
    sleep(1)
  })
}

// Journey 5: Full platform explorer
function platformExplorerJourney() {
  group('platform_explorer', () => {
    // Web app
    visitPage(`${BASE}/ar`, 'explorer_home')
    sleep(1)
    visitPage(`${BASE}/ar/careers`, 'explorer_careers')
    sleep(1)
    visitPage(`${BASE}/ar/coaching`, 'explorer_coaching')
    sleep(1)

    // Learn app
    visitPage(`${LEARN}/ar`, 'explorer_learn_home')
    sleep(1)
    visitPage(`${LEARN}/ar/courses`, 'explorer_learn_courses')
    sleep(1)

    // API calls
    callApi(`${API}/api/health`, 'explorer_health')
    sleep(0.5)
    callApi(`${API}/api/courses?status=PUBLISHED&limit=6`, 'explorer_courses_api')
    sleep(1)
  })
}

// Journey 6: Bounce user (quick exit)
function bounceUserJourney() {
  group('bounce_user', () => {
    visitPage(`${BASE}/ar`, 'bounce_home')
    sleep(0.5 + Math.random())
  })
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

export default function () {
  // A Gauge keeps the last value added (it is not an up/down counter), so record
  // the instance-wide active VU count directly.
  activeUsers.add(exec.instance.vusActive)

  const r = Math.random()

  if (r < 0.25)      newVisitorJourney()
  else if (r < 0.45) returningStudentJourney()
  else if (r < 0.60) mobileUserJourney()
  else if (r < 0.75) apiPowerUserJourney()
  else if (r < 0.90) platformExplorerJourney()
  else               bounceUserJourney()

  sleep(Math.random() * 3 + 1)
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────────

export function handleSummary(data) {
  const dur   = data.metrics.http_req_duration?.values
  const fail  = data.metrics.http_req_failed?.values
  const errs  = data.metrics.custom_errors?.values
  const reqs  = data.metrics.http_reqs?.values
  const views = data.metrics.total_page_views?.values
  const calls = data.metrics.total_api_calls?.values
  const peak  = data.metrics.vus_max?.values

  const sec = v => (v === undefined ? 'N/A' : (v / 1000).toFixed(2) + 's')
  const pct = v => (v === undefined ? 'N/A' : (v * 100).toFixed(2) + '%')

  // PASS only if every threshold defined in options held.
  const failedThresholds = []
  for (const [metric, m] of Object.entries(data.metrics)) {
    for (const [expr, ok] of Object.entries(m.thresholds || {})) {
      if (!ok) failedThresholds.push(`${metric}: ${expr}`)
    }
  }
  const passed = failedThresholds.length === 0

  const summary = `
==================================================
 DeveWay Platform Load Test
 Peak VUs: ${peak ? peak.max : 'N/A'}  (normal ramp 90 + spike 50 + constant 10 overlap)
==================================================
 Overall: ${passed ? 'PASSED' : 'FAILED'}
${failedThresholds.map(t => ` - threshold failed: ${t}`).join('\n')}

 PERFORMANCE
   p(50) response time : ${sec(dur?.med)}
   p(95) response time : ${sec(dur?.['p(95)'])}
   p(99) response time : ${sec(dur?.['p(99)'])}

 RELIABILITY
   HTTP failure rate   : ${pct(fail?.rate)}
   Custom error rate   : ${pct(errs?.rate)}
   Total requests      : ${reqs?.count || 0}
   Page views          : ${views?.count || 0}
   API calls           : ${calls?.count || 0}

 JOURNEY MIX
   25% New visitors        20% Returning students
   15% Mobile users        15% API power users
   15% Platform explorers  10% Bounce users
==================================================
`

  return {
    'load-test/results.json': JSON.stringify(data, null, 2),
    stdout: summary,
  }
}
