# DeveWay Load Test

Targets production by default: web `https://deveway-teal.vercel.app`, learn `https://devewayhub.vercel.app`, API `https://api.deveways.com`.

## Install k6
Windows: `winget install k6`

## Run
```
k6 run load-test/k6-script.js
```

With environment variables:
```
k6 run -e ENV=staging -e BASE_URL=https://staging.example.com -e API_URL=https://api-staging.example.com load-test/k6-script.js
```

To exercise authenticated journeys, provide real test accounts:
```
k6 run -e LEARNER_EMAIL=learner@test.com -e LEARNER_PASSWORD=... -e MENTOR_EMAIL=mentor@test.com -e MENTOR_PASSWORD=... load-test/k6-script.js
```
Without credentials the login steps are skipped and authenticated routes are called without a token (401/403 is treated as expected).

Warning: the API blocks an IP after 10 failed logins in 15 minutes. Never point the credentials at accounts that do not exist. The script sends only one deliberate bad login (in `setup()`).

## Scenarios (about 5 minutes)
| Scenario | Share | What it does |
|----------|-------|--------------|
| anonymous_browsing | 30% | `/ar`, `/ar/careers`, `/ar/coaching`, `/en`, `/en/careers`; 30 VUs |
| auth_flow | 10% | `POST /api/auth/login`, `GET /api/auth/me`, unread notifications; 10 VUs |
| authenticated_learner | 25% | login, `/ar/dashboard`, `/ar/dashboard/my-courses`, `/api/career/paths/my`, `/api/notifications`; 25 VUs |
| api_load | 20% | `/api/career/paths`, path detail, `/api/courses`, `/api/coaching/coaches`, `/api/consulting/consultants`, `/api/health`; 20 VUs |
| mentor_flow | 5% | mentor login, `/api/consulting/sessions/my`, dashboard; 5 VUs |
| spike | 10% | anonymous browsing, 0 to 100 VUs in 10s, hold 30s, down in 10s, starts at 4m |

Requests are tagged `type: page | api | auth`, so thresholds and results separate them.

## Thresholds
- `http_req_failed` < 5%
- `http_req_duration` p95 < 3000ms, p99 < 5000ms
- pages p95 < 3000ms, API p95 < 2000ms
- `page_errors` < 5%, `api_errors` < 10%

## Reading results
The summary prints PASSED/FAILED, then page, API and auth lines. Full data is written to `load-test/results.json`.
- High page error rate: a Vercel limit or a failing route. Check Vercel logs.
- High API error rate or slow p95: the Render backend (cold start on a free plan, database).
- Low auth success rate with credentials set: wrong credentials or the login limiter (429).
- Spike p95 much worse than steady-state: autoscaling or cold starts.
