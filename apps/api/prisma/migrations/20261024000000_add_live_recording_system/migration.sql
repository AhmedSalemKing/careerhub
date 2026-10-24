-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('SCHEDULED', 'STARTING', 'LIVE', 'ENDING', 'ENDED');

-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('PENDING', 'STARTING', 'RECORDING', 'STOPPING', 'PROCESSING', 'UPLOADING', 'READY', 'FAILED', 'NEEDS_ATTENTION');

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "status" "LiveSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveRecording" (
    "id" TEXT NOT NULL,
    "liveSessionId" TEXT NOT NULL,
    "status" "RecordingStatus" NOT NULL DEFAULT 'PENDING',
    "resourceId" TEXT,
    "sid" TEXT,
    "b2Key" TEXT,
    "bunnyVideoId" TEXT,
    "lastError" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveRecording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "externalId" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LiveSession_channelName_key" ON "LiveSession"("channelName");

-- CreateIndex
CREATE UNIQUE INDEX "LiveRecording_liveSessionId_key" ON "LiveRecording"("liveSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "LiveRecording_sid_key" ON "LiveRecording"("sid");

-- AddForeignKey
ALTER TABLE "LiveRecording" ADD CONSTRAINT "LiveRecording_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
