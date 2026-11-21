# DeveWay Frontend Components, State, Auth and Utilities

Covers `apps/web` and `apps/learn`. Paths are relative to each app's `src/`. See `01_FRONTEND_OVERVIEW.md` for the stack and `02_FRONTEND_PAGES.md` for routes.

## 1. State management

Three mechanisms are actually used; there is no Redux, Jotai or other global store.

| Mechanism | Where | What it holds |
|---|---|---|
| Zustand | `stores/authStore.ts` in both apps | Current user, token, loading flag (web also: refresh token and `isAuthenticated`). Actions: `setUser`, `setToken`, `hydrate`, `logout`, `updateUser` |
| TanStack Query | `lib/query-client.ts` (web), `lib/query.tsx` (learn) | All server data. Defaults: `staleTime` 5 minutes, `retry` 2, `refetchOnWindowFocus: false`; web also `gcTime` 10 minutes and `refetchOnMount: false`; mutations retry once. Query keys include `['auth','me']` and `['notifications']` |
| React Context | web: `contexts/MarketContext.tsx`, `contexts/SiteConfigContext.tsx`, toast context in `lib/toast.tsx`; learn: `contexts/MarketContext.tsx`, `lib/toast.tsx`, `LoadingProvider` in `components/PageLoader.tsx` | Selected market (KSA/EG), CMS site config, toasts, page-loading overlay |
| Component state and browser storage | everywhere | Forms use `react-hook-form` and local `useState`; theme uses `next-themes` (web storage key `deveway-theme`, default dark; learn default system); market also in the `market` cookie; the assessment result is passed through `sessionStorage` (`assessmentResult`) |

Provider order, web (`app/layout.tsx` then `app/[locale]/layout.tsx`): `ThemeProvider` > `QueryClientProvider` > `ToastProvider` > `SiteConfigProvider` (in `Providers.tsx`), then `MarketProvider` > `LocaleShell` (Navbar, page, Footer; Navbar and Footer are omitted on `/admin` paths). `Providers` also calls `hydrate()` on the auth store, starts the keep-alive ping, and fetches `GET /admin/site-settings` to apply the theme colours.

Provider order, learn (`app/layout.tsx`): `ThemeProvider` (next-themes) > `NextIntlClientProvider` > `QueryProvider` > `MarketProvider` > `ToastProvider` > `LoadingProvider` > `TokenSync` (in `Suspense`), `KeepAlivePing`, `Navbar`, page, `Footer`.

Cross-component events (web): `window` events `auth:updated` (after login, register or logout, so the Navbar re-reads the store) and `role:changed` (dispatched when `/auth/me` reports a new account type).

## 2. Authentication flow on the frontend

### 2.1 Where the tokens are stored

Both apps use the same keys (`lib/auth.ts`): `deveway_token` (access token), `deveway_refresh` (refresh token), `deveway_user` (JSON of the user). Each value is written to `localStorage` and also to a cookie (`SameSite=Lax`, access and user cookies for 7 days, the refresh cookie for 30 days). On non-localhost hosts the cookie is set on the parent domain (`.deveways.com`) so subdomains see it. Legacy names (`careerhub_token`, `careerhub_user`, `token`, `access_token`) are still read by the API clients and cleared on logout.

The tokens are readable by JavaScript. On login the API also sets cookies named `refresh_token` and `access_token` (`response.cookie` in the auth controller) and the axios clients send credentials (`withCredentials: true`); web's request interceptor reads the `access_token` cookie first, then its own stored copies.

### 2.2 Login (web)

1. `/login` calls `useAuth().login` (`hooks/useAuth.ts`): `POST /auth/login` with `{ email, password }`.
2. `onSuccess` stores the access token, refresh token and user in the Zustand store and in all storage locations above, fires `POST /users/track-activity` (`LOGIN`), dispatches `auth:updated`, and navigates: admins to `/{locale}/admin`; everyone else to the `?redirect=` query parameter or `/{locale}/dashboard`. (Hand-off to learn: see 2.5.)
3. Errors map to messages by status (401 wrong credentials, 404 no account, 403 server message).
4. Registration (`/register`) works the same way after `POST /auth/register`; instructor and consultant accounts are PENDING and are sent to the pending-approval screen. Google sign-in goes through the API (`/api/auth/google`) and comes back to `/auth/google/success` with the session data in the query string, which the page stores and removes from the URL.

### 2.3 Keeping the session fresh and handling expiry

- Web: `useAuth` runs `GET /auth/me` every 30 seconds (`refetchInterval`) while a token exists, to keep role and verification in sync and to announce role changes. **Web never calls `/auth/refresh`.** A 401 clears all stored auth and redirects (to `/login`, or `/banned`, `/rejected`, `/login?error=...` based on the error code or message). Network errors and 502/503 are retried twice before failing.
- Learn: on a 401 the axios interceptor makes one attempt to refresh with `POST /auth/refresh` and `{ refreshToken }` taken from storage; on success it stores the new tokens and replays the request; on failure it clears storage and redirects to the web login with a `redirect` back to the current learn page. `GET /auth/me` 401s are not retried.
- `syncAuthUser` (`lib/auth-sync.ts` in learn) is a single-flight, memoized `GET /auth/me` so several components do not each fetch the user.

### 2.4 Protected routes

There is no server-side enforcement in either app (the middlewares only deal with locale and market). Protection is client-side:

| Mechanism | Where | Behaviour |
|---|---|---|
| `AuthGate` | web `app/components/AuthGate.tsx` | Hydrates the store; while loading shows a skeleton; with no token redirects to `/{locale}/login`; skips the redirect if a logout is in progress |
| Admin layout guard | web `app/[locale]/admin/layout.tsx` | After 300 ms reads `deveway_user` from localStorage; redirects to login unless `accountType` is `ADMIN` or `SUPER_ADMIN` |
| Dashboard layout | web `app/[locale]/dashboard/layout.tsx` | Builds the navigation for the user's account type; if the stored status is PENDING, BANNED or REJECTED it re-checks `/auth/me` and logs the user out (through learn) with an error code unless the server says ACTIVE |
| Per-page role checks | web dashboard pages | For example `create-course` redirects `CONSULTANT` and `STUDENT`; `client-sessions` redirects `STUDENT` to `my-sessions`; `revenue` renders a consultant or instructor view |
| 401 interceptor | both `lib/api.ts` | Any protected API call without a valid token ends in a redirect to login |
| Not-enrolled page | learn `components/course/NotEnrolledPage.tsx` | The course player shows it when `GET /courses/:id/enrollment` returns no enrollment |

Because these checks run in the browser against browser-stored data, the backend's JWT and role guards are the real access control.

### 2.5 Sharing the session between web and learn (different origins)

Web and learn run on different domains, so they do not share browser storage. Instead of a shared cookie, the apps hand the token over explicitly:

- **Web to learn links:** `lib/learn-link.ts` builds learn URLs with `?token=<access token>` (`learnLink`, `learnUrlWithToken`, `learnCoursesLink`, `learnCourseLink`). `installLearnLinkTokenizer()` is a delegated listener (installed by the Navbar) that adds the token to any link pointing at the learn origin at click time. `learnSyncUrl` builds `learn/{locale}/auth/sync?token=...&return=...`, used right after login.
- **Learn receiving the token:** `components/TokenSync.tsx` (mounted in the root layout) reads `?token=` on any page, stores it in localStorage (`deveway_token` and `careerhub_token`), drops the previous user record if the token changed, loads the user with `syncAuthUser(true)`, and removes the parameter from the URL with `history.replaceState`. `/auth/sync` does the same on a dedicated page and then redirects to `return` if its host is on an allow-list (`deveways.com`, `deveway.com`, `devewayhub.vercel.app`, `deveway-teal.vercel.app`, `localhost`, and subdomains).
- **Logout:** web's `logout()` clears its own storage and cookies, then does a top-level navigation to `learn/{locale}/logout?return=<web login>`. Learn's `/logout` page clears every known auth key, cookie, and cache storage, then returns to `return` (allow-listed). Learn's own `logout()` goes the other way, through web's `/logout`. A `window.__dvLoggingOut` flag stops auth guards and the 401 handler from starting a competing redirect during this round trip.
- **Learn to web:** learn has no login. `webLoginUrl(locale, redirectPath)` sends visitors to `web/{locale}/login?redirect=<absolute learn URL>`; after login web sends them back (through the sync URL).

## 3. Shared and major components

### 3.1 apps/web, `app/components/` (app-wide)

| Component | Purpose |
|---|---|
| `Providers`, `LocaleShell` | Provider tree and page chrome (see section 1). `applySiteSettings` applies CMS colours as CSS variables |
| `Navbar` | Top navigation: language switcher, notification bell, theme toggle, market, user menu with avatar and verified badge, role-based links; installs the learn-link tokenizer |
| `Footer`, `LanguageSwitcher`, `HashScrollHandler` | Footer, locale toggle, scroll to `#anchor` after navigation |
| `AuthGate` | Client-side sign-in gate (2.4) |
| `DashboardShell`, `DashboardSidebar`, `AdminShell` | Dashboard and admin page wrappers (AdminShell is a thin wrapper; the admin layout owns the sidebar) |
| `NotificationBell` | Lists notifications, marks read and mark-all-read (`/notifications`), routes through `lib/notification-url.ts` |
| `CartDrawer` (`CartIcon`) | Cart contents and removal (`GET /cart`, `DELETE /cart/remove/:courseId`) |
| `CourseCard`, `CourseGrid`, `CoursesShowcase` | Course cards with market-aware prices, a home-page courses strip |
| `CoachCard`, `BookingCalendar`, `SessionCard`, `ChatInterface` | Coach listing and legacy booking, session cards, chat view for a session |
| `SearchBar` | Global search over courses and consultants |
| `CertificateView`, `AnalyticsCharts`, `StarRating`, `VisionBadge`, `TracksGrid`, `JourneySection`, `HeroSection`, `TypewriterHero`, `CharacterDuo` | Presentational pieces for certificates, charts (recharts), ratings, Saudi/Egypt Vision 2030 badges, track cards, landing sections, illustrated characters |
| `CustomSelect`, `Toast`, `PageLoader` (`LoadingProvider`), `NumberInputGuard` | Searchable select, toast, route loading overlay, stops the mouse wheel from changing number inputs |
| `ui/` (`Button`, `Input`, `Label`, `Skeleton`, `BrandText`, `DynamicText`, `cn`) | Small design-system primitives |
| `live/DailyCall` | Embeds the Daily video room for live sessions |

### 3.2 apps/web, `components/` (feature components)

| Group | Components | Purpose |
|---|---|---|
| AI assistant | `ai/FloatingAIButton`, `FloatingCareerOrb`, `ai/VoiceOrb`, `CareerInterview`, `ai/StopSpeechOnNav` | Floating entry points and the interview UI. `CareerInterview` takes a context prop (`career-interview` or `general-assistant`) |
| Voice and speech engine | `ai/stt-controller.ts`, `ai/stt-session.ts`, `ai/speech-ledger.ts`, `ai/tts-text.ts`, `ai/tts-v2/*` | Framework-free speech-to-text lifecycle, utterance de-duplication, text cleaning for speech, streaming text-to-speech with error policy and watchdog. Covered by Jest tests |
| Coaching | `coaching/MentorDetailsModal`, `coaching/MentorStats`, `kokonutui/stay-picker` | Mentor detail modal, trust signals (years of experience, completed sessions), availability calendar |
| Courses and careers | `careers/EnrollConfirmModal`, `dashboard/CareerPathModal`, `PaymentModal`, `PriceDisplay` | Enroll confirmation with package price, career path modal, Stripe payment modal for consulting sessions, price in the selected market |
| Quizzes | `quizzes/ScoreCircle`, `SegmentedControl`, `StatusBadge`, `ToggleSwitch` | Quiz builder and results widgets |
| Users | `UserAvatar`, `avatars/MaleAvatar`, `FemaleAvatar`, `VerifiedBadge`, `VisionBadge` | Photo, gender character, or initial avatar; verified mark |
| Admin | `AdminCurrencyToggle`, `BottomDock` | Admin currency view, mobile navigation dock |
| Generic | `ConfirmModal`, `ErrorBoundary`, `SkeletonCard`, `SmartImage` | Confirm dialog, error boundary, skeleton, image wrapper that falls back to `<img>` for unknown hosts |
| Guided tours | `tour/PageTour` plus about 30 `*Tour.tsx` files (`HomeTour`, `DashboardTour`, `CoachingTour`, `QuizBuilderTour`, ...) | `driver.js` walkthroughs per page, with a launcher button; some start automatically on first visit |
| Legal | `legal/legalDefaults.ts` | Default privacy and terms text, support email |

### 3.3 apps/web, page-local components

`app/[locale]/sections/*` (home page sections), `careers/CareersPage`, `coaches/CoachesPage`, `faq/FaqPage`, `dashboard/assessment/*` (`AIInterviewPage`, `AssessmentInner`, `compass/*`), `admin/courses/PackageModal`, `admin/instructor-reports/InstructorReportsClient`, `dashboard/schedule/ScheduleClient`, `verify/[serial]/VerifyCertificatePage`.

### 3.4 apps/learn, `app/components/`

| Component | Purpose |
|---|---|
| `Navbar`, `Footer`, `LanguageSwitcher`, `ThemeToggle`, `LearnHeader` | Navigation; notifications, AI chat and assessment links point at the web app |
| `TokenSync` | Cross-origin token bridge (2.5) |
| `NotificationBell`, `CartIcon`, `SearchBar` | Same roles as in web; notification pages live in web |
| `LoginForm`, `RegisterForm` | Form components (the active login and register pages redirect to web) |
| `Providers`, `PageLoader` (`LoadingProvider`), `KeepAlivePing`, `NumberInputGuard` | Provider glue, loading overlay, pings `/health` every 5 minutes, number-input guard |
| `CareerPathsSection`, `JourneySection`, `TypewriterHero` | Home page sections |
| `live/DailyCall` | Daily video room |
| `ui/` (`button`, `input`, `progress`, `scroll-area`, `select`, `separator`, `skeleton`, `cn`) | shadcn-style primitives (class-variance-authority) |

### 3.5 apps/learn, `components/`

| Component | Purpose |
|---|---|
| `ProtectedVideo`, `VideoProtection` | Lesson video element for a course (takes the course id, token, student name) and a tiled watermark overlay with the user's name and email; `VideoProtection` also blocks the context menu and some key shortcuts |
| `course/NotEnrolledPage`, `course/AiComingSoon` | Shown when the user is not enrolled; placeholder for the assistant button |
| `live/LiveCourseDetail`, `live/LiveRecordingPlayer`, `live/LiveSessionReplay` | Live-course detail, HLS recording player (hls.js; recordings are stored on Bunny Stream), replay of an ended session |
| `quizzes/QuizEntryCard`, `ConfirmDialog`, `ScoreCircle`, `StatusBadge` | Quiz start card (fetches the lesson's active quiz), confirmations, results |
| `CustomSelect`, `SmartImage`, `ErrorBoundary`, `UserAvatar`, `avatars/*`, `VerifiedBadge`, `VisionBadge` | Same helpers as web |
| Guided tours | `CourseDetailTour`, `CoursePlayerTour`, `GradesTour`, `LearnCoursesTour`, `LearnHomeTour`, `QuizTour`, `QuizResultTour`, `tour/PageTour` | `driver.js` walkthroughs |

## 4. Custom hooks

| Hook | App | Purpose |
|---|---|---|
| `useAuth` | web | Login, register, forgot and reset password mutations; `GET /auth/me` polling (30 s); role-change detection and toast; `logout` |
| `useAuth` | learn | Small hook exposing the auth store and a login mutation (`POST /auth/login`); the learn login page itself redirects to web |
| `useCompassSession` | web | Drives a Career Compass session through the `/api/compass/*` proxies (start, resume, answer, complete, report) |
| `useLiveSocket` | both | Socket.IO client for the `/live` namespace; waits until the user identity is available, then listens for `viewer-count`, `new-comment`, `new-question`, `question-approved`, `question-answered`, `question-dismissed`, `stream-started` and `stream-ended` |
| `components/ai/useAIChat` | web | Chat state, streaming responses from `/api/ai/chat`, speech-to-text and text-to-speech orchestration, career result parsing |
| `components/ai/tts-v2/useStreamingTTS` | web | Streaming PCM text-to-speech through Web Audio (`/api/ai/tts-v2`) |
| `components/ai/useCareerMemory` | web | Loads and saves the user's AI memory (`/api/ai/memory`), seeded from localStorage; `buildMemoryContext` formats it for the prompt |
| `useAuthStore`, `useMarket`, `useSiteConfig`, `useToast` | both (`useSiteConfig` web only) | State hooks described in section 1 |

## 5. Utilities (`lib/`)

| File | App | What it provides |
|---|---|---|
| `api.ts` | both | Configured axios instance and `get`/`post`/`put`/`patch`/`del` helpers |
| `auth.ts` | both | Token, refresh token and user storage (localStorage plus cookies), `logout`, cookie and storage clearing |
| `auth-sync.ts` | learn | Single-flight `/auth/me` sync (`syncAuthUser`, `readToken`) |
| `learn-link.ts` | web | Learn URL builders that carry the token; link tokenizer |
| `constants.ts` | both | `LEARN_URL`, `MAIN_URL`, `API_URL`; web adds `SOCKET_URL`; learn adds `webLoginUrl` |
| `unwrap.ts` | both | Strip the `{ success, data }` envelope (`unwrapData`; learn `unwrap`, `unwrapList`) |
| `market.ts`, `marketConfig.ts`, `formatCurrency.ts` | both | Market model (KSA/SAR and EG/EGP): detection, country query parameter, price formatting. Egypt shows EGP using the API's `*Display` fields; other visitors see SAR |
| `time.ts`, `format-date.ts`, `formatDate.ts`, `live.ts` | web (learn has `time.ts`, `live.ts`) | Timezone-aware, Gregorian-calendar date formatting (Africa/Cairo for display), live-session date and status helpers |
| `uiLocale.ts` | both | Page language for helpers that cannot call hooks |
| `toast.tsx`, `notify.ts`, `confirm-toast.tsx` | web (learn: `toast.tsx`, `notify.ts`) | Toast context and helpers |
| `query-client.ts` | web | Shared `QueryClient` defaults |
| `activityTracker.ts` | web | `trackPageView` and `trackAction` (`POST /users/track-activity`) |
| `keepAlive.ts` | web | Pings the API health endpoint periodically so a sleeping host wakes up |
| `career-paths.ts`, `career-path-mapping.ts`, `tracks.ts` | web | Static career path data, category-to-path mapping, track types and fetchers (`GET /tracks`) |
| `assessment-engine.ts` | web | Static question bank and scoring for the client-side career assessment |
| `file-download.ts`, `pdf.ts`, `media.ts`, `upload-error.ts` | both (`pdf.ts` web) | File preview and download helpers (Cloudinary raw files), PDF opening, media URL helpers, upload error messages |
| `notification-url.ts` | web | Where each notification type should link to |
| `utils.ts` | web | `cn`, brand colour normalisation |
| `instructor.ts` | learn | Instructor display name helpers |
