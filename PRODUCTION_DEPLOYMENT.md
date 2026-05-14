# DeveWay 🚀 Production Deployment Guide

## Prerequisites
- Node.js 20.x
- PostgreSQL 15 (Supabase)
- Redis (for Bull queues)
- Cloudinary account
- Stripe account (live keys)
- SendGrid account (verified sender)
- Sentry project (DSN)
- Render account (API)
- Vercel account (Web + Learn)

## Deployment Order
1. Database: Run Prisma migrations on Supabase
2. API: Deploy to Render
3. Web: Deploy to Vercel
4. Learn: Deploy to Vercel

## Environment Variables — API (Render)
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=<min 32 chars random>
JWT_REFRESH_SECRET=<min 32 chars random>
FRONTEND_URL=https://www.deveways.com
LEARN_URL=https://devewayhub.vercel.app
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=no-reply@deveways.com
GROQ_API_KEY=gsk_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
REDIS_URL=redis://...
AGORA_APP_ID=...
AGORA_APP_CERTIFICATE=...
SENTRY_DSN=https://...@sentry.io/...
NODE_ENV=production
PORT=10000
```

## Environment Variables — Web (Vercel)
```
NEXT_PUBLIC_API_URL=https://deve-way.onrender.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_SENTRY_DSN=...
```

## Environment Variables — Learn (Vercel)
```
NEXT_PUBLIC_API_URL=https://deve-way.onrender.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_SENTRY_DSN=...
```

## Database Migration
```bash
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

## Post-Deploy Checklist
- [ ] Test /api/health endpoint returns ok
- [ ] Test /api/health/live and /api/health/ready
- [ ] Test user registration flow
- [ ] Test login with Google OAuth
- [ ] Test course enrollment
- [ ] Test payment flow
- [ ] Test certificate generation
- [ ] Test forgot password email
- [ ] Test admin login
- [ ] Verify Sentry receives test error
- [ ] Verify Stripe webhook is registered
- [ ] Submit sitemap to Google Search Console

## Google Search Console
1. Go to search.google.com/search-console
2. Add property: www.deveways.com
3. Verify via HTML file or DNS record
4. Submit sitemap: https://www.deveways.com/sitemap.xml
