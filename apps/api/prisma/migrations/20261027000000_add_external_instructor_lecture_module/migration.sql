-- CreateEnum
CREATE TYPE "ExternalLectureStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ExternalInstructor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "specialty" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalInstructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalLecture" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT,
    "lectureDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "ExternalLectureStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalLecture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalLecture_instructorId_idx" ON "ExternalLecture"("instructorId");

-- CreateIndex
CREATE INDEX "ExternalLecture_courseId_idx" ON "ExternalLecture"("courseId");

-- CreateIndex
CREATE INDEX "ExternalLecture_lectureDate_idx" ON "ExternalLecture"("lectureDate");

-- CreateIndex
CREATE INDEX "ExternalLecture_status_idx" ON "ExternalLecture"("status");

-- AddForeignKey
ALTER TABLE "ExternalLecture" ADD CONSTRAINT "ExternalLecture_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "ExternalInstructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
