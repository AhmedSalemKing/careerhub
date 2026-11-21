# DeveWay Backend Overview

Source of truth: `apps/api` (NestJS). Generated from the code in the repository; where the older README/SETUP files disagree with the code, this document follows the code.

## 1. Architecture

DeveWay is a monorepo (`apps/api`, `apps/web`, `apps/learn`). The backend is a single NestJS application that exposes a REST API under the global prefix `/api` (configurable with `API_PREFIX`), plus one Socket.IO gateway (`/live` namespace) and Bull background jobs.

Request pipeline (from `src/main.ts` and `src/app.module.ts`):

1. Cache-Control is forced to `no-cache` on every response.
2. Body limits: JSON and urlencoded up to 100 MB.
3. Static files: `/uploads` served from `UPLOADS_PATH` (default `./uploads`).
4. Helmet (CSP, HSTS, frameguard deny), `X-Robots-Tag: noindex`.
5. CORS whitelist: `deveway-teal.vercel.app`, `devewayhub.vercel.app`, `www.deveways.com`, `localhost:3000`, `localhost:3001`. Credentials enabled.
6. Compression, morgan, custom logger middleware, cookie-parser.
7. CSRF middleware on `/api/auth`, `/api/wallet`, `/api/admin`, `/api/payments`, `/api/certificates`.
8. Global `ValidationPipe` (whitelist, forbidNonWhitelisted, transform).
9. Global `HttpExceptionFilter`, `TransformInterceptor` (wraps responses as `{ success, data, meta }`), `CurrencyInterceptor`.
10. Global guard: `ThrottlerGuard` only (three buckets: 10 per second, 100 per minute, 500 per 15 minutes). There is NO global JWT guard; authentication is applied per controller or per route with `JwtAuthGuard`.
11. Swagger UI at `/api/docs` when `NODE_ENV` is not `production`.
12. Raw health endpoint `GET /health` (answered in `main.ts`), plus `GET /api/health` from the health module.

Authorization model: `JwtAuthGuard` (honours the `@Public()` decorator), `RolesGuard` with `@Roles(...)` (matches either `user.role` or `user.accountType`; `SUPER_ADMIN` bypasses every role check), `OptionalJwtGuard` (attaches the user when a token is present), `RefreshGuard`, `StreamAuthGuard`.

## 2. NestJS modules

31 feature modules in `src/modules`, plus `PrismaModule`, `AuditModule` (`src/common/services`), and the `exchange-rate` service. All are registered in `AppModule`.

| Module | Responsibility |
|---|---|
| auth | Register, login, refresh, logout, password reset, email verification, Google OAuth, admin login, auto-login token, account type and pro-field updates |
| users | Profile, avatar, dashboard, enrollments, certificates, notifications, settings, account deletion, activity tracking |
| career | Career paths, AI and classic assessments, recommendations, skills, market insights, user path selection |
| career-ai | AI career interview sessions (Gemini/Groq over HTTP), SSE chat, report generation, TTS, voice token |
| compass | Career Compass: versioned question bank, branching, scoring and matching engines, reports |
| tracks | Learning tracks shown on the home page and `/careers`; admin CRUD |
| packages | Priced course bundles for a track or career path (the `packages` table) |
| courses | Course catalog, search, enrollment, progress, instructor tools, bundles |
| lessons | Lesson content, progress, notes, discussion, admin lesson CRUD |
| quizzes | Student quiz attempts and instructor quiz authoring/grading |
| video | Video upload URLs, playback, thumbnails, Cloudflare and Bunny webhooks |
| upload | File, image, CV, video and document uploads; Cloudinary, Bunny Stream, local/S3 storage; file sharing |
| certificates | Certificate generation (Puppeteer/canvas, Bull queue), verification by serial |
| coaching | Legacy coach model (coaches, slots, coaching sessions, packages, reviews), scheduling, Zoom |
| consulting | Consultant marketplace: slots, session booking, approval, reschedule, payment, Daily rooms |
| sessions | Older consulting-session API (`/api/sessions`), still used by the learn app; wallet payment, earnings |
| live | Live course streaming (Daily rooms, Agora recording pipeline), recording to B2 then Bunny; Socket.IO gateway |
| webhook | `POST /api/webhooks/daily` (Daily.co meeting-ended events) |
| payments | Stripe Checkout for courses, packages and consulting sessions; Stripe webhook; invoices |
| payment | Stripe PaymentIntent flow for courses (`/api/payment`) |
| wallet | Wallet balance, Stripe top-up, pay with wallet, coach earnings transfer |
| cart | Shopping cart of courses |
| ratings | Course ratings |
| verification | Identity (ID card) verification submit/approve/reject |
| notifications | In-app notifications, email (SendGrid, Bull processor), push (Firebase), SMS (Twilio), templates |
| analytics | Event tracking and admin/user analytics |
| instructor-reports | Instructor and consultant lecture logs, collective reports, Excel and PDF export |
| admin | Back-office API: users, courses, approvals, payments, settings, CMS, activity, exchange rates, maintenance tools |
| ai | Generic AI conversations and chat (`/api/ai`) |
| email | Shared email service |
| csrf | CSRF token endpoint |
| health | Health and metrics endpoints |

Cross-cutting pieces in `src/common`: `mentor-price.ts` (keeps the mentor price in sync), filters, interceptors, middleware (CSRF, logger, activity tracking), `AuditService` and `ActivityService` (security log and user activity, with a WebSocket feed).

## 3. Tech stack (versions from `apps/api/package.json`)

| Area | Technology | Version range |
|---|---|---|
| Language | TypeScript | ^5.9.3 |
| Runtime | Node.js | 20.11.0 on Render (`NODE_VERSION`); SETUP.md says 18+ |
| Framework | NestJS common / core / platform-express | ^11.1.17 / ^10.4.22 / ^10.4.22 (mixed majors in package.json) |
| ORM | Prisma and @prisma/client | ^5.22.0 |
| Database | PostgreSQL (Supabase in production) | 13+ |
| Queue | Bull / @nestjs/bull; Redis via ioredis | ^4.12.2 / ^11.0.4; ^5.3.2 |
| Auth | @nestjs/jwt, passport, passport-jwt, passport-google-oauth20, bcrypt | ^10.1.1, ^0.7.0, ^4.0.1, ^2.0.0, ^5.1.1 |
| Validation | class-validator, class-transformer, joi | ^0.14.1, ^0.5.1, ^17.12.0 |
| Realtime | socket.io, @nestjs/websockets | ^4.8.3, ^11.1.19 |
| Payments | stripe | ^20.4.1 |
| AI | Groq and Gemini REST APIs called over HTTP (`api.groq.com`, `generativelanguage.googleapis.com`); `@anthropic-ai/sdk` ^0.80.0 and `openai` ^4.24.7 are declared | see note |
| Media | cloudinary, Bunny Stream (HTTP), Cloudflare Stream (HTTP), sharp, ffmpeg-static | ^2.9.0, n/a, n/a, ^0.33.5, ^5.2.0 |
| Storage | @aws-sdk/client-s3 and aws-sdk (both present) | ^3.1156.0, ^2.1547.0 |
| Documents | puppeteer, pdfkit, pdfmake, exceljs, qrcode, @napi-rs/canvas | ^21.9.0, ^0.18.0, ^0.3.13, ^4.4.0, ^1.5.3, ^0.1.99 |
| Email/Push | nodemailer, @sendgrid/mail (dev dependency), firebase-admin | ^6.9.8, ^7.7.0, ^13.7.0 |
| Monitoring | @sentry/node, @sentry/nestjs | ^10.53.1 |
| Security | helmet, csurf, @nestjs/throttler | ^7.1.0, ^1.11.0, ^5.0.1 |
| Docs | @nestjs/swagger, swagger-ui-express | ^7.1.14, ^5.0.0 |
| Tests | jest, ts-jest, supertest | ^29.7.0, ^29.1.2, ^6.3.4 |

Notes: `@sendgrid/mail` is listed under devDependencies. `@nestjs/mongoose`, `@nestjs/elasticsearch` and `elasticsearch` are declared, but nothing in `src/` imports them. `@anthropic-ai/sdk` is also declared but not imported anywhere in `src/`; all AI calls go to Groq and Gemini. These are candidates for cleanup.

## 4. Folder structure (`apps/api`)

```
apps/api
  package.json, nest-cli.json, tsconfig*.json
  README.md, SETUP.md, DEVEWAY_DOCUMENTATION.md
  prisma/
    schema.prisma            68 models, 16 enums
    migrations/              33 migration folders + migration_lock.toml
    dbml/schema.dbml         generated diagram of the schema
    seed.ts / seed.js
  scripts/, tests/
  src/
    main.ts                  bootstrap, middleware, Swagger
    app.module.ts            module wiring, Joi env validation, Throttler, Bull
    prisma/                  PrismaModule + PrismaService
    common/
      decorators/ dto/ filters/ guards/ interceptors/ middleware/ pipes/ utils/
      services/              audit, activity
      mentor-price.ts
    middleware/              http-logger, track-activity
    exchange-rate/           exchange-rate.service.ts
    config/ assets/ scripts/ seed-categories.ts
    modules/
      admin  ai  analytics  auth  career  career-ai  cart  certificates
      coaching  compass  consulting  courses  csrf  email  health
      instructor-reports  lessons  live  notifications  packages
      payment  payments  quizzes  ratings  sessions  tracks  upload
      users  verification  video  wallet  webhook
```

Each module normally contains `*.controller.ts`, `*.service.ts`, `*.module.ts` and an optional `dto/` folder.

## 5. Running locally

From `SETUP.md`/`README.md`, corrected against `package.json`:

Prerequisites: Node.js 18+ (Render uses 20.11), PostgreSQL 13+, Redis 6+ (Bull queues for email and certificates). `docker-compose.yml` at the repo root starts PostgreSQL 15 and Redis 7.

```bash
cd apps/api
npm install                 # postinstall runs prisma generate
cp .env.example .env        # then fill in values
npx prisma migrate deploy   # or: npm run db:migrate (dev) / npm run db:push
npm run db:seed             # optional
npm run start:dev           # watch mode, default port from PORT (main.ts falls back to 10000)
```

Useful scripts: `npm run build` (prisma generate + nest build), `npm run start:prod`, `npm test`, `npm run test:e2e`, `npm run lint`, `npm run type-check`, `npm run db:studio`, `npm run migrate:status`.

Local URLs: API at `http://localhost:<PORT>/api`, Swagger at `/api/docs`. Note `.env.example` sets `PORT=4000`, while the code defaults to `10000` when `PORT` is unset.

## 6. Environment variables

Required by the Joi schema in `app.module.ts`: `DATABASE_URL`, `JWT_SECRET` (min 32 chars), `JWT_REFRESH_SECRET` (min 32 chars). Prisma also needs `DIRECT_URL` (used by migrations; see `schema.prisma`).

Variables listed in `.env.example` (placeholders only; never commit real values):

| Group | Variables |
|---|---|
| Database | `DATABASE_URL` (plus `DIRECT_URL`, required by the Prisma datasource, not in `.env.example`) |
| JWT | `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` |
| Redis | `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` |
| Rate limiting | `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` |
| AWS S3 | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Cloudflare Stream | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_EMAIL` |
| Bunny Stream | `BUNNY_API_KEY`, `BUNNY_LIBRARY_ID`, `BUNNY_CDN_HOSTNAME` |
| SendGrid / email | `SENDGRID_API_KEY`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`, `SUPPORT_EMAIL`, `FROM_EMAIL`, `SENDGRID_FROM_EMAIL`, `SMTP_*` |
| Firebase | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| Twilio / SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SMS_PROVIDER`, `SMS_TEST_NUMBER` |
| Zoom | `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_WEBHOOK_SECRET_TOKEN` |
| Frontend URLs / CORS | `FRONTEND_URL`, `LEARN_URL`, `CORS_ORIGIN` |
| AI | `GROQ_API_KEY` |
| API | `PORT`, `NODE_ENV`, `API_PREFIX` |
| Uploads | `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES`, `MAX_VIDEO_SIZE`, `VIDEO_QUALITY` |
| Analytics / monitoring | `GOOGLE_ANALYTICS_ID`, `MIXPANEL_TOKEN`, `SENTRY_DSN`, `LOG_LEVEL` |
| Misc / flags | `CACHE_TTL`, `CACHE_MAX_SIZE`, `SESSION_*`, `BACKUP_*`, `BCRYPT_ROUNDS`, `ENABLE_*` feature flags |

Variables the code reads but `.env.example` does not list (found by searching `src/`): `DIRECT_URL`, `GEMINI_API_KEY`, `GEMINI_CHAT_MODEL`, `GEMINI_LIVE_MODEL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDFLARE_WATERMARK_ID`, `CLOUDFLARE_WEBHOOK_SIGNING_KEY`, `DAILY_API_KEY`, `DAILY_DOMAIN`, `UPLOADS_PATH`, `SOCKET_CORS_ORIGIN`, `SMS_API_KEY`, `SMS_API_SECRET`, `SMS_SENDER`, `APP_URL`, `API_URL`, `NEXT_PUBLIC_WEB_URL`, `EMAIL_TEMPLATES_DIR`, `ENABLE_METRICS`, `REDIS_DB`, `CACHE_CHECK_PERIOD`, `CACHE_MAX_ITEMS`. The Agora and Backblaze B2 variables (`AGORA_*`, `B2_*`) are set in `render.yaml` for the live-recording pipeline.

## 7. Deployment

- Host: Render, defined in `render.yaml` (service `deveway-api`, `runtime: node`, `plan: free`, `rootDir: apps/api`, `autoDeploy: true`).
- Build: `npm install && npm run build`.
- Pre-deploy: `npx prisma migrate deploy` (uses `DIRECT_URL`; with Supabase this must be the session pooler on port 5432, not the IPv6-only direct host and not the 6543 transaction pooler).
- Start: `npm run start:prod` (`node dist/main`). Health check path: `/api/health`.
- Secrets are set in the Render dashboard (`sync: false`), including `DATABASE_URL`, `DIRECT_URL`, `JWT_*`, `AGORA_*`, `B2_*`, `BUNNY_*`, `DAILY_*`, `FRONTEND_URL`.
- Database: PostgreSQL on Supabase. Redis is required for Bull queues.
- Frontends deploy separately to Vercel (production domain `www.deveways.com`); the API base used by CORS is `https://deve-way.onrender.com`.
- Error tracking: Sentry when `SENTRY_DSN` is set.
