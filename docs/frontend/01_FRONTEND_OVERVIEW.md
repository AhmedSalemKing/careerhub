# DeveWay Frontend Overview

Scope: `apps/web` (315 source files under `src/`) and `apps/learn` (127 source files under `src/`). Written from the source code; where a README or comment disagrees with the code, this document follows the code. Versions are the ranges declared in each app's `package.json` (exact installed versions are in each `package-lock.json`).

## 1. The two apps

| | apps/web | apps/learn |
|---|---|---|
| Purpose | The main site: marketing home page, career tracks, mentor (consultant) marketplace and booking, registration and login for everyone, role-based dashboards (student, instructor, consultant), the admin panel, the AI career assistant and Career Compass, certificate verification | The learning platform: public course catalog, course detail, the course player (video lessons), live-course viewing and recordings, quizzes and grades, certificate view |
| Audience | Visitors, students, instructors, consultants, admins | Students (and visitors browsing courses) |
| Login | Owns login, registration, password reset, Google sign-in, auto-login | Has none. `/login` and `/register` redirect to the web app; the session arrives from web through a token hand-off (see 03_FRONTEND_COMPONENTS.md, auth flow) |
| Dev port | 3000 (Next default) | 3002 (`next dev -p 3002`) |
| Production hosts seen in code | `www.deveways.com`, `deveway-teal.vercel.app` | `devewayhub.vercel.app` |
| Languages | Arabic (default, RTL) and English, both with `localePrefix: 'always'` (`/ar/...`, `/en/...`) | same |

Both apps are Next.js App Router projects with a `[locale]` segment, share most utility code by copy (there is no shared package), and talk to the same NestJS API.

## 2. Tech stack

| Area | web | learn |
|---|---|---|
| Framework | next 14.2.35 | next 14.2.35 |
| UI library | react ^18, react-dom ^18 | same |
| Language | typescript ^5 | typescript ^5 |
| i18n | next-intl ^4.8.3 (`messages/ar.json`, `messages/en.json`) | next-intl ^4.8.3 |
| Server state | @tanstack/react-query ^5.91.0 | ^5.91.0 |
| Client state | zustand ^5.0.12 | zustand ^5.0.12 |
| HTTP | axios ^1.13.6 (plus `fetch` in some places) | axios ^1.13.6 (plus `fetch`) |
| Styling | tailwindcss ^3.4.1, tailwind-merge ^3.5.0, clsx ^2.1.1, postcss ^8 | same, plus class-variance-authority ^0.7.1 |
| Components | Radix UI primitives (alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, tooltip) | same, plus react-slot |
| Icons / motion | lucide-react ^0.577.0, framer-motion ^12.38.0 | same |
| Forms / validation | react-hook-form ^7.71.2, @hookform/resolvers ^5.2.2, zod ^4.3.6 | react-hook-form ^7.72.0, same resolvers and zod |
| Toasts | react-hot-toast ^2.6.0, sonner ^2.0.7 (and a custom `lib/toast.tsx`) | same |
| Charts | recharts ^3.8.0 | recharts ^3.8.0 |
| Dates | date-fns ^4.1.0, dayjs ^1.11.20 | same |
| Payments | @stripe/stripe-js ^9.3.1, @stripe/react-stripe-js ^6.3.0 | same |
| Realtime | socket.io-client ^4.8.3 | socket.io-client ^4.8.3 |
| Video | (Daily call component, no player library) | hls.js 1.6.16, react-player ^3.4.0 |
| Guided tours | driver.js ^1.14.0 | driver.js ^1.14.0 |
| Monitoring | @sentry/nextjs ^10.53.1 | @sentry/nextjs ^10.53.1 |
| Sanitising | isomorphic-dompurify ^3.12.0 | isomorphic-dompurify ^3.12.0 |
| Themes | next-themes ^0.4.6 | next-themes ^0.4.6 |
| Fonts | @fontsource/dm-sans ^5.2.8, @fontsource/plus-jakarta-sans ^5.2.8 | same |
| AI (web only) | @google/generative-ai ^0.24.1, msedge-tts ^2.1.1, fix-webm-duration ^1.0.6 | not present |
| Tests (web only) | jest ^30.5.2, ts-jest ^29.4.15, @testing-library/react ^16.3.3, @testing-library/dom ^10.4.2 | none |
| Lint | eslint ^8, eslint-config-next 14.2.35 | same |

Notes: `apps/web/package.json` has no `test` script even though `jest.config.js` and several `__tests__` folders exist (run Jest directly). Both `next.config.mjs` files set `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true`, so type and lint errors do not fail a build. There is no `engines` field; the Node version is whatever the deploy platform uses.

## 3. Folder structure

### apps/web

```
apps/web
  messages/ar.json, en.json
  next.config.mjs, vercel.json, tailwind.config.ts, jest.config.js, __mocks__/
  public/                        logos, images, fonts
  src/
    middleware.ts                next-intl locale routing + `market` cookie (SAR/EGP by country)
    i18n.ts, i18n/request.ts     locales ['ar','en'], default 'ar'
    instrumentation*.ts          Sentry
    app/
      layout.tsx                 root layout: Providers, PageLoader, NumberInputGuard, keep-alive
      page.tsx                   redirects / to /ar
      robots.ts, sitemap.ts, opengraph-image.tsx
      [locale]/                  all pages (see 02_FRONTEND_PAGES.md)
        layout.tsx               MarketProvider + LocaleShell (Navbar/Footer, hidden on /admin)
        admin/  dashboard/  careers/  coaches/  coaching/  checkout/  ...
        sections/                home page sections
      api/                       Next route handlers: ai/chat, ai/tts, ai/tts-v2, ai/memory,
                                 compass/*, keep-alive, ping, revalidate
      components/                shared UI: Navbar, Footer, AuthGate, CourseCard, CartDrawer,
                                 NotificationBell, DashboardShell, BookingCalendar, ui/*
      contexts/                  MarketContext, SiteConfigContext
    components/                  feature components: ai/ (voice and chat), coaching/, quizzes/,
                                 careers/, dashboard/, avatars/, tour/ + many *Tour.tsx
    hooks/                       useAuth, useCompassSession, useLiveSocket
    lib/                         api.ts, auth.ts, learn-link.ts, market*.ts, time/format helpers
    stores/authStore.ts          Zustand auth store
    data/, assets/fonts/
```

### apps/learn

```
apps/learn
  messages/ar.json, en.json
  next.config.mjs, vercel.json, tailwind.config.ts, .env.production
  src/
    middleware.ts                same locale and market logic as web (no /learn exclusion)
    i18n.ts, i18n/request.ts
    app/
      layout.tsx                 root layout: next-themes, NextIntl, QueryProvider, MarketProvider,
                                 ToastProvider, LoadingProvider, TokenSync, KeepAlivePing, Navbar, Footer
      [locale]/                  pages (see 02_FRONTEND_PAGES.md)
      components/                Navbar, Footer, NotificationBell, CartIcon, SearchBar, TokenSync,
                                 RegisterForm, LoginForm, live/DailyCall, ui/*
      contexts/MarketContext.tsx
    components/                  course/, live/, quizzes/, ProtectedVideo, VideoProtection, tours
    hooks/                       useAuth, useLiveSocket
    lib/                         api.ts, auth.ts, auth-sync.ts, constants.ts, market*.ts, helpers
    stores/authStore.ts
```

## 4. How each app talks to the backend API

Both apps use a shared-in-spirit `axios` instance in `src/lib/api.ts` (exported as `api`, plus helpers `get`, `post`, `put`, `patch`, `del`). Backend responses are `{ success, data, meta }`; pages unwrap `res.data.data` (web has `lib/unwrap.ts`: `unwrapData`; learn has `unwrap`, `unwrapList`).

| | web (`apps/web/src/lib/api.ts`) | learn (`apps/learn/src/lib/api.ts`) |
|---|---|---|
| Base URL | `NEXT_PUBLIC_API_URL` used as-is (it must already end in `/api`); fallback `https://api.deveways.com/api` | `NEXT_PUBLIC_API_URL`, with `/api` appended if missing; fallback `https://api.deveways.com` (then `/api`) |
| Credentials | `withCredentials: true` | `withCredentials: true` |
| Timeout | 60 s (cold starts) | 30 s |
| Token source (request interceptor) | cookie `access_token`, then localStorage `careerhub_token`, then `deveway_token` | localStorage `deveway_token`, `careerhub_token`, `token`, sessionStorage `token`, cookie `deveway_token` |
| Auth header | `Authorization: Bearer <token>` | same |
| Market | If cookie `market=EGP`, adds query param `country=EG` to every request | same |
| Retry | Up to 2 retries (2 s, 4 s) on network errors, 502/503, timeouts (opt out with `skipRetry`) | none |
| 401 handling | Clears stored auth and redirects: to `/banned`, `/rejected`, `/login?error=pending_approval`, `/login?error=account_deleted` or `/login?error=account_inactive` depending on the error code or message, otherwise to `/login`. Opt out with `skipAuthRedirect`; skipped while a logout is in progress | Tries one refresh: `POST /auth/refresh` with `{ refreshToken }` from localStorage or cookie, stores the new tokens, retries the original request; if that fails it clears tokens and redirects to the web login URL with a `redirect` back to the current learn path. `/auth/me` 401s are not retried |
| Other | Locale-preserving redirects (`/en` or `/ar`) | Logs unexpected errors (not 401/403/404/409) |

Some code bypasses the axios instance and calls the API with `fetch`: the checkout pages (`POST /payments/checkout/course/:id`), certificates list, the live pages in learn (`/live/status`, `/live/join`, `/live/recording/public`), the search bar, sitemaps and the keep-alive pings. These read the token themselves and set `Authorization` manually.

Next.js route handlers in `apps/web/src/app/api` (server side, not the NestJS API): `ai/chat` (streams Gemini responses), `ai/tts` and `ai/tts-v2` (Gemini text-to-speech), `ai/memory` (reads and writes the user's AI memory through the NestJS career-path endpoints), `compass/*` (authenticated proxies to the NestJS Compass API), `keep-alive` and `ping` (call the API health endpoint), `revalidate` (calls `revalidatePath`). The AI and Compass handlers verify the caller by calling `GET /auth/me` on the NestJS API with the user's token, so the frontend never holds the JWT secret.

Realtime: `socket.io-client` connects to `<API origin>/live` (namespace `/live`). Web builds the host from `NEXT_PUBLIC_SOCKET_URL` or `NEXT_PUBLIC_API_URL` minus `/api`; learn hardcodes `https://api.deveways.com`.

## 5. Environment variables

The apps ship no `.env.example`. The table lists every variable read in `src/` (found by searching `process.env`), with the variable names present in the local `.env.local`/`.env.production` files (names only; values are not recorded here).

| Variable | web | learn | Used for |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes (29 uses) | yes (15 uses) | Backend API base URL |
| `NEXT_PUBLIC_MAIN_URL` | yes | yes (9 uses) | URL of the web app (learn redirects here for login/checkout/logout); web fallback `https://deveway.com` |
| `NEXT_PUBLIC_LEARN_URL` | yes | yes | URL of the learn app; web fallback `https://devewayhub.vercel.app` (production) or `http://localhost:3002` (dev) |
| `NEXT_PUBLIC_LMS_URL` | yes | no | Learn URL used by `lib/urls.ts` (fallback `/learn`) |
| `NEXT_PUBLIC_APP_URL` | listed in learn env files | listed | Present in env files; not read in `src/` |
| `NEXT_PUBLIC_WEB_URL` | no | yes (2 uses) | Web app URL in learn |
| `NEXT_PUBLIC_SOCKET_URL` | yes | no | Socket.IO host override |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | yes | no (Stripe packages installed) | Stripe.js publishable key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | yes (3 uses) | no | Maps in course creation |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` | yes | no | Google site verification meta tag |
| `NEXT_PUBLIC_SENTRY_DSN` | yes | yes | Sentry (client) |
| `GEMINI_API_KEY` | yes (server only, 10 uses) | no | Gemini chat and TTS in the Next route handlers |
| `SENTRY_ORG`, `SENTRY_PROJECT` | build | build | Sentry build plugin (`next.config.mjs`) |
| `SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING` | in env file | in env file | Sentry setting |
| `NODE_ENV`, `NEXT_RUNTIME` | yes | yes | Framework |

Variables prefixed `NEXT_PUBLIC_` are embedded in the browser bundle; `GEMINI_API_KEY` is only read in server route handlers.

## 6. Running locally

Prerequisites: Node.js and npm, the API running (or `NEXT_PUBLIC_API_URL` pointing at a deployed one).

```bash
# web (http://localhost:3000)
cd apps/web
npm install
# create .env.local with at least NEXT_PUBLIC_API_URL (e.g. http://localhost:4000/api),
# NEXT_PUBLIC_LEARN_URL=http://localhost:3002 and GEMINI_API_KEY for the AI features
npm run dev

# learn (http://localhost:3002)
cd apps/learn
npm install
# .env.local with NEXT_PUBLIC_API_URL, NEXT_PUBLIC_MAIN_URL=http://localhost:3000
npm run dev
```

Scripts (both apps): `dev`, `build`, `start`, `lint`. Learn's `dev` and `start` bind port 3002. In development, `apps/web/next.config.mjs` rewrites `/learn/:path*` to `http://localhost:3002/:path*`. The API CORS list in the backend allows `http://localhost:3000` and `http://localhost:3001`; learn on 3002 is not in that list, so browser calls from a local learn app to the API need the allow-list in the API's `main.ts` extended.

Tests (web only): Jest is configured for `**/__tests__/**/*.test.ts` (AI chat route, STT/TTS controllers, auth headers, market config); run with `npx jest` from `apps/web`.

## 7. Deployment

- Both apps deploy to Vercel. Each has a `.vercel/` link folder and a `vercel.json`. `render.yaml` in the repo root describes only the NestJS API, not the frontends.
- `apps/web/vercel.json`: `functions` entry `app/**/*.tsx` with `maxDuration: 30`. The Next route handlers set their own limits (`ai/chat` 60 s, TTS 25 s).
- `apps/learn/vercel.json`: `framework: nextjs`, `installCommand: npm install`, `buildCommand: npm run build`.
- Both `next.config.mjs` files: wrapped with `next-intl` and `withSentryConfig` (source maps hidden, console debug logging removed); `poweredByHeader: false`; AVIF/WebP images with remote patterns for `res.cloudinary.com` and `lh3.googleusercontent.com`; long-lived cache headers for `/_next/static` and `/fonts`; security headers on all routes (HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP same-origin). Web allows camera and microphone for itself; learn allows camera, microphone, display capture and fullscreen (live sessions).
- Production deploys of the web app go to `www.deveways.com` (see the project `CLAUDE.md`: `cd apps/web && npx vercel --prod`).
- Each app has `robots.ts` and `sitemap.ts`. Web's sitemap and metadata use `https://www.deveways.com`; learn uses `https://devewayhub.vercel.app` as `metadataBase`.
