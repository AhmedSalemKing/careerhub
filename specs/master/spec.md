# Feature Specification: CareerHub Production Readiness — Phase 0 + Phase 1

**Feature Branch**: `master`
**Created**: 2026-04-03
**Status**: Active
**Source**: Reverse-engineered from full system analysis — see `SYSTEM_SPECIFICATION.md`

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Secure Password Reset (Priority: P1)

A registered user who has forgotten their password triggers a reset flow,
receives a time-limited email link, and successfully sets a new password
without any security degradation.

**Why this priority**: The current implementation stores reset tokens as plain
strings in the refresh-token table. A database read by any authenticated service
exposes all reset tokens. This is a security critical defect that must be fixed
before any user-facing launch.

**Independent Test**: A user with a known email can request a reset, receive the
email, click the link within 1 hour, set a new password, and log in — all without
accessing any other feature.

**Acceptance Scenarios**:

1. **Given** a registered user, **When** `POST /auth/forgot-password` is called,
   **Then** a `PasswordResetToken` record is created with a hashed token, 1-hour
   expiry, and the plain token is emailed to the user (not stored).
2. **Given** a valid reset link, **When** `POST /auth/reset-password` is called
   with the token and new password within 1 hour, **Then** the password is updated,
   the token is marked used, all active sessions for the user are invalidated.
3. **Given** an expired or used token, **When** reset is attempted, **Then** a
   400 error with message "Reset link has expired or already been used" is returned.
4. **Given** a password reset, **When** the new password does not meet complexity
   requirements (min 8 chars, uppercase, lowercase, number, special char),
   **Then** validation rejects it with a clear message before any DB write.

---

### User Story 2 — Secure Authentication Hygiene (Priority: P1)

No sensitive data appears in application logs. All console statements that expose
credentials, tokens, or PII are removed from production code and replaced with
structured NestJS Logger calls.

**Why this priority**: Confirmed console.log statements in auth.controller.ts
emit email addresses and access tokens to stdout. Any log pipeline will index
these.

**Independent Test**: Start the API, perform a login, register, and refresh — then
inspect stdout output. No email, password, or token value appears at any log level.

**Acceptance Scenarios**:

1. **Given** a login attempt, **When** the API processes it, **Then** stdout
   contains no email address, no password, and no JWT token string.
2. **Given** a register attempt, **When** the API processes it, **Then** stdout
   contains no credential values.
3. **Given** any API error, **When** logged by NestJS Logger, **Then** the log
   entry contains service name, operation, and sanitized context — not raw
   request body.

---

### User Story 3 — Protected File Uploads (Priority: P1)

Only authenticated users can upload files. Anonymous requests to the upload
endpoint are rejected with 401.

**Why this priority**: Unauthenticated upload is an open door to S3 cost abuse
and malicious content hosting.

**Independent Test**: Send `POST /upload` without an Authorization header — it
MUST return 401. With a valid JWT — it MUST process the upload.

**Acceptance Scenarios**:

1. **Given** an unauthenticated request, **When** `POST /upload` is called,
   **Then** a 401 Unauthorized response is returned before any S3 operation.
2. **Given** an authenticated request with an invalid MIME type, **When** uploaded,
   **Then** the file is rejected with 400 before S3 transfer begins.
3. **Given** an authenticated request with a valid file, **When** uploaded,
   **Then** the file is stored in S3 and metadata saved to `UploadedFile`.

---

### User Story 4 — Course Purchase Completes Enrollment (Priority: P1)

A student who pays for a course is automatically enrolled and can immediately
access the course lessons.

**Why this priority**: This is the platform's primary revenue flow. It is
currently broken — payment succeeds but enrollment is never created.

**Independent Test**: Complete a Stripe payment for a course in test mode.
Immediately after confirmation, call `GET /courses/:id/enrollment` — it MUST
return `status: ACTIVE`.

**Acceptance Scenarios**:

1. **Given** a student with a valid Stripe test payment, **When** payment is
   confirmed via `POST /payments/confirm-payment`, **Then** an `Enrollment` record
   is created with `status: ACTIVE` for that student + course combination.
2. **Given** a Stripe `payment_intent.succeeded` webhook event, **When** received
   and signature-verified, **Then** enrollment is created if not already present
   (idempotent safety net).
3. **Given** a payment confirmation, **When** enrollment creation fails (DB error),
   **Then** the payment record remains and a retry job is queued — the student is
   NOT left in a "paid but not enrolled" limbo silently.
4. **Given** a completed enrollment, **When** the student visits the course page,
   **Then** the course is accessible and `GET /courses/enrolled` includes it.

---

### User Story 5 — Lesson Progress Is Tracked (Priority: P2)

A student watching a lesson sees their progress advance in real time. The course
card shows an accurate completion percentage that reflects actual lesson completions.

**Why this priority**: Progress tracking is the core engagement loop. Currently
`updateProgress` always writes `0%`, making the platform appear broken to learners.

**Independent Test**: Mark all lessons in a 4-lesson course as complete, one by one.
After each, `GET /courses/:id/enrollment` MUST show an updated `progress` value
(25%, 50%, 75%, 100%). On 100%, course status MUST transition to `COMPLETED`.

**Acceptance Scenarios**:

1. **Given** a student enrolled in a course, **When** `POST /courses/:courseId/lessons/:lessonId/complete`
   is called, **Then** a `LessonProgress` record is upserted with `status: COMPLETED`
   and `completedAt` set.
2. **Given** a lesson completed, **When** progress is recalculated, **Then**
   `Enrollment.progress` = (completed lessons / total published lessons) × 100,
   rounded to the nearest integer.
3. **Given** all lessons completed, **When** the final lesson is marked complete,
   **Then** `Enrollment.status` transitions to `COMPLETED` and a certificate
   generation job is queued.
4. **Given** a lesson with video, **When** the student sends a heartbeat at 30s
   intervals, **Then** `LessonProgress.timeSpent` is incremented correctly.

---

### User Story 6 — Transactional Emails Are Delivered (Priority: P2)

The platform sends emails for: welcome on registration, password reset link,
enrollment confirmation, and session booking confirmation. All emails use the
HTML templates already in the codebase.

**Why this priority**: Without email delivery, password reset is non-functional
for any user who forgets their password, and trust in the platform is undermined.

**Independent Test**: Register a new account → receive welcome email within 60
seconds. Request password reset → receive reset email with working link within
60 seconds.

**Acceptance Scenarios**:

1. **Given** a new student registration, **When** the account is created,
   **Then** a welcome email is sent to the registered address within 60 seconds.
2. **Given** a forgot-password request, **When** processed, **Then** a reset
   email is sent containing the reset link (not the raw token) within 60 seconds.
3. **Given** a course enrollment, **When** payment is confirmed, **Then** an
   enrollment confirmation email is sent.
4. **Given** an email send failure (SendGrid API error), **When** it occurs,
   **Then** the job is retried up to 3 times with exponential backoff; failure
   is logged with full context.

---

### User Story 7 — AI Career Assessment Generates Real Reports (Priority: P2)

A student completes the 15-question career assessment and receives an
AI-generated report with career path recommendations, strengths, and next steps.

**Why this priority**: AI-powered career guidance is the platform's primary
differentiator. Currently the assessment framework exists but the Claude SDK
call may not execute.

**Independent Test**: Start an assessment session, submit 15 answers, call
the complete endpoint — the response MUST include a non-empty `report` object
with `recommendedPaths`, `strengths`, `gaps`, and `nextSteps` fields derived
from actual Claude output.

**Acceptance Scenarios**:

1. **Given** 15 completed assessment answers, **When** `POST /career/assessment/session/:id/complete`
   is called, **Then** the Anthropic Claude API is invoked with a structured
   prompt containing the answers.
2. **Given** a successful Claude response, **When** parsed, **Then** the report
   is persisted in `AssessmentSession.report` and returned in the response.
3. **Given** a Claude API failure, **When** it occurs, **Then** the session is
   marked with `status: FAILED`, the error is logged, and the user receives a
   user-friendly "assessment temporarily unavailable" message (not a 500 error).
4. **Given** a completed assessment, **When** the user revisits their dashboard,
   **Then** the cached report is returned without re-calling Claude.

---

### Edge Cases

- What happens when a Stripe webhook is received twice for the same payment?
  → Enrollment creation MUST be idempotent (upsert on userId+courseId unique constraint).
- What happens when the reset token email fails to send?
  → The `PasswordResetToken` record is created, the error is logged, and a retry
  is queued — the token is not invalidated pre-emptively.
- What happens when a student marks a free lesson complete without enrollment?
  → Free lesson completion MUST still require enrollment (free lessons are preview-only
  unless enrolled).
- What happens if all lessons are deleted from a course after enrollment?
  → Progress calculation MUST handle zero total lessons gracefully (return 0%).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store password reset tokens as hashed values in a
  dedicated `PasswordResetToken` table, not in the `Session` table.
- **FR-002**: System MUST expire password reset tokens after 1 hour and mark
  them as used after a single successful reset.
- **FR-003**: System MUST add `@UseGuards(JwtAuthGuard)` to the upload controller
  so only authenticated users can upload files.
- **FR-004**: System MUST remove all `console.log` from the auth module and replace
  with NestJS `Logger` calls that exclude sensitive field values.
- **FR-005**: System MUST create an `Enrollment` record after `confirmPayment()`
  succeeds, using an upsert to ensure idempotency.
- **FR-006**: System MUST handle Stripe `payment_intent.succeeded` webhook events
  by triggering enrollment creation as a safety net.
- **FR-007**: System MUST recalculate `Enrollment.progress` after each
  `markLessonComplete` call based on actual `LessonProgress` records.
- **FR-008**: System MUST transition `Enrollment.status` to `COMPLETED` when
  all published lessons are marked complete, and queue a certificate generation job.
- **FR-009**: System MUST send a welcome email via Bull queue on user registration.
- **FR-010**: System MUST send a password reset email via Bull queue on
  forgot-password request.
- **FR-011**: System MUST call the Anthropic Claude API with user assessment
  answers on `POST /career/assessment/session/:id/complete`.
- **FR-012**: System MUST persist the Claude-generated report in
  `AssessmentSession.report` and return it to the client.
- **FR-013**: System MUST enforce password complexity on register and reset:
  minimum 8 characters, at least one uppercase, one lowercase, one digit, one
  special character.
- **FR-014**: System MUST validate all required environment variables at boot
  with fail-fast behavior if any are missing.

### Key Entities *(include if feature involves data)*

- **PasswordResetToken**: `id`, `userId`, `tokenHash` (bcrypt), `expiresAt`,
  `usedAt` (nullable), `ipAddress`, `createdAt`
- **LessonProgress**: extended with `timeSpent` (seconds, updated via heartbeat)
- **AssessmentSession**: `report` (Json) field confirmed to store Claude output
- **Enrollment**: `progress` (Int) correctly reflects lesson completion ratio;
  `status` auto-transitions to COMPLETED

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero plaintext tokens or email addresses appear in API stdout logs
  after any auth operation.
- **SC-002**: 100% of course purchases result in an enrollment record being
  created within 5 seconds of payment confirmation.
- **SC-003**: Course progress displayed to students is accurate within ±1% of
  actual lesson completion ratio at all times.
- **SC-004**: Password reset emails are delivered within 60 seconds of the
  forgot-password request in 99% of cases.
- **SC-005**: AI assessment reports are generated and returned within 30 seconds
  of submitting 15 answers in 95% of cases.
- **SC-006**: Anonymous upload attempts are rejected 100% of the time with no
  S3 API calls made.
- **SC-007**: The platform survives a Claude API outage without producing 500
  errors — users receive a graceful degraded message.

---

## Assumptions

- SendGrid API key is configured and the account is out of sandbox mode (can send
  to any address, not just verified senders).
- Stripe test mode is used during development and staging; production keys are
  used only after full end-to-end testing.
- The Anthropic API key is available in the environment and has sufficient quota
  for `claude-sonnet-4-5` calls.
- Existing `Session` table refresh token rows are NOT migrated to the new
  `PasswordResetToken` table — the two concerns are simply separated going forward.
- Bull queues are backed by the same Redis instance already in use for caching.
- The email HTML templates in `src/modules/notifications/templates/` are already
  correct in design and only need to be wired to the Bull job processor.
