---

description: "Task list for CareerHub Production Readiness — Phase 0 + Phase 1"
---

# Tasks: CareerHub Production Readiness — Phase 0 + Phase 1

**Input**: Design documents from `specs/master/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story to enable independent implementation
and verification. US1–US3 are P1 (security critical). US4–US7 are P2 (core flows).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US7)
- All file paths are absolute from repo root

---

## Phase 1: Setup

**Purpose**: Confirm all existing packages are available and verify schema field
states before writing any code.

- [ ] T001 Verify `@nestjs/bull` and `bull` are listed in `apps/api/package.json` dependencies (no install needed if present)
- [ ] T002 [P] Verify `@sendgrid/mail` is listed in `apps/api/package.json` devDependencies and install if missing: `cd apps/api && npm install @sendgrid/mail`
- [ ] T003 [P] Confirm `LessonProgress.timeSpent` field exists in `apps/api/prisma/schema.prisma`; note if missing for T028 handling

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cross-cutting changes that every user story depends on. MUST be complete
before any story implementation begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Add Joi `validationSchema` to `ConfigModule.forRoot()` in `apps/api/src/app.module.ts` — require `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET` (min 32 chars), `REDIS_HOST`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SENDGRID_API_KEY`, `ANTHROPIC_API_KEY`, `FRONTEND_URL`, `LEARN_URL` with `validationOptions: { abortEarly: false }`
- [ ] T005 [P] Fix `API_BASE_URL` default fallback from `localhost:3001` to `localhost:4000` in `apps/web/src/lib/constants.ts`
- [ ] T006 [P] Fix `API_BASE_URL` default fallback from `localhost:3001` to `localhost:4000` in `apps/learn/src/lib/constants.ts`

**Checkpoint**: API boots with all env vars set; frontends resolve the correct API port

---

## Phase 3: User Story 1 — Secure Password Reset (Priority: P1) 🎯 MVP Security

**Goal**: Password reset tokens are bcrypt-hashed and stored in a dedicated
`PasswordResetToken` table. The raw token is emailed, never persisted.

**Independent Test**: Call `POST /auth/forgot-password`, inspect DB — only a bcrypt hash
is stored. Call `POST /auth/reset-password` with the raw token — password updates and
token is marked used. Repeat with same token — returns 400.

### Implementation for User Story 1

- [ ] T007 [US1] Add `PasswordResetToken` model to `apps/api/prisma/schema.prisma` with fields: `id`, `userId`, `tokenHash` (String unique), `expiresAt` (DateTime), `usedAt` (DateTime?), `ipAddress` (String?), `createdAt` (DateTime default now) — with `onDelete: Cascade` relation to `User` and `@@index([userId])`, `@@index([expiresAt])`
- [ ] T008 [US1] Add `passwordResetTokens PasswordResetToken[]` relation to the `User` model in `apps/api/prisma/schema.prisma`
- [ ] T009 [US1] Run Prisma migration: `cd apps/api && npx prisma migrate dev --name add_password_reset_token` — verify migration file created under `apps/api/prisma/migrations/`
- [ ] T010 [P] [US1] Add `@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, { message: 'Password must contain uppercase, lowercase, number, and special character' })` and `@MinLength(8)` to the `password` field in `apps/api/src/modules/auth/dto/register.dto.ts`
- [ ] T011 [P] [US1] Rewrite `apps/api/src/modules/auth/dto/reset-password.dto.ts` — add `token: string` with `@IsString() @IsNotEmpty()` and `newPassword: string` with `@IsString() @MinLength(8) @Matches(...)` (same regex as T010)
- [ ] T012 [US1] Rewrite `forgotPassword()` in `apps/api/src/modules/auth/auth.service.ts`: (1) look up user by email — silently succeed if not found (prevent enumeration), (2) generate `rawToken = crypto.randomBytes(32).toString('hex')`, (3) compute `tokenHash = await bcrypt.hash(rawToken, 10)`, (4) delete all existing `PasswordResetToken` rows for this user, (5) create new `PasswordResetToken` with `tokenHash`, `expiresAt = new Date(Date.now() + 3600_000)`, `ipAddress` from request, (6) queue email job (placeholder call — wired fully in US6 T040), return success
- [ ] T013 [US1] Rewrite `resetPassword()` in `apps/api/src/modules/auth/auth.service.ts`: (1) accept `{ token, newPassword }`, (2) decode user from token is NOT possible since raw token has no userId — require the client to pass `email` alongside token OR fetch all non-expired, non-used tokens and `bcrypt.compare` each — choose: add `email` field to `ResetPasswordDto` and look up user first, then find their unexpired tokens, (3) on match: `bcrypt.hash(newPassword, 12)` and `prisma.user.update`, (4) set `usedAt = new Date()` on the token, (5) delete all `Session` rows for the user (invalidate all refresh tokens), (6) log with `this.logger.log('Password reset successful', { userId })` — no token value in log
- [ ] T014 [US1] Add `@ApiOperation` and `@ApiResponse(400)` / `@ApiResponse(200)` Swagger decorators to `forgotPassword()` and `resetPassword()` route handlers in `apps/api/src/modules/auth/auth.controller.ts`

**Checkpoint**: US1 fully functional and testable independently per quickstart.md Story 1 steps

---

## Phase 4: User Story 2 — Secure Authentication Hygiene (Priority: P1)

**Goal**: Zero sensitive data in API stdout. All `console.log` in the auth module
replaced with NestJS `Logger` calls that sanitize PII fields before logging.

**Independent Test**: Start the API, call login + register + refresh — grep stdout
for any email address, password, or token string — must return empty.

### Implementation for User Story 2

- [ ] T015 [US2] Create `apps/api/src/common/utils/sanitize.util.ts` — export `function sanitize<T extends Record<string, unknown>>(obj: T): Partial<T>` that removes keys matching `/^(password|token|secret|key|authorization|credential)$/i` using `Object.fromEntries(Object.entries(obj).filter(...))`
- [ ] T016 [US2] Audit and rewrite `apps/api/src/modules/auth/auth.controller.ts`: (1) add `private readonly logger = new Logger(AuthController.name)` property, (2) replace every `console.log(...)` call with `this.logger.debug(...)` passing only `sanitize({...})` of the relevant context — no email, password, or token values, (3) remove dead debug statements that have no operational value entirely
- [ ] T017 [P] [US2] Audit `apps/api/src/modules/auth/auth.service.ts`: add `private readonly logger = new Logger(AuthService.name)`, replace any `console.log` with structured `this.logger.log/error/warn` using sanitized context, wrap all external calls (bcrypt, prisma) in try/catch that logs `{ operation, reason: e.message }` before re-throwing as `UnauthorizedException` or `BadRequestException`

**Checkpoint**: `grep -r "console.log" apps/api/src/modules/auth/` returns no output

---

## Phase 5: User Story 3 — Protected File Uploads (Priority: P1)

**Goal**: `POST /upload` and all upload endpoints require a valid JWT. Anonymous
requests are rejected before any S3 operation begins.

**Independent Test**: `curl -X POST http://localhost:4000/api/upload -F "file=@test.jpg"` (no auth header) → 401 Unauthorized.

### Implementation for User Story 3

- [ ] T018 [US3] Add `@UseGuards(JwtAuthGuard)` class-level decorator to `UploadController` in `apps/api/src/modules/upload/upload.controller.ts` — place it immediately above `@Controller('upload')`
- [ ] T019 [P] [US3] Add `@ApiResponse({ status: 401, description: 'Unauthorized — valid JWT required' })` to each endpoint method in `apps/api/src/modules/upload/upload.controller.ts`

**Checkpoint**: Anonymous upload returns 401; authenticated upload succeeds as before

---

## Phase 6: User Story 4 — Course Purchase Completes Enrollment (Priority: P1)

**Goal**: Confirming a Stripe payment for a course always creates an `Enrollment`
record. The webhook provides an idempotent safety net.

**Independent Test**: Confirm a Stripe test payment → immediately call
`GET /api/courses/:id/enrollment` → must return `status: "ACTIVE"`.

### Implementation for User Story 4

- [ ] T020 [US4] Update `createPaymentIntent()` in `apps/api/src/modules/payments/payments.service.ts` — when `itemType === 'COURSE'`, add `metadata: { userId, courseId, type: 'COURSE' }` to the `stripe.paymentIntents.create()` call so the webhook can recover `userId` and `courseId` from the intent
- [ ] T021 [US4] Add private `createEnrollmentAfterPayment(userId: string, courseId: string, paymentId: string): Promise<void>` method to `apps/api/src/modules/payments/payments.service.ts` — body: `prisma.enrollment.upsert({ where: { userId_courseId: { userId, courseId } }, create: { userId, courseId, status: EnrollmentStatus.ACTIVE, progress: 0 }, update: { status: EnrollmentStatus.ACTIVE } })` then call `notificationsService.notify(userId, NotificationType.PAYMENT_CONFIRMED, { courseId, paymentId })`
- [ ] T022 [US4] In `confirmPayment()` in `apps/api/src/modules/payments/payments.service.ts`: after `stripe.paymentIntents.confirm()` resolves successfully, call `await this.createEnrollmentAfterPayment(userId, courseId, payment.id)` — wrap in try/catch that logs and re-throws so the payment record is preserved even if enrollment creation fails
- [ ] T023 [US4] Add `payment_intent.succeeded` case to the Stripe webhook handler in `apps/api/src/modules/payments/payments.service.ts`: extract `userId` and `courseId` from `paymentIntent.metadata`, call `createEnrollmentAfterPayment()` — this is the idempotent safety net for network failures
- [ ] T024 [US4] Ensure webhook handler in `apps/api/src/modules/payments/payments.service.ts` verifies Stripe signature using `stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)` before processing any event — wrap in try/catch that throws `BadRequestException` on signature mismatch
- [ ] T025 [US4] Update `@ApiResponse` on `POST /payments/confirm-payment` in `apps/api/src/modules/payments/payments.controller.ts` to document the new `enrollment` field in the response shape per `specs/master/contracts/payments.md`

**Checkpoint**: Payment confirmation creates enrollment; duplicate webhook calls produce one enrollment (upsert idempotency)

---

## Phase 7: User Story 5 — Lesson Progress Is Tracked (Priority: P2)

**Goal**: Marking a lesson complete recalculates enrollment progress accurately.
Course transitions to COMPLETED at 100%. Time spent is tracked via heartbeat.

**Independent Test**: Mark 4 lessons complete sequentially → enrollment progress
must be 25 → 50 → 75 → 100 and final status must be `COMPLETED`.

### Implementation for User Story 5

- [ ] T026 [US5] Add 5 new `@@index` entries to `apps/api/prisma/schema.prisma`: `LessonProgress(userId, lessonId, status)`, `Lesson(courseId, isPublished)`, `Course(careerPathId, status)`, `Payment(userId, status)`, `Notification(userId, isRead, createdAt)` — follow existing index syntax in schema
- [ ] T027 [US5] Run Prisma migration: `cd apps/api && npx prisma migrate dev --name add_performance_indices` — verify migration SQL contains the 5 `CREATE INDEX` statements
- [ ] T028 [US5] Rewrite `markLessonComplete()` in `apps/api/src/modules/courses/courses.service.ts`: (1) verify user is enrolled (`prisma.enrollment.findUniqueOrThrow({ where: { userId_courseId } })`) — throw `ForbiddenException` if not found, (2) upsert `LessonProgress` record with `status: COMPLETED`, `completedAt: new Date()`, (3) use `Promise.all` to count completed lessons and total published lessons for the course, (4) calculate `progress = totalCount === 0 ? 0 : Math.round((completed / total) * 100)`, (5) update `Enrollment` with new `progress` value — if `progress === 100` also set `status: COMPLETED`, `completedAt: new Date()`, (6) return `{ lessonProgress, enrollmentProgress: { progress, status, completedLessons, totalLessons } }`
- [ ] T029 [US5] Add certificate queue trigger in `apps/api/src/modules/courses/courses.service.ts`: when `progress === 100` after enrollment update, call `this.certificateQueue.add('generate', { userId, courseId })` — inject `@InjectQueue('certificates') private certificateQueue: Queue` in constructor; add `BullModule.registerQueue({ name: 'certificates' })` to courses module imports if not already present
- [ ] T030 [US5] Add `heartbeat(userId: string, courseId: string, lessonId: string, seconds: number): Promise<{ timeSpent: number }>` method to `apps/api/src/modules/courses/courses.service.ts` — body: upsert `LessonProgress` with `timeSpent: { increment: seconds }` and `status: IN_PROGRESS` if not yet completed; return updated `timeSpent`
- [ ] T031 [US5] Add `POST /:courseId/lessons/:lessonId/heartbeat` route to `apps/api/src/modules/courses/courses.controller.ts` — accepts `{ seconds: number }` body (validated: `@IsInt() @Min(1) @Max(60)`), calls `this.coursesService.heartbeat(user.id, courseId, lessonId, body.seconds)`, add Swagger `@ApiOperation` and `@ApiResponse(200)` per `specs/master/contracts/courses.md`
- [ ] T032 [P] [US5] Update `GET /courses/:id/enrollment` response in `apps/api/src/modules/courses/courses.service.ts` to include `completedLessons` and `totalLessons` counts alongside `progress` and `status` per `specs/master/contracts/courses.md`

**Checkpoint**: All 4 progress increments verified; course completes at 100%; heartbeat increments `timeSpent`

---

## Phase 8: User Story 6 — Transactional Emails Are Delivered (Priority: P2)

**Goal**: Welcome, password reset, and enrollment confirmation emails are sent via
Bull queue with 3-attempt exponential backoff. Email delivery does not block HTTP responses.

**Independent Test**: Register → email job appears in Bull queue → email received
in inbox within 60 seconds.

### Implementation for User Story 6

- [ ] T033 [US6] Create `apps/api/src/modules/notifications/email.types.ts` — export `EmailTemplate` union type (`'welcome' | 'password-reset' | 'enrollment-confirmation' | 'session-booking'`), `EmailJob` interface (`{ to: string; template: EmailTemplate; context: Record<string, string> }`), and `EMAIL_SUBJECTS` const map (`{ welcome: 'Welcome to CareerHub', 'password-reset': 'Reset your password', ... }`)
- [ ] T034 [US6] Update `apps/api/src/modules/notifications/notifications.module.ts`: import `BullModule.registerQueue({ name: 'email', defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: 100, removeOnFail: 500 } })` — add `EmailProcessor` to the `providers` array
- [ ] T035 [US6] Create `apps/api/src/modules/notifications/email.processor.ts` — decorate with `@Processor('email')`, inject `ConfigService`, add `@Process()` method `processEmail(job: Job<EmailJob>)` that calls `sgMail.send({ to: job.data.to, from: process.env.SENDGRID_FROM_EMAIL, subject: EMAIL_SUBJECTS[job.data.template], html: renderTemplate(job.data.template, job.data.context) })` — wrap in try/catch that logs error with `this.logger.error('Email delivery failed', { template, to: job.data.to, attempt: job.attemptsMade, error: e.message })` before re-throwing so Bull retries
- [ ] T036 [US6] Add `renderTemplate(template: EmailTemplate, context: Record<string, string>): string` helper in `apps/api/src/modules/notifications/email.processor.ts` — reads the existing HTML template files from `apps/api/src/modules/notifications/templates/` using `fs.readFileSync`, replaces `{{VARIABLE}}` placeholders with `context` values, returns the final HTML string
- [ ] T037 [US6] Refactor `apps/api/src/modules/notifications/notifications.service.ts`: inject `@InjectQueue('email') private readonly emailQueue: Queue`, add `async queueEmail(job: EmailJob): Promise<void>` that calls `this.emailQueue.add(job)` — replace any existing inline `sgMail.send()` calls with `this.queueEmail(...)`
- [ ] T038 [US6] Call `await this.notificationsService.queueEmail({ to: user.email, template: 'welcome', context: { firstName: profile.firstName } })` in `apps/api/src/modules/auth/auth.service.ts` immediately after successful `prisma.user.create()` in `register()` — inject `NotificationsService` if not already injected
- [ ] T039 [US6] Call `await this.notificationsService.queueEmail({ to: user.email, template: 'password-reset', context: { resetLink: `${frontendUrl}/reset-password?token=${rawToken}`, firstName: profile.firstName, expiresIn: '1 hour' } })` in `apps/api/src/modules/auth/auth.service.ts` in `forgotPassword()` immediately after `PasswordResetToken` is created (replacing the placeholder from T012)

**Checkpoint**: Registration queues a welcome email job; forgot-password queues a reset email job; both appear in Bull queue and deliver within 60s

---

## Phase 9: User Story 7 — AI Career Assessment Generates Real Reports (Priority: P2)

**Goal**: Completing the 15-question assessment calls Claude and returns a structured
report with `recommendedPaths`, `strengths`, `gaps`, and `nextSteps`. Claude failures
return a graceful degraded response, not a 500 error.

**Independent Test**: Submit 15 answers to `POST /career/assessment/session/:id/complete`
→ response must include `data.report` with non-empty `recommendedPaths` array derived
from actual Claude output.

### Implementation for User Story 7

- [ ] T040 [US7] Update `apps/api/src/modules/ai/prompts/career-analysis.prompt.ts`: ensure the prompt function ends with an explicit instruction: `"Respond ONLY with valid JSON matching exactly this TypeScript interface: { recommendedPaths: Array<{ slug: string; score: number; reason: string }>; strengths: string[]; gaps: string[]; nextSteps: string[]; generatedAt: string }"` — do not include any text outside the JSON in the response
- [ ] T041 [US7] Add `AssessmentReport` interface and `parseAssessmentReport(text: string): AssessmentReport` function in `apps/api/src/modules/career/ai-assessment.service.ts` — parser: (1) try `JSON.parse(text)` directly, (2) on failure extract JSON from the text using a regex `/{[\s\S]*}/`, (3) validate required fields exist (`recommendedPaths`, `strengths`, `gaps`, `nextSteps`) — throw `Error('Invalid report format')` if any are missing
- [ ] T042 [US7] Implement `completeSession(sessionId: string, userId: string)` in `apps/api/src/modules/career/ai-assessment.service.ts`: (1) fetch session with answers (`prisma.assessmentSession.findUniqueOrThrow`), (2) fetch active career paths, (3) call `buildCareerAnalysisPrompt({ answers: session.answers, careerPaths })`, (4) call `this.anthropic.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 2048, timeout: 25000, messages: [{ role: 'user', content: prompt }] })`, (5) parse response with `parseAssessmentReport()`, (6) add `generatedAt: new Date().toISOString()` to report, (7) update session: `status: COMPLETED`, `report`, `completedAt`, (8) return `{ report, status: 'COMPLETED' }`
- [ ] T043 [US7] Add Claude API error handling in `apps/api/src/modules/career/ai-assessment.service.ts` `completeSession()`: catch block must (1) log `this.logger.error('Claude API call failed', { sessionId, operation: 'completeSession', error: e.message })`, (2) update session `status: 'FAILED'` in DB, (3) return `{ status: 'processing', message: 'Assessment analysis is temporarily unavailable. Please try again in a moment.', retryAfter: 60 }` — do NOT throw an `InternalServerErrorException`
- [ ] T044 [P] [US7] Verify `AssessmentSession` model in `apps/api/prisma/schema.prisma` has `status String @default("IN_PROGRESS")` field — if missing, add it; if present as plain string and `FAILED` is needed as a valid value, add an `AssessmentSessionStatus` enum and run `npx prisma migrate dev --name add_assessment_session_status`
- [ ] T045 [P] [US7] Add `@ApiOperation`, `@ApiResponse(200)`, and `@ApiResponse(503)` Swagger decorators to the `POST /career/assessment/session/:sessionId/complete` route handler in `apps/api/src/modules/career/career.controller.ts` — document the `report` object shape and the graceful degraded response

**Checkpoint**: Submitting 15 answers returns a Claude-generated `report` with real content; killing ANTHROPIC_API_KEY returns graceful error message, not 500

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, documentation, and type safety confirmation across
all three apps.

- [ ] T046 [P] Update `apps/api/.env.example` with all required environment variables from `SYSTEM_SPECIFICATION.md` Appendix B — every variable added in T004 Joi schema MUST have a placeholder entry with a descriptive comment
- [ ] T047 [P] Run `cd apps/api && npx tsc --noEmit` — fix any TypeScript errors introduced by new types, interfaces, or model changes before merging
- [ ] T048 [P] Run `cd apps/web && npx tsc --noEmit` — fix any TypeScript errors caused by the API_BASE_URL constant change or updated API response shapes
- [ ] T049 [P] Run `cd apps/learn && npx tsc --noEmit` — same as T048 for the learn app
- [ ] T050 [P] Run `cd apps/api && npm run lint` and `cd apps/web && npm run lint` and `cd apps/learn && npm run lint` — fix all ESLint errors (not warnings)
- [ ] T051 Run `specs/master/quickstart.md` verification scenarios end-to-end against the local running stack — all 7 stories must pass before marking complete
- [ ] T052 [P] Verify no `console.log` remains anywhere in `apps/api/src/modules/auth/`: `grep -r "console.log" apps/api/src/modules/auth/` must return empty output

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1–US3 (Phases 3–5)**: All depend on Foundational phase — can run in parallel
- **US4–US7 (Phases 6–9)**: All depend on Foundational phase — can run in parallel
  - US6 (email) depends on US1 (T038/T039 call `queueEmail` which was set up in US6's T035-T037) — implement US6 queue infrastructure before wiring calls in US1/US4
  - US4 (payment enrollment) calls `notificationsService.notify()` — ensure `NotificationsService` is available first
- **Polish (Phase N)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (Password Reset) P1**: No dependencies on other stories — start after Foundational
- **US2 (Log Hygiene) P1**: No dependencies — can start in parallel with US1
- **US3 (Upload Guard) P1**: No dependencies — single file change, can be done immediately
- **US4 (Payment Enrollment) P1**: Depends on `NotificationsService.notify()` being available (already exists); T038/T039 for email wiring depends on US6 queue being set up
- **US5 (Progress Tracking) P2**: Depends on US4 (enrollment must exist before progress can be tracked); indices migration can run independently
- **US6 (Email Delivery) P2**: No dependencies on other stories — queue infrastructure is self-contained; `queueEmail()` callers in US1 and US4 depend on this being done first
- **US7 (AI Assessment) P2**: No dependencies on other stories — Claude integration is self-contained

### Within Each User Story

- Schema changes → migration → DTO changes → service changes → controller changes → Swagger
- T007 → T009 (schema) must precede T012/T013 (service logic that uses the new model)
- T020 (payment metadata) must precede T022 (webhook can read metadata)
- T026/T027 (indices migration) should precede T028 (progress recalculation benefits from indices)
- T033/T034/T035/T036/T037 (queue infrastructure) must precede T038/T039 (callers)
- T040/T041 (prompt + parser) must precede T042/T043 (service uses them)

### Parallel Opportunities

```
Phase 1 in parallel: T001, T002, T003
Phase 2 sequential: T004 → T005+T006 (T005 and T006 in parallel)

After Foundational:
  Stream A (US1): T007 → T008 → T009 → T010+T011 (parallel) → T012 → T013 → T014
  Stream B (US2): T015 → T016+T017 (parallel)
  Stream C (US3): T018 → T019
  Stream D (US6 infra): T033 → T034 → T035 → T036 → T037 (then unblocks US1 T038/T039 and US4 T038)
  Stream E (US5 indices): T026 → T027 (independent of all logic tasks)

After US6 infrastructure complete:
  US4: T020 → T021 → T022 → T023 → T024 → T025
  Complete US1 wiring: T038 (T038 depends on US6 T037 and US1 T012)

After US4 enrollment works:
  US5 logic: T028 → T029 → T030 → T031+T032 (parallel)

US7 independent: T040+T041+T044 (parallel) → T042 → T043 → T045

Polish (all parallel): T046, T047, T048, T049, T050, T052
Then T051 (end-to-end run)
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 — Security Critical)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (T004–T006)
3. Complete Phase 3: US1 (T007–T014) — password reset hardening
4. Complete Phase 4: US2 (T015–T017) — log hygiene
5. Complete Phase 5: US3 (T018–T019) — upload guard
6. **STOP and VALIDATE**: All security stories independently verified
7. These three stories can be merged and deployed as a security patch

### Full Phase 0+1 Delivery

1. Security MVP above
2. US6 email queue infrastructure (T033–T037) — needed by US1 and US4
3. Wire email calls in US1 (T038–T039)
4. US4 payment enrollment (T020–T025)
5. US5 progress tracking (T026–T032)
6. US7 AI assessment (T040–T045)
7. Polish (T046–T052)

### Parallel Team Strategy

With two developers:
- **Dev A**: US1 + US2 + US3 (security stories — self-contained)
- **Dev B**: US6 email infrastructure → then US4 payment enrollment
- After both complete: Dev A takes US5, Dev B takes US7
- Both run Polish phase

---

## Notes

- `[P]` tasks touch different files and have no blocking dependencies within their phase
- `[Story]` label maps each task to its user story for independent traceability
- Run `npx prisma generate` after every schema change and before running the app
- Do not skip the Foundational phase (T004) — missing env vars cause cryptic startup errors
- US1 T013 requires the `email` field on `ResetPasswordDto` to look up the user; update the contract in `specs/master/contracts/auth.md` if this was not documented there
- US6 T036 reads HTML template files at runtime — ensure `apps/api/src/modules/notifications/templates/` contains `welcome.html` and `password-reset.html` (they already exist per system analysis)
- US7 `parseAssessmentReport` must handle both clean JSON output and Claude responses that wrap JSON in markdown code fences (` ```json ... ``` `)
