# Implementation Plan: CareerHub Production Readiness — Phase 0 + Phase 1

**Branch**: `master` | **Date**: 2026-04-03 | **Spec**: `specs/master/spec.md`
**Input**: Feature specification from `specs/master/spec.md`

---

## Summary

Harden the CareerHub platform for production deployment by fixing 7 confirmed
production-blocking issues discovered during full system reverse-engineering.

**Phase 0** (Security): Remove auth credential leaks from logs, fix insecure
password reset token storage, add authentication guard to the upload endpoint,
enforce password complexity, and add fail-fast environment variable validation.

**Phase 1** (Core Flows): Fix the payment → enrollment broken link (users pay but
never get course access), implement real lesson progress tracking, wire email
delivery via Bull queues, and confirm the AI assessment Claude API calls execute.

All changes follow the existing NestJS module architecture. No new frameworks or
major dependencies are introduced. Bull and Redis are already installed.

---

## Technical Context

**Language/Version**: TypeScript 5.x — strict mode required
**Primary Dependencies**: NestJS 10/11, Prisma 5, `@nestjs/bull`, `@sendgrid/mail`,
`@anthropic-ai/sdk`, `stripe`
**Storage**: PostgreSQL (Prisma ORM) + Redis (Bull queues + cache)
**Testing**: Jest (unit), Supertest (integration) — existing test setup
**Target Platform**: Node.js 18 LTS, Linux server
**Project Type**: REST API (NestJS) + Next.js 14 frontends
**Performance Goals**: Password reset flow < 200ms p95 (excluding email delivery);
lesson complete endpoint < 300ms p95 (including progress recalculation)
**Constraints**: No breaking API changes to existing working endpoints unless
explicitly documented in contracts/; no new major npm packages without justification
**Scale/Scope**: Platform with < 10 000 users (Phase 0/1 does not require horizontal scaling)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-implementation Gates

| Principle | Gate | Status |
|-----------|------|--------|
| **I. Clean Architecture** | Each fix is isolated to its owning module. No cross-module file imports introduced. | ✅ Pass — auth fix in AuthModule, payment fix in PaymentsModule, upload fix in UploadModule |
| **II. Secure Backend** | All routes private by default; upload endpoint gets `@UseGuards(JwtAuthGuard)`. Password reset uses hashed token in dedicated table. Console.log with credentials removed. | ✅ Pass — all three violations addressed in Phase 0 |
| **III. Performance-First Mindset** | Progress recalculation uses COUNT aggregation with proper indices, not a loop. Email delivery moves to Bull queue (non-blocking). | ✅ Pass — research.md Decision 4 covers indices and query pattern |
| **IV. Maintainable and Readable Code** | New `PasswordResetToken` table resolves Session-table dual-purpose ambiguity. Logger calls replace console.log. | ✅ Pass |
| **V. Production-Ready Standards** | Joi env validation added to ConfigModule. `.env.example` updated with all required vars. Stripe webhook validates signature. | ✅ Pass |
| **VI. Error Handling and Logging** | All external service calls (Stripe, Anthropic, SendGrid) wrapped in try/catch with NestJS Logger. Silent failures resolved. | ✅ Pass — each service method has explicit error handling per research.md |

### Complexity Tracking

> No constitution violations requiring justification in this plan.

---

## Project Structure

### Documentation (this feature)

```text
specs/master/
├── plan.md          ← this file
├── spec.md          ← user stories and requirements
├── research.md      ← technical decisions (Phase 0 complete)
├── data-model.md    ← schema changes
├── quickstart.md    ← verification steps
├── contracts/
│   ├── auth.md      ← password reset + register changes
│   ├── payments.md  ← confirm-payment + webhook changes
│   └── courses.md   ← lesson complete + heartbeat changes
└── tasks.md         ← created by /speckit.tasks (not yet)
```

### Source Code (affected paths)

```text
apps/api/
├── prisma/
│   ├── schema.prisma                             ← PasswordResetToken model + indices
│   └── migrations/
│       ├── 20260403000001_add_password_reset_token/
│       ├── 20260403000002_add_performance_indices/
│       └── 20260403000003_assessment_session_status/
├── src/
│   ├── app.module.ts                             ← Joi validation schema added
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts                ← console.log removed
│   │   │   ├── auth.service.ts                   ← forgotPassword + resetPassword rewritten
│   │   │   └── dto/
│   │   │       ├── register.dto.ts               ← password @Matches added
│   │   │       └── reset-password.dto.ts         ← token + newPassword fields
│   │   ├── upload/
│   │   │   └── upload.controller.ts              ← @UseGuards(JwtAuthGuard) added
│   │   ├── payments/
│   │   │   └── payments.service.ts               ← confirmPayment creates enrollment
│   │   ├── courses/
│   │   │   └── courses.service.ts                ← markLessonComplete recalculates progress
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts           ← BullModule.registerQueue('email') added
│   │   │   ├── notifications.service.ts          ← queueEmail() replaces inline sendEmail()
│   │   │   └── email.processor.ts                ← NEW: Bull job processor
│   │   └── career/
│   │       └── ai-assessment.service.ts          ← completeSession calls anthropic.messages.create()

apps/web/
├── src/
│   └── lib/
│       └── constants.ts                          ← API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

apps/learn/
└── src/
    └── lib/
        └── constants.ts                          ← API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
```

**Structure Decision**: Web application (Option 2 from template). Three apps: backend
(`apps/api`), main frontend (`apps/web`), learner portal (`apps/learn`). Changes
concentrated in `apps/api` with minor constant fixes in both frontends.

---

## Phase 0: Research (Complete)

All technical decisions resolved in `specs/master/research.md`. No NEEDS CLARIFICATION
items remain.

**Summary of decisions**:
1. Password reset → dedicated `PasswordResetToken` table with bcrypt-hashed token
2. Email delivery → Bull queue `email` with retry (3 attempts, exponential backoff)
3. Payment enrollment → inline upsert + Stripe webhook safety net (both idempotent)
4. Lesson progress → COUNT aggregation with new composite indices, 60s Redis cache
5. AI assessment → synchronous Claude call with 25s timeout + FAILED status fallback
6. Env validation → Joi schema in `ConfigModule.forRoot()`
7. Logging → NestJS `Logger`, sanitize() strips credential fields
8. Upload auth → `@UseGuards(JwtAuthGuard)` at controller class level

---

## Phase 1: Design & Contracts (Complete)

All design artifacts generated:

- **Data model**: `specs/master/data-model.md` — new `PasswordResetToken`, indices,
  state transitions, DTO validation rules
- **Contracts**: `specs/master/contracts/` — auth, payments, courses endpoint changes
- **Quickstart**: `specs/master/quickstart.md` — step-by-step verification for each story

### Re-evaluation: Constitution Check Post-Design

| Check | Result |
|-------|--------|
| Controllers remain logic-free? | ✅ All new logic in service layer |
| No new cross-module file imports? | ✅ NotificationsService injected via module exports; EnrollmentService injected into PaymentsModule |
| Prisma calls only in services? | ✅ No controller-level queries introduced |
| All external calls have try/catch? | ✅ Research.md Decision 5 (Claude timeout), Decision 2 (Bull retry covers email) |
| Swagger decorators with implementation? | ✅ Required in each contract change |
| Indices defined for new query patterns? | ✅ data-model.md covers 5 new indices |
| `.env.example` updated? | ✅ Included in Story acceptance criteria |
| No `console.log` introduced? | ✅ Logger pattern specified in research.md Decision 7 |

---

## Implementation Guidance by Story

### Story 1: Secure Password Reset

**Files to change**:
1. `apps/api/prisma/schema.prisma` — add `PasswordResetToken` model + relation on `User`
2. Run: `npx prisma migrate dev --name add_password_reset_token`
3. `apps/api/src/modules/auth/auth.service.ts`:
   - `forgotPassword()`: generate `crypto.randomBytes(32).toString('hex')`, bcrypt hash it,
     store in `PasswordResetToken`, queue email job with raw token
   - `resetPassword()`: query `PasswordResetToken` where `userId` + `expiresAt > now()` +
     `usedAt IS NULL`; loop and `bcrypt.compare()`; on match: update password, set `usedAt`,
     delete all Sessions for user
4. `apps/api/src/modules/auth/dto/reset-password.dto.ts` — `token: string` + `newPassword` with `@Matches`
5. `apps/api/src/modules/auth/dto/register.dto.ts` — add `@Matches` to `password`

**Key invariant**: The raw token NEVER persists to DB. Only the hash does.

---

### Story 2: Auth Log Hygiene

**Files to change**:
1. `apps/api/src/modules/auth/auth.controller.ts` — remove all `console.log`; replace
   any genuine debug info with `this.logger.debug(...)` using sanitized context
2. Add `private readonly logger = new Logger(AuthController.name);` to class

**Sanitize helper** (add to `src/common/utils/sanitize.util.ts`):
```typescript
const SENSITIVE_KEYS = /^(password|token|secret|key|authorization|credential)$/i;

export function sanitize<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !SENSITIVE_KEYS.test(key))
  ) as Partial<T>;
}
```

---

### Story 3: Upload Auth Guard

**Files to change**:
1. `apps/api/src/modules/upload/upload.controller.ts` — add `@UseGuards(JwtAuthGuard)` decorator

One line. Verify no existing tests rely on anonymous upload access.

---

### Story 4: Payment → Enrollment

**Files to change**:
1. `apps/api/src/modules/payments/payments.service.ts`:
   - Inject `PrismaService` (already available)
   - After `stripe.paymentIntents.confirm()` succeeds in `confirmPayment()`, call:
     ```typescript
     await this.prisma.enrollment.upsert({
       where: { userId_courseId: { userId, courseId } },
       create: { userId, courseId, status: 'ACTIVE', progress: 0 },
       update: { status: 'ACTIVE' },
     });
     ```
   - Emit `PAYMENT_CONFIRMED` notification
2. In `handleStripeWebhook()`, add case for `payment_intent.succeeded`:
   - Extract `userId` and `courseId` from `paymentIntent.metadata`
   - Call same upsert (idempotent)
   - Note: Stripe metadata must be populated in `createPaymentIntent()` at the time of intent creation

**Metadata on intent creation** (also fix `createPaymentIntent()`):
```typescript
await stripe.paymentIntents.create({
  amount: course.price * 100,
  currency: course.currency.toLowerCase(),
  metadata: { userId, courseId, type: 'COURSE' },
});
```

---

### Story 5: Lesson Progress Tracking

**Files to change**:
1. `apps/api/src/modules/courses/courses.service.ts`:
   - `markLessonComplete()`:
     ```typescript
     // 1. Upsert LessonProgress
     await this.prisma.lessonProgress.upsert({
       where: { userId_lessonId: { userId, lessonId } },
       create: { userId, lessonId, status: 'COMPLETED', completedAt: new Date() },
       update: { status: 'COMPLETED', completedAt: new Date() },
     });

     // 2. Recalculate progress
     const [completed, total] = await Promise.all([
       this.prisma.lessonProgress.count({
         where: { userId, lesson: { courseId }, status: 'COMPLETED' },
       }),
       this.prisma.lesson.count({ where: { courseId, isPublished: true } }),
     ]);
     const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

     // 3. Update enrollment
     const updatedEnrollment = await this.prisma.enrollment.update({
       where: { userId_courseId: { userId, courseId } },
       data: {
         progress,
         ...(progress === 100 ? { status: 'COMPLETED', completedAt: new Date() } : {}),
       },
     });

     // 4. Queue certificate if course completed
     if (progress === 100) {
       await this.certificateQueue.add('generate', { userId, courseId });
     }
     ```

2. **New endpoint** `POST /courses/:courseId/lessons/:lessonId/heartbeat`:
   ```typescript
   await this.prisma.lessonProgress.upsert({
     where: { userId_lessonId: { userId, lessonId } },
     create: { userId, lessonId, status: 'IN_PROGRESS', timeSpent: seconds },
     update: { timeSpent: { increment: seconds } },
   });
   ```

3. **Migration**: `npx prisma migrate dev --name add_performance_indices`

---

### Story 6: Email Delivery

**Files to change**:
1. `apps/api/src/modules/notifications/notifications.module.ts`:
   ```typescript
   BullModule.registerQueue({ name: 'email', defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } } })
   ```
2. **New file**: `apps/api/src/modules/notifications/email.processor.ts`:
   ```typescript
   @Processor('email')
   export class EmailProcessor {
     @Process()
     async processEmail(job: Job<EmailJob>) {
       const { to, template, context } = job.data;
       await sgMail.send({
         to,
         from: process.env.SENDGRID_FROM_EMAIL,
         subject: EMAIL_SUBJECTS[template],
         html: renderTemplate(template, context),
       });
     }
   }
   ```
3. `apps/api/src/modules/notifications/notifications.service.ts`:
   - Inject `@InjectQueue('email') private emailQueue: Queue`
   - Replace direct `sendEmail()` calls with `this.emailQueue.add({ to, template, context })`
4. Call `queueWelcomeEmail()` in `AuthService.register()` after user creation
5. Call `queuePasswordResetEmail()` in `AuthService.forgotPassword()` after token creation

---

### Story 7: AI Assessment

**Files to change**:
1. `apps/api/src/modules/career/ai-assessment.service.ts`:
   - `completeSession()` must call:
     ```typescript
     const prompt = buildCareerAnalysisPrompt({ answers, careerPaths });
     const response = await this.anthropic.messages.create({
       model: 'claude-sonnet-4-5',
       max_tokens: 2048,
       timeout: 25000,
       messages: [{ role: 'user', content: prompt }],
     });
     const report = parseAssessmentReport(response.content[0].text);
     await this.prisma.assessmentSession.update({
       where: { id: sessionId },
       data: { report, status: 'COMPLETED', completedAt: new Date() },
     });
     ```
   - On Claude error: set `status: 'FAILED'`, log with `this.logger.error(...)`,
     return graceful response (`{ status: 'processing', retryAfter: 60 }`)
   - Add `parseAssessmentReport(text: string): AssessmentReport` parser that extracts
     JSON from the Claude response or falls back to structured extraction

2. Ensure the `career-analysis.prompt.ts` builds a prompt that requests JSON output:
   ```
   Respond ONLY with valid JSON matching this schema:
   {"recommendedPaths":[{"slug":"...","score":90,"reason":"..."}],
    "strengths":["..."],"gaps":["..."],"nextSteps":["..."]}
   ```

---

### Env Validation (cross-cutting)

**File**: `apps/api/src/app.module.ts`

Add to `ConfigModule.forRoot()`:
```typescript
validationSchema: Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  REDIS_HOST: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  SENDGRID_API_KEY: Joi.string().required(),
  ANTHROPIC_API_KEY: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().required(),
  LEARN_URL: Joi.string().uri().required(),
}),
validationOptions: { abortEarly: false },
```

**File**: `apps/api/.env.example` — update with all keys from Appendix B of SYSTEM_SPECIFICATION.md.

---

### Frontend Constants Fix (cross-cutting)

**File**: `apps/web/src/lib/constants.ts`
```typescript
// Before:
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
// After:
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
```

Same fix in `apps/learn/src/lib/constants.ts`.

---

## Acceptance Checklist (before marking complete)

- [ ] `npx tsc --noEmit` passes in `apps/api`, `apps/web`, `apps/learn`
- [ ] `npm run lint` passes in all three apps
- [ ] All quickstart.md verification steps pass
- [ ] No `console.log` remains in `apps/api/src/modules/auth/`
- [ ] `PasswordResetToken` table exists in DB with bcrypt-hashed values
- [ ] Upload endpoint returns 401 on unauthenticated request
- [ ] Course enrollment is created after payment confirmation
- [ ] `Enrollment.progress` updates correctly after lesson completions
- [ ] Email job appears in Bull queue on registration
- [ ] AI assessment returns non-empty `report` object
- [ ] API boots without error when all required env vars are set
- [ ] API refuses to start (config error) when `JWT_SECRET` is missing
- [ ] `apps/api/.env.example` has all required variables
