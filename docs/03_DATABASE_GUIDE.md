# DeveWay Database Guide

Source: `apps/api/prisma/schema.prisma` (Prisma 5.22, PostgreSQL). 68 models (tables), 16 enums, 85 foreign keys. The full SQL is in `04_SCHEMA.sql`; a generated diagram is in `apps/api/prisma/dbml/schema.dbml`.

Correction to earlier internal notes: the schema has 68 tables, not 63. This guide lists all 68.

Naming: most tables use snake_case names set with `@@map` (for example `users`, `user_profiles`). Seven models have no `@@map` and keep their model name as the table name: `Course`, `CourseBundle`, `BundleCourse`, `Subscription`, `LiveSession`, `LiveRecording`, `WebhookEvent`. IDs are `cuid` strings. Most tables have `createdAt`/`updatedAt`.

## 1. Domain map (68 tables)

| Domain | Count | Tables |
|---|---|---|
| Auth and identity | 5 | users, user_profiles, sessions, password_reset_tokens, device_tokens |
| Learning (catalog, progress, careers, AI, live) | 29 | see section 3 |
| Coaching | 5 | coaches, coaching_slots, coaching_sessions, coaching_credits, coach_reviews |
| Consulting | 1 | consulting_sessions |
| Payments and commerce | 6 | payments, wallet_transactions, exchange_rates, carts, cart_items, Subscription |
| System | 12 | notifications, chat_messages, admin_logs, audit_logs, security_logs, user_activities, analytics_events, uploaded_files, file_shares, site_settings, site_setting, WebhookEvent |
| Compass | 10 | compass_versions, compass_stages, compass_questions, compass_options, compass_follow_up_rules, compass_sessions, compass_session_questions, compass_answers, compass_dimension_evidence, compass_reports |

## 2. Auth and identity

| Table | What it stores | Who uses it |
|---|---|---|
| users | One row per account: email, password hash, role (`USER`, `COACH`, `ADMIN`, `SUPER_ADMIN`), account type (STUDENT, INSTRUCTOR, CONSULTANT, ADMIN), approval status (ACTIVE, PENDING, REJECTED, BANNED), Google id, Stripe customer id, ID-verification state, wallet balance, earnings balance, and the mentor fields (bio, speciality, experience, hourlyRate, meetingMethod, CV and LinkedIn URLs) | Every module; auth and admin most |
| user_profiles | Display profile, one per user: name, phone, birth date, gender, country, city, avatar, bio, speciality, yearsExperience, qualifications, consultingAreas, sessionPrice, sessionDuration, timezone, language | Profile pages, mentor listings, booking |
| sessions | Refresh-token sessions (token, expiry) | Auth |
| password_reset_tokens | Hashed single-use reset tokens with expiry and requester IP | Auth |
| device_tokens | Push-notification device tokens (ios, android, web) | Notifications |

## 3. Learning

### 3.1 Catalog and content

| Table | What it stores | Who uses it |
|---|---|---|
| categories | Course categories, optionally nested (parent/children), Arabic and English names | Course catalog, filters |
| career_paths | Career paths (slug, titles and descriptions in Arabic/English, skills, salary range, demand level) | Career module, courses |
| tracks | Learning tracks shown on the home page and `/careers`: texts in both languages, weeks, level, skills, jobs (JSON), courses (JSON), country (EG, KSA, BOTH), optional fixed session price | Public site, admin tracks page |
| packages | A priced bundle of courses sold for one track or career path (course ids, original and final price in SAR) | Checkout, admin |
| Course | A course: slug, titles/descriptions, prices (`price`/`currency` plus `priceEGP`, `priceUSD`, `priceSAR`), level, status (`DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `REJECTED`, `ARCHIVED`), certificate settings, and live/offline fields (type, stream, schedule, location, max attendees) | Courses, admin, instructors, live |
| CourseBundle | Admin-defined bundle of courses with price and discount | Course bundles endpoint |
| BundleCourse | Join table linking a bundle to its courses (ordered) | Bundles |
| course_modules | Modules of a course (ordered, published flag) | Course structure |
| sections | Sections of a course (ordered), the newer structure used by the instructor tools | Instructor course builder |
| lessons | A lesson: type (VIDEO, FILE, TEXT, LIVE), content, video/file info, free-preview flag, publish flag, live and location fields; belongs to a module or a section | Lesson player, instructors |
| video_content | Hosted-video record for a lesson: stream id, playback URL, thumbnail, duration, processing status | Video module |
| instructor_lectures | Log of lectures an instructor delivered (course, date, minutes, status DRAFT/COMPLETED/CANCELLED) | Instructor reports and their Excel/PDF exports |

### 3.2 Quizzes

| Table | What it stores |
|---|---|
| quiz_tests | A quiz attached to a course (and optionally a section or lesson): duration, passing score, shuffle, retake rules, status |
| quiz_test_questions | Ordered questions with type, text, optional image, points |
| quiz_test_choices | Answer choices and which are correct |
| quiz_test_attempts | A student's attempt: timing, auto and manual scores, percentage, passed flag |
| quiz_test_answers | Per-question answers with auto and manual grade and feedback |

### 3.3 Progress and recognition

| Table | What it stores | Who uses it |
|---|---|---|
| enrollments | A user's enrollment in a course (status, progress percent, dates); unique per user and course | Courses, payments, certificates |
| lesson_progress | Per-lesson status, percent, time spent; unique per user and lesson | Progress tracking |
| certificates | Issued certificate: unique serial number, image and QR URLs; unique per user and course | Certificates module, public verification |
| ratings | A 1-5 rating with comment, either for a course or for a consultant (two nullable targets) | Course pages, consultant profiles |

### 3.4 Careers and AI

| Table | What it stores |
|---|---|
| career_assessments | Classic career assessment run for a user and career path (score, results, 7-day expiry) |
| assessment_questions | Questions of a classic assessment (Arabic/English, type, options, answer) |
| assessment_sessions | AI assessment session: answers (JSON) and generated report (JSON) |
| user_career_paths | Career paths a user selected, with title and category copied in, and whether AI recommended it |
| conversations | AI conversation per user (title, context, interview stage, evidence log, generated report) |
| ai_messages | Messages of a conversation (role, text, token count) |

### 3.5 Live streaming

| Table | What it stores |
|---|---|
| LiveSession | One live broadcast of a course: channel name, instructor, status (`SCHEDULED`, `STARTING`, `LIVE`, `ENDING`, `ENDED`), Daily room, timing, duration |
| LiveRecording | The recording pipeline state for a live session (status from `PENDING` to `READY` or `FAILED`, Agora resource id and sid, Backblaze key, Bunny video id, retry count, last error) |

## 4. Coaching (legacy coach marketplace)

| Table | What it stores | Who uses it |
|---|---|---|
| coaches | Coach profile attached to a user (one per user): bios in both languages, specialties, experience, hourlyRate, availability (JSON), rating, review count, verified flag | `/api/coaching/coaches` |
| coaching_slots | Time slots a coach offers (start, end, booked flag, price) | Slot booking |
| coaching_sessions | A booked coaching session (coach, user, slot, Zoom ids, status, price, recording) | Coaching module |
| coaching_credits | Remaining prepaid sessions a user holds from a package, with expiry | Package purchases |
| coach_reviews | A 1-5 review of a completed coaching session; one per user and session | Coach profile |

## 5. Consulting (current mentor marketplace)

| Table | What it stores | Who uses it |
|---|---|---|
| consulting_sessions | A session between a student (`studentId`) and a consultant (`consultantId`), both pointing at `users`: topic, notes, scheduled time, duration, status (starts at `PENDING_APPROVAL`), reschedule fields, Daily room name and URL, meeting link, price, currency, payment status and payment id, approval flags, start/end/complete timestamps, cancel reason | `/api/consulting`, `/api/sessions`, payments, instructor reports |

The consulting flow reads mentor information from `users` and `user_profiles`; it does not use the `coaches` table.

## 6. Payments and commerce

| Table | What it stores | Who uses it |
|---|---|---|
| payments | A payment event: user, optional course, amount, currency, method (default STRIPE_CARD), status, Stripe ids, `itemType`/`itemId` for what was bought, metadata | Payments, admin revenue |
| wallet_transactions | Wallet ledger entries: type (TOPUP, PAYMENT, REFUND), amount, status, Stripe intent, course | Wallet |
| exchange_rates | Rate per currency pair (unique on from/to); admin edits USD to SAR and USD to EGP | Pricing, currency interceptor |
| carts | One cart per user | Cart |
| cart_items | Courses in a cart (unique per cart and course) | Cart |
| Subscription | A user's subscription state: plan, status, start and end date. No code in `apps/api/src` currently reads or writes it | Not yet used |

## 7. System

| Table | What it stores | Who uses it |
|---|---|---|
| notifications | In-app notifications in both languages with a type enum and JSON data, read flag | Notification bell, all modules |
| chat_messages | Direct messages between users (text, file, image), optionally tied to a session id | Chat |
| admin_logs | Admin actions with resource, id, details, IP and user agent | Admin audit trail |
| audit_logs | Generic audit entries (action, entity type and id, admin id, details) | Audit service |
| security_logs | Security events (login success/failure, resets, wallet events) with IP and user agent | Audit service, admin security page |
| user_activities | Per-user activity feed (action, entity, metadata, IP) | Super-admin activity center |
| analytics_events | Product analytics events, anonymous allowed | Analytics |
| uploaded_files | File records for uploads (storage key, URL, type, size, folder, public flag) | Upload |
| file_shares | Share links for uploaded files (expiry, optional password, download limit) | Upload |
| site_settings | Single-row theme settings (site name, primary, background and button colours, logo) | Admin, frontend theme |
| site_setting | Key-value CMS settings grouped by section (JSON values) | Admin CMS |
| WebhookEvent | Designed to store inbound provider webhook payloads (source, event type, processed flag). No code in `apps/api/src` currently reads or writes it | Not yet used |

## 8. Compass

Career Compass is a versioned, data-driven questionnaire. Question content lives in the database so it can be edited and versioned without a deploy.

| Table | What it stores |
|---|---|
| compass_versions | A published version of the questionnaire (one active at a time) |
| compass_stages | Stages within a version (stage number, titles in both languages) |
| compass_questions | Questions with dimension, type (single choice, multi select, ranking, rating scale, short text, scenario, practical), text and hints in both languages, baseline flag, order, answer limits, max follow-up depth |
| compass_options | Choices for a question |
| compass_follow_up_rules | Branching rules: when an option or condition on a trigger question is met, ask a follow-up question (with reason and priority) |
| compass_sessions | A user's run through a version (status, current stage, 30-day expiry) |
| compass_session_questions | Every question presented in a session (baseline and follow-ups) with order, status and branching reason; needed to resume and audit |
| compass_answers | Answers (selected options, ranking JSON, text, rating); unique per session and question |
| compass_dimension_evidence | Per-session evidence findings and optional scores for six dimensions; all scores are nullable until approved weights exist |
| compass_reports | Generated report: summaries, unranked candidate paths, strengths, gaps, roadmap, limitations, AI narrative, in both languages |

## 9. Key relationships in plain English

- A **user** has at most one **profile** (`user_profiles`), at most one **coach** record, at most one **cart**, and many sessions, enrollments, notifications, payments, certificates and activity rows. Most child rows are deleted when the user is deleted (cascade); payments, enrollments' course link and chat messages are not.
- A **course** belongs optionally to one career path, one category and one instructor (a user). It has many modules, sections, quizzes, enrollments, certificates, payments, ratings and cart items. A **lesson** belongs to a module or a section, and has at most one `video_content` record.
- A **quiz** belongs to a course and optionally to one section and one lesson. Attempts belong to a quiz and a user; answers belong to an attempt and a question.
- An **enrollment** ties one user to one course (unique pair). A **certificate** also ties one user to one course (unique pair), and **lesson_progress** ties one user to one lesson.
- A **consulting session** has two foreign keys to `users`: the student and the consultant.
- A **coaching session** points to a coach, a user and a slot; a **coach review** points to the coach, the user and the coaching session.
- A **cart** has many cart items, each pointing at a course.
- A **bundle** links to courses through `BundleCourse`.
- A **Compass session** belongs to a user and a version; its answers, presented questions, evidence and report hang off the session. Questions belong to a version and a stage, options belong to a question, and follow-up rules connect a trigger question (and optionally an option) to a follow-up question.
- A **conversation** has many AI messages (cascade delete).
- A **live recording** belongs to exactly one live session.

## 10. Known design decisions

These are recorded as the team's intended design. Each includes the practical consequence so a new developer is not surprised.

1. **Mentor price is stored in three tables.** `users.hourlyRate`, `user_profiles.sessionPrice` and `coaches.hourlyRate` all hold the price. Every save path writes all three through `syncMentorPrice` (`apps/api/src/common/mentor-price.ts`): settings (`PATCH /api/auth/profile`), `PATCH /api/auth/update-pro-fields`, admin hourly-rate update, admin approval with a rate, and coach creation. Registration writes `users` and `user_profiles` (a `coaches` row does not exist yet). The coaches update uses `updateMany`, so it never creates a coach row. **All reads use `users.hourlyRate` first**, falling back to `sessionPrice` (consultant listing, booking price, consulting checkout, track consultants). Consequence: rows saved before this change may still disagree until the mentor's price is saved again; `PATCH /api/users/profile` writes only `sessionPrice` and is not used for prices by the web app.
2. **`LiveSession.courseId` and `LiveSession.instructorId` are plain strings (no foreign key).** Live sessions are kept independent of course and user lifecycle, so a session record survives if a course or instructor is removed. Consequence: no database-level integrity or cascade, and the table has no indexes on those columns, so lookups by course are not index-backed.
3. **`packages.courseIds` is a `String[]` (no foreign key).** A package stores its course ids inline; `pathId` plus `pathKind` (TRACK or CAREER_PATH) points at a track or career path without a database relation. Consequence: deleting a course does not update packages, and "which packages include this course" needs an array lookup. `CourseBundle` and `BundleCourse` (real foreign keys) are the older, relational equivalent.
4. **`Subscription` has no foreign key to `payments`.** `Subscription` holds the current state (plan, status, dates); `payments` holds the events. They are deliberately separate, so a subscription is not tied to a single payment row. Consequence: linking a subscription to the payments that funded it is done by convention (user id and metadata), not by a constraint.

Other things worth knowing when reading the schema:

- Both `users` and `user_profiles` carry bio, speciality, experience and LinkedIn fields (and `coaches` carries bio and experience too). Registration and profile updates write both `users` and `user_profiles`; the consulting listing falls back to the `users` values when the profile is empty.
- Several columns that look like references are plain strings by design or history: `UserCareerPath.pathId`, `CoachingCredit.packageId`, `ChatMessage.sessionId`, `Payment.itemId`, `ConsultingSession.paymentId`, `ConsultingSession.proposedBy/rescheduledBy/completedBy`, `WalletTransaction.courseId`, `QuizAnswer.gradedBy`, and ids inside the `Track.courses` JSON.
- Status fields are a mix of enums (`CourseStatus`, `EnrollmentStatus`, `SessionStatus`, `LiveSessionStatus`) and free strings (`users.status`, `Payment.status`, `ConsultingSession.status`, `Quiz.status`); the allowed values for strings are defined in code.
- Two parallel mentor systems exist: `coaches` family (legacy, Zoom) and `consulting_sessions` (current, Daily). The public coaching page reads consultants through the consulting API.
- `SiteSettings` (single row, theme) and `SiteSetting` (key-value CMS) are two different tables.
- Schema-only tables (no reads or writes found in `apps/api/src` when this guide was written): `Subscription`, `WebhookEvent`. Treat them as reserved for future features.

## 11. Enums

`UserRole`, `Gender`, `AssessmentStatus`, `LectureStatus`, `CourseStatus`, `EnrollmentStatus`, `LessonStatus`, `SessionStatus`, `NotificationType`, `MessageType`, `LiveSessionStatus`, `RecordingStatus`, `CompassDimension`, `CompassQuestionType`, `CompassSessionStatus`, `CompassQuestionStatus`. Values are in `04_SCHEMA.sql` (the `CREATE TYPE` statements at the top).

## 12. Migrations

Migrations live in `apps/api/prisma/migrations` (33 migration folders plus `migration_lock.toml`) and are applied with `prisma migrate deploy` during the Render pre-deploy step. The schema uses `DATABASE_URL` for the app and `DIRECT_URL` for migrations.
