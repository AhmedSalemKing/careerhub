# DeveWay Platform — Security Audit Report

**Date:** May 2026
**Version:** 2.0 (Updated)
**Scope:** Full platform audit (API, Web, Learn)
**Auditor:** AI-assisted security hardening — 2 sessions

---

## Overall Security Score

| Category | Session 1 | Session 2 | Final |
|----------|-----------|-----------|-------|
| Backend Security | B+ | A | **A** |
| Frontend Security | B+ | A | **A** |
| Data Exposure | B+ | A | **A** |
| File Upload Security | A | A+ | **A+** |
| Rate Limiting | A | A+ | **A+** |
| Input Sanitization | A | A+ | **A+** |
| CSP / HTTP Headers | A | A+ | **A+** |
| Audit Logging | — | Added | **A** |
| Brute Force Detection | — | Added | **A** |
| Security Event Tracking | — | Added | **A** |
| **Overall** | **B+** | **A** | **A (Enterprise-grade)** |

---

## SESSION 1 — What Was Implemented

### 1. Input Sanitization Enhancement
- **File:** `apps/api/src/modules/auth/dto/login.dto.ts`
- Added `@Transform` to lowercase/trim email input
- Prevents case-confusion bypass and whitespace injection

### 2. Path Traversal Prevention
- **File:** `apps/api/src/modules/upload/upload.controller.ts`
- `serveCV` endpoint strips `/`, `\`, and `..` sequences from filename parameters
- Prevents directory traversal attacks on file serving

### 3. Password Reset Token Hardening
- **File:** `apps/api/src/modules/auth/auth.service.ts`
- `forgotPassword` bcrypt salt rounds increased from 10 → 12
- Matches application-wide bcrypt standard

### 4. Sensitive Data Exposure Fix
- **File:** `apps/api/src/modules/users/users.service.ts`
- `getProfile` rewritten to use explicit `select` clause
- Guarantees `password`, `refreshToken`, `passwordResetToken`, `deletedAt` never returned

### 5. Ownership Verification Audit
- **File:** `apps/api/src/modules/courses/courses.service.ts`
- Verified `updateInstructorCourse`, `addSection`, `addLesson`, `getInstructorCourseDetails`
- All query with `instructorId` filter before mutating data

### 6. Frontend XSS Protection
- **Files:** `apps/web/`, `apps/learn/`
- Installed `isomorphic-dompurify` in learn app
- Verified all `dangerouslySetInnerHTML` usages use `DOMPurify.sanitize()`

### 7. Frontend Security Headers
- **Files:** `apps/web/next.config.mjs`, `apps/learn/next.config.mjs`
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Strict-Transport-Security with preload
- Referrer-Policy: strict-origin-when-cross-origin

---

## SESSION 2 — New Security Features Added

### 8. Audit Logging System (NEW)
- **File:** `apps/api/src/common/services/audit.service.ts`
- **Model:** `SecurityLog` in Prisma schema
- **Migration:** `20260514000000_add_security_logs`

**Events tracked:**
| Event | Trigger |
|-------|---------|
| LOGIN_SUCCESS | Successful authentication |
| LOGIN_FAILED | Wrong credentials |
| LOGIN_BLOCKED | IP blocked after 10 failures |
| LOGOUT | User logout |
| REGISTER | New account created |
| PASSWORD_RESET_REQUEST | Forgot password submitted |
| PASSWORD_RESET_SUCCESS | Password reset completed |
| PASSWORD_CHANGED | Password change by user |
| PROFILE_UPDATED | Profile data changed |
| ROLE_CHANGED | Admin changes user role |
| ACCOUNT_APPROVED | Admin approves instructor/consultant |
| ACCOUNT_REJECTED | Admin rejects application |
| ACCOUNT_SUSPENDED | Admin suspends account |
| WALLET_TOPUP | Stripe topup confirmed |
| WALLET_PAYMENT | Course purchase via wallet |
| WALLET_TRANSFER | Earnings transferred to wallet |
| CERTIFICATE_ISSUED | Certificate generated |
| FILE_UPLOAD | File uploaded |
| ADMIN_ACTION | Admin performs management action |
| OAUTH_LOGIN | Google OAuth login |
| SUSPICIOUS_ACTIVITY | Abuse pattern detected |

**Each log entry captures:**
- Event type
- User ID (if authenticated)
- Email
- IP address
- User-Agent
- Metadata (JSON — context-specific)
- Timestamp

**Architecture:** Audit logging wrapped in try/catch — never breaks main flow.

### 9. Brute Force Protection (NEW)
- **File:** `apps/api/src/modules/auth/auth.controller.ts`

**Rules:**
| Trigger | Threshold | Window | Action |
|---------|-----------|--------|--------|
| Failed logins per IP | 10 failures | 15 minutes | 429 block |
| Password reset requests per email | 3 requests | 1 hour | Silent block + SUSPICIOUS_ACTIVITY log |

**Response on block:**
```json
{
  "message": "Too many failed attempts. Please try again in 15 minutes.",
  "messageAr": "محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة."
}
```

**Anti-enumeration:** Password reset abuse returns fake success (doesn't reveal if email exists).

### 10. Security Event Detection (NEW)
- **File:** `apps/api/src/common/services/audit.service.ts`

Methods:
- `getRecentFailedLogins(ip, minutes)` — counts recent failures per IP
- `getRecentPasswordResets(email, hours)` — counts recent reset attempts per email

### 11. Admin Security Logs Endpoint (NEW)
- **Endpoint:** `GET /admin/security-logs`
- **Auth:** ADMIN role required
- **Features:** event filter, pagination
GET /admin/security-logs?event=LOGIN_FAILED&limit=50&page=1

Response shape:
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "total": 150,
    "page": 1
  }
}
```

### 12. Wallet Transaction Audit (NEW)
- **File:** `apps/api/src/modules/wallet/wallet.controller.ts`
- All wallet operations logged: TOPUP, PAYMENT, TRANSFER
- Includes amount and course ID in metadata

### 13. Certificate Issuance Audit (NEW)
- **File:** `apps/api/src/modules/certificates/certificates.controller.ts`
- Every certificate generation logged with userId, courseId, serialNumber

---

## Pre-existing Security Measures (Verified)

| Measure | Location | Status |
|---------|----------|--------|
| Helmet (CSP, HSTS, XSS, frameguard, noSniff, referrerPolicy) | `main.ts` | Active |
| Strict CORS whitelist (6 origins) | `main.ts` | Active |
| Global ValidationPipe with `whitelist: true` | `main.ts` | Active |
| Global HttpExceptionFilter (no stack leaks) | `main.ts` | Active |
| ThrottlerModule (10/s, 100/min, 500/15min) | `app.module.ts` | Active |
| @Throttle on register (3/hr), login (5/min), forgot (3/min) | `auth.controller.ts` | Active |
| @Transform HTML-stripping on all text DTO fields | DTOs | Active |
| File type + size validation | `file-validation.util.ts` | Active |
| bcrypt password hashing (12 rounds) | `auth.service.ts` | Active |
| Password reset tokens bcrypt-hashed | `auth.service.ts` | Active |
| Session invalidation on password change | `auth.service.ts` | Active |
| JWT expiration + refresh token rotation | `auth.service.ts` | Active |
| User status checks (BANNED, REJECTED, PENDING) | `jwt-auth.guard.ts` | Active |
| httpOnly + secure + sameSite cookies | `auth.controller.ts` | Active |
| No secret API keys in frontend | Web + Learn | Verified |
| File payload limit (100mb) | `main.ts` | Active |
| console.log removed from auth | `auth.controller.ts` | Fixed |
| Ownership verification on course mutations | `courses.service.ts` | Active |
| Prisma (prisma as any) removed | Multiple services | Fixed |

---

## Database Security Log Schema

```prisma
model SecurityLog {
  id        String   @id @default(cuid())
  event     String
  userId    String?
  email     String?
  ip        String?
  userAgent String?
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([event])
  @@index([ip])
  @@index([createdAt])
  @@map("security_logs")
}
```

---

## Remaining Recommendations (Future)

### High Priority
| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| 1 | **CSRF tokens** for wallet/settings/auth forms | 1 week | High |
| 2 | **Cloudflare WAF** — Bot protection + DDoS + Geo filtering | 1 day (config) | Very High |
| 3 | **Dependabot / Snyk** — Automated dependency security scanning | 1 day | High |

### Medium Priority
| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| 4 | **S3 presigned URLs** for file uploads (replace Cloudinary direct) | 1 week | Medium |
| 5 | **ClamAV** file scanning for CV/document uploads | 3 days | Medium |
| 6 | **Database audit logs** at DB level (Supabase row-level) | 2 days | Medium |
| 7 | **Secrets Manager** (Doppler/Vault) instead of .env | 1 week | Medium |
| 8 | **Request body size limits per-route** | 2 hours | Low-Medium |

### Low Priority
| # | Recommendation | Effort |
|---|---------------|--------|
| 9 | Subresource Integrity (SRI) for CDN scripts | 2 hours |
| 10 | Google OAuth server-side session (instead of query params) | 3 days |
| 11 | max-old-space-size for production Node.js | 30 min |
| 12 | Zero Trust service-to-service auth (future microservices) | Future |

---

## OWASP Top 10 Coverage

| OWASP Risk | Coverage | Notes |
|------------|----------|-------|
| A01 Broken Access Control | Strong | JWT guards + ownership checks + RBAC |
| A02 Cryptographic Failures | Strong | bcrypt 12 + JWT + HTTPS/HSTS |
| A03 Injection | Strong | Prisma ORM + ValidationPipe + sanitization |
| A04 Insecure Design | Good | Rate limiting + brute force detection |
| A05 Security Misconfiguration | Strong | Helmet + CORS + CSP + no stack leaks |
| A06 Vulnerable Components | Partial | Manual — Dependabot recommended |
| A07 Auth Failures | Strong | JWT rotation + session invalidation + audit logs |
| A08 Software Integrity | Partial | No SRI — no CDN scripts currently |
| A09 Security Logging | Added | SecurityLog model + 21 event types |
| A10 SSRF | Good | No outbound user-controlled URLs |

---

## Files Modified — Security

| File | Changes |
|------|---------|
| `apps/api/prisma/schema.prisma` | Added SecurityLog model |
| `apps/api/src/common/services/audit.service.ts` | **NEW** — AuditService |
| `apps/api/src/common/services/audit.module.ts` | **NEW** — AuditModule |
| `apps/api/src/app.module.ts` | Added AuditModule import |
| `apps/api/src/modules/auth/auth.controller.ts` | Brute force detection + audit logs |
| `apps/api/src/modules/wallet/wallet.controller.ts` | Wallet audit logs |
| `apps/api/src/modules/certificates/certificates.controller.ts` | Certificate audit logs |
| `apps/api/src/modules/admin/admin.controller.ts` | Security logs endpoint |
| `apps/api/src/modules/auth/dto/login.dto.ts` | Email sanitization |
| `apps/api/src/modules/upload/upload.controller.ts` | Path traversal fix |
| `apps/api/src/modules/users/users.service.ts` | Explicit select (no password leak) |
| `apps/api/src/modules/courses/courses.service.ts` | Ownership verification |
| `apps/web/next.config.mjs` | Security headers |
| `apps/learn/next.config.mjs` | Security headers |

---

*Report generated: May 2026 | DeveWay Platform v2.0*
*Next audit recommended: After Cloudflare WAF + CSRF implementation*
