<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0 (MINOR — 6 principles replacing 5; Performance-First
is new; all principles materially expanded with concrete, enforceable rules)

Modified principles (old title → new title):
  I.  Module Isolation           → I.  Clean Architecture
  II. Type Safety                → IV. Maintainable and Readable Code (absorbed + expanded)
  III.API Contract First         → V.  Production-Ready Standards (absorbed + expanded)
  IV. Security by Default        → II. Secure Backend (expanded)
  V.  Observability              → VI. Error Handling and Logging (expanded)
  [NEW]                          → III.Performance-First Mindset

Added sections: none
Removed sections: none

Templates:
  ✅ .specify/templates/plan-template.md — Constitution Check section present;
     gates reference generic principle names, compatible with updated titles.
  ✅ .specify/templates/spec-template.md — No constitution-specific references;
     compatible as-is.
  ✅ .specify/templates/tasks-template.md — Foundational phase guidance aligns
     with new Performance-First (caching/pagination tasks) and Clean Architecture
     (module setup tasks) principles.
  ✅ .specify/templates/agent-file-template.md — Generic; no outdated references.
  ℹ  .specify/templates/commands/ — Directory does not exist yet; no command files
     to update.

Deferred TODOs: None.
-->

# CareerHub Constitution

## Core Principles

### I. Clean Architecture

**Goal**: Every part of the system MUST have a single, clear responsibility.
The monorepo MUST remain three independently deployable units.

**Rules — Monorepo boundaries:**
- `apps/api`, `apps/web`, and `apps/learn` MUST each build and deploy independently.
  A change in one app MUST NOT require a code change in a sibling app to keep it
  functional.
- Frontend apps MUST communicate with the backend exclusively through the typed API
  client (`src/lib/api.ts`). Raw `fetch`/`axios` calls in page or component files
  are not permitted.

**Rules — API module design:**
- Every NestJS module MUST be self-contained: one controller, one service, one
  module file, and its own DTOs. No cross-module file imports — only exported
  NestJS services consumed via the module's `exports` array.
- Controllers MUST contain zero business logic and zero database calls. They
  receive a validated DTO, call one service method, and return the result.
- Prisma calls MUST live exclusively in service files. No `prisma.find*` in
  controllers, guards, or interceptors.
- Cross-cutting concerns (auth, logging, validation, rate-limiting) MUST be
  implemented as NestJS guards, interceptors, pipes, or middleware — never
  duplicated inline in individual route handlers.
- Shared utilities MUST live in `src/common/`; shared types in `src/common/dto/`
  or `src/common/interfaces/`. No logic duplication across modules.

**Rules — Frontend component design:**
- Pages (`page.tsx`) MUST contain only layout composition and data-fetching setup.
  Business logic, API calls, and state management belong in hooks or service files.
- Reusable UI elements MUST be placed in `src/app/components/`. Page-specific
  components stay co-located in the page directory.

**Rationale**: The platform spans three apps, 15+ API modules, and 10+ external
integrations. Without hard boundaries, changes become unpredictably expensive and
testing becomes impractical.

### II. Secure Backend

**Goal**: Security is non-negotiable and MUST be the default, not an opt-in.
No route, endpoint, or piece of user data is accessible unless explicitly
authorized.

**Rules — Authentication:**
- ALL NestJS routes are JWT-protected by default. Public routes MUST be explicitly
  annotated with `@Public()`. Any new `@Public()` usage requires a written
  justification in the PR.
- Access tokens MUST be short-lived (≤15 min). Refresh tokens MUST be stored
  as `httpOnly` cookies — never in `localStorage` or exposed via JS.
- Passwords MUST be hashed with bcrypt at a minimum cost factor of 10. Plaintext
  passwords MUST never appear in logs, error messages, or API responses.

**Rules — Authorization:**
- Role-based access control MUST use `@Roles(UserRole.X)` with `RolesGuard` at
  the route level AND ownership/permission checks inside the service. Guard-only
  RBAC is insufficient — service-layer checks prevent privilege escalation through
  indirect calls.
- Users MUST only access their own resources unless they hold COACH or ADMIN role.
  Resource ownership MUST be validated against the authenticated userId in every
  service method that returns or mutates user-scoped data.

**Rules — Input & transport:**
- The global `ValidationPipe` (with `whitelist: true`, `forbidNonWhitelisted: true`,
  `transform: true`) MUST be applied to all routes. No request body reaches a
  service without passing DTO validation.
- File uploads MUST validate MIME type against an allowlist and enforce a maximum
  byte size before any processing begins.
- Auth endpoints (`/auth/login`, `/auth/register`, `/auth/forgot-password`) MUST
  be covered by `ThrottlerGuard`. Brute-force protection is non-negotiable.
- CORS MUST explicitly list allowed origins. Wildcard (`*`) origins are prohibited
  in `NODE_ENV=production`.
- Helmet security headers MUST be enabled in production.

**Rules — Secrets:**
- No secret, API key, or credential MUST ever be committed to version control.
  All required secrets MUST be documented in `.env.example` with placeholder values.
- Error responses returned to clients MUST never include stack traces, internal
  error messages, or database error details. Use generic messages in production.

**Rationale**: CareerHub processes Stripe payments, issues verifiable certificates,
stores personal career profiles, and handles coach-student relationships. A single
authorization bypass or credential leak carries outsized legal and reputational risk.

### III. Performance-First Mindset

**Goal**: The system MUST remain fast under realistic load without requiring
heroic optimizations later. Performance decisions are made at design time,
not incident time.

**Rules — Database:**
- All `findMany` queries MUST include pagination (`skip`/`take`). No unbounded
  list queries are permitted. Maximum page size is 100 records.
- Prisma `select` MUST be used to fetch only the fields needed by the caller.
  `findUnique`/`findMany` that returns every column of a wide table when only
  two fields are needed is a violation.
- N+1 queries are prohibited. Use Prisma `include` for related data or batch
  IDs into a single `findMany({ where: { id: { in: [...] } } })`. Loops that
  call `prisma.find*` per iteration MUST be refactored.
- Database indices MUST be defined on all foreign keys and any field used in
  a `where` clause of a query that runs at request time.

**Rules — Caching:**
- Redis caching via `cache-manager-ioredis` is MANDATORY for: course listings,
  career path data, user profiles (read path), and any data that is expensive
  to compute and changes infrequently. Cache TTLs MUST be explicitly set — no
  infinite TTLs on mutable data.
- AI assessment responses, once generated, MUST be cached or persisted — never
  re-computed on repeated requests for the same input.

**Rules — Background processing:**
- Operations that take >200ms or involve external network calls MUST run in Bull
  queues, not in the HTTP request/response cycle. This includes: email sending,
  certificate PDF generation, video processing callbacks, AI operations on large
  inputs, and batch analytics writes.

**Rules — Frontend:**
- All server state MUST be managed with TanStack React Query. `staleTime` MUST
  be explicitly configured per query — never rely on default `0` for data that
  does not change per-request.
- All images MUST use the Next.js `<Image>` component with explicit `width`,
  `height`, and `sizes` props. The `priority` prop is reserved for above-the-fold
  LCP images only.
- Heavy components (rich text editors, charts, PDF viewers) MUST use
  `next/dynamic` with `ssr: false`. They MUST NOT block initial page hydration.
- The `compression` middleware MUST remain enabled on the API. Gzip/Brotli for
  all API responses is non-negotiable.

**Rationale**: Course pages, lesson players, and the AI assessment flow are the
core user journeys. Slow responses or unresponsive UIs directly drive churn. With
Cloudflare, Stripe, Firebase, and the AI backend in the critical path, every
unnecessary blocking call compounds latency.

### IV. Maintainable and Readable Code

**Goal**: Any engineer joining the team MUST be able to understand, modify, and
test any module within hours, not days.

**Rules — TypeScript:**
- TypeScript strict mode (`"strict": true`) is MANDATORY across all apps. The
  `any` type is prohibited without an inline comment explaining why a safe type
  is not feasible.
- Prisma-generated types are the canonical source of truth for database entity
  shapes. Do not declare equivalent plain interfaces — import from `@prisma/client`.
- Enums defined in the Prisma schema (`UserRole`, `CourseStatus`, `SessionStatus`,
  etc.) MUST be used consistently. String literals that duplicate enum values
  are a violation.

**Rules — Function and module size:**
- Service methods MUST do one thing. A method exceeding ~40 lines is a signal to
  extract a private helper or a dedicated sub-service.
- No magic numbers or inline string literals for domain values. Use the Prisma
  enums or named constants in `src/common/constants/`.
- No commented-out code MUST be merged to the main branch. Dead code is deleted,
  not preserved in comments.

**Rules — Naming and structure:**
- React components: PascalCase (`CourseCard.tsx`).
- NestJS services, guards, pipes: PascalCase class names, kebab-case filenames
  (`courses.service.ts`).
- Utility functions: camelCase.
- Each NestJS module handles ONE domain. The `courses` module handles courses;
  it MUST NOT contain enrollment business logic that belongs in its own concern.

**Rules — PRs:**
- PR descriptions MUST explain WHY the change is being made, not just what files
  were changed. Reviewers need context, not a diff summary.
- PRs MUST remain focused on a single concern. Mixing a bug fix, a refactor, and
  a new feature in one PR makes review and rollback unreliable.

**Rationale**: A codebase with 15+ modules, 3 apps, and AI/payment integrations
becomes unmaintainable quickly if conventions are inconsistent. Readability is a
force multiplier for the entire team's velocity.

### V. Production-Ready Standards

**Goal**: Features MUST be built to work correctly under production conditions
from day one, not hardened as an afterthought.

**Rules — Correctness gates:**
- `tsc --noEmit` (type-check) and `eslint` MUST both pass before any branch is
  merged. These gates are not bypassed under any urgency.
- `npm run build` MUST succeed in CI for all three apps. A build failure on
  `master` is a P0 incident.
- Features MUST be verified against the full running stack (API + DB + Redis),
  not only against mocks or isolated unit tests.

**Rules — Configuration and environment:**
- Application startup MUST perform fail-fast validation of all required environment
  variables using Joi or `@nestjs/config` schema validation. A missing required
  var MUST throw at boot, not silently default to an insecure or broken value.
- Every environment variable introduced by a feature MUST be added to `.env.example`
  in the same PR.
- `NODE_ENV` MUST be respected for: CORS policy, error message verbosity, Helmet
  configuration, and log level.

**Rules — API contracts:**
- All API endpoints MUST have Swagger decorators (`@ApiOperation`, `@ApiResponse`,
  `@ApiBody`/`@ApiParam`) authored in the same PR as the implementation — never
  retrofitted later.
- Breaking API changes (removed or renamed fields, changed types, removed endpoints)
  MUST be flagged explicitly in the PR. Production-facing breaking changes require
  a versioned migration path.
- Prisma schema migrations MUST be tested against a staging database before
  applying to production. Destructive migrations (column/table drops) MUST be
  split across two PRs: first make the app tolerant of the old schema, then drop.

**Rules — External service resilience:**
- Any feature that depends on an external service (Stripe, Anthropic, Firebase,
  Twilio, S3, Cloudflare) MUST implement graceful degradation or a circuit-breaker
  pattern so that a third-party outage does not render core functionality unusable.
- AI-dependent features MUST have a non-AI fallback path or a clear user-facing
  degraded state. The AI call failing MUST NOT produce a 500 error to the user.

**Rules — No `console.log`:**
- `console.log`, `console.error`, `console.warn` are prohibited in committed code.
  Use the NestJS `Logger` in the API and structured log utilities in frontends.

**Rationale**: Technical debt created by "we'll harden it later" decisions is
compound-interest debt. In a payment-processing, certificate-issuing platform with
live coaching sessions, a production defect has immediate, visible user impact.

### VI. Error Handling and Logging

**Goal**: Every failure MUST be captured, contextualized, and surfaced at the
appropriate level — no silent failures, no raw stack traces to end users.

**Rules — Service-layer error handling:**
- Every service method that performs I/O (database, external API, file system,
  queue) MUST be wrapped in try/catch. Errors MUST be logged with structured
  context before being re-thrown or converted to an `HttpException`.
- Silent failure — catching an exception and returning a default value or `null`
  without logging — is prohibited.
- All `HttpException` subclasses MUST be used for API error responses
  (`NotFoundException`, `ForbiddenException`, `BadRequestException`, etc.).
  Raw `new Error()` MUST NOT be thrown in controllers or services handling
  HTTP requests.

**Rules — Log structure:**
Every log entry at WARN level or above MUST include:
- `timestamp` (ISO 8601)
- `level` (`error` | `warn` | `info` | `debug`)
- `service` (NestJS module/class name via `Logger` context)
- `userId` (when available from the request context)
- `resourceId` (entity id being acted upon, when applicable)
- `operation` (method name or action description)
- `message` (human-readable description)
- `error.message` and `error.stack` (on error level)

**Rules — External service calls:**
- Every call to Stripe, Anthropic, Firebase, Twilio, S3, and Cloudflare MUST be
  wrapped in try/catch with specific error handling. Generic catch-all swallowing
  is not acceptable.
- Stripe webhook handlers MUST validate the event signature before processing.
  Processing an unverified webhook event is a security violation.
- Bull job failure handlers MUST log the full job data and error to enable
  manual replay debugging.

**Rules — Health and observability:**
- The `/api/health` endpoint MUST remain operational and cover: PostgreSQL
  reachability, Redis connectivity, and a lightweight ping to at least one
  critical external service.
- Analytics events MUST be emitted (to the analytics module or event bus) for
  all key user lifecycle actions: account registration, course enrollment,
  lesson completion, assessment completed, certificate earned, payment confirmed,
  coaching session scheduled/completed.

**Rules — Frontend error boundaries:**
- Every Next.js page or layout that fetches data MUST handle error states
  explicitly — showing a user-friendly message, not a raw error object or a
  blank screen.
- React Query `onError` callbacks MUST display toast notifications via the
  project's `notify` utility (`src/lib/notify.ts`), not `console.error`.

**Rationale**: The platform integrates 10+ external services across async job
queues, real-time websockets, and AI pipelines. Without consistent structured
logging and explicit error boundaries, diagnosing production failures is a
needle-in-a-haystack problem that compounds under pressure.

## Technology Stack Constraints

The approved stack is fixed. New major runtime dependencies require a documented
justification (problem statement, alternatives considered, chosen solution) in the
PR before merging.

| Layer | Approved Technology |
|---|---|
| API framework | NestJS (TypeScript) |
| Database | PostgreSQL via Prisma ORM |
| Cache / Queues | Redis + ioredis + Bull |
| Auth | JWT via `@nestjs/passport` + `passport-jwt` |
| File storage | AWS S3 (`@aws-sdk/client-s3`) |
| Video | Cloudflare Stream |
| Payments | Stripe |
| Email | SendGrid + Nodemailer |
| Push notifications | Firebase Admin SDK |
| SMS | Twilio |
| AI | Anthropic Claude SDK (`@anthropic-ai/sdk`) — primary |
| Frontend framework | Next.js 14 (App Router) |
| Styling | TailwindCSS + Radix UI primitives |
| State (client) | Zustand (global) + TanStack React Query (server) |
| i18n | next-intl (languages: `ar`, `en`) |
| Forms | React Hook Form + Zod |

AI features MUST use the Anthropic Claude SDK as the primary provider. OpenAI
(`openai` package) is present as a fallback; new AI features MUST default to
Anthropic unless a documented capability gap exists.

Database schema changes MUST go through Prisma migrations (`prisma migrate dev`).
Direct schema edits without a migration file are prohibited on shared branches.

## Development Workflow

Feature work MUST follow the speckit workflow:

1. Spec authored and reviewed (`/speckit.spec`) before implementation begins.
2. Implementation plan produced (`/speckit.plan`) and approved before coding.
3. Tasks broken down (`/speckit.tasks`) with explicit user-story grouping.
4. Each user story MUST be independently testable as an MVP increment before
   the next story begins.

Shortcuts to any of these steps require explicit agreement and MUST be noted
in the PR.

## Governance

This constitution supersedes all informal conventions, README guidelines, and
prior verbal agreements. When a conflict arises between this document and any
other artifact, this constitution takes precedence.

**Amendments**: Any principle addition, removal, or material redefinition requires
a PR that: (a) updates this file, (b) increments the version per the policy below,
(c) documents the motivation, and (d) lists downstream artifacts requiring updates.
The PR MUST be reviewed before merging.

**Versioning policy**:
- MAJOR: A principle removed, redefined incompatibly, or a gate added that
  invalidates existing widespread patterns.
- MINOR: New principle or section added, or materially expanded guidance.
- PATCH: Clarifications, wording improvements, typo fixes.

**Compliance review**: All PRs MUST self-attest compliance via the Constitution
Check in the implementation plan. Reviewers are responsible for flagging violations.
Justified complexity deviations MUST be recorded in the plan's Complexity Tracking
table; undocumented deviations are grounds for blocking merge.

**Version**: 1.1.0 | **Ratified**: 2026-04-03 | **Last Amended**: 2026-04-03
