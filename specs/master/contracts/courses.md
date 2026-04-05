# API Contracts: Courses Module Changes

**Branch**: `master`
**Date**: 2026-04-03
**Scope**: Lesson progress tracking, enrollment status transitions

---

## CHANGED: POST /courses/:courseId/lessons/:lessonId/complete

**Before**: Creates `LessonProgress` record but sets `Enrollment.progress = 0` always.

**After**: Creates/upserts `LessonProgress`, recalculates `Enrollment.progress`,
transitions `Enrollment.status` to `COMPLETED` if all lessons done.

### Request
```http
POST /api/courses/:courseId/lessons/:lessonId/complete
Authorization: Bearer <jwt>
```

### Response — 200 OK (EXTENDED)
```json
{
  "success": true,
  "data": {
    "lessonProgress": {
      "lessonId": "cllsnid",
      "status": "COMPLETED",
      "completedAt": "2026-04-03T12:00:00.000Z"
    },
    "enrollmentProgress": {
      "courseId": "clcourseid",
      "progress": 75,
      "status": "ACTIVE",
      "completedLessons": 3,
      "totalLessons": 4
    }
  }
}
```

### Response — when all lessons complete (EXTENDED)
```json
{
  "success": true,
  "data": {
    "lessonProgress": { "status": "COMPLETED" },
    "enrollmentProgress": {
      "progress": 100,
      "status": "COMPLETED",
      "certificateQueued": true
    }
  },
  "message": "Course completed! Your certificate is being generated."
}
```

### Response — 403 Forbidden (not enrolled)
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You must be enrolled in this course to complete lessons."
}
```

---

## NEW: POST /courses/:courseId/lessons/:lessonId/heartbeat

Tracks time spent on a lesson for progress and engagement analytics.

### Request
```http
POST /api/courses/:courseId/lessons/:lessonId/heartbeat
Authorization: Bearer <jwt>
Content-Type: application/json
```
```json
{
  "seconds": 30
}
```

### Response — 200 OK
```json
{
  "success": true,
  "data": {
    "timeSpent": 120
  }
}
```
> `timeSpent` is the cumulative total for this lesson for this user.

---

## CHANGED: GET /courses/:id/enrollment

Returns richer enrollment data including accurate progress.

### Response — 200 OK (EXTENDED)
```json
{
  "success": true,
  "data": {
    "id": "clenrollmentid",
    "courseId": "clcourseid",
    "status": "ACTIVE",
    "progress": 50,
    "completedLessons": 4,
    "totalLessons": 8,
    "enrolledAt": "2026-03-01T00:00:00.000Z",
    "completedAt": null
  }
}
```
