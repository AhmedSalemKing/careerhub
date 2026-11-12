CREATE TABLE IF NOT EXISTS "packages" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "pathKind" TEXT NOT NULL DEFAULT 'TRACK',
    "courseIds" TEXT[],
    "originalPrice" DOUBLE PRECISION,
    "finalPrice" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "packages_pathId_idx" ON "packages"("pathId");
CREATE INDEX IF NOT EXISTS "packages_isActive_idx" ON "packages"("isActive");
