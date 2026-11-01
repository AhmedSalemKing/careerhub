-- CreateEnum
CREATE TYPE "CompassDimension" AS ENUM ('CONTEXT', 'INTERESTS', 'SKILLS', 'BEHAVIORAL_INDICATORS', 'MOTIVATION', 'WORK_PREFERENCES', 'MARKET_READINESS');

-- CreateEnum
CREATE TYPE "CompassQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTI_SELECT', 'RANKING', 'RATING_SCALE', 'SHORT_TEXT', 'SCENARIO', 'PRACTICAL_MINI');

-- CreateEnum
CREATE TYPE "CompassSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "CompassQuestionStatus" AS ENUM ('PENDING', 'PRESENTED', 'ANSWERED', 'SKIPPED');

-- CreateTable
CREATE TABLE "compass_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compass_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compass_stages" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "stageNumber" INTEGER NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,

    CONSTRAINT "compass_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compass_questions" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "dimension" "CompassDimension" NOT NULL,
    "type" "CompassQuestionType" NOT NULL,
    "textAr" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "hintAr" TEXT,
    "hintEn" TEXT,
    "isBaseline" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "minAnswers" INTEGER,
    "maxAnswers" INTEGER,
    "maxFollowUpDepth" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "compass_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compass_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "textAr" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "compass_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compass_follow_up_rules" (
    "id" TEXT NOT NULL,
    "triggerQuestionId" TEXT NOT NULL,
    "triggerOptionId" TEXT,
    "triggerCondition" TEXT,
    "followUpQuestionId" TEXT NOT NULL,
    "dimension" "CompassDimension" NOT NULL,
    "reasonAr" TEXT NOT NULL,
    "reasonEn" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "compass_follow_up_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compass_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "status" "CompassSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStage" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (now() + interval '30 days'),

    CONSTRAINT "compass_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compass_session_questions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "presentedOrder" INTEGER NOT NULL,
    "status" "CompassQuestionStatus" NOT NULL DEFAULT 'PENDING',
    "branchingReason" TEXT,
    "followUpDepth" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "compass_session_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compass_answers" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rankingOrder" JSONB,
    "textValue" TEXT,
    "ratingValue" INTEGER,
    "isFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "followUpDepth" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compass_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compass_dimension_evidence" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "interests" INTEGER,
    "skills" INTEGER,
    "behavioralIndicators" INTEGER,
    "motivation" INTEGER,
    "workPreferences" INTEGER,
    "marketReadiness" INTEGER,
    "careerFitScore" INTEGER,
    "confidence" INTEGER,
    "scoringVersion" TEXT,
    "evidenceFindings" JSONB NOT NULL DEFAULT '{}',
    "skillDiscrepancies" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "compass_dimension_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compass_reports" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "profileSummaryAr" TEXT,
    "profileSummaryEn" TEXT,
    "candidatePaths" JSONB NOT NULL DEFAULT '[]',
    "strengthsAr" JSONB NOT NULL DEFAULT '[]',
    "strengthsEn" JSONB NOT NULL DEFAULT '[]',
    "skillGapsAr" JSONB NOT NULL DEFAULT '[]',
    "skillGapsEn" JSONB NOT NULL DEFAULT '[]',
    "experienceGapsAr" JSONB NOT NULL DEFAULT '[]',
    "experienceGapsEn" JSONB NOT NULL DEFAULT '[]',
    "learningRoadmapAr" JSONB NOT NULL DEFAULT '{}',
    "learningRoadmapEn" JSONB NOT NULL DEFAULT '{}',
    "limitations" TEXT,
    "aiNarrativeAr" TEXT,
    "aiNarrativeEn" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compass_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "compass_versions_version_key" ON "compass_versions"("version");

-- CreateIndex
CREATE INDEX "compass_versions_isActive_idx" ON "compass_versions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "compass_stages_versionId_stageNumber_key" ON "compass_stages"("versionId", "stageNumber");

-- CreateIndex
CREATE INDEX "compass_questions_versionId_idx" ON "compass_questions"("versionId");

-- CreateIndex
CREATE INDEX "compass_questions_dimension_idx" ON "compass_questions"("dimension");

-- CreateIndex
CREATE INDEX "compass_questions_stageId_isBaseline_idx" ON "compass_questions"("stageId", "isBaseline");

-- CreateIndex
CREATE INDEX "compass_sessions_userId_status_idx" ON "compass_sessions"("userId", "status");

-- CreateIndex
CREATE INDEX "compass_sessions_userId_completedAt_idx" ON "compass_sessions"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "compass_session_questions_sessionId_presentedOrder_idx" ON "compass_session_questions"("sessionId", "presentedOrder");

-- CreateIndex
CREATE UNIQUE INDEX "compass_session_questions_sessionId_questionId_key" ON "compass_session_questions"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "compass_answers_sessionId_idx" ON "compass_answers"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "compass_answers_sessionId_questionId_key" ON "compass_answers"("sessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "compass_dimension_evidence_sessionId_key" ON "compass_dimension_evidence"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "compass_reports_sessionId_key" ON "compass_reports"("sessionId");

-- AddForeignKey
ALTER TABLE "compass_stages" ADD CONSTRAINT "compass_stages_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "compass_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_questions" ADD CONSTRAINT "compass_questions_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "compass_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_questions" ADD CONSTRAINT "compass_questions_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "compass_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_options" ADD CONSTRAINT "compass_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "compass_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_follow_up_rules" ADD CONSTRAINT "compass_follow_up_rules_triggerQuestionId_fkey" FOREIGN KEY ("triggerQuestionId") REFERENCES "compass_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_follow_up_rules" ADD CONSTRAINT "compass_follow_up_rules_triggerOptionId_fkey" FOREIGN KEY ("triggerOptionId") REFERENCES "compass_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_follow_up_rules" ADD CONSTRAINT "compass_follow_up_rules_followUpQuestionId_fkey" FOREIGN KEY ("followUpQuestionId") REFERENCES "compass_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_sessions" ADD CONSTRAINT "compass_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_sessions" ADD CONSTRAINT "compass_sessions_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "compass_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_session_questions" ADD CONSTRAINT "compass_session_questions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "compass_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_session_questions" ADD CONSTRAINT "compass_session_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "compass_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_answers" ADD CONSTRAINT "compass_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "compass_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_answers" ADD CONSTRAINT "compass_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "compass_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_dimension_evidence" ADD CONSTRAINT "compass_dimension_evidence_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "compass_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compass_reports" ADD CONSTRAINT "compass_reports_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "compass_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

