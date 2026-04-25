# DeveWay Platform - Complete Technical Documentation

A comprehensive guide for developers to understand and work on the DeveWay platform without asking questions.

---

## 1. Project Overview

**Platform Name:** DeveWay (ديموِвей)

**Purpose:** AI-powered career development platform that helps users discover career paths, learn professional courses, get certified, and receive coaching from industry experts.

**Target Audience:**
- Students seeking tech careers
- Professionals looking to upskill
- Instructors creating courses
- Consultants offering career guidance

### Tech Stack Summary
- **Backend:** NestJS 10/11, Prisma 5, PostgreSQL, Redis (Bull queues)
- **Frontend (Main):** Next.js 14 (App Router), React 18, Zustand, TanStack Query
- **Frontend (Learn):** Next.js 14 (App Router), React 18
- **Payments:** Stripe integration
- **File Storage:** Cloudinary, AWS S3
- **Email:** SendGrid
- **AI:** Groq (Llama-3.3-70b)
- **Authentication:** JWT + Refresh tokens

### Live URLs
- **Main Web App:** https://deveway-teal.vercel.app (apps/web)
- **Learn App:** https://devewayhub.vercel.app (apps/learn)
- **API (Primary):** https://deve-way.onrender.com (apps/api)
- **API (Mirror):** https://devewayhub.onrender.com

---

## 2. Architecture

### Monorepo Structure
```
careerhub/
├── apps/
│   ├── api/           # NestJS API (Port 3001)
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── admin/
│   │       │   ├── courses/
│   │       │   ├── payments/
│   │       │   ├── wallet/
│   │       │   ├── certificates/
│   │       │   ├── notifications/
│   │       │   ├── verification/
│   │       │   ├── coaching/
│   │       │   ├── sessions/
│   │       │   ├── users/
│   │       │   ├── upload/
│   │       │   └── ai/
│   │       ├── common/
│   │       ├── middleware/
│   │       └── main.ts
│   ├── web/           # Next.js Main App (Port 3000)
│   │   └── src/
│   │       ├── app/
│   │       ├── components/
│   │       ├── stores/
│   │       └── lib/
│   └── learn/         # Next.js Learn App (Port 3002)
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   ├── stores/
│       │   └── lib/
├── DEVEWAY_DOCUMENTATION.md
└── package.json
```

### Service Communication Diagram
```
┌─────────────────┐
│  Browser        │
│  (Web/Learn)    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────────────────────────────┐
│                    Vercel / Render                       │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │ apps/web    │    │ apps/learn  │                  │
│  │ :3000       │    │ :3002       │                  │
│  └──────┬───────┘    └──────┬───────┘                  │
│         │ API calls         │                           │
│         ▼                  ▼                           │
│  ┌────────────────��─────────────────────────────┐     │
│  │           apps/api (:3001)                   │     │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────┐│     │
│  │  │ Auth   │ │Courses │ │Wallet  │ │...  ││     │
│  │  └────────┘ └────────┘ └────────┘ └─────┘│     │
│  └───────────────────────┬─────────────────────┘     │
│                          │                           │
│         ┌───────────────┼───────────────┐           │
│         ▼               ▼               ▼             │
│  ┌──────────┐   ┌──────────┐    ┌──────────┐     │
│  │PostgreSQL │   │ Redis    │    │Cloudinary │     │
│  │Supabase  │   │ Bull MQ  │    │ AWS S3   │     │
│  └──────────┘   └──────────┘    └──────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Authentication Flow
1. **Register:** User submits email/password → API creates user → Returns JWT access token + HTTP-only refresh cookie
2. **Login:** User submits credentials → API validates → Returns JWT + refresh cookie
3. **Token Refresh:** Client sends cookie + access token → API validates → Returns new tokens
4. **Session Invalidation:** Logout clears refresh tokens from database

---

## 3. Database Schema (from schema.prisma)

### Enums

```prisma
enum UserRole {
  USER        // Regular user
  COACH       // Coaching provider
  ADMIN      // Platform admin
  SUPER_ADMIN // Full system access
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum AssessmentStatus {
  IN_PROGRESS
  COMPLETED
  EXPIRED
}

enum CourseStatus {
  DRAFT          // Not published
  PENDING_REVIEW // Awaiting admin approval
  PUBLISHED     // Live
  REJECTED      // Rejected by admin
  ARCHIVED      // Hidden
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  SUSPENDED
  CANCELLED
}

enum LessonStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

enum SessionStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum NotificationType {
  COURSE_ENROLLMENT
  LESSON_COMPLETED
  CERTIFICATE_EARNED
  COACHING_REMINDER
  PAYMENT_CONFIRMED
  SYSTEM_ANNOUNCEMENT
  VERIFICATION_APPROVED
  VERIFICATION_REJECTED
  USER_APPROVED
  USER_REJECTED
  USER_BANNED
  ROLE_CHANGED
  WALLET_TOPUP
  SESSION_BOOKED
  SESSION_CONFIRMED
  SESSION_CANCELLED
}

enum MessageType {
  TEXT
  FILE
  IMAGE
}
```

### Models

#### User
```prisma
model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  password          String
  role               UserRole  @default(USER)
  isActive          Boolean   @default(true)
  accountType       String    @default("STUDENT")  // STUDENT | INSTRUCTOR | CONSULTANT | ADMIN
  status            String    @default("ACTIVE")    // ACTIVE | PENDING | REJECTED | BANNED
  cvUrl             String?
  bio               String?
  experience       Int?
  speciality       String?
  linkedinUrl      String?
  hourlyRate       Float?
  meetingMethod    String?   // ZOOM | GOOGLE_MEET | BOTH
  googleId          String?   @unique
  provider         String    @default("local")
  stripeCustomerId String?
  approvedAt       DateTime?
  rejectedAt       DateTime?
  rejectedReason  String?
  lastSeenAt       DateTime?
  
  // Identity verification
  idVerificationStatus String   @default("UNVERIFIED")
  idFrontUrl           String?
  idBackUrl            String?
  idVerifiedAt        DateTime?
  idRejectedReason   String?
  isVerified         Boolean  @default(false)
  walletBalance      Float     @default(0)
  
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  deletedAt          DateTime?

  // Relations
  profile              UserProfile?
  sessions             Session[]
  enrollments          Enrollment[]
  certificates         Certificate[]
  payments             Payment[]
  coachingSessions    CoachingSession[]
  coachReviews         CoachReview[]
  notifications        Notification[]
  activities           UserActivity[]
  walletTransactions   WalletTransaction[]
  // ... more relations
}
```

#### UserProfile
```prisma
model UserProfile {
  id          String    @id @default(cuid())
  userId      String    @unique
  firstName   String
  lastName    String
  phone       String?
  dateOfBirth DateTime?
  gender      Gender?
  nationality String?
  country     String?
  city        String?
  avatar      String?
  bio         String?
  linkedinUrl String?
  timezone    String   @default("UTC")
  language    String   @default("en")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### Course
```prisma
model Course {
  id            String       @id @default(cuid())
  slug          String       @unique
  careerPathId  String?
  instructorId String?
  categoryId   String?
  titleEn      String
  titleAr      String?
  descriptionEn String?
  descriptionAr String?
  thumbnail    String?
  previewVideo String?
  price        Float        @default(0)
  currency     String       @default("USD")
  duration    Int?
  level        String       @default("BEGINNER")
  status       CourseStatus @default(DRAFT)
  isFeatured   Boolean     @default(false)
  sortOrder     Int         @default(0)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  modules      CourseModule[]
  sections     Section[]
  enrollments  Enrollment[]
  certificates Certificate[]
  payments     Payment[]
}
```

#### Enrollment
```prisma
model Enrollment {
  id           String           @id @default(cuid())
  userId       String
  courseId     String
  status       EnrollmentStatus @default(ACTIVE)
  progress     Float             @default(0)
  enrolledAt   DateTime         @default(now())
  completedAt  DateTime?
  expiresAt    DateTime?

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id])

  @@unique([userId, courseId])
}
```

#### Lesson
```prisma
model Lesson {
  id             String   @id @default(cuid())
  moduleId       String?
  sectionId      String?
  title          String
  titleAr        String?
  description    String?
  descriptionAr String?
  content        Json?    // Rich content
  type           String   @default("VIDEO")  // VIDEO | FILE | TEXT
  videoUrl       String?
  videoDuration  Int?
  fileUrl        String?
  fileName       String?
  fileSize       Int?
  isFree         Boolean  @default(false)
  order          Int      @default(0)
  isPublished   Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Certificate
```prisma
model Certificate {
  id              String    @id @default(cuid())
  userId          String
  courseId        String
  serialNumber    String    @unique
  certificateUrl  String
  qrCodeUrl       String
  issuedAt        DateTime  @default(now())
  expiresAt      DateTime?
}
```

#### Payment
```prisma
model Payment {
  id              String   @id @default(cuid())
  userId          String
  courseId        String?
  amount         Float
  currency       String   @default("SAR")
  method         String   @default("STRIPE_CARD")
  status         String   @default("PENDING")
  transactionId  String?  @unique
  stripeIntentId String?
  description    String?
  itemType       String?
  itemId         String?
  completedAt    DateTime?
  refundedAt     DateTime?
  metadata       Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

#### WalletTransaction
```prisma
model WalletTransaction {
  id                    String   @id @default(cuid())
  userId                String
  type                  String   // TOPUP | PAYMENT | REFUND
  amount                Float
  description           String?
  status                String   @default("SUCCESS")
  stripePaymentIntentId String?
  courseId              String?
  createdAt             DateTime @default(now())
}
```

#### ConsultingSession
```prisma
model ConsultingSession {
  id             String    @id @default(cuid())
  studentId     String
  consultantId  String
  scheduledAt   DateTime
  duration      Int       @default(60)
  meetingMethod String    @default("ZOOM")
  meetingLink   String?
  topic         String?
  notes         String?
  status        String    @default("PENDING")
  price         Float     @default(0)
  paymentStatus String    @default("UNPAID")
  paymentId     String?
  createdAt      DateTime  @default(now())
}
```

---

## 4. API Reference - Complete Endpoint List

### Base URL
```
Production: https://deve-way.onrender.com/api
Development: http://localhost:3001/api
```

### Authentication Required
- Endpoints marked with 🔒 require JWT Bearer token
- Format: `Authorization: Bearer <access_token>`

---

### Auth Module
`/api/auth`

#### POST /api/auth/register
- **Auth:** No
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "Ahmed",
  "lastName": "Ali",
  "phone": "+966501234567",
  "country": "Saudi Arabia",
  "city": "Riyadh",
  "language": "ar",
  "accountType": "STUDENT",  // STUDENT | INSTRUCTOR | CONSULTANT
  "cvUrl": "https://...",    // Required for INSTRUCTOR/CONSULTANT
  "bio": "...",
  "experience": 5,
  "speciality": "React",
  "hourlyRate": 150,
  "meetingMethod": "ZOOM",
  "avatar": "https://..."
}
```
- **Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGci..."
  }
}
```
- Sets HTTP-only `refresh_token` cookie

#### POST /api/auth/login
- **Auth:** No
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
- **Response:** Same as register + sets refresh cookie

#### POST /api/auth/refresh
- **Auth:** Yes (RefreshGuard - uses cookie)
- **Response:** New access token

#### POST /api/auth/logout
- **Auth:** 🔒
- **Response:** `{ success: true, message: "Logout successful" }`

#### GET /api/auth/me
- **Auth:** 🔒
- **Response:** Full user profile with profile data

#### PATCH /api/auth/profile
- **Auth:** 🔒
- **Request Body:** Any user profile fields to update
- **Response:** Updated user

#### POST /api/auth/forgot-password
- **Auth:** No
- **Request Body:** `{ "email": "user@example.com" }`
- **Response:** Always succeeds (prevents email enumeration)

#### POST /api/auth/reset-password
- **Auth:** No
- **Request Body:**
```json
{
  "email": "user@example.com",
  "token": "abc123...",
  "newPassword": "newSecurePassword"
}
```

#### POST /api/auth/change-password
- **Auth:** 🔒
- **Request Body:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword"
}
```

#### GET /api/auth/check-auth
- **Auth:** 🔒
- **Response:** `{ success: true, authenticated: true, user: {...} }`

#### POST /api/auth/admin/login
- **Auth:** No
- **Purpose:** Admin-specific login (validates role is ADMIN/SUPER_ADMIN)
- **Request Body:** Same as regular login
- **Response:** User data + tokens if admin

#### GET /api/auth/google
- **Auth:** No (Public)
- **Purpose:** Initiate Google OAuth

#### GET /api/auth/google/callback
- **Auth:** No (Public)
- **Purpose:** Handle OAuth callback

#### PATCH /api/auth/update-account-type
- **Auth:** 🔒
- **Request:** `{ "accountType": "INSTRUCTOR" }`

#### PATCH /api/auth/update-pro-fields
- **Auth:** 🔒
- **Request:** Update professional profile fields

---

### Admin Module
`/api/admin`

#### GET /api/admin/dashboard
- **Auth:** 🔒 (ADMIN only)
- **Response:** Dashboard overview with stats

#### GET /api/admin/stats/overview
- **Auth:** 🔒 (ADMIN only)
- **Response:** Platform statistics

#### GET /api/admin/users
- **Auth:** 🔒 (ADMIN only)
- **Query Params:** `page`, `limit`, `role`, `status`, `search`
- **Response:** Paginated user list

#### GET /api/admin/users/:id
- **Auth:** 🔒 (ADMIN)

#### PATCH /api/admin/users/:id
- **Auth:** 🔒 (ADMIN)
- **Request:** Update user data (role, isActive, email, profile)

#### DELETE /api/admin/users/:id
- **Auth:** 🔒 (ADMIN)

#### POST /api/admin/users/:id/suspend
- **Auth:** 🔒 (ADMIN)
- **Body:** `{ "reason": "..." }`

#### POST /api/admin/approve/:userId
- **Auth:** 🔒 (ADMIN)
- **Response:** User approved

#### POST /api/admin/reject/:userId
- **Auth:** 🔒 (ADMIN)
- **Body:** `{ "reason": "..." }`

#### GET /api/admin/pending-approvals
- **Auth:** 🔒 (ADMIN)
- **Response:** Users awaiting INSTRUCTOR/CONSULTANT approval

#### GET /api/admin/pending-courses
- **Auth:** 🔒 (ADMIN)
- **Response:** Courses pending review

#### POST /api/admin/courses/:id/approve
- **Auth:** 🔒 (ADMIN)

#### POST /api/admin/courses/:id/reject
- **Auth:** 🔒 (ADMIN)
- **Body:** `{ "reason": "..." }`

#### POST /api/admin/courses/create
- **Auth:** 🔒 (ADMIN)
- **Full Course Creation DTO**

#### GET /api/admin/payments
- **Auth:** 🔒 (ADMIN)
- **Response:** Confirmed payments only

#### GET /api/admin/audit-logs
- **Auth:** 🔒 (ADMIN)
- **Query:** `limit`

#### GET /api/admin/site-settings
- **Auth:** No (Public)
- **Response:** Site settings (colors, logo)

#### PATCH /api/admin/site-settings
- **Auth:** 🔒 (ADMIN)
- **Body:** `{ "primaryColor": "#5120c8", "buttonColor": "#5120c8", ... }`

#### GET /api/admin/activity/live
- **Auth:** 🔒 (ADMIN)
- **Query:** `limit`
- **Response:** Real-time user activity feed

---

### Courses Module
`/api/courses`

#### GET /api/courses
- **Auth:** No
- **Query:** `page`, `limit`, `careerPath`, `categoryId`, `level`, `search`, `language`

#### GET /api/courses/featured
- **Auth:** No
- **Query:** `limit`, `language`

#### GET /api/courses/categories
- **Auth:** No
- **Query:** `language`

#### GET /api/courses/levels/list
- **Auth:** No

#### GET /api/courses/search
- **Auth:** No

#### GET /api/courses/enrolled
- **Auth:** 🔒
- **Response:** User's enrolled courses

#### GET /api/courses/my-courses
- **Auth:** 🔒
- **Logic:** Returns enrolled courses for students, created courses for instructors

#### GET /api/courses/instructor/stats
- **Auth:** 🔒 (INSTRUCTOR)
- **Response:** Instructor dashboard stats

#### GET /api/courses/:slug
- **Auth:** No
- **Response:** Full course data with modules

#### GET /api/courses/:id/lessons
- **Auth:** No

#### POST /api/courses/:id/enroll
- **Auth:** 🔒

#### GET /api/courses/:id/enrollment
- **Auth:** 🔒
- **Response:** Enrollment status

#### POST /api/courses/:courseId/lessons/:lessonId/complete
- **Auth:** 🔒
- **Response:** Updated progress, may queue certificate

#### POST /api/courses/:courseId/lessons/:lessonId/heartbeat
- **Auth:** 🔒
- **Body:** `{ "seconds": 30 }`

#### POST /api/courses/:id/complete-check
- **Auth:** 🔒
- **Response:** Completion status + certificate URL if ready

#### GET /api/courses/recommendations
- **Auth:** 🔒

#### GET /api/courses/search/suggestions
- **Auth:** No

#### POST /api/courses
- **Auth:** 🔒 (INSTRUCTOR)
- **Create course**

#### PATCH /api/courses/:id
- **Auth:** 🔒 (INSTRUCTOR/ADMIN)
- **Update course**

#### DELETE /api/courses/:id
- **Auth:** 🔒 (ADMIN only)

#### PATCH /api/courses/:id/publish
- **Auth:** 🔒 (ADMIN only)

#### PATCH /api/courses/:id/unpublish
- **Auth:** 🔒 (ADMIN only)

---

### Wallet Module
`/api/wallet`

#### GET /api/wallet
- **Auth:** 🔒
- **Response:** Balance + recent transactions

#### POST /api/wallet/topup/create-intent
- **Auth:** 🔒
- **Request:** `{ "amount": 500 }` (SAR)
- **Response:** Stripe PaymentIntent client secret

#### POST /api/wallet/topup/confirm
- **Auth:** 🔒
- **Request:** `{ "paymentIntentId": "pi_..." }`

#### POST /api/wallet/pay/:courseId
- **Auth:** 🔒
- **Uses wallet balance to purchase course**

#### POST /api/wallet/transfer-from-earnings
- **Auth:** 🔒 (INSTRUCTOR/CONSULTANT)
- **Request:** `{ "amount": 500 }`
- **Transfer earnings to wallet balance**

---

### Sessions Module (Consulting)
`/api/sessions`

#### GET /api/sessions/consultants
- **Auth:** 🔒
- **Response:** Available consultants

#### GET /api/sessions/consultants/:id
- **Auth:** 🔒

#### POST /api/sessions/book
- **Auth:** 🔒
- **Request:**
```json
{
  "consultantId": "cuid_...",
  "scheduledAt": "2025-06-15T14:00:00Z",
  "duration": 60,
  "meetingMethod": "ZOOM",
  "topic": "Career guidance"
}
```

#### GET /api/sessions/my-sessions
- **Auth:** 🔒
- **Query:** `status`

#### PATCH /api/sessions/:id/confirm
- **Auth:** 🔒 (Consultant only)
- **Body:** `{ "meetingLink": "https://..." }`

#### PATCH /api/sessions/:id/reject
- **Auth:** 🔒

#### PATCH /api/sessions/:id/reschedule
- **Auth:** 🔒

#### PATCH /api/sessions/:id/cancel
- **Auth:** 🔒

#### POST /api/sessions/:id/pay
- **Auth:** 🔒
- **Response:** Stripe client secret or sandbox confirmation

#### POST /api/sessions/:id/confirm-payment
- **Auth:** 🔒
- **Body:** `{ "paymentIntentId": "pi_..." }`

#### GET /api/sessions/my-earnings
- **Auth:** 🔒 (Consultant)
- **Response:** Total earnings, pending, available

---

### Payments Module
`/api/payments`

#### GET /api/payments/user
- **Auth:** 🔒
- **Query:** `page`, `limit`, `status`

#### GET /api/payments/admin
- **Auth:** 🔒 (ADMIN)
- **Query:** `page`, `limit`, `status`, `userId`

---

### Certificates Module
`/api/certificates`

#### GET /api/certificates/my
- **Auth:** 🔒
- **Response:** User's certificates

#### GET /api/certificates/:serialNumber/verify
- **Auth:** No (Public)
- **Response:** Certificate details for verification

---

### Notifications Module
`/api/notifications`

#### GET /api/notifications
- **Auth:** 🔒
- **Query:** `page`, `limit`, `type`, `isRead`

#### POST /api/notifications/:id/read
- **Auth:** 🔒

#### POST /api/notifications/read-all
- **Auth:** 🔒

#### DELETE /api/notifications/:id
- **Auth:** 🔒

---

### Users Module
`/api/users`

#### GET /api/users/dashboard
- **Auth:** 🔒
- **Response:** User dashboard data

#### GET /api/users/progress
- **Auth:** 🔒

#### GET /api/users/achievements
- **Auth:** 🔒

#### GET /api/users/settings
- **Auth:** 🔒

#### PATCH /api/users/settings
- **Auth:** 🔒
- **Request:** `{ "language": "ar", "timezone": "Asia/Riyadh" }`

---

### Upload Module
`/api/upload`

#### POST /api/upload/cv (Public)
- **Auth:** No
- **File:** PDF/Word, max 5MB

#### POST /api/upload/image (Public)
- **Auth:** No
- **File:** Image, max 10MB

#### POST /api/upload/video (Public)
- **Auth:** No
- **File:** Video, max 500MB

#### POST /api/upload/file
- **Auth:** 🔒
- **File:** Document, max 50MB

#### GET /api/upload/my-files
- **Auth:** 🔒

#### DELETE /api/upload/:fileId
- **Auth:** 🔒

---

### AI Module
`/api/ai`

#### GET /api/ai/conversations
- **Auth:** 🔒

#### POST /api/ai/conversations
- **Auth:** 🔒
- **Request:** `{ "context": "dashboard" }`

#### GET /api/ai/conversations/:id
- **Auth:** 🔒

#### DELETE /api/ai/conversations/:id
- **Auth:** 🔒

#### POST /api/ai/chat
- **Auth:** 🔒
- **Request:** `{ "conversationId": "...", "message": "..." }`
- **Response:** Server-Sent Events (SSE) streaming response

---

### Verification Module
`/api/verification`

#### POST /api/verification/submit
- **Auth:** 🔒 (INSTRUCTOR/CONSULTANT)
- **Request:** `{ "idFrontUrl": "...", "idBackUrl": "..." }`

#### GET /api/verification/status
- **Auth:** 🔒

#### GET /api/verification/pending
- **Auth:** 🔒 (ADMIN)

#### POST /api/verification/:userId/approve
- **Auth:** 🔒 (ADMIN)

#### POST /api/verification/:userId/reject
- **Auth:** 🔒 (ADMIN)
- **Body:** `{ "reason": "..." }`

---

## 5. Frontend - Web App (deveway-teal.vercel.app)

### Route Structure

| Route | Component | Purpose | Auth Required |
|-------|-----------|---------|--------------|
| `/` | `page.tsx` | Landing page | No |
| `/:locale/login` | `login/page.tsx` | User login | No |
| `/:locale/register` | `register/page.tsx` | User registration | No |
| `/:locale/dashboard` | `dashboard/page.tsx` | User dashboard | Yes |
| `/:locale/dashboard/layout.tsx` | DashboardLayout | Dashboard shell | Yes |
| `/:locale/dashboard/wallet` | `wallet/page.tsx` | Wallet balance | Yes |
| `/:locale/dashboard/certificates` | `certificates/page.tsx` | My certificates | Yes |
| `/:locale/dashboard/settings` | `settings/page.tsx` | Account settings | Yes |
| `/:locale/coaching` | `coaching/page.tsx` | Coaching page | No |
| `/:locale/checkout/:courseId` | `checkout/[courseId]/page.tsx` | Course purchase | Yes |
| `/:locale/admin` | `admin/page.tsx` | Admin dashboard | Yes (Admin) |
| `/:locale/admin/users` | `admin/users/page.tsx` | User management | Yes (Admin) |
| `/:locale/admin/users/:id` | `admin/users/[id]/page.tsx` | User details | Yes (Admin) |
| `/:locale/admin/approvals` | `admin/approvals/page.tsx` | Pending approvals | Yes (Admin) |
| `/:locale/admin/courses` | `admin/courses/page.tsx` | Course management | Yes (Admin) |
| `/:locale/admin/create-course` | `admin/create-course/page.tsx` | Create course | Yes (Admin) |

### Key Components

#### Navbar.tsx
- **Location:** `apps/web/src/app/components/Navbar.tsx`
- **Purpose:** Main navigation with locale switcher, user menu
- **Props:** none (uses auth store)

#### NotificationBell.tsx
- **Location:** `apps/web/src/app/components/NotificationBell.tsx`
- **Purpose:** Shows unread notification count, opens notification panel
- **Props:** none

#### VerifiedBadge.tsx
- **Location:** `apps/web/src/components/VerifiedBadge.tsx`
- **Purpose:** Shows green checkmark for verified users/instructors
- **Props:** `size?: "sm" | "md" | "lg"`, `showTooltip?: boolean`

#### CourseCard.tsx
- **Location:** `apps/web/src/app/components/CourseCard.tsx`
- **Purpose:** Display course thumbnail, title, price, instructor

---

## 6. Frontend - Learn App (devewayhub.vercel.app)

### Route Structure

| Route | Component | Purpose | Auth Required |
|-------|-----------|---------|--------------|
| `/` | `page.tsx` | Course catalog | No |
| `/:locale/courses` | `courses/page.tsx` | Browse courses | No |
| `/:locale/courses/[id]` | `courses/[id]/page.tsx` | Course details | No |
| `/:locale/learn/:courseId]` | `learn/[courseId]/page.tsx` | Video player | Yes |
| `/:locale/my-courses` | `my-courses/page.tsx` | Enrolled courses | Yes |
| `/:locale/certificate/:serial]` | `certificate/[serial]/page.tsx` | Verify certificate | No (Public) |

### Key Features
- Video player with lesson progress tracking
- Certificate verification by serial number
- Course progress display

---

## 7. State Management

### AuthStore (Zustand)
**Location:** `apps/web/src/stores/authStore.ts`

```typescript
interface AuthState {
  user: User | null;
  isHydrated: boolean;
  
  // Actions
  hydrate: () => Promise<void>;
  login: (credentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data) => Promise<void>;
}
```

### Data Stored
- **user:** Current user object (id, email, role, accountType, profile)
- **accessToken:** JWT for API authentication
- **isHydrated:** Whether store has been initialized from cookies

### Auth Flow
1. App loads → `hydrate()` checks cookies
2. If refresh token exists → `GET /auth/check-auth` → Set user/token
3. Login/Register → Store user + tokens in cookies
4. Logout → Clear cookies → Reset state

---

## 8. Notification System

### Notification Types
| Type | When Generated |
|------|-------------|
| `COURSE_ENROLLMENT` | User enrolls in course |
| `LESSON_COMPLETED` | User completes a lesson |
| `CERTIFICATE_EARNED` | Certificate is generated |
| `PAYMENT_CONFIRMED` | Payment succeeds |
| `WALLET_TOPUP` | Wallet is recharged |
| `USER_APPROVED` | Admin approves instructor |
| `USER_REJECTED` | Admin rejects application |
| `USER_BANNED` | Admin bans user |
| `SESSION_BOOKED` | Consulting session is booked |
| `SESSION_CONFIRMED` | Consultant confirms session |
| `SESSION_CANCELLED` | Session is cancelled |

### Frontend Display
- NotificationBell component shows unread count
- Notifications panel from dashboard
- In-app toast notifications (using sonner)

---

## 9. Activity Tracking

### TrackActivityMiddleware
**Location:** `apps/api/src/middleware/track-activity.middleware.ts`

Tracks:
- User authentication (login/logout)
- Course views and searches
- Lesson progress
- Payments

### UserActivity Model
```prisma
model UserActivity {
  id        String   @id @default(cuid())
  userId    String
  action    String   // LOGIN, VIEW_COURSE, SEARCH_COURSES, ENROLL_COURSE, PAYMENT, etc.
  entity    String?  // Course, User, etc.
  entityId  String?
  metadata  Json?
  ipAddress String?
  createdAt DateTime @default(now())
}
```

Admin can view activity feed via `/api/admin/activity/live`

---

## 10. File Upload System

### Supported Files
| Endpoint | File Type | Max Size | Auth Required |
|----------|----------|---------|--------------|
| `/api/upload/cv` | PDF, Word | 5MB | No (Public) |
| `/api/upload/image` | Images | 10MB | No |
| `/api/upload/video` | Video | 500MB | No |
| `/api/upload/file` | Documents | 50MB | Yes |
| `/api/upload/single` | Any | Varies | Yes |

### Cloudinary Integration
- Images/videos go to Cloudinary by default
- Folder structure: `deveway/{cvs,images,videos,files}`
- Public URL returned in response

### Local Fallback
- Files stored in `/uploads` folder
- Static serve at `/uploads/*`

---

## 11. Payment System

### Stripe Integration
- PaymentIntents API for secure payments
- Supports SAR currency
- Webhook for payment confirmation

### Wallet System
- Users can preload wallet balance
- Use balance for course purchases
- Transaction history tracked

### Earnings System
- Instructors earn from course sales
- Consultants earn from sessions
- Can transfer earnings to wallet

### Transfer Flow
1. Course/session payment received
2. System records earnings (consultant/instructor)
3. User requests transfer via `/api/wallet/transfer-from-earnings`
4. Earnings moved to wallet balance

---

## 12. Certificate System

### Generation Process
1. User completes course (progress = 100%)
2. Certificate generation queued via Bull
3. Canvas renders certificate with:
   - Student name
   - Course title
   - Issue date
   - Instructor name/signature
   - Unique serial number
4. QR code added linking to verification page
5. Uploaded to Cloudinary
6. Notification sent to student

### Certificate Verification
- Public endpoint: `GET /:serial/verify` (or certificate page)
- Returns: Student name, course title, issue date
- Serial format: `DVW-<timestamp>-<uuid>`

### Template
- Uses `@napi-rs/canvas` for rendering
- Fonts: Playfair Display, Cormorant Garamond, Great Vibes
- QR code via `qrcode` package
- Sharp for image compositing

---

## 13. Identity Verification

### Flow
1. User (INSTRUCTOR/CONSULTANT) submits ID via `/api/verification/submit`
2. Status set to `PENDING`
3. Admin reviews via `/api/admin/pending-verifications`
4. Admin approves/rejects via `/api/verification/:id/approve|reject`
5. User gets notification of result
6. If verified, shows green verified badge

### Requirements
- Front and back of national ID
- Clear, legible images
- Must match account name

### Badge Display
- VerifiedBadge component shows checkmark
- Only for verified users (typically instructors/consultants)

---

## 14. Deployment

### Render (API)

**Service:** deve-way (main)
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Environment:** Node.js 20

**Service:** devewayhub (API mirror)
- Same as above for redundancy

**Environment Variables Required:**
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
STRIPE_SECRET_KEY=sk_...
SENDGRID_API_KEY=SG....
GROQ_API_KEY=gsk_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://deveway-teal.vercel.app
LEARN_URL=https://devewayhub.vercel.app
```

### Vercel (Frontend)

**Project:** deveway-teal (apps/web)
- **Framework:** Next.js 14
- **Build Command:** `next build`
- **Output Directory:** `.next`

**Project:** devewayhub (apps/learn)
- Same framework settings

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://deve-way.onrender.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 15. Environment Variables

### API (.env)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | Yes | For Prisma direct connection |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret |
| `STRIPE_SECRET_KEY` | No | Stripe payment processing |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing |
| `SENDGRID_API_KEY` | No | Email delivery |
| `GROQ_API_KEY` | No | AI chat functionality |
| `CLOUDINARY_CLOUD_NAME` | No | File storage |
| `CLOUDINARY_API_KEY` | No | File storage |
| `CLOUDINARY_API_SECRET` | No | File storage |
| `AWS_ACCESS_KEY_ID` | No | S3 backup storage |
| `AWS_SECRET_ACCESS_KEY` | No | S3 backup storage |
| `AWS_S3_BUCKET` | No | S3 bucket name |
| `FRONTEND_URL` | Yes | For links in emails |
| `LEARN_URL` | Yes | For certificate verification |
| `REDIS_URL` | No | For Bull job queues |

### Web (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MAIN_URL=http://localhost:3000
NEXT_PUBLIC_LEARN_URL=http://localhost:3002
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Learn (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3002
NEXT_PUBLIC_MAIN_URL=http://localhost:3000
```

---

## 16. Database

### Supabase
- **Project:** DeveWay Career Platform
- **Region:** AWS Middle East (UAE)
- **Connection:** PostgreSQL 15 via Prisma

### Tables (Core)
- users
- user_profiles
- sessions
- courses
- sections
- lessons
- enrollments
- lesson_progress
- certificates
- payments
- notifications
- wallets/wallet_transactions
- consulting_sessions
- coaches/coaching_sessions/coach_reviews

### Manual SQL Migrations
Run any manual migrations via Supabase SQL Editor:
```sql
-- Example migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS walletBalance FLOAT DEFAULT 0;
```

---

## 17. Known Issues & Solutions

### Certificate Generation Issues
- **Issue:** Fonts not loading in canvas
- **Solution:** Register fonts from @fontsource packages explicitly

### Refresh Token Rotation
- **Issue:** Multiple devices
- **Solution:** New refresh token issued each login, old ones invalidated

### CORS Issues
- **Issue:** local dev mismatches
- **Fix:** Ensure CORS includes localhost:3000/3002 in main.ts

### Payment Webhooks
- **Issue:** Stripe webhook signature validation
- **Fix:** Verify using STRIPE_WEBHOOK_SECRET

---

## 18. Admin Credentials

### Creating First Admin
```typescript
// Via seed or direct database insert
const hashedPassword = await bcrypt.hash('Admin@123', 12);
await prisma.user.create({
  data: {
    email: 'admin@deveway.com',
    password: hashedPassword,
    role: 'ADMIN',
    accountType: 'ADMIN',
    status: 'ACTIVE',
    profile: { create: { firstName: 'Admin', lastName: 'Admin' } }
  }
});
```

### Default Admin
- **Email:** admin@deveway.com (create via seed)
- **Password:** Set during initial setup

---

## 19. Quick Reference

### Common Commands
```bash
# API
cd apps/api
npm run start:dev     # Start dev server
npm run build       # Production build
npm run lint        # Lint code

# Web
cd apps/web
npm run dev        # Start dev
npm run build      # Production build

# Learn
cd apps/learn
npm run dev        # Start dev

# Database
npx prisma studio  # Open database UI
npx prisma generate  # Generate client
```

### API Development
- All controllers in `apps/api/src/modules/`
- JWT auth in `modules/auth/`
- Add new modules to `app.module.ts`

### Frontend Development
- Pages in `apps/web/src/app/` and `apps/learn/src/app/`
- Components in `apps/web/src/components/`
- Stores use Zustand in `stores/`

---

## 20. Troubleshooting Tips

### Authentication Issues
1. Check JWT_SECRET is 32+ characters
2. Verify cookie settings (httpOnly, secure, sameSite)
3. Check token expiration in auth service

### Payment Failures
1. Verify Stripe keys in environment
2. Check webhook endpoint is reachable
3. Check payment intent status in Dashboard

### File Upload Issues
1. Check Cloudinary credentials
2. Verify file size limits in multer config
3. Check Content-Type headers

### Database Connection
1. Verify DATABASE_URL format
2. Check Supabase project status
3. Ensure network access (firewall)

---

*Document Version: 1.0*
*Last Updated: 2026-04-25*