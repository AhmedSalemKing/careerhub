# CareerHub — Professional System Specification

**Version**: 1.0.0
**Date**: 2026-04-03
**Scope**: Full-stack reverse-engineered specification, gap analysis, and improvement roadmap
**Status**: Living document — update after each major feature delivery

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Current System — Backend Analysis](#3-current-system--backend-analysis)
4. [Current System — Database Schema](#4-current-system--database-schema)
5. [Current System — Frontend Analysis](#5-current-system--frontend-analysis)
6. [Feature Completeness Matrix](#6-feature-completeness-matrix)
7. [Security Audit](#7-security-audit)
8. [Performance Analysis](#8-performance-analysis)
9. [Bugs & Bad Practices](#9-bugs--bad-practices)
10. [Missing & Incomplete Features](#10-missing--incomplete-features)
11. [Improvements Roadmap](#11-improvements-roadmap)

---

## 1. Executive Summary

CareerHub (internal package name: DeveWay) is an **AI-powered career development and learning
platform** built on a Next.js + NestJS monorepo. The system serves four user types — students,
instructors, coaches/consultants, and admins — across three independently deployed applications.

The codebase demonstrates professional architecture and thoughtful domain modeling. However, a
significant gap exists between the surface area that has been designed (endpoints defined, models
created, UI pages scaffolded) and what has been fully implemented. Roughly 40% of the platform's
intended features are stub implementations, hardcoded responses, or silently incomplete flows.

**Critical gaps that block production deployment:**
- Stripe payment flow is not functional end-to-end (transactions are not confirmed)
- Video streaming via Cloudflare Stream is not fully wired up
- Email/SMS/push notification delivery is stubbed
- The AI assessment engine exists architecturally but Claude SDK calls are not executed
- Password reset uses insecure token storage
- Console logs exposing authentication data in production code

**Strengths:**
- Solid NestJS module architecture with clear domain separation
- Prisma schema is comprehensive and well-normalized
- Both frontends follow consistent Next.js 14 App Router patterns
- Security foundations are in place (JWT, RBAC, global ValidationPipe, Helmet, Throttler)
- i18n is properly configured for Arabic and English

---

## 2. System Architecture

### 2.1 Monorepo Layout

```
careerhub/
├── apps/
│   ├── api/          NestJS 10/11 — REST API + WebSocket
│   ├── web/          Next.js 14 — Main app (all user dashboards, admin panel)
│   └── learn/        Next.js 14 — Lightweight learner portal (course consumption)
├── node_modules/     Root-level shared packages
└── .specify/         Speckit planning artifacts
```

### 2.2 Application Responsibilities

| App | Port | Audience | Responsibilities |
|-----|------|----------|-----------------|
| `api` | 4000 | All clients | Auth, data, business logic, file storage, payments, AI |
| `web` | 3000 | Students, instructors, coaches, admins | Full platform UX — dashboards, course creation, admin panel |
| `learn` | 3002 | Students | Course browsing, lesson playback, certificates, checkout |

### 2.3 Infrastructure Dependencies

| Service | Provider | Used For | Status |
|---------|----------|----------|--------|
| Database | PostgreSQL | Primary data store | Active |
| Cache / Queues | Redis + Bull | Session cache, job queues | Partially wired |
| File Storage | AWS S3 | Avatars, course thumbnails, certificates, uploads | Active |
| Video CDN | Cloudflare Stream | Lesson video upload, processing, playback | Partially wired |
| Payments | Stripe | Course purchases, coaching packages, subscriptions | Partially wired |
| Email | SendGrid + Nodemailer | Transactional email | Stubbed |
| Push Notifications | Firebase Admin SDK | In-app push | Stubbed |
| SMS | Twilio | OTP, reminders | Stubbed |
| AI | Anthropic Claude (`claude-sonnet-4-5`) | Career assessment, AI chat, recommendations | Partially wired |
| Video Conferencing | Zoom API | Coaching sessions | Stubbed |

### 2.4 Communication Patterns

```
Browser (web / learn)
  ↓  HTTP REST + Bearer JWT
apps/api (NestJS)
  ↓  Prisma ORM
PostgreSQL

apps/api
  ↓  ioredis
Redis (cache + Bull job queues)

apps/api
  ↓  @aws-sdk/client-s3
AWS S3

apps/api
  ↓  @anthropic-ai/sdk
Anthropic Claude API

apps/api (future)
  ↑↓  WebSocket (socket.io)
Browser (real-time notifications, chat)
```

---

## 3. Current System — Backend Analysis

### 3.1 Bootstrap & Global Configuration (`main.ts`)

**Fully implemented:**
- `helmet()` — security headers including CSP
- `compression()` — gzip/brotli response compression
- `morgan` — HTTP request logging (dev: colored, prod: combined)
- Global `ValidationPipe` — `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- Global `HttpExceptionFilter` — standardized error envelope
- Global `TransformInterceptor` — wraps all responses: `{success, data, message}`
- `ThrottlerGuard` globally applied (900 000ms window, 100 requests max)
- Swagger docs at `/api/docs` (disabled in production)
- CORS: configured for localhost:3000, :3002, :3003 + env `FRONTEND_URL` / `LEARN_URL`
- Graceful shutdown on `SIGTERM` / `SIGINT`

**Issues:**
- `CORS` allows multiple hardcoded localhost ports — these must be env-only in production
- `/health` endpoint in `main.ts` is a raw Express route returning `{ status: 'ok' }` — separate
  from the `HealthModule`; both exist without coordination
- Throttler limits are hardcoded rather than read from environment variables

### 3.2 Authentication Module

**Implemented correctly:**
- Register with account-type branching (STUDENT gets token immediately; INSTRUCTOR/CONSULTANT
  enter PENDING status, no tokens issued until admin approval)
- Bcrypt password hashing at cost 12
- JWT access token (15 min) + refresh token (7 days) via HTTP-only cookie
- Refresh token rotation: old token invalidated on refresh
- Role-based login blocking (PENDING, REJECTED, BANNED users receive 401)
- Password change (requires current password)
- Email verification flow (token stored, endpoint exists)
- Admin-only login endpoint with role enforcement

**Incomplete / broken:**
- `POST /auth/forgot-password`: password reset token stored as plain string with `reset:` prefix
  in the `Session` table. Session table is designed for refresh tokens. A dedicated
  `PasswordResetToken` table with expiry, used-flag, and IP tracking is needed.
- No brute-force lockout after N failed login attempts (Throttler exists globally but no per-user
  failed-attempt counter)
- Email verification is a notification, not a hard gate — students can log in before verifying
- INSTRUCTOR / CONSULTANT registration requires a CV URL but no server-side validation that the
  URL resolves to an actual file

**Security violations:**
- `console.log` statements in `auth.controller.ts` print email, login attempts, and token data
  to stdout in production

### 3.3 Users Module

**Implemented correctly:**
- Profile read/update
- Avatar upload to S3 (5 MB, jpg/jpeg/png/webp)
- Notification read/mark-read
- Settings (language, timezone, notification preferences)
- Soft-delete account (requires current password)

**Incomplete:**
- `GET /users/achievements` — returns three hardcoded static achievements; no real achievement
  tracking exists in the database
- `GET /users/progress` — learning progress is returned but `timeSpent` is not tracked anywhere
  (always 0)
- Dashboard cache is manual in-memory (TTL 30s, no invalidation) — will serve stale data

### 3.4 Career Module

**Implemented correctly:**
- Career path CRUD (admin creates, public reads)
- User career path selection (upsert)
- Roadmap generation (groups courses by level, generates timeline and milestones from actual data)
- Career path comparison
- Skills extraction

**Hardcoded / fake data (not production-acceptable):**
- `GET /career/market-insights` — entire response is a hardcoded JS object (salary ranges, demand
  trends, job listings are fictional static data)
- `GET /career/recommendations` — string-template recommendations, not AI-generated

**AI Assessment — partially wired:**
- `AssessmentSession` model exists
- `AiAssessmentService` is imported in the module
- Endpoint scaffolding exists for 15-question flow
- The actual Anthropic SDK call (`anthropic.messages.create(...)`) is **not confirmed to execute**
  with a real prompt; service methods may return mock data

### 3.5 Courses Module

**Implemented correctly:**
- Course listing with pagination (12/page), search, career path filter, level filter
- Course details by slug or ID
- Featured courses
- Category listing
- Enrollment check
- Instructor course CRUD (create, update, delete)
- Admin publish/unpublish/approve/reject

**Incomplete:**
- `POST /courses/:id/progress` — `updateProgress` sets `progress: 0` regardless of actual
  completion; real calculation never runs
- `POST /courses/:courseId/lessons/:lessonId/complete` — `markLessonComplete` does not recalculate
  course `progress` on `Enrollment`
- `POST /courses/:id/complete-check` — `completeCourseCheck` logic incomplete
- Course recommendation endpoint delegates to career service which returns hardcoded data
- `GET /courses/instructor/stats` — returns mostly zero values, no real aggregation

### 3.6 Payments Module

**Designed but not production-functional:**
- Stripe `PaymentIntent` creation is implemented
- Payment confirmation endpoint exists
- Webhook endpoint exists with signature header parsing

**What is broken:**
- After `confirmPayment()`, enrollment in the course is **not triggered**. No call to
  `enrollmentService.enroll()` exists in the confirmed-payment branch
- Coupon validation logic exists but no coupon creation admin interface
- Invoice PDF generation is incomplete (placeholder response)
- Refund processing: admin refund endpoint exists but Stripe `refunds.create()` call is missing
- Subscription lifecycle (renewal, cancellation, expiry) is not implemented — `Subscription` model
  exists, `POST /payments/subscribe` is routed, but service logic is a stub
- `GET /payments/invoices/:id/download` — returns 404 as implementation is missing

### 3.7 Coaching Module

**Implemented correctly:**
- Coach listing and profile
- Availability slots management
- Session booking (creates `CoachingSession` record)
- Session status transitions (reschedule, cancel)
- Review submission

**Stubs:**
- `POST /coaching/sessions/:id/join` — should return a Zoom meeting URL; `ZoomService` is
  injected but all Zoom API calls return mock data
- Zoom meeting creation on booking: `zoomMeetingId` and `zoomJoinUrl` on `CoachingSession` are
  never populated
- Coach package purchase: delegates to payment service which is incomplete

### 3.8 Admin Module

**Implemented correctly:**
- User management (list, suspend, ban, approve, reject)
- Course approval workflow
- Pending approvals list
- Site settings (colors, logo, name)
- Audit log read

**Stubs (return mock / empty data):**
- System health check
- System logs
- Backup / restore
- Performance monitoring
- Error tracking
- Usage statistics
- Revenue analytics (returns hardcoded structure)
- Engagement analytics (returns empty structure)

### 3.9 Notifications Module

**Implemented correctly:**
- `Notification` records created and stored in DB
- `GET /notifications` and mark-read work

**Stubs:**
- `NotificationsService.sendEmail()` — SendGrid call is present but gated behind a condition that
  may never be true; HTML templates exist but delivery unverified
- `SmsService.sendSms()` — Twilio SDK present, credentials loaded, but actual API call not
  confirmed to execute in production paths
- `PushService.send()` — Firebase `messaging.send()` is present but `DeviceToken` registration
  endpoint does not exist (can't register a device without a route)

### 3.10 AI Module

**Implemented correctly:**
- Anthropic SDK instantiated with API key from env
- Prompts defined in `src/modules/ai/prompts/` (career-advisor, career-analysis,
  course-recommendation, lesson-assistant)
- Chat history persistence in `Conversation` + `AiMessage` models
- `POST /ai/chat` — creates messages and calls Claude

**Issues:**
- `POST /ai/chat` has no authentication guard visible in the controller decorator — potential
  unauthenticated AI access
- Token usage not tracked against a user quota
- No streaming response — full Claude response buffered before returning; poor UX for long outputs
- Chat history endpoint is paginated but no conversation management (delete, title edit)

### 3.11 Certificates Module

**Implemented:**
- Puppeteer PDF generation with HTML template
- QR code generated and embedded
- Certificate uploaded to S3
- Serial number generated (UUID-based)

**Missing:**
- Public certificate verification endpoint (`/certificates/verify/:serial`) — the `learn` app
  has a `/certificate/[serial]` page but the corresponding API endpoint is not confirmed

### 3.12 Upload Module

**Implemented:**
- S3 multipart upload
- File metadata stored in `UploadedFile`
- Signed URL generation for private files
- MIME type and size validation

**Issues:**
- `POST /upload` does not require authentication (no `@UseGuards` or role check in controller)
  — anonymous file upload to S3 is possible
- No virus/malware scanning on uploaded files
- File size limit (5 MB for images) is hardcoded

### 3.13 Cart Module

**Implemented:**
- Add / remove items
- Cart read

**Missing:**
- Cart checkout does not call the payment service reliably — the delegation path is incomplete
- No cart expiry (items stay indefinitely)
- No cart merging for unauthenticated → authenticated transition

---

## 4. Current System — Database Schema

### 4.1 Core Models Reference

```
User (id, email, password, role, accountType, status, stripeCustomerId, ...)
  ├── UserProfile (firstName, lastName, phone, country, avatar, timezone, ...)
  ├── Session (refreshToken | reset: token — misuse of single table)
  ├── Enrollment (courseId, status, progress 0-100, enrolledAt, completedAt)
  ├── LessonProgress (lessonId, status, progress, timeSpent, completedAt)
  ├── Certificate (courseId, serialNumber, certificateUrl, qrCodeUrl)
  ├── CoachingSession (coachId, slotId, zoomMeetingId, status, ...)
  ├── Payment (courseId, amount, currency, stripeIntentId, status, ...)
  ├── Notification (type, titleEn/Ar, contentEn/Ar, isRead)
  ├── Conversation + AiMessage (AI chat history)
  ├── Cart → CartItem → Course
  ├── AssessmentSession (answers[], report, status)
  ├── UserCareerPath (pathId, pathTitle, aiRecommended)
  └── DeviceToken (push notification tokens)

CareerPath (slug, titleEn/Ar, skills[], salaryRange, demandLevel, ...)
  └── Course (slug, title, price, level, status, isFeatured, ...)
        ├── CourseModule → Lesson
        ├── Section → Lesson
        ├── Lesson (videoUrl, type, isFree, order, ...)
        │     ├── VideoContent (streamId, playbackUrl, status)
        │     └── Quiz → QuizQuestion → QuizAttempt
        ├── Enrollment
        └── Certificate

Coach (userId, specialties[], hourlyRate, isVerified, rating, ...)
  ├── CoachingSlot (startTime, endTime, isBooked)
  ├── CoachingSession
  └── CoachReview (rating, comment, sessionId)

ConsultingSession (studentId, consultantId, scheduledAt, meetingMethod, ...)

SiteSettings (siteName, primaryColor, backgroundColor, logoUrl)
AdminLog + AuditLog
UploadedFile + FileShare
Category
Subscription
Rating (courseId | consultantId)
```

### 4.2 Schema Issues

| Issue | Severity | Detail |
|-------|----------|--------|
| Session table dual-purpose | High | Refresh tokens and password reset tokens share the same `Session` table. Reset tokens use a `reset:` string prefix as a type discriminator — fragile, unindexed by type, no IP or device tracking |
| User field duplication | Medium | `User.bio`, `User.experience`, `User.speciality`, `User.linkedinUrl`, `User.hourlyRate`, `User.meetingMethod` duplicate fields in `UserProfile` and `Coach` — unclear which is authoritative |
| No password history | Medium | Users can reuse the same password after reset; no `PasswordHistory` table |
| JSON fields unversioned | Medium | `Assessment.results`, `QuizQuestion.options`, `Lesson.content` are JSON blobs with no schema version — format changes will silently corrupt old records |
| Cart has no TTL | Low | `CartItem` records have no `expiresAt`; abandoned carts grow indefinitely |
| Missing indices | Medium | `Course.careerPathId`, `Lesson.moduleId`, `LessonProgress.lessonId`, `Payment.userId+status` — common query patterns without composite indices |
| Enrollment.progress orphan | Low | `LessonProgress` records are never aggregated back to `Enrollment.progress` (the update code is a stub) |
| VideoContent.uploadUrl | Low | `uploadUrl` is nullable and temporary (Cloudflare direct creator upload), but never cleared after upload completes |

---

## 5. Current System — Frontend Analysis

### 5.1 Web App (`apps/web`)

**Auth flow:**
- Zustand `authStore` holds `user`, `token`, `refreshToken`
- Tokens persisted to `localStorage` (`deveway_token`, `deveway_refresh`) and cookies
- Axios interceptor: on 401, attempts silent token refresh; on refresh failure, redirects to login
- Role-based layout: `DashboardShell` renders different sidebars based on `user.accountType`

**Pages status:**

| Page | Status | Issues |
|------|--------|--------|
| Home | Working | Hero, featured courses, categories, CTA render |
| `/courses` | Working | Browse, search, filter by career path/level |
| `/careers` | Working | Career path listings |
| `/careers/[slug]` | Working | Path details, stats, course list |
| `/login` | Working | — |
| `/register` | Working | Account type selection (student/instructor/consultant) |
| `/forgot-password` | Working | Sends request; delivery unverified |
| `/dashboard` | Working | Overview stats, quick links |
| `/dashboard/assessment` | Partially working | UI renders but AI backend may return mock data |
| `/dashboard/career-path` | Working | Displays selected path, recommendations |
| `/dashboard/coaching` | Partially working | Session list works; Zoom link broken |
| `/dashboard/my-courses` | Working | Student view; instructor view partially |
| `/dashboard/create-course` | Incomplete | Form exists; submission not confirmed to persist |
| `/dashboard/earnings` | Stub | No real data from API |
| `/dashboard/availability` | Working | Coach availability setting |
| `/checkout/[courseId]` | Broken | Stripe PaymentIntent created but enrollment not triggered after payment |
| `/admin/*` | Partially working | User/course/session management works; analytics, revenue, monitoring are stubs |

**Global issues:**
- `NEXT_PUBLIC_API_URL` defaults to `http://localhost:3001` in some files (should be 4000)
- Inconsistent API response unwrapping: sometimes `response.data.data`, sometimes `response.data`
- Loading states: skeleton components exist but are not consistently used on all data-fetching pages
- No error boundaries — unhandled promise rejections cause white-screen crashes
- `console.log` present in multiple page components

### 5.2 Learn App (`apps/learn`)

**Purpose:** Student-only course consumption portal.

| Page | Status | Issues |
|------|--------|--------|
| Home | Working | Hero, featured courses |
| `/courses` | Working | Browse, search |
| `/courses/[id]` | Working | Course details, preview |
| `/courses/[id]/learn` | Partially working | Lesson list renders; video playback depends on Cloudflare Stream |
| `/my-courses` | Working | Enrolled course list |
| `/dashboard` | Working | Student stats |
| `/login` / `/register` | Working | — |
| `/checkout/[id]` | Broken | Same payment completion issue as web app |
| `/certificate/[serial]` | Partially working | Renders certificate; verify API endpoint uncertain |
| `/coaching` | Stub | Page exists, limited functionality |

---

## 6. Feature Completeness Matrix

| Domain | Feature | Completion | Blocker |
|--------|---------|-----------|---------|
| **Auth** | Register / Login / Logout | 90% | Minor: no email verification gate |
| **Auth** | Token refresh | 95% | — |
| **Auth** | Password reset | 50% | Insecure token storage; email delivery unverified |
| **Auth** | Email verification | 40% | Not a hard gate; delivery unverified |
| **Auth** | Brute-force protection | 30% | Global throttle only; no per-account lockout |
| **Courses** | Browse / Search / Filter | 90% | — |
| **Courses** | Course details | 85% | — |
| **Courses** | Enrollment | 75% | Progress recalculation broken |
| **Courses** | Lesson playback (video) | 40% | Cloudflare playback URL not wired |
| **Courses** | Lesson progress tracking | 30% | `timeSpent` never tracked; `progress` update stub |
| **Courses** | Quizzes | 55% | Attempt scoring exists; pass/fail not propagated |
| **Courses** | Course creation (instructor) | 60% | Section/lesson CRUD partial; no video upload UI |
| **Courses** | Course approval workflow | 85% | — |
| **Certificates** | Generate PDF | 70% | Puppeteer implementation exists but not tested at scale |
| **Certificates** | Public verification | 50% | API endpoint uncertain |
| **Payments** | Stripe PaymentIntent | 60% | Intent created; confirmation → enrollment broken |
| **Payments** | Course purchase flow | 30% | Post-payment enrollment not triggered |
| **Payments** | Subscriptions | 10% | Model only |
| **Payments** | Refunds | 20% | Admin endpoint; Stripe call missing |
| **Payments** | Invoices | 20% | Download endpoint returns 404 |
| **Payments** | Coupons | 40% | Validation logic exists; no admin creation UI |
| **Coaching** | Coach browse / profile | 85% | — |
| **Coaching** | Session booking | 65% | Creates record; Zoom meeting not created |
| **Coaching** | Zoom join link | 5% | ZoomService stubbed |
| **Coaching** | Session reviews | 75% | — |
| **AI** | Career assessment (15Q) | 40% | Claude call may not execute in production |
| **AI** | AI chat | 65% | Claude calls active; no streaming; no auth guard |
| **AI** | Course recommendations | 20% | Hardcoded template responses |
| **AI** | Market insights | 5% | Fully hardcoded |
| **Notifications** | In-app notifications | 85% | — |
| **Notifications** | Email delivery | 25% | SendGrid integrated but delivery unverified |
| **Notifications** | Push notifications | 20% | Firebase SDK; no device token registration endpoint |
| **Notifications** | SMS delivery | 15% | Twilio SDK; calls not confirmed |
| **Admin** | User management | 80% | — |
| **Admin** | Course management | 80% | — |
| **Admin** | Analytics | 20% | Mock data |
| **Admin** | Revenue tracking | 15% | Mock data |
| **Admin** | System health / monitoring | 5% | Stubs |
| **Cart** | Add / remove | 80% | — |
| **Cart** | Checkout | 20% | Payment delegation incomplete |
| **Realtime** | WebSocket / chat | 30% | socket.io installed; not wired to frontend |

---

## 7. Security Audit

### 7.1 Critical (fix before any production traffic)

**S-001 — Console logs exposing auth data**
- Location: `apps/api/src/modules/auth/auth.controller.ts` (multiple lines)
- Risk: Access tokens, email addresses, and login attempts printed to stdout. Any log
  aggregation pipeline (CloudWatch, Datadog) will ingest and index these.
- Fix: Remove all `console.log` from auth module. Use NestJS `Logger` at `debug` level,
  which is suppressed in production.

**S-002 — Password reset token in Session table**
- Location: `apps/api/src/modules/auth/auth.service.ts` — `forgotPassword()`
- Risk: Refresh token table used for password resets with a string prefix. No separate
  expiry enforcement, no IP tracking, no single-use enforcement beyond deletion on use.
- Fix: Create dedicated `PasswordResetToken` model with `token` (hashed), `expiresAt`,
  `usedAt`, `ipAddress`, `userId`. Hash the token before storage; compare hash on verify.

**S-003 — Unauthenticated file upload**
- Location: `apps/api/src/modules/upload/upload.controller.ts`
- Risk: `POST /upload` allows anonymous users to store arbitrary files on the platform's
  S3 bucket, generating costs and potential hosting of malicious content.
- Fix: Add `@UseGuards(JwtAuthGuard)` to upload controller.

**S-004 — Unauthenticated AI chat**
- Location: `apps/api/src/modules/ai/ai.controller.ts`
- Risk: `POST /ai/chat` may not require authentication, allowing unrestricted Claude API
  calls at platform cost.
- Fix: Verify guard presence; add `@UseGuards(JwtAuthGuard)` if missing. Add per-user
  daily token quota check.

### 7.2 High (fix before user-facing launch)

**S-005 — No account lockout on failed logins**
- Risk: Credential stuffing and brute-force attacks limited only by global rate limiter
  (100 requests per 15 minutes from any IP), not per-account.
- Fix: Track failed login attempts in Redis (`auth:fails:{userId}`, TTL 15 min). Lock
  account after 5 consecutive failures; unlock after 15 min or via admin.

**S-006 — Email verification not enforced**
- Risk: Accounts can be created with non-existent email addresses, blocking legitimate
  owners from registering with their email.
- Fix: Set `isEmailVerified: false` on register; block login for unverified students
  after a grace period (24h). Hard-gate instructor/consultant approval on verification.

**S-007 — CORS with hardcoded localhost origins**
- Risk: Localhost origins left in production CORS allowlist allow cross-origin requests
  from any attacker running a local server.
- Fix: Derive allowed origins exclusively from `ALLOWED_ORIGINS` env variable; remove
  all `localhost` fallback values from production config.

**S-008 — JWT default secret**
- Risk: If `JWT_SECRET` env var is missing, application should fail to start, not use
  a default secret.
- Fix: Add Joi schema validation for `JWT_SECRET` in `app.module.ts` `ConfigModule`.
  If missing at boot, throw and refuse to start.

**S-009 — No CSRF protection on cookie-based auth**
- Risk: Refresh token in HTTP-only cookie is vulnerable to CSRF on any `POST` endpoint
  that relies on the cookie for auth.
- Fix: Add `SameSite=Strict` (or `Lax`) to the refresh token cookie. For `SameSite=Lax`
  deployments, add a `X-Requested-With: XMLHttpRequest` check on token-refresh endpoint.

### 7.3 Medium

**S-010 — Weak password policy**
- No complexity requirements enforced on register or password reset.
- Fix: Add class-validator `@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)` to
  `password` field in `RegisterDto` and `ResetPasswordDto`.

**S-011 — No virus scanning on uploads**
- Uploaded files are stored directly to S3 without antivirus scanning.
- Fix: Add a Bull job that runs ClamAV (or a SaaS equivalent) on every uploaded file;
  quarantine and delete if infected; notify the uploader.

**S-012 — Admin endpoints not versioned or prefixed separately**
- Admin routes share the same `/api/` prefix as public routes; enumeration via Swagger
  reveals full admin surface.
- Fix: Disable Swagger in production (already done); consider separating admin routes
  to a different subdomain or requiring an additional admin token.

---

## 8. Performance Analysis

### 8.1 Database

**P-001 — N+1 query risk in course listings**
- `GET /courses` fetches courses with nested `include` on instructor, category, careerPath,
  modules, sections, and ratings in a single call. As the dataset grows, this query will
  degrade significantly.
- Fix: Use `select` to return only required fields per endpoint. Separate "list" queries
  (minimal fields) from "detail" queries (full nesting). Add indices on `careerPathId`,
  `categoryId`, `status`, `isFeatured`.

**P-002 — Enrollment progress update is a full-table scan**
- `markLessonComplete` must count completed lessons for the course and compare against total
  lessons to compute progress. Without proper indices on `LessonProgress(userId, lessonId,
  status)`, this becomes expensive at scale.
- Fix: Add composite index `(userId, lessonId, status)` on `LessonProgress`. Cache progress
  computation in Redis with invalidation on lesson complete.

**P-003 — Unpaginated nested data**
- `GET /courses/:id/lessons` returns all lessons for a course in a single response. A course
  with 200 lessons returns 200 records with full nesting in one HTTP call.
- Fix: Paginate lessons by module/section. Return section headers with lesson count; lazy-load
  lesson details on expand.

**P-004 — Manual in-memory cache without invalidation**
- `UsersService` uses a JavaScript `Map` with 30-second TTL for dashboard data. This:
  (a) does not scale across multiple API pods, (b) never invalidates on data mutation,
  (c) grows unbounded if user IDs are not evicted.
- Fix: Replace with Redis-backed `CacheManager` (already installed). Implement cache
  invalidation on profile/enrollment mutations.

**P-005 — AI chat is blocking**
- `POST /ai/chat` awaits the full Claude response before sending the HTTP response. Claude
  responses can take 5–30 seconds for long outputs.
- Fix: Implement server-sent events (SSE) or WebSocket streaming. Use
  `anthropic.messages.stream()` to pipe tokens to the client in real time.

**P-006 — Bull queues not used for heavy operations**
- Certificate PDF generation (Puppeteer + S3 upload), email sending, and Zoom meeting
  creation run synchronously in the HTTP request cycle.
- Fix: Move all of these to Bull jobs. Return `202 Accepted` with a `jobId` immediately;
  notify via WebSocket or polling when the job completes.

### 8.2 Frontend

**P-007 — React Query `staleTime` not set**
- Default `staleTime: 0` means every component mount triggers a refetch. Course listings,
  career path data, and user profile are refetched on every navigation.
- Fix: Set `staleTime: 1000 * 60 * 5` (5 min) for stable data; `staleTime: 1000 * 30`
  (30 s) for user-specific mutable data. Configure globally in `QueryClient`.

**P-008 — No image optimization in learn app**
- Course thumbnails use raw `<img>` tags in some components rather than Next.js `<Image>`.
- Fix: Replace all `<img>` with `next/image` `<Image>`. Configure `remotePatterns` for S3
  and Cloudflare CDN hostnames. Set proper `sizes` attributes.

---

## 9. Bugs & Bad Practices

### 9.1 Confirmed Bugs

| ID | Severity | Location | Description |
|----|----------|----------|-------------|
| B-001 | Critical | `payments.service.ts` — `confirmPayment()` | After Stripe payment confirmed, enrollment is **not created**. User pays but gets no course access. |
| B-002 | Critical | `courses.service.ts` — `updateProgress()` | Always sets `Enrollment.progress = 0` regardless of actual lesson completions. |
| B-003 | High | `auth.controller.ts` | Multiple `console.log` statements emit auth tokens and user emails to production logs. |
| B-004 | High | `upload.controller.ts` | File upload endpoint has no authentication guard — anonymous S3 uploads possible. |
| B-005 | High | `coaching.service.ts` — `joinSession()` | Returns a hardcoded or empty Zoom URL. Students cannot join sessions. |
| B-006 | Medium | `users.service.ts` — `getAchievements()` | Returns three hardcoded achievements regardless of user activity. |
| B-007 | Medium | `payments.service.ts` — `downloadInvoice()` | Returns 404 or throws; invoice download not implemented. |
| B-008 | Medium | `admin.service.ts` — `getSystemHealth()` | Returns `null` / stub; health check widget in admin dashboard is non-functional. |
| B-009 | Medium | `career.service.ts` — `getMarketInsights()` | Returns static hardcoded JS object; displayed as real market data to users. |
| B-010 | Low | `web/src/lib/constants.ts` | `API_BASE_URL` defaults to `localhost:3001`; API runs on 4000. |

### 9.2 Code Quality Issues

| ID | Category | Issue |
|----|----------|-------|
| Q-001 | Logging | `console.log` used throughout; no structured logging with NestJS `Logger` |
| Q-002 | Error handling | Many service catch blocks swallow errors silently |
| Q-003 | Type safety | Several `any` casts in frontend API client without justification |
| Q-004 | Duplication | User fields duplicated between `User`, `UserProfile`, and `Coach` models |
| Q-005 | Config | Throttler window/max values hardcoded in `app.module.ts` rather than read from env |
| Q-006 | i18n | Some admin page strings not internationalized (hardcoded English) |
| Q-007 | Validation | No password complexity validator in `RegisterDto` or `ResetPasswordDto` |
| Q-008 | Architecture | `Session` table serves two concerns (refresh tokens + password resets) |
| Q-009 | Frontend | API response unwrapping inconsistent: `res.data` vs `res.data.data` in different hooks |
| Q-010 | Frontend | `localStorage` used for token storage (XSS risk); should be HTTP-only cookie only |

---

## 10. Missing & Incomplete Features

### 10.1 Must-have for Production

#### M-01: Payment Flow Completion
The end-to-end payment flow is broken. When a student pays for a course:
1. Stripe PaymentIntent is created ✅
2. Payment is confirmed with Stripe ✅
3. `Payment` record is persisted ✅
4. **`Enrollment` record is NOT created** ✗
5. **Student does not gain course access** ✗

Required additions:
- After `confirmPayment()` succeeds, call `enrollmentService.create()` for the purchased course
- Add a Stripe webhook handler for `payment_intent.succeeded` as a safety net
- Emit `PAYMENT_CONFIRMED` notification
- Issue certificate job on `COURSE` completion

#### M-02: Email Delivery
Transactional emails are critical for auth and engagement. Required:
- Verify SendGrid API key integration with a test send
- Welcome email on registration
- Password reset email with secure time-limited token link
- Course enrollment confirmation
- Session booking confirmation and reminder (24h before)

#### M-03: Video Playback
Lesson video playback is non-functional without Cloudflare Stream `playbackUrl`.
Required:
- Complete Cloudflare direct creator upload: `POST /video/upload-url` → return signed upload URL
- On upload completion webhook: update `VideoContent.status = READY`, set `playbackUrl`
- Frontend learn app: render Cloudflare Stream player with `playbackUrl`

#### M-04: AI Assessment Engine
The 15-question career assessment is the platform's primary AI differentiator. Required:
- Confirm `AiAssessmentService.generateReport()` calls `anthropic.messages.create()` with the
  actual user answers
- Map assessment output to structured career recommendations
- Persist report in `AssessmentSession.report`
- Display report in the dashboard assessment page

#### M-05: Device Token Registration
Push notifications cannot be delivered without device tokens. Required:
- `POST /notifications/device-token` — register FCM/APNs token (authenticated)
- `DELETE /notifications/device-token/:token` — unregister (logout)

### 10.2 High-priority Gaps

#### H-01: Course Progress Tracking
- Implement `markLessonComplete` to recalculate `Enrollment.progress` based on
  `LessonProgress` records
- Track `timeSpent` in `LessonProgress` via frontend heartbeat (update every 30s of active play)
- Fire `LESSON_COMPLETED` and `CERTIFICATE_EARNED` notifications at appropriate triggers

#### H-02: Zoom Integration
- Implement `ZoomService.createMeeting()` using Zoom JWT or OAuth2 server-to-server credentials
- Call on session booking; store `zoomMeetingId` and `zoomJoinUrl` on `CoachingSession`
- Return `zoomJoinUrl` from `POST /coaching/sessions/:id/join`

#### H-03: Certificate Verification
- `GET /certificates/verify/:serial` public endpoint — return certificate metadata or 404
- Certificate page in learn app calls this endpoint to confirm authenticity

#### H-04: Admin Analytics
- Replace hardcoded stubs in revenue/engagement analytics with real Prisma aggregations
- Revenue: `Payment.aggregate({ _sum: { amount: true } })` grouped by date range
- Enrollment: `Enrollment.groupBy({ by: ['courseId'] })` for top courses
- Active users: `User.count({ where: { isActive: true } })`

#### H-05: Subscription System
- Implement subscription tier logic: FREE, PRO, ENTERPRISE
- Gate certain courses/features by subscription level
- Stripe Subscription integration (create, webhook for renewal/cancellation)

### 10.3 Medium-priority Gaps

#### Med-01: Achievement System
- Define achievement types and triggers in a `Achievement` + `UserAchievement` model
- Award achievements on: first enrollment, first completion, 5/10/25 completions,
  assessment completion, coaching session booked
- Display in user profile and dashboard

#### Med-02: Real-time Notifications
- Implement socket.io event emission from `NotificationsService`
- Frontend: subscribe to `notification:{userId}` room on login; show `NotificationBell` updates
  in real time without polling

#### Med-03: Course Rating & Review Display
- `Rating` model and create endpoint exist
- `GET /courses/:id` should include aggregated rating (`_avg` on `Rating.value`) and
  recent review count
- Display star rating on course cards

#### Med-04: Instructor Dashboard Stats
- `GET /courses/instructor/stats` returns zeros — implement real aggregations:
  - Total students (unique `Enrollment.userId` across instructor's courses)
  - Total revenue (sum of `Payment.amount` for instructor's courses)
  - Average course rating
  - Monthly enrollment trend

#### Med-05: Consulting Session Management
- `ConsultingSession` model is separate from `CoachingSession`
- Full CRUD is only partially implemented
- Calendar view for consultant availability

---

## 11. Improvements Roadmap

### Phase 0 — Security & Stability Hardening (Week 1–2)
*No new features. Make the existing system safe to expose to users.*

| Task | Effort | Impact |
|------|--------|--------|
| Remove all `console.log` from API code; replace with NestJS Logger | S | Critical |
| Move password reset to dedicated `PasswordResetToken` table with hashed token | M | Critical |
| Add `@UseGuards(JwtAuthGuard)` to upload controller | S | Critical |
| Verify/add auth guard to AI chat controller | S | Critical |
| Add `JWT_SECRET` required validation at bootstrap | S | High |
| Set `SameSite=Strict` on refresh token cookie | S | High |
| Remove hardcoded localhost from CORS config; read from env only | S | High |
| Add password complexity validation to `RegisterDto` / `ResetPasswordDto` | S | High |
| Add per-user failed login counter in Redis (lock after 5 attempts) | M | High |
| Fix `API_BASE_URL` constant in frontend (3001 → 4000) | S | High |
| Fix API response unwrapping inconsistency in frontend hooks | M | Medium |
| Replace `localStorage` token storage with HTTP-only cookie strategy | L | High |

### Phase 1 — Core Flow Completion (Week 3–5)
*Make the primary user journey (browse → enroll → learn → certify) fully functional.*

| Task | Effort | Impact |
|------|--------|--------|
| Fix payment confirmation → enrollment creation (B-001) | M | Critical |
| Implement Stripe webhook `payment_intent.succeeded` handler | M | Critical |
| Implement `markLessonComplete` with progress recalculation (B-002) | M | Critical |
| Verify SendGrid email delivery; implement welcome + password reset emails | M | Critical |
| Complete Cloudflare Stream upload URL generation + webhook completion | L | High |
| Wire Cloudflare `playbackUrl` to frontend video player | M | High |
| Implement `POST /notifications/device-token` registration | S | High |
| Confirm AI assessment Claude SDK calls execute with real user data | M | High |
| Implement certificate verification endpoint | S | Medium |
| Move Puppeteer PDF generation to Bull queue (async) | M | Medium |
| Move email sending to Bull queue (async) | S | Medium |

### Phase 2 — Feature Completeness (Week 6–9)
*Fill the remaining gaps for a complete product.*

| Task | Effort | Impact |
|------|--------|--------|
| Zoom meeting creation on session booking | L | High |
| Real admin analytics (revenue, enrollment, user growth) | L | High |
| Course progress tracking with `timeSpent` heartbeat | M | High |
| `LESSON_COMPLETED` and `CERTIFICATE_EARNED` notifications | M | High |
| Subscription tier system with Stripe Subscriptions | XL | High |
| Instructor dashboard real stats | M | Medium |
| Achievement system (model, triggers, display) | L | Medium |
| Real-time notifications via socket.io | L | Medium |
| Course rating aggregate on course listings | S | Medium |
| Consulting session management (full CRUD) | M | Medium |
| Cart checkout → payment delegation fix | M | Medium |
| AI market insights (replace hardcoded with real aggregations) | L | Medium |
| AI course recommendations (replace template with Claude-generated) | M | Medium |

### Phase 3 — Production Readiness (Week 10–12)
*Infrastructure, observability, and scale preparation.*

| Task | Effort | Impact |
|------|--------|--------|
| Add Sentry (or equivalent) for error tracking in API and frontends | M | High |
| Configure proper logging pipeline (Winston → CloudWatch/Datadog) | M | High |
| Add Redis caching for course listings, featured courses, career paths | M | High |
| Implement proper cache invalidation strategy | M | Medium |
| Add composite database indices (P-001, P-002) | S | High |
| Paginate lesson lists (P-003) | M | Medium |
| Implement streaming for AI chat (SSE) | M | Medium |
| Docker Compose for local development | M | Medium |
| CI/CD pipeline (GitHub Actions: lint → type-check → test → build → deploy) | L | High |
| `.env.example` with all required variables documented | S | High |
| Throttler config via environment variables | S | Medium |
| Load testing (k6 / Artillery) on critical paths | M | Medium |
| File upload virus scanning (ClamAV or SaaS) | L | Low |

### Phase 4 — Growth Features (Post-launch)
*Competitive differentiation and engagement.*

| Task | Effort | Impact |
|------|--------|--------|
| Live streaming sessions (WebRTC or third-party) | XL | High |
| Mobile app (React Native reusing API) | XL | High |
| Advanced AI career advisor (multi-turn, context-aware) | L | High |
| Learning path auto-progression (recommend next course) | M | Medium |
| Social features (learner community, discussion threads) | XL | Medium |
| Affiliate / referral system | L | Medium |
| Content moderation (automated + manual) | L | Medium |
| Multi-currency and regional pricing | M | Medium |
| Corporate accounts / team enrollment | XL | High |
| White-label / custom branding per institution | XL | Medium |

---

## Appendix A — API Endpoint Inventory

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| POST | /auth/register | Public | — | Working |
| POST | /auth/login | Public | — | Working |
| POST | /auth/refresh | Cookie | — | Working |
| POST | /auth/logout | JWT | Any | Working |
| GET | /auth/me | JWT | Any | Working |
| POST | /auth/forgot-password | Public | — | Partial (delivery unverified) |
| POST | /auth/reset-password | Public | — | Partial (insecure token) |
| POST | /auth/verify-email | Public | — | Partial |
| POST | /auth/change-password | JWT | Any | Working |
| GET | /users/profile | JWT | Any | Working |
| PATCH | /users/profile | JWT | Any | Working |
| POST | /users/avatar | JWT | Any | Working |
| GET | /users/dashboard | JWT | Any | Working (stale cache) |
| GET | /users/achievements | JWT | Any | Bug (hardcoded) |
| GET | /courses | Public | — | Working |
| GET | /courses/featured | Public | — | Working |
| GET | /courses/:slug | Public | — | Working |
| POST | /courses/:id/enroll | JWT | Any | Working |
| POST | /courses/:courseId/lessons/:lessonId/complete | JWT | Any | Bug (progress=0) |
| POST | /payments/create-payment-intent | JWT | Any | Working |
| POST | /payments/confirm-payment | JWT | Any | Bug (no enrollment) |
| POST | /payments/webhook/stripe | Public | — | Partial |
| GET | /coaching/coaches | Public | — | Working |
| POST | /coaching/sessions/book | JWT | Any | Partial (no Zoom) |
| POST | /coaching/sessions/:id/join | JWT | Any | Bug (empty URL) |
| POST | /ai/chat | JWT? | Any | Partial (no stream) |
| GET | /career/market-insights | JWT | Any | Bug (hardcoded) |
| POST | /career/assessment/session/start | JWT | Any | Partial |
| POST | /upload | — | — | Bug (no auth) |
| GET | /admin/analytics/revenue | JWT | ADMIN | Stub |
| GET | /admin/system/health | JWT | ADMIN | Stub |

---

## Appendix B — Environment Variables Required

```env
# Application
NODE_ENV=production
PORT=4000
API_PREFIX=api

# Database
DATABASE_URL=postgresql://user:pass@host:5432/careerhub

# Auth
JWT_SECRET=<min 64 char random string>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
FRONTEND_URL=https://careerhub.com
LEARN_URL=https://learn.careerhub.com
ALLOWED_ORIGINS=https://careerhub.com,https://learn.careerhub.com

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=careerhub-prod

# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# SendGrid
SENDGRID_API_KEY=SG....

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Zoom
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Frontend
NEXT_PUBLIC_API_URL=https://api.careerhub.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

*End of CareerHub System Specification v1.0.0*
*Next review: after Phase 1 completion*
