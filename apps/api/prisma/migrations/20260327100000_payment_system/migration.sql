-- Payment System Migration
-- Convert PaymentMethod and PaymentStatus enums to plain strings
-- Add stripeIntentId, make description optional

-- Step 1: Convert method column from enum to text
ALTER TABLE "payments" ALTER COLUMN "method" TYPE TEXT USING method::TEXT;

-- Step 2: Convert status column from enum to text
ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "status" TYPE TEXT USING status::TEXT;
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Step 3: Make description optional
ALTER TABLE "payments" ALTER COLUMN "description" DROP NOT NULL;

-- Step 4: Add currency default
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'SAR';

-- Step 5: Add method default
ALTER TABLE "payments" ALTER COLUMN "method" SET DEFAULT 'STRIPE_CARD';

-- Step 6: Add stripeIntentId column
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "stripeIntentId" TEXT;

-- Step 7: Drop unused enum types (after columns are converted)
DROP TYPE IF EXISTS "PaymentMethod";
DROP TYPE IF EXISTS "PaymentStatus";
