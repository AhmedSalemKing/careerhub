# API Contracts: Payments Module Changes

**Branch**: `master`
**Date**: 2026-04-03
**Scope**: Payment confirmation → enrollment creation fix

---

## CHANGED: POST /payments/confirm-payment

**Before**: Confirms Stripe payment, creates `Payment` record. No enrollment created.

**After**: Confirms Stripe payment, creates `Payment` record, creates (or upserts)
`Enrollment` record for the purchased course.

### Request
```http
POST /api/payments/confirm-payment
Authorization: Bearer <jwt>
Content-Type: application/json
```
```json
{
  "paymentIntentId": "pi_3abc123...",
  "courseId": "clxxxxxxxxxxxxxxx"
}
```

### Response — 200 OK (EXTENDED)
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "clpaymentid",
      "status": "COMPLETED",
      "amount": 4999,
      "currency": "USD"
    },
    "enrollment": {
      "id": "clenrollmentid",
      "courseId": "clxxxxxxxxxxxxxxx",
      "status": "ACTIVE",
      "progress": 0
    }
  },
  "message": "Payment confirmed. You are now enrolled in the course."
}
```
> **Breaking change**: `data` was previously `{ payment: {...} }`. Now includes
> `enrollment` field. Frontend must be updated to handle the new shape.

### Response — 402 Payment Required (Stripe failure)
```json
{
  "success": false,
  "statusCode": 402,
  "message": "Payment could not be confirmed. Please check your payment details."
}
```

### Response — 409 Conflict (already enrolled — idempotent)
```json
{
  "success": true,
  "data": {
    "payment": { "status": "COMPLETED" },
    "enrollment": { "status": "ACTIVE", "alreadyEnrolled": true }
  },
  "message": "Already enrolled in this course."
}
```

---

## NEW: POST /payments/webhook/stripe (signature verified)

The webhook handler must validate the Stripe signature on every call.

### Request
```http
POST /api/payments/webhook/stripe
stripe-signature: t=...,v1=...
Content-Type: application/json
```
Raw body (unparsed) is required for signature verification.

### Handled events

| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Create enrollment (idempotent upsert) |
| `payment_intent.payment_failed` | Update `Payment.status = FAILED`, notify user |
| `customer.subscription.created` | Create/update `Subscription` record |
| `customer.subscription.deleted` | Set `Subscription.status = CANCELLED` |

### Response — 200 OK
```json
{ "received": true }
```

### Response — 400 (invalid signature)
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Webhook signature verification failed."
}
```
