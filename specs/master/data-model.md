# Data Model: CareerHub Production Readiness — Phase 0 + Phase 1

**Branch**: `master`
**Date**: 2026-04-03

---

## New Models

### PasswordResetToken

Replaces the `reset:`-prefixed Session table misuse. Stores a hashed reset token
with an expiry, used flag, and optional IP address for audit.

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  ipAddress String?
  createdAt DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```

**Lifecycle**:
1. Created by `forgotPassword()`: raw token generated with `crypto.randomBytes(32)`,
   hashed with `bcrypt.hash(raw, 10)`, stored. Raw token sent in email only.
2. Verified by `resetPassword()`: fetch all non-expired, non-used tokens for user;
   call `bcrypt.compare(incoming, stored.tokenHash)` on each.
3. On successful reset: set `usedAt = now()`. On expired: query filters
   `expiresAt > now()` so expired tokens are ignored automatically.
4. Cleanup: a scheduled job (or expiry index) can purge rows where
   `expiresAt < now() - 7 days`.

---

## Modified Models

### User

**Add relation**:
```prisma
passwordResetTokens PasswordResetToken[]
```

No field changes. The `bio`, `experience`, `speciality` duplications are tracked
in the backlog (SYSTEM_SPECIFICATION.md Q-004) but NOT changed in this phase to
avoid breaking existing queries.

---

### LessonProgress

**Add field** (already in schema, verify `timeSpent` exists):
```prisma
timeSpent Int @default(0)   // cumulative seconds of active video playback
```

The `timeSpent` field already exists in the Prisma schema as `Int @default(0)`.
The issue is that it is never written. In Phase 1, the `heartbeat` endpoint will
increment this field using `prisma.lessonProgress.update({ data: { timeSpent: { increment: seconds } } })`.

**No migration required** if field already exists. Verify with:
```bash
npx prisma db pull  # confirm timeSpent exists
```

---

### AssessmentSession

**Verify fields** (should already exist per schema):
```prisma
model AssessmentSession {
  id          String    @id @default(cuid())
  userId      String
  answers     Json[]
  report      Json?     // ← Phase 1 writes here
  status      String    @default("IN_PROGRESS")  // IN_PROGRESS | COMPLETED | FAILED
  createdAt   DateTime  @default(now())
  completedAt DateTime?
  user        User      @relation(fields: [userId], references: [id])
}
```

If `status` is not already an enum, add:
```prisma
enum AssessmentSessionStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
}
```
And update `status` field to use it.

---

## New Database Indices (Performance)

These indices fix the N+1 and full-table scan risks identified in the system analysis.

### Migration: add_performance_indices

```sql
-- LessonProgress: progress recalculation query
CREATE INDEX IF NOT EXISTS "LessonProgress_userId_lessonId_status_idx"
  ON "LessonProgress"("userId", "lessonId", "status");

-- Lesson: count published lessons per course
CREATE INDEX IF NOT EXISTS "Lesson_courseId_isPublished_idx"
  ON "Lesson"("courseId", "isPublished");

-- Course: filter by career path and status (browsing)
CREATE INDEX IF NOT EXISTS "Course_careerPathId_status_idx"
  ON "Course"("careerPathId", "status");

-- Payment: user payment history
CREATE INDEX IF NOT EXISTS "Payment_userId_status_idx"
  ON "Payment"("userId", "status");

-- Notification: user notification list (unread filter)
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx"
  ON "Notification"("userId", "isRead", "createdAt" DESC);
```

---

## State Transitions

### Enrollment Status

```
[not exists] ──payment confirmed──→ ACTIVE
ACTIVE ──all lessons complete──→  COMPLETED
ACTIVE ──admin action──────────→  SUSPENDED
ACTIVE ──user cancels──────────→  CANCELLED
SUSPENDED ──admin action───────→  ACTIVE
```

### AssessmentSession Status

```
IN_PROGRESS ──complete called, Claude succeeds──→ COMPLETED
IN_PROGRESS ──complete called, Claude fails────→ FAILED
FAILED ──retry job succeeds────────────────────→ COMPLETED
```

### PasswordResetToken Lifecycle

```
[created] ──bcrypt.compare match + within 1h──→ usedAt = now()
[created] ──expiresAt < now()──────────────────→ [ignored by query]
```

---

## Migration File Naming Convention

```
apps/api/prisma/migrations/
├── 20260403000001_add_password_reset_token/
│   └── migration.sql     ← PasswordResetToken table
├── 20260403000002_add_performance_indices/
│   └── migration.sql     ← 5 new indices
└── 20260403000003_assessment_session_status_enum/
    └── migration.sql     ← Optional: enum for AssessmentSession.status
```

Run: `npx prisma migrate dev --name add_password_reset_token` etc.

---

## Validation Rules (DTO level)

### RegisterDto / ResetPasswordDto — password field

```typescript
@IsString()
@MinLength(8)
@Matches(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
  {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, ' +
      'one number, and one special character (@$!%*?&)',
  },
)
password: string;
```

### ForgotPasswordDto

```typescript
@IsEmail()
email: string;
```

### ResetPasswordDto

```typescript
@IsString()
@IsNotEmpty()
token: string;

@IsString()
@MinLength(8)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, { message: '...' })
newPassword: string;
```
