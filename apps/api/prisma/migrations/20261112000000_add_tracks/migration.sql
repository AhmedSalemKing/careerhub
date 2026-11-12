-- CreateTable
CREATE TABLE IF NOT EXISTS "tracks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descAr" TEXT NOT NULL,
    "descEn" TEXT NOT NULL,
    "weeks" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "levelEn" TEXT NOT NULL,
    "languages" TEXT NOT NULL,
    "vision2030" TEXT[],
    "priceEG" DOUBLE PRECISION,
    "priceKSA" DOUBLE PRECISION,
    "sessionPrice" DOUBLE PRECISION,
    "sessionPriceKSA" DOUBLE PRECISION,
    "skills" TEXT[],
    "skillsEn" TEXT[],
    "jobs" JSONB NOT NULL DEFAULT '[]',
    "courses" JSONB NOT NULL DEFAULT '[]',
    "freeItemsAr" TEXT[],
    "freeItemsEn" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "country" TEXT NOT NULL DEFAULT 'BOTH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tracks_slug_key" ON "tracks"("slug");
CREATE INDEX IF NOT EXISTS "tracks_isActive_idx" ON "tracks"("isActive");
