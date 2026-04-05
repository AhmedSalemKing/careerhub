# API Contracts: Auth Module Changes

**Branch**: `master`
**Date**: 2026-04-03
**Scope**: Password reset token security hardening + password complexity enforcement

---

## CHANGED: POST /auth/forgot-password

**Before**: Creates a `Session` record with `refreshToken = "reset:" + rawToken`.

**After**: Creates a `PasswordResetToken` record with `tokenHash = bcrypt(rawToken)`.
The raw token is emailed. The response is identical (no behavioral change to callers).

### Request
```http
POST /api/auth/forgot-password
Content-Type: application/json
```
```json
{
  "email": "user@example.com"
}
```

### Response — 200 OK
```json
{
  "success": true,
  "data": null,
  "message": "If this email is registered, a reset link has been sent."
}
```
> Note: Always returns 200 to prevent email enumeration. No change from existing behavior.

### Response — 429 Too Many Requests
```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests. Please try again later."
}
```
> Note: Add `@Throttle({ default: { limit: 3, ttl: 60000 } })` to this endpoint specifically.

---

## CHANGED: POST /auth/reset-password

**Before**: Finds `Session` where `refreshToken = "reset:" + token`, resets password.

**After**: Finds `PasswordResetToken` where `expiresAt > now()` AND `usedAt IS NULL`
for the matching user; verifies `bcrypt.compare(token, tokenHash)`; resets password;
marks token used; invalidates all sessions.

### Request
```http
POST /api/auth/reset-password
Content-Type: application/json
```
```json
{
  "token": "abc123def456...",
  "newPassword": "NewSecure@Pass1"
}
```

### Response — 200 OK
```json
{
  "success": true,
  "data": { "message": "Password reset successfully. Please log in." }
}
```

### Response — 400 Bad Request (expired/used token)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Reset link has expired or already been used."
}
```

### Response — 400 Bad Request (weak password)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
}
```

---

## CHANGED: POST /auth/register

**New validation** on `password` field:
- Min 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (`@$!%*?&`)

### Response — 400 Bad Request (weak password) — NEW
```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
  ]
}
```

---

## UNCHANGED endpoints (behavior only, guard added)

### POST /upload (auth guard added — BREAKING for anonymous callers)

**Before**: No authentication required.

**After**: Requires `Authorization: Bearer <token>` header.

```http
POST /api/upload
Authorization: Bearer <jwt>
Content-Type: multipart/form-data
```

**Unauthenticated response** — NEW:
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized"
}
```
