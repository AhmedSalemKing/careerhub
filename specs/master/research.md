# Research: CareerHub Production Readiness — Phase 0 + Phase 1

**Branch**: `master`
**Phase**: 0 (research complete)
**Date**: 2026-04-03

---

## Decision 1: Password Reset Token Storage Strategy

**Decision**: Dedicated `PasswordResetToken` Prisma model with bcrypt-hashed token.

**Rationale**:
- The current `Session` table conflates refresh tokens and reset tokens via a
  `reset:` string prefix. This bypasses any type-safety, makes indexing impossible,
  and leaks reset tokens to any query that scans sessions.
- bcrypt hashing of the reset token means a DB read alone cannot be used to
  reset passwords — the attacker needs the raw token from the email.
- Separate table allows independent expiry enforcement, used-flag, and IP tracking
  without polluting the session management logic.

**Alternatives considered**:
- Redis TTL store (rejected: tokens must survive a Redis restart; email delivery
  can take minutes, so the token window must outlive Redis volatility)
- Keep in Session table with a discriminator enum (rejected: still conflates two
  concerns; Prisma relations remain confusing)
- Signed JWT as reset token (rejected: if JWT_SECRET is rotated, all pending
  resets break; tokens cannot be individually revoked before expiry)

**Implementation**:
```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  ipAddress String?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```
Raw token generation: `crypto.randomBytes(32).toString('hex')` (256-bit entropy).
Hash for storage: `bcrypt.hash(rawToken, 10)`.
Email link: `${FRONTEND_URL}/reset-password?token=${rawToken}`.
Verify: fetch by `userId`, call `bcrypt.compare(rawToken, record.tokenHash)`.

---

## Decision 2: Email Delivery Architecture

**Decision**: Bull queue (`email-queue`) with `@nestjs/bull` processor in `NotificationsModule`.
SendGrid via `@sendgrid/mail` for transactional sends.

**Rationale**:
- Bull is already installed and Redis is available. Moving email sends off the HTTP
  request cycle means registration/password-reset endpoints remain fast even if
  SendGrid is slow.
- Retry with exponential backoff (3 attempts, 1s/2s/4s) handles transient SendGrid
  errors without manual intervention.
- Bull's built-in failed-job tracking enables replay and alerting.

**Alternatives considered**:
- Inline `sendEmail()` in service (rejected: slow endpoint, no retry, blocks
  request if SendGrid is down)
- AWS SES instead of SendGrid (rejected: SendGrid SDK already installed and
  HTML templates are compatible)

**Queue job shape**:
```typescript
interface EmailJob {
  to: string;
  template: 'welcome' | 'password-reset' | 'enrollment-confirmation' | 'session-booking';
  context: Record<string, string>; // template variables
}
```

**Bull queue config**:
```typescript
BullModule.registerQueue({
  name: 'email',
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})
```

---

## Decision 3: Payment → Enrollment Trigger Strategy

**Decision**: Dual-path: (a) inline after `confirmPayment()` + (b) Stripe webhook
`payment_intent.succeeded` as idempotent safety net.

**Rationale**:
- The inline path covers the happy path with zero latency.
- The webhook covers network failures between confirm and enrollment creation.
- Using `prisma.enrollment.upsert()` on `(userId, courseId)` unique constraint
  ensures neither path creates duplicates.

**Alternatives considered**:
- Webhook-only (rejected: adds latency; user might not see course access immediately
  after payment confirmation in the UI)
- Queue-based enrollment (rejected: unnecessary async for a simple DB write; adds
  latency and complexity)

**Enrollment creation logic** (both paths call the same private method):
```typescript
private async createEnrollmentAfterPayment(
  userId: string,
  courseId: string,
  paymentId: string,
): Promise<void> {
  await this.prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: {
      userId, courseId,
      status: EnrollmentStatus.ACTIVE,
      progress: 0,
    },
    update: {
      status: EnrollmentStatus.ACTIVE,
    },
  });
  await this.notificationsService.notify(userId, NotificationType.PAYMENT_CONFIRMED, {
    courseId, paymentId,
  });
}
```

---

## Decision 4: Lesson Progress Calculation

**Decision**: Recalculate progress in-request after each `markLessonComplete` using
a single aggregation query. Cache the result in Redis for 60s.

**Rationale**:
- Progress is displayed on the course card and the dashboard; it must be accurate.
- A simple `COUNT` of completed `LessonProgress` rows vs total published `Lesson`
  rows is fast with proper indices.
- 60s Redis cache prevents the aggregation running on every page refresh during
  an active study session.

**Query pattern**:
```typescript
const [completedCount, totalCount] = await Promise.all([
  this.prisma.lessonProgress.count({
    where: { userId, lesson: { courseId }, status: LessonStatus.COMPLETED },
  }),
  this.prisma.lesson.count({
    where: { courseId: enrollment.courseId, isPublished: true },
  }),
]);
const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
```

**Indices added** (migration):
```sql
CREATE INDEX ON "LessonProgress"("userId", "lessonId", "status");
CREATE INDEX ON "Lesson"("courseId", "isPublished");
```

---

## Decision 5: AI Assessment Report Generation

**Decision**: Synchronous Claude call inside the `completeSession` service method
with a 25-second timeout and graceful fallback.

**Rationale**:
- Assessment reports are generated once per session; the user is waiting for the
  result and expects it immediately.
- 25s timeout matches the UX expectation (loading spinner with message "Analyzing
  your responses...").
- Fallback: if Claude fails, return `{ status: 'processing', message: 'Your report
  is being generated. Check back in a moment.' }` and queue a retry job.

**Prompt structure** (using existing `career-analysis.prompt.ts`):
```typescript
const prompt = buildCareerAnalysisPrompt({
  answers: session.answers,    // Array of {questionId, answer}
  careerPaths: activeCareerPaths, // Available paths to recommend
});

const response = await this.anthropic.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 2048,
  timeout: 25000,
  messages: [{ role: 'user', content: prompt }],
});
```

**Report schema** (stored in `AssessmentSession.report`):
```typescript
interface AssessmentReport {
  recommendedPaths: Array<{ slug: string; score: number; reason: string }>;
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
  generatedAt: string; // ISO timestamp
}
```

---

## Decision 6: Environment Variable Validation

**Decision**: Joi schema in `ConfigModule.forRoot()` using `validationSchema`.

**Rationale**:
- `@nestjs/config` already supports Joi schemas via `validationSchema` option.
  No new dependency needed.
- Fail-fast at boot is the correct behavior for missing credentials.

**Required variables to validate**:
```typescript
Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES: Joi.string().default('7d'),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  SENDGRID_API_KEY: Joi.string().required(),
  ANTHROPIC_API_KEY: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().required(),
  LEARN_URL: Joi.string().uri().required(),
})
```

---

## Decision 7: Structured Logging Replacement

**Decision**: Replace all `console.log` with NestJS `Logger` instance at class level.
Sanitize log context to exclude password, token, and secret fields.

**Pattern**:
```typescript
// In each service/controller class:
private readonly logger = new Logger(AuthController.name);

// On events:
this.logger.log('User login attempt', { userId: user.id, accountType: user.accountType });
// NOT: this.logger.log('User login', { email, password, token })

// On errors:
this.logger.error('Login failed', { operation: 'login', reason: e.message });
```

**Sanitization rule**: A utility `sanitize(obj)` strips fields matching
`/(password|token|secret|key|authorization)/i` before logging.

---

## Decision 8: Auth Guard on Upload Controller

**Decision**: Add `@UseGuards(JwtAuthGuard)` at controller class level (covers all endpoints).

**Rationale**: The simplest correct fix. The upload controller has no public endpoints.
Individual endpoints that should be public (none currently) would add `@Public()`.

**Change**: One line added to `upload.controller.ts`:
```typescript
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController { ... }
```
