-- Remove legacy external instructor/lecture tables.
-- These were never present in production (Render logs show "table does not exist"),
-- but IF EXISTS keeps this migration idempotent and safe on any environment.
DROP TABLE IF EXISTS "ExternalLecture" CASCADE;
DROP TABLE IF EXISTS "ExternalInstructor" CASCADE;
DROP TABLE IF EXISTS "lecture_records" CASCADE;
DROP TYPE IF EXISTS "ExternalLectureStatus";
DROP TYPE IF EXISTS "LectureRecordStatus";

-- CreateEnum
CREATE TYPE "LectureStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "instructor_lectures" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT,
    "deliveredAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "LectureStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_lectures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "instructor_lectures_instructorId_status_idx" ON "instructor_lectures"("instructorId", "status");
CREATE INDEX "instructor_lectures_courseId_idx" ON "instructor_lectures"("courseId");
CREATE INDEX "instructor_lectures_deliveredAt_idx" ON "instructor_lectures"("deliveredAt");

-- AddForeignKey
ALTER TABLE "instructor_lectures" ADD CONSTRAINT "instructor_lectures_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "instructor_lectures" ADD CONSTRAINT "instructor_lectures_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
