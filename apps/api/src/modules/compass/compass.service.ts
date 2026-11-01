import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { CompassVersion, CompassQuestion, CompassOption, CompassFollowUpRule } from '@prisma/client'
import { buildEvidenceFindings, computeConfidence } from './scoring.engine'
import { selectFollowUps, getInvalidatedFollowUpIds, type BranchingContext } from './branching.engine'
import { findCandidatePaths } from './matching.engine'
import type { CreateSessionDto } from './dto/create-session.dto'
import type { SubmitAnswersDto } from './dto/submit-answers.dto'
import type { AnswerRecord, CompassQuestionDto, CompassSessionState, CompassSessionDetail } from './types'
import { STAGE_COUNT } from './types'

type QuestionWithRelations = CompassQuestion & {
  options: CompassOption[]
  stage: { stageNumber: number; titleAr: string; titleEn: string }
}

@Injectable()
export class CompassService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(userId: string, dto: CreateSessionDto): Promise<CompassSessionState> {
    const version = await this.resolveVersion(dto.versionId)

    const stage1 = await this.prisma.compassStage.findUniqueOrThrow({
      where: { versionId_stageNumber: { versionId: version.id, stageNumber: 1 } },
      include: {
        questions: {
          where: { isBaseline: true },
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    })

    const session = await this.prisma.compassSession.create({
      data: { userId, versionId: version.id, currentStage: 1 },
    })

    // Track baseline Stage 1 questions
    if (stage1.questions.length > 0) {
      await this.prisma.compassSessionQuestion.createMany({
        data: stage1.questions.map((q, i) => ({
          sessionId: session.id,
          questionId: q.id,
          presentedOrder: i + 1,
          status: 'PRESENTED' as const,
          followUpDepth: 0,
        })),
      })
    }

    const totalBaseline = await this.prisma.compassQuestion.count({
      where: { versionId: version.id, isBaseline: true },
    })

    return {
      sessionId: session.id,
      versionId: version.id,
      status: session.status,
      currentStage: 1,
      totalStages: STAGE_COUNT,
      progress: { answeredBaseline: 0, totalBaseline, answeredFollowUp: 0 },
      currentStageData: {
        stageNumber: stage1.stageNumber,
        titleAr: stage1.titleAr,
        titleEn: stage1.titleEn,
        questions: stage1.questions.map(q => this.toQuestionDto(q as QuestionWithRelations)),
      },
      pendingFollowUps: [],
    }
  }

  async getSession(sessionId: string, userId: string): Promise<CompassSessionDetail> {
    const session = await this.findSessionForUser(sessionId, userId)

    const version = await this.prisma.compassVersion.findUniqueOrThrow({
      where: { id: session.versionId },
    })

    const currentStageData = await this.prisma.compassStage.findUnique({
      where: { versionId_stageNumber: { versionId: version.id, stageNumber: session.currentStage } },
      include: {
        questions: {
          where: { isBaseline: true },
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    })

    const pendingFollowUps = await this.prisma.compassSessionQuestion.findMany({
      where: { sessionId, status: 'PENDING', question: { isBaseline: false } },
      orderBy: { presentedOrder: 'asc' },
      include: { question: { include: { options: { orderBy: { order: 'asc' } } } } },
    })

    const answers = await this.prisma.compassAnswer.findMany({ where: { sessionId } })
    const answeredIds = answers.map(a => a.questionId)

    const totalBaseline = await this.prisma.compassQuestion.count({
      where: { versionId: session.versionId, isBaseline: true },
    })

    return {
      sessionId: session.id,
      versionId: session.versionId,
      status: session.status,
      currentStage: session.currentStage,
      totalStages: STAGE_COUNT,
      progress: {
        answeredBaseline: answers.filter(a => !a.isFollowUp).length,
        totalBaseline,
        answeredFollowUp: answers.filter(a => a.isFollowUp).length,
      },
      currentStageData: currentStageData
        ? {
            stageNumber: currentStageData.stageNumber,
            titleAr: currentStageData.titleAr,
            titleEn: currentStageData.titleEn,
            questions: (currentStageData.questions as QuestionWithRelations[]).map(q =>
              this.toQuestionDto(q),
            ),
          }
        : undefined,
      pendingFollowUps: pendingFollowUps.map(sq =>
        this.toQuestionDto(sq.question as QuestionWithRelations, sq.branchingReason ?? undefined),
      ),
      answeredQuestionIds: answeredIds,
    }
  }

  async submitAnswers(
    sessionId: string,
    userId: string,
    dto: SubmitAnswersDto,
  ): Promise<{ followUpQuestions: CompassQuestionDto[]; nextStage: number | null; isComplete: boolean; progress: object }> {
    const session = await this.findSessionForUser(sessionId, userId)
    if (session.status !== 'IN_PROGRESS') {
      throw new ConflictException('Session is not in progress')
    }

    const version = await this.prisma.compassVersion.findUniqueOrThrow({
      where: { id: session.versionId },
    })

    // Validate all question IDs belong to this version and stage
    const questionIds = dto.answers.map(a => a.questionId)
    const questions = await this.prisma.compassQuestion.findMany({
      where: { id: { in: questionIds }, versionId: version.id },
      include: { options: true },
    })
    if (questions.length !== questionIds.length) {
      throw new BadRequestException('One or more question IDs are invalid for this assessment version')
    }

    // Answer-change handling: invalidate downstream follow-ups for changed answers
    const existingAnswers = await this.prisma.compassAnswer.findMany({ where: { sessionId } })
    const changedQuestionIds = questionIds.filter(id => existingAnswers.some(a => a.questionId === id))

    if (changedQuestionIds.length > 0) {
      const allRules = await this.prisma.compassFollowUpRule.findMany({
        where: { triggerQuestionId: { in: changedQuestionIds } },
      })
      const answeredSet = new Set(existingAnswers.map(a => a.questionId))
      const toInvalidate: string[] = []
      for (const qid of changedQuestionIds) {
        toInvalidate.push(...getInvalidatedFollowUpIds(qid, allRules, answeredSet))
      }
      if (toInvalidate.length > 0) {
        await this.prisma.compassAnswer.deleteMany({
          where: { sessionId, questionId: { in: toInvalidate } },
        })
        await this.prisma.compassSessionQuestion.updateMany({
          where: { sessionId, questionId: { in: toInvalidate } },
          data: { status: 'PENDING' },
        })
      }
    }

    // Upsert answers
    for (const a of dto.answers) {
      await this.prisma.compassAnswer.upsert({
        where: { sessionId_questionId: { sessionId, questionId: a.questionId } },
        update: {
          selectedOptionIds: a.selectedOptionIds ?? [],
          rankingOrder: a.rankingOrder ?? undefined,
          textValue: a.textValue ?? null,
          ratingValue: a.ratingValue ?? null,
        },
        create: {
          sessionId,
          questionId: a.questionId,
          selectedOptionIds: a.selectedOptionIds ?? [],
          rankingOrder: a.rankingOrder ?? undefined,
          textValue: a.textValue ?? null,
          ratingValue: a.ratingValue ?? null,
          isFollowUp: !questions.find(q => q.id === a.questionId)?.isBaseline,
          followUpDepth: 0,
        },
      })
      // Mark as answered in session question tracker
      await this.prisma.compassSessionQuestion.upsert({
        where: { sessionId_questionId: { sessionId, questionId: a.questionId } },
        update: { status: 'ANSWERED' },
        create: {
          sessionId,
          questionId: a.questionId,
          presentedOrder: 999,
          status: 'ANSWERED',
          followUpDepth: 0,
        },
      })
    }

    // Select follow-up questions
    const allAnswers = await this.prisma.compassAnswer.findMany({ where: { sessionId } })
    const presentedIds = new Set(
      (await this.prisma.compassSessionQuestion.findMany({ where: { sessionId } })).map(sq => sq.questionId),
    )

    const allRules = await this.prisma.compassFollowUpRule.findMany({
      where: {
        triggerQuestionId: { in: questionIds },
      },
      include: {
        followUpQuestion: {
          include: {
            options: { orderBy: { order: 'asc' } },
            stage: true,
          },
        },
      },
    })

    const submittedRecords: AnswerRecord[] = dto.answers.map(a => {
      const q = questions.find(q => q.id === a.questionId)!
      return {
        questionId: a.questionId,
        dimension: q.dimension,
        type: q.type,
        selectedOptionIds: a.selectedOptionIds ?? [],
        rankingOrder: (a.rankingOrder as { optionId: string; rank: number }[] | null) ?? null,
        textValue: a.textValue ?? null,
        ratingValue: a.ratingValue ?? null,
        isFollowUp: !q.isBaseline,
        followUpDepth: 0,
      }
    })

    const branchCtx: BranchingContext = {
      rules: allRules as Parameters<typeof selectFollowUps>[1]['rules'],
      alreadyPresentedIds: presentedIds,
      answeredIds: new Set(allAnswers.map(a => a.questionId)),
      totalPresentedCount: presentedIds.size,
    }

    const { questions: followUps, reasons } = selectFollowUps(submittedRecords, branchCtx)

    // Persist follow-up questions in session tracker
    if (followUps.length > 0) {
      let orderBase = presentedIds.size + 1
      for (const fq of followUps) {
        await this.prisma.compassSessionQuestion.upsert({
          where: { sessionId_questionId: { sessionId, questionId: fq.id } },
          update: {},
          create: {
            sessionId,
            questionId: fq.id,
            presentedOrder: orderBase++,
            status: 'PENDING',
            branchingReason: reasons[fq.id] ?? null,
            followUpDepth: 1,
          },
        })
      }
    }

    // Determine if all stage questions (baseline + pending follow-ups) are answered
    const pendingCount = await this.prisma.compassSessionQuestion.count({
      where: { sessionId, status: { in: ['PENDING', 'PRESENTED'] } },
    })
    const isLastStage = dto.stageNumber === STAGE_COUNT
    const allAnsweredThisStage = pendingCount === 0 && followUps.length === 0

    let nextStage: number | null = null
    if (allAnsweredThisStage && dto.stageNumber < STAGE_COUNT) {
      nextStage = dto.stageNumber + 1
      await this.prisma.compassSession.update({
        where: { id: sessionId },
        data: { currentStage: nextStage },
      })
      // Pre-load next stage baseline questions into tracker
      const nextStageData = await this.prisma.compassStage.findUnique({
        where: { versionId_stageNumber: { versionId: version.id, stageNumber: nextStage } },
        include: {
          questions: { where: { isBaseline: true }, orderBy: { order: 'asc' } },
        },
      })
      if (nextStageData) {
        const existingInTracker = await this.prisma.compassSessionQuestion.findMany({
          where: { sessionId, questionId: { in: nextStageData.questions.map(q => q.id) } },
        })
        const existingIds = new Set(existingInTracker.map(sq => sq.questionId))
        const toAdd = nextStageData.questions.filter(q => !existingIds.has(q.id))
        if (toAdd.length > 0) {
          const maxOrder = await this.prisma.compassSessionQuestion.aggregate({
            where: { sessionId },
            _max: { presentedOrder: true },
          })
          let order = (maxOrder._max.presentedOrder ?? 0) + 1
          await this.prisma.compassSessionQuestion.createMany({
            data: toAdd.map(q => ({
              sessionId,
              questionId: q.id,
              presentedOrder: order++,
              status: 'PRESENTED' as const,
              followUpDepth: 0,
            })),
          })
        }
      }
    }

    const totalBaseline = await this.prisma.compassQuestion.count({
      where: { versionId: session.versionId, isBaseline: true },
    })
    const answeredBaseline = await this.prisma.compassAnswer.count({
      where: { sessionId, isFollowUp: false },
    })
    const answeredFollowUp = await this.prisma.compassAnswer.count({
      where: { sessionId, isFollowUp: true },
    })

    return {
      followUpQuestions: followUps,
      nextStage,
      isComplete: isLastStage && allAnsweredThisStage,
      progress: { answeredBaseline, totalBaseline, answeredFollowUp },
    }
  }

  async completeSession(sessionId: string, userId: string): Promise<{ dimensionEvidence: object; reportId: string }> {
    const session = await this.findSessionForUser(sessionId, userId)
    if (session.status === 'COMPLETED') {
      throw new ConflictException('Session already completed')
    }
    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Session is not in progress')
    }

    const allAnswers = await this.prisma.compassAnswer.findMany({
      where: { sessionId },
      include: { question: true },
    })

    if (allAnswers.length === 0) {
      throw new BadRequestException('Cannot complete a session with no answers')
    }

    const answerRecords: AnswerRecord[] = allAnswers.map(a => ({
      questionId: a.questionId,
      dimension: a.question.dimension,
      type: a.question.type,
      selectedOptionIds: a.selectedOptionIds,
      rankingOrder: a.rankingOrder as { optionId: string; rank: number }[] | null,
      textValue: a.textValue,
      ratingValue: a.ratingValue,
      isFollowUp: a.isFollowUp,
      followUpDepth: a.followUpDepth,
    }))

    const evidenceFindings = buildEvidenceFindings(answerRecords)
    const confidence = computeConfidence(evidenceFindings)

    const dimensionEvidence = await this.prisma.compassDimensionEvidence.upsert({
      where: { sessionId },
      update: {
        evidenceFindings: evidenceFindings as object,
        skillDiscrepancies: [] as object,
        confidence,
        scoringVersion: '1.0',
      },
      create: {
        sessionId,
        evidenceFindings: evidenceFindings as object,
        skillDiscrepancies: [] as object,
        confidence,
        scoringVersion: '1.0',
      },
    })

    // Build provisional report
    const careerPaths = await this.prisma.careerPath.findMany({
      where: { isActive: true },
      include: { courses: { select: { id: true, titleAr: true, titleEn: true }, take: 3 } },
    })

    const candidatePaths = findCandidatePaths(evidenceFindings, careerPaths)

    const report = await this.prisma.compassReport.upsert({
      where: { sessionId },
      update: { candidatePaths: candidatePaths as object[] },
      create: {
        sessionId,
        candidatePaths: candidatePaths as object[],
        strengthsAr: [],
        strengthsEn: [],
        skillGapsAr: [],
        skillGapsEn: [],
        experienceGapsAr: [],
        experienceGapsEn: [],
        learningRoadmapAr: {},
        learningRoadmapEn: {},
        limitations: confidence == null || confidence < 50
          ? 'لم تكتمل معظم أسئلة التقييم — النتائج تقريبية'
          : null,
      },
    })

    await this.prisma.compassSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })

    return { dimensionEvidence, reportId: report.id }
  }

  async getReport(sessionId: string, userId: string): Promise<object> {
    const session = await this.findSessionForUser(sessionId, userId)
    const report = await this.prisma.compassReport.findUnique({ where: { sessionId } })
    if (!report) throw new NotFoundException('Report not found')
    const evidence = await this.prisma.compassDimensionEvidence.findUnique({ where: { sessionId } })
    return { sessionId, status: session.status, dimensionEvidence: evidence, report }
  }

  async listSessions(userId: string): Promise<object[]> {
    const sessions = await this.prisma.compassSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: { report: { select: { candidatePaths: true } } },
    })
    return sessions.map(s => ({
      id: s.id,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      currentStage: s.currentStage,
    }))
  }

  private async resolveVersion(versionId?: string): Promise<CompassVersion> {
    if (versionId) {
      const v = await this.prisma.compassVersion.findUnique({ where: { id: versionId } })
      if (!v) throw new NotFoundException('Assessment version not found')
      return v
    }
    const active = await this.prisma.compassVersion.findFirst({
      where: { isActive: true },
      orderBy: { publishedAt: 'desc' },
    })
    if (!active) throw new BadRequestException('No active assessment version available')
    return active
  }

  private async findSessionForUser(sessionId: string, userId: string) {
    const session = await this.prisma.compassSession.findUnique({ where: { id: sessionId } })
    if (!session) throw new NotFoundException('Session not found')
    if (session.userId !== userId) throw new ForbiddenException('Access denied')
    return session
  }

  private toQuestionDto(q: QuestionWithRelations, branchingReason?: string): CompassQuestionDto {
    return {
      id: q.id,
      type: q.type,
      dimension: q.dimension,
      textAr: q.textAr,
      textEn: q.textEn,
      hintAr: q.hintAr,
      hintEn: q.hintEn,
      isBaseline: q.isBaseline,
      order: q.order,
      minAnswers: q.minAnswers,
      maxAnswers: q.maxAnswers,
      options: (q.options ?? [])
        .sort((a: CompassOption, b: CompassOption) => a.order - b.order)
        .map((o: CompassOption) => ({ id: o.id, textAr: o.textAr, textEn: o.textEn, order: o.order })),
      branchingReason: branchingReason ?? null,
    }
  }
}
