# Quickstart: Verify Phase 0 + Phase 1 Implementation

**Branch**: `master`
**Date**: 2026-04-03

Use this guide to verify each user story is correctly implemented end-to-end.
Run against a local stack: `apps/api` + PostgreSQL + Redis.

---

## Prerequisites

```bash
# Start API
cd apps/api
cp .env.example .env  # fill in real test values
npx prisma migrate dev
npm run start:dev

# In another terminal, start web app
cd apps/web
npm run dev
```

Required test environment values:
- `STRIPE_SECRET_KEY` = Stripe test key (`sk_test_...`)
- `SENDGRID_API_KEY` = SendGrid key with sender verified
- `ANTHROPIC_API_KEY` = valid key with quota
- `JWT_SECRET` = any 32+ char string for local dev

---

## Story 1: Secure Password Reset

### Step 1 — Request reset
```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
# Expected: 200 { success: true, data: null, message: "Reset email sent" }
```

### Step 2 — Verify DB (no plain token)
```bash
npx prisma studio
# Navigate to PasswordResetToken table
# Confirm: tokenHash starts with "$2b$" (bcrypt prefix)
# Confirm: NO plain token in Session table with "reset:" prefix
```

### Step 3 — Use the link
Extract the raw token from the email link, then:
```bash
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "<RAW_TOKEN>", "newPassword": "NewPass@123"}'
# Expected: 200 { success: true, data: { message: "Password reset successful" } }
```

### Step 4 — Confirm token consumed
```bash
# Retry the same token
curl -X POST http://localhost:4000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "<SAME_RAW_TOKEN>", "newPassword": "AnotherPass@123"}'
# Expected: 400 { message: "Reset link has expired or already been used" }
```

### Step 5 — Verify stdout is clean
```bash
# Review terminal where API is running
# Search for email address or token in output
grep -i "test@example" <(cat api-stdout.log)  # should return nothing
grep -i "sk_test" <(cat api-stdout.log)         # should return nothing
```

---

## Story 2: Auth Log Hygiene

```bash
# Login and watch API stdout
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Password@123"}'

# Inspect API terminal output
# MUST NOT contain: email address, password, access token, refresh token
# MUST contain: structured log like [AuthController] User logged in { userId: "cl..." }
```

---

## Story 3: Upload Auth Guard

```bash
# Without token — must reject
curl -X POST http://localhost:4000/api/upload \
  -F "file=@/tmp/test.jpg"
# Expected: 401 Unauthorized

# With valid token — must accept
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password@123"}' \
  | jq -r '.data.accessToken')

curl -X POST http://localhost:4000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test.jpg"
# Expected: 201 { data: { url: "https://..." } }
```

---

## Story 4: Payment → Enrollment

```bash
# 1. Get a Stripe test payment method token
STRIPE_PM="pm_card_visa"  # Stripe test token

# 2. Create payment intent
TOKEN="<valid JWT>"
COURSE_ID="<published course id>"

INTENT=$(curl -s -X POST http://localhost:4000/api/payments/create-payment-intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"courseId\": \"$COURSE_ID\", \"paymentMethodId\": \"$STRIPE_PM\"}" \
  | jq -r '.data.clientSecret')

# 3. Confirm payment
curl -s -X POST http://localhost:4000/api/payments/confirm-payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"paymentIntentId\": \"<intent_id>\", \"courseId\": \"$COURSE_ID\"}"

# 4. Verify enrollment created
curl -s http://localhost:4000/api/courses/$COURSE_ID/enrollment \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.status'
# Expected: "ACTIVE"

# 5. Verify in enrolled list
curl -s http://localhost:4000/api/courses/enrolled \
  -H "Authorization: Bearer $TOKEN" \
  | jq '[.data[] | select(.courseId == "'$COURSE_ID'")]'
# Expected: array with one entry
```

---

## Story 5: Lesson Progress Tracking

```bash
COURSE_ID="<enrolled course id>"
TOKEN="<valid JWT>"

# Get lesson list
LESSONS=$(curl -s http://localhost:4000/api/courses/$COURSE_ID/lessons \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].lessons[].id')

LESSON1=$(echo "$LESSONS" | head -1)
LESSON2=$(echo "$LESSONS" | sed -n '2p')

# Mark first lesson complete
curl -s -X POST http://localhost:4000/api/courses/$COURSE_ID/lessons/$LESSON1/complete \
  -H "Authorization: Bearer $TOKEN"

# Check progress
curl -s http://localhost:4000/api/courses/$COURSE_ID/enrollment \
  -H "Authorization: Bearer $TOKEN" | jq '.data.progress'
# Expected: e.g. 25 (if 4 lessons total)

# Mark all lessons complete, check final status
# ... (repeat for all lessons)
curl -s http://localhost:4000/api/courses/$COURSE_ID/enrollment \
  -H "Authorization: Bearer $TOKEN" | jq '{progress: .data.progress, status: .data.status}'
# Expected: { "progress": 100, "status": "COMPLETED" }
```

---

## Story 6: Email Delivery

```bash
# Register a new account
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"Pass@1234","firstName":"Test","lastName":"User","accountType":"STUDENT"}'

# Check Bull queue
# Open Bull Board (if installed) at http://localhost:4000/api/queues
# OR check Redis directly:
redis-cli llen "bull:email:wait"  # should briefly show 1 then drain to 0
# Check email received in SendGrid Activity Feed or inbox
```

---

## Story 7: AI Assessment Report

```bash
TOKEN="<valid JWT>"

# Start session
SESSION=$(curl -s -X POST http://localhost:4000/api/career/assessment/session/start \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.sessionId')

# Get questions
curl -s http://localhost:4000/api/career/assessment/questions \
  -H "Authorization: Bearer $TOKEN" | jq '[.data[].id]'

# Submit answers (15 answers)
ANSWERS='[
  {"questionId":"q1","answer":"I enjoy solving technical problems"},
  {"questionId":"q2","answer":"Yes, I have 3 years of experience"},
  ...
]'

# Complete session
REPORT=$(curl -s -X POST "http://localhost:4000/api/career/assessment/session/$SESSION/complete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"answers\": $ANSWERS}")

echo $REPORT | jq '.data.report'
# Expected: object with recommendedPaths, strengths, gaps, nextSteps
# NOT expected: null, empty object, or hardcoded template

# Verify Claude was called (check API stdout for Anthropic request log)
```

---

## Environment Variable Validation

```bash
# Remove required variable and attempt boot
unset STRIPE_SECRET_KEY

cd apps/api && npm run start:dev
# Expected: application exits immediately with error:
# "ConfigModule validation error: STRIPE_SECRET_KEY is required"
# NOT expected: application starts and crashes later on first Stripe call
```

---

## Regression Checklist

After implementing all stories, verify existing functionality is not broken:

- [ ] Login / logout / token refresh still work
- [ ] Course listing and search still work
- [ ] Admin user management still works
- [ ] Existing enrolled courses still accessible
- [ ] Coaching session booking still works (minus Zoom link)
- [ ] Certificate page still renders
- [ ] i18n language switching still works
