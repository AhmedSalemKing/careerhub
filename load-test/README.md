# DeveWay Load Test — Enterprise Grade

## Install k6
Windows: `winget install k6`

## Run Full Test (about 7 minutes)
```
cd D:\careerhub
k6 run load-test/k6-script.js
```

## Load shape
Three scenarios run at the same time against production:

| Scenario | VUs | When |
|----------|-----|------|
| normal_load | ramps 0 → 20 → 90, holds 90, ramps down | 0m – 7m |
| spike_test | 0 → 50, holds, back to 0 | starts at 4m |
| api_constant | constant 10 | 0m – 6m |

Between 4m and about 6m the scenarios overlap, so peak concurrency is up to
**150 VUs** (90 + 50 + 10), not 90. The summary prints the actual peak.

## What It Tests
| Journey | % of Users | Description |
|---------|-----------|-------------|
| New Visitor | 25% | Homepage → Careers → Coaching → Courses |
| Returning Student | 20% | Courses → Categories → Learn App |
| Mobile User | 15% | All pages on mobile device |
| API Power User | 15% | Direct API calls, stress test |
| Platform Explorer | 15% | Full platform walkthrough |
| Bounce User | 10% | Quick exit simulation |

## Pass Criteria (thresholds)
- Error rate < 10% (`http_req_failed` and `custom_errors`)
- p(50) < 2s, p(95) < 5s, p(99) < 8s overall
- API p(95) < 3s, page p(95) < 5s

The overall PASSED/FAILED in the summary reflects every threshold above.

## Before Running
1. Check https://api.deveways.com/api/health responds
2. Open Render logs (optional — to watch server)
3. Open Vercel logs (optional — to watch frontend)

This test hits live production (web, learn app and API). Run it at a quiet time
and expect it to appear in analytics and to count against free-tier quotas.

## Results
Saved to: `load-test/results.json` (git-ignored)
