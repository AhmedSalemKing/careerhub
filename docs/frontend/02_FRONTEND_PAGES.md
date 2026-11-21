# DeveWay Frontend Pages and Routes

Every route in `apps/web` and `apps/learn`, from the `src/app` directories. All page routes live under a `[locale]` segment, so every path below is really `/ar/...` or `/en/...` (the middleware redirects `/` to the Arabic home, and both apps use `localePrefix: 'always'`). API paths are relative to the backend base URL (`.../api`); the backend's authentication rules are in `docs/02_API_ENDPOINTS.md`.

## How to read the Auth column

| Value | Meaning |
|---|---|
| Public | The page renders for anyone; any data it loads comes from public API routes |
| Public (action needs login) | The page renders for anyone, but the main action (enroll, book, pay) needs a token and sends the visitor to login |
| Protected | The page needs a signed-in user. Enforcement in the frontend is client-side: an `AuthGate` wrapper, a redirect inside the page or layout, or the API answering 401 (which the axios interceptor turns into a redirect to login) |
| Role: X | The page is meant for account type X (`STUDENT`, `INSTRUCTOR`, `CONSULTANT`, `ADMIN`, `SUPER_ADMIN`). The frontend check is a UX gate; the API enforces real permissions |

Important: neither app has server-side route protection. Both `middleware.ts` files only handle locale and the `market` cookie. The token lives in browser storage, so it is not available to server components. Treat every frontend gate as navigation convenience and rely on the API for authorization.

---

# apps/web

## Public site

| Path | What it renders | API endpoints called | Auth |
|---|---|---|---|
| `/` (root, no locale) | Redirects to `/ar` | none | Public |
| `/{locale}` | Home page: hero, home sections (career tracks, how it works, features, testimonials, CTA), courses showcase | `GET /courses`, `GET /courses?status=PUBLISHED&limit=10`, `GET /tracks`, `GET /admin/site-config` (theme/CMS), `GET /admin/site-settings` | Public |
| `/{locale}/careers` | Careers page: grid of learning tracks | `GET /tracks`, `GET /career/paths`, `GET /career/paths/my` (when signed in) | Public |
| `/{locale}/careers/[slug]` | One track: description, skills, jobs and salary ranges, course list, matching consultants, enroll confirmation (package price) | `GET /tracks/:slug`, `GET /career/paths`, `GET /career/paths/:slug`, `GET /career/paths/my`, `GET /consulting/consultants`, `GET /courses`, `GET /courses/:id`, `POST /career/paths/add/:pathId` | Public (action needs login) |
| `/{locale}/coaches` | List of coaches | `GET /api/coaching/coaches` (see note on `/api` below) | Public |
| `/{locale}/coaches/[id]` | Coach detail | `GET /api/coaching/coaches/:id` | Public |
| `/{locale}/coaching` | Mentor marketplace: filter, search, sort mentors; price shown from the mentor's `sessionPrice` / `hourlyRate` in the visitor's market currency | `GET /consulting/consultants` | Public |
| `/{locale}/coaching/[consultantId]/book` | Booking page for one mentor: details, available slots, duration, topic, creates the session | `GET /consulting/consultants/:id`, `GET /consulting/consultants/:id/slots`, `GET /sessions/consultants/:id`, `POST /consulting/sessions/book` | Public (action needs login) |
| `/{locale}/courses` | Calls `notFound()` (the catalog is served by the learn app; metadata only) | none | Public |
| `/{locale}/profile/[userId]` | Public profile of an instructor or user | `GET /users/profile/:userId` | Public |
| `/{locale}/verify/[serial]` | Certificate verification result for a serial number | `GET /certificates/:serial/verify` | Public |
| `/{locale}/faq` | FAQ | none | Public |
| `/{locale}/contact` | Contact page (support email) | none | Public |
| `/{locale}/help` | Placeholder ("launching soon") | none | Public |
| `/{locale}/ai-chat` | Placeholder ("launching soon"); the working AI chat is under the dashboard | none | Public |
| `/{locale}/privacy`, `/{locale}/terms` | Legal text (defaults in `components/legal/legalDefaults.ts`, overridable from CMS settings) | `GET /admin/site-config` | Public |

## Authentication and account state pages

| Path | What it renders | API endpoints called | Auth |
|---|---|---|---|
| `/{locale}/login` | Login form (email and password, Google button); redirects admins to `/admin`, others to `?redirect=` or the dashboard; after login hands the token to learn | `POST /auth/login`, `POST /users/track-activity`, the Google button navigates the browser to `<API origin>/api/auth/google` | Public |
| `/{locale}/register` | Multi-step registration for student, instructor or consultant (CV upload, speciality, experience, rate); logs in automatically after registering | `POST /auth/register`, `POST /auth/login`, `PATCH /auth/update-account-type`, `PATCH /auth/update-pro-fields`, `POST /upload/cv` (via `fetch`, CV upload) | Public |
| `/{locale}/forgot-password` | Request a reset email | `POST /auth/forgot-password` | Public |
| `/{locale}/reset-password` | Set a new password from the emailed token | `POST /auth/reset-password` | Public |
| `/{locale}/logout` | Clears web storage and cookies, then goes through learn's `/logout` | none | Public |
| `/{locale}/auto-login` | Logs in with the emailed auto-login token (approved consultants) | `POST /auth/auto-login` | Public |
| `/{locale}/auth/google/success` | Receives the Google sign-in result (data in the query string), stores the session, routes by role | none (data comes from the API redirect) | Public |
| `/{locale}/auth/google/complete` | Lets a new Google user pick an account type | `PATCH /auth/update-account-type` | Protected |
| `/{locale}/pending-approval` | "Application under review" screen for instructor and consultant accounts | `GET /auth/me` | Protected |
| `/{locale}/banned` | Banned-account notice | none | Public |
| `/{locale}/rejected` | Rejected-application notice | none | Public |

## Checkout and payment

| Path | What it renders | API endpoints called | Auth |
|---|---|---|---|
| `/{locale}/checkout/[courseId]` | Starts Stripe Checkout for a course and redirects to Stripe; sends visitors without a token to login | `GET /courses/:id`, `POST /payments/checkout/course/:courseId` (via `fetch`) | Protected |
| `/{locale}/payment/success` | Post-payment confirmation | `POST /payments/verify-payment` | Protected |

## Dashboard (`/{locale}/dashboard/...`)

`dashboard/layout.tsx` is a client layout: it hydrates the auth store, builds a role-specific navigation (admin, instructor, consultant, student), refreshes `GET /auth/me` once per mount, prefetches `/auth/me` and `/notifications`, and logs a user out (through learn) if their stored status is PENDING, BANNED or REJECTED and the server does not say ACTIVE. It does not redirect a visitor who has no token; individual pages use `AuthGate` or rely on API 401s.

| Path | What it renders | API endpoints called | Auth |
|---|---|---|---|
| `/dashboard` | Role-based overview: student (courses, career path, sessions, certificates), instructor overview, consultant overview, admin quick links; career path modal | `GET /users/dashboard`, `GET /users/profile`, `GET /career/paths`, `GET /career/paths/my`, `GET /certificates/my`, `GET /courses`, `GET /courses/:id`, `GET /courses/enrolled`, `GET /courses/my-courses`, `GET /courses/instructor/stats`, `GET /coaching/consulting/my-sessions`, `GET /consulting/sessions`, `GET /consulting/consultants`, `GET /consulting/consultants/:id/slots`, `POST /consulting/sessions/book`, `GET /packages/my/purchased`, `GET /payments/my/invoices`, `GET /tracks` | Protected |
| `/dashboard/assessment` | The AI career interview (assistant "Rasheed", voice and text) through `AIInterviewPage` | Next routes `POST /api/ai/chat`, `/api/ai/tts*`, `/api/ai/memory` | Protected |
| `/dashboard/assessment/result` | Result of the assessment (read from `sessionStorage` key `assessmentResult`) | none | Protected |
| `/dashboard/ai-chat` | Full-screen AI chat (the dashboard layout hides its chrome on this route) | Next route `POST /api/ai/chat` | Protected |
| `/dashboard/career-path` | Redirects to `/dashboard` | none | Protected |
| `/dashboard/certificates` | The user's certificates with view/download | `GET /certificates/my` (via `fetch`) | Protected |
| `/dashboard/my-courses` | Student: enrolled courses; instructor (`isInstructor`): own courses with go-live and manage links | `GET /courses/enrolled` (students) or `GET /courses/my-courses` (instructors), `GET /courses/:id/lessons`, `DELETE /courses/:id`, `POST /live/lesson-start/:lessonId` | Protected; instructor view for `INSTRUCTOR` |
| `/dashboard/create-course` | Course creation form (recorded, live, offline with map location); redirects `CONSULTANT` and `STUDENT` to `/dashboard` | `GET /career/paths`, `GET /courses/categories`, `POST /courses`, `POST /upload/image` (via `fetch`) | Blocks STUDENT and CONSULTANT (client-side redirect) |
| `/dashboard/courses/[id]/manage` | Course content manager (sections, lessons, uploads, settings, live lessons, students) for the owner; also reused for admins | `GET /courses/instructor/:id/details`, `GET /career/paths`, `GET /live/manage/:id`, `PATCH /courses/:id`, `PATCH /courses/:id/course-settings`, `PATCH /courses/:id/mark-completed`, `POST /courses/instructor/:id/sections`, `POST /courses/sections/:sectionId/lessons`, `POST /live/lesson-start/:lessonId`, `POST /live/end/:courseId` | Role: INSTRUCTOR, ADMIN |
| `/dashboard/courses/[id]/go-live` | Instructor live-stream room for a course (Daily call) | `GET /courses/:id`, `GET /auth/me`, `GET /live/recording/:id`, `POST /live/end/:id` | Role: INSTRUCTOR |
| `/dashboard/courses/[id]/manage/quizzes` | Quiz list for a course | `GET /quizzes?courseId=`, `DELETE /quizzes/:id` | Role: INSTRUCTOR |
| `/dashboard/courses/[id]/manage/quizzes/new` | Create a quiz | `GET /courses/instructor/:id/details`, `POST /quizzes` | Role: INSTRUCTOR |
| `/dashboard/courses/[id]/manage/quizzes/[quizId]/builder` | Quiz builder (questions, choices, publish) | `GET/PATCH /quizzes/:id`, `POST /quizzes/:id/questions`, `PATCH/DELETE /quizzes/:id/questions/:qid`, `POST /quizzes/:id/reorder`, `POST /quizzes/:id/publish` or `unpublish`, `POST /upload/image` | Role: INSTRUCTOR |
| `/dashboard/courses/[id]/manage/quizzes/[quizId]/attempts` | Attempts of a quiz | `GET /quizzes/:id`, `GET /quizzes/:id/attempts` | Role: INSTRUCTOR |
| `/dashboard/courses/[id]/manage/quizzes/attempts/[aid]` | Review and grade one attempt | `GET /quizzes/attempts/:aid`, `POST /quizzes/attempts/:aid/grade` | Role: INSTRUCTOR |
| `/dashboard/analytics` | Instructor statistics | `GET /courses/instructor/stats` | Role: INSTRUCTOR |
| `/dashboard/revenue` | Revenue: consultant view (sessions) or instructor view (per course) | `GET /coaching/consulting/my-sessions`, `GET /courses/instructor/revenue` | Role: CONSULTANT, INSTRUCTOR |
| `/dashboard/earnings` | Consultant earnings | `GET /sessions/my-earnings` | Role: CONSULTANT |
| `/dashboard/schedule` | Consultant schedule, start or join a session room | `GET /consulting/sessions`, `POST /consulting/sessions/:id/start-room`, `POST /consulting/sessions/:id/join-room` | Role: CONSULTANT |
| `/dashboard/client-sessions` | Consultant: sessions requested by clients, approve, reschedule, cancel, go live; redirects `STUDENT` to `/dashboard/my-sessions` | `GET /consulting/sessions`, `GET /sessions/my-sessions`, `GET /consulting/sessions/:id/reschedule-slots`, `PATCH /consulting/sessions/:id/approve`, `request-reschedule`, `cancel`, `POST /consulting/sessions/:id/start-room`, `join-room` | Role: CONSULTANT |
| `/dashboard/my-sessions` | Student: own mentor sessions, pay, cancel, reschedule decisions | `GET /consulting/sessions`, `PATCH /consulting/sessions/:id/approve-reschedule`, `reject-reschedule`, `cancel`, `POST /consulting/sessions/:id/confirm-payment`, `POST /payments/checkout/consulting/:id` | Protected |
| `/dashboard/consulting/[sessionId]/go-live` | Video room for a consulting session | `POST /consulting/sessions/:id/start-room`, `join-room`, `end` | Protected (consultant or student of the session) |
| `/dashboard/coaching` | Consultant-oriented sessions list | `GET /sessions/my-sessions` | Role: CONSULTANT |
| `/dashboard/coaching/book` | Legacy coach booking (coach list, calendar, slots) | `GET /api/coaching/coaches`, `GET /api/coaching/coaches/:id/slots`, `POST /api/coaching/sessions/book` | Protected (`AuthGate`) |
| `/dashboard/chat/[id]` | Chat for a coaching session | `GET /api/coaching/sessions/:id` | Protected (`AuthGate`) |
| `/dashboard/invoices` | Payment history | `GET /payments/my/invoices` | Protected |
| `/dashboard/notifications` | Notification list | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/mark-all-read` | Protected (`AuthGate`) |
| `/dashboard/settings` | Profile, avatar, price (mentors), password, ID verification | `GET /auth/me`, `PATCH /auth/profile`, `POST /auth/change-password`, `POST /upload/image`, `GET /verification/status`, `POST /verification/submit` | Protected |
| `/dashboard/tts-test` | Developer page for testing text-to-speech | Next route `POST /api/ai/tts` | Protected |
| `/dashboard/availability`, `/dashboard/lectures`, `/dashboard/reviews`, `/dashboard/students` | "Coming soon" placeholders | none | Protected |

## Admin (`/{locale}/admin/...`)

`admin/layout.tsx` is a client layout with its own sidebar. It reads `deveway_user` from localStorage after a 300 ms delay and redirects to login unless `accountType` is `ADMIN` or `SUPER_ADMIN`. The Navbar and Footer are hidden on `/admin` paths (`LocaleShell`). Pages additionally use `AdminShell`/`AuthGate` in places. The API enforces `ADMIN` on every `/admin/*` call.

| Path | What it renders | API endpoints called | Auth |
|---|---|---|---|
| `/admin` | Dashboard with platform statistics | `GET /admin/stats` | Role: ADMIN, SUPER_ADMIN |
| `/admin/users` | User table: counts, create, change role, ban, unban, delete | `GET /admin/users`, `GET /admin/users/counts`, `POST /admin/users/create`, `PATCH /admin/users/:id/role`, `POST /admin/users/:id/ban`, `POST /admin/users/:id/unban`, `DELETE /admin/users/:id` | Role: ADMIN |
| `/admin/users/[id]` | One user: detail, financials, activity | `GET /admin/users/:id/detail`, `/financials`, `/activity` | Role: ADMIN |
| `/admin/approvals` | Pending instructor and consultant applications, pending courses, ID verifications; approve or reject, set a mentor hourly rate or a course price | `GET /admin/pending-approvals`, `GET /admin/pending-courses`, `GET /verification/pending`, `POST /admin/approve/:id`, `POST /admin/reject/:id`, `POST /admin/courses/:id/approve`, `POST /admin/courses/:id/reject`, `POST /verification/approve/:id`, `POST /verification/reject/:id`, `PATCH /admin/users/:id/hourly-rate`, `PATCH /admin/courses/:id/price` | Role: ADMIN |
| `/admin/courses` | Course management and packages (bundles per track) | `GET /admin/courses`, `GET /admin/courses/counts`, `PATCH /admin/courses/:id/approve`, `reject`, `GET /packages/admin/all`, `PATCH /packages/:id`, `DELETE /packages/:id`, `GET /career/paths`, `GET /tracks`, `POST /packages` (modal) | Role: ADMIN |
| `/admin/courses/[id]/manage` | Reuses the instructor course manager for admins | same as `/dashboard/courses/[id]/manage` | Role: ADMIN |
| `/admin/create-course` | Admin course creation | `GET /career/paths`, `GET /courses/categories`, `GET /users/instructors`, `POST /admin/courses/create` | Role: ADMIN |
| `/admin/create-session` | Create a consulting session for a student and consultant | `GET /users?role=CONSULTANT`, `GET /users?role=STUDENT`, `POST /admin/sessions` | Role: ADMIN |
| `/admin/sessions` | All consulting sessions | `GET /admin/sessions` | Role: ADMIN |
| `/admin/tracks` | Track editor (texts, skills, jobs, courses, images) | `GET/POST /admin/tracks`, `PUT/DELETE /admin/tracks/:id`, `POST /admin/tracks/import-career-paths`, `GET /courses`, `POST /upload/image` | Role: ADMIN |
| `/admin/payments` | Payments list | `GET /payments/admin/all` (see "Calls without a matching route" below) | Role: ADMIN |
| `/admin/revenue` | Revenue and sessions overview | `GET /admin/payments`, `GET /admin/sessions` | Role: ADMIN |
| `/admin/analytics` | Analytics charts | `GET /analytics/overview`, `GET /analytics/revenue/analytics` | Role: ADMIN |
| `/admin/activity` | Activity feed and statistics | `GET /admin/activity`, `GET /admin/activity/stats` | Role: ADMIN |
| `/admin/certificates` | All certificates | `GET /certificates/admin/all` | Role: ADMIN |
| `/admin/coaches` | All coaches | `GET /coaching/admin/all` | Role: ADMIN |
| `/admin/instructor-reports` | Instructor and consultant lecture reports, Excel export, log a lecture | `GET /instructor-reports/report`, `/instructors`, `/report/instructor/:id`, `/export/excel`, `POST /instructor-reports/lectures`, `GET /courses` | Role: ADMIN |
| `/admin/site-settings` | CMS settings, theme colours and exchange rates; triggers `POST /api/revalidate` | `GET/PATCH /admin/cms-settings`, `GET/PATCH /admin/exchange-rate`, Next route `POST /api/revalidate?path=` | Role: ADMIN |

## Next.js route handlers (`apps/web/src/app/api`)

These are server routes inside the web app, not NestJS endpoints.

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/api/ai/chat` | POST | Streams a Gemini response (SSE) for the assistant; has a circuit breaker, idempotency and continuity helpers | Verifies the user through `GET /auth/me` |
| `/api/ai/tts` | POST | Gemini text-to-speech returned as audio | same |
| `/api/ai/tts-v2` | POST | Streaming PCM text-to-speech (prototype, used by `useStreamingTTS`) | same |
| `/api/ai/memory` | GET, PUT | Reads and writes the user's stored AI memory, persisted through the NestJS career-path API | same |
| `/api/compass/sessions` and `/api/compass/sessions/[id]` (`/answers`, `/complete`, `/report`) | GET, POST | Authenticated proxies to the NestJS `/career/compass/sessions...` routes | same |
| `/api/keep-alive`, `/api/ping` | GET | Call `GET /health` on the API (keeps the host warm) | Public |
| `/api/revalidate` | POST | `revalidatePath(path)` for a query-string path | Public |

Other generated routes: `robots.txt`, `sitemap.xml`, `opengraph-image`.

---

# apps/learn

Learn has no login or registration of its own, and no role-gated sections; it relies on the same token and the same API. Pages that need the user read the auth store and show an enrollment or login prompt; the API enforces access (for example, lesson content requires enrollment).

| Path | What it renders | API endpoints called | Auth |
|---|---|---|---|
| `/` (root, no locale) | Redirects to `/ar` | none | Public |
| `/{locale}` | Learn home: hero, career paths section, journey, featured courses, enrolled courses | `GET /courses`, `GET /courses/enrolled`, `GET /tracks`, `GET /auth/me` (sync) | Public |
| `/{locale}/courses` | Course catalog with search and filters, enroll and checkout actions (live courses join a room) | `GET /courses`, `POST /courses/:id/enroll` (`fetch`), `GET /live/token/:id` (`fetch`), `POST /payments/checkout/course/:id` (`fetch`) | Public (enroll needs login) |
| `/{locale}/courses/[id]` | Course detail (live-course variant via `LiveCourseDetail`); enroll, grades for the course. The layout does a server-side check and returns a real 404 for unknown course ids | `GET /courses/:id`, `GET /courses/:id/enrollment`, `GET /quizzes/grades/course/:id`, `POST /courses/:id/enroll` | Public (enroll needs login) |
| `/{locale}/courses/[id]/learn` | Placeholder checkout screen with hard-coded sample data (not wired to the API) | none | Public |
| `/{locale}/learn/[courseId]` | The course player: lesson list, protected video playback (HLS), lesson completion, notes, quiz entry cards, live-session replay; shows a "not enrolled" page when there is no enrollment | `GET /courses/:id`, `GET /courses/:id/enrollment`, `GET /quizzes/lesson/:lessonId/active`, `POST /courses/:courseId/lessons/:lessonId/complete` (via `fetch`) | Protected |
| `/{locale}/learn/[courseId]/quiz/[quizId]` | Take a quiz: timer, answers (file answers upload) and submit | `GET /quizzes/:id/meta`, `GET /quizzes/:id/start`, `GET /quizzes/attempts/:aid/mine`, `POST /quizzes/attempts/:aid/answer`, `POST /quizzes/attempts/:aid/submit`, `POST /upload/file` | Protected |
| `/{locale}/learn/[courseId]/quiz/[quizId]/result` | Quiz result, score circle, per-question review | `GET /quizzes/attempts/:aid/mine` | Protected |
| `/{locale}/live/[courseId]` | Live course viewer (Daily call), recording fallback, viewer count | `GET /live/status/:id`, `GET /live/join/:id`, `GET /live/recording/public/:id` (all `fetch`), `PATCH /live/viewers/:id`; Socket.IO `/live` | Protected for joining |
| `/{locale}/my-courses` | Student, instructor and consultant course/session lists | `GET /courses/my-courses`, `GET /courses/instructor/my-courses` (see below), `GET /coaching/consulting/my-sessions` | Protected |
| `/{locale}/dashboard` | Static welcome cards (server component) | none | Public |
| `/{locale}/dashboard/grades` | The student's quiz grades | `GET /quizzes/grades/mine` | Protected |
| `/{locale}/dashboard/ai-chat` | "Coming soon" placeholder | none | Public |
| `/{locale}/coaching` | Mentor list and booking (older sessions API) | `GET /sessions/consultants`, `POST /sessions/book` | Protected (the `/sessions` API requires a JWT) |
| `/{locale}/certificate/[serial]` | Certificate display and verification | `GET /certificates/verify/:code` | Public |
| `/{locale}/profile/[userId]` | Public profile (server component, with loading and not-found states) | `GET /users/profile/:userId` | Public |
| `/{locale}/payment/enroll` | Pay for a course or package: shows the price in the visitor's market currency and starts Stripe Checkout; sends logged-out visitors to the web login | `POST /payments/checkout/package/:id` or `/payments/checkout/course/:id` (`fetch`) | Protected |
| `/{locale}/checkout/[id]` | Redirects to the web app's `/{locale}/checkout/:id` | none | Public |
| `/{locale}/login`, `/{locale}/register` | Redirect to the web app's login and register pages (keeping `redirect`) | none | Public |
| `/{locale}/auth/sync` | SSO bridge: stores `?token=`, fetches the user, then redirects to `?return=` (an allow-listed host) or `/courses` | `GET /auth/me` | Public |
| `/{locale}/logout` | Clears all auth storage, cookies and caches, then redirects to `?return=` (allow-listed) or the web `/logout` | none | Public |
| `/{locale}/careers`, `/coaches`, `/contact`, `/faq`, `/help`, `/pricing`, `/privacy`, `/terms` | Each redirects to the same path on the web app | none | Public |
| `/{locale}/not-found` | 404 page | none | Public |

Shared learn components that call the API on every page: `NotificationBell` (`GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/mark-all-read`), `CartIcon` (`GET /cart`), `SearchBar` (`GET /courses/search?q=`), `KeepAlivePing` (`GET /health`). Generated routes: `robots.txt` and `sitemap.xml` (the sitemap reads `GET /courses?limit=100&status=PUBLISHED`).

---

# Notes

## Calls without a matching route

Three frontend calls do not match any route in `02_API_ENDPOINTS.md` at the time of writing:

- `GET /payments/admin/all` (web `/admin/payments`): the payments controller has no `admin/all` route (revenue pages use `GET /admin/payments`).
- `GET /courses/instructor/my-courses` (learn `/my-courses`): the backend has `GET /courses/my-courses`.
- `GET /live/token/:id` (learn `/courses`, live-course join): the live controller has `GET /live/join/:courseId` and `POST /live/start/:courseId`, but no `token` route.

## About `/api/...` paths

`GET /api/coaching/coaches`, `GET /api/coaching/coaches/:id`, `GET /api/coaching/coaches/:id/slots`, `POST /api/coaching/sessions/book` and `GET /api/coaching/sessions/:id` are called (by `/coaches`, `/coaches/[id]`, `/dashboard/coaching/book` and `/dashboard/chat/[id]`) through the axios instance from `lib/api.ts`. That instance's base URL already ends in `/api` (production fallback `https://api.deveways.com/api`), so these paths resolve to `.../api/api/coaching/...` unless `NEXT_PUBLIC_API_URL` is set without the `/api` suffix. The main coaching flow (`/coaching`) uses `/consulting/...` paths and does not have this prefix.

## Code that exists but is not mounted

The Career Compass UI (`dashboard/assessment/compass/CompassFlow.tsx`, `StageView`, `QuestionCard`, `DiscoveryReport`) and the `useCompassSession` hook, with the `/api/compass/*` proxy routes, are present, but no page currently mounts `CompassFlow`.
