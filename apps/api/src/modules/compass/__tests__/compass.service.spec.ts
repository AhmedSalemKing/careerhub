/**
 * CompassService integration tests — full user journey with mocked Prisma.
 */

import { CompassService } from '../compass.service'
import { PrismaService } from '../../../prisma/prisma.service'
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common'

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const VERSION_ID = 'v1'
const ACTIVE_VERSION = { id: VERSION_ID, version: '1.0.0', isActive: true, publishedAt: new Date() }

function makeQ(id: string, stageNum: number, dimension: string, isBaseline = true) {
  return {
    id, versionId: VERSION_ID, stageId: `s${stageNum}`,
    dimension, type: 'SINGLE_CHOICE', isBaseline, order: 1,
    textAr: `سؤال ${id}`, textEn: `Question ${id}`,
    hintAr: null, hintEn: null, minAnswers: null, maxAnswers: null, maxFollowUpDepth: 1,
    options: [
      { id: `opt_a_${id}`, textAr: 'الخيار أ', textEn: 'Option A', order: 1 },
      { id: `opt_b_${id}`, textAr: 'الخيار ب', textEn: 'Option B', order: 2 },
    ],
    stage: { stageNumber: stageNum, titleAr: `المرحلة ${stageNum}`, titleEn: `Stage ${stageNum}` },
  }
}

const Q: Record<string, ReturnType<typeof makeQ>> = {
  q1: makeQ('q1', 1, 'CONTEXT'),
  q2: makeQ('q2', 1, 'CONTEXT'),
  q3: makeQ('q3', 2, 'INTERESTS'),
  q4: makeQ('q4', 2, 'INTERESTS'),
  qfu: makeQ('qfu', 2, 'INTERESTS', false),
}

const RULE_FU = {
  id: 'r1',
  triggerQuestionId: 'q3',
  triggerOptionId: 'opt_a_q3',
  triggerCondition: null,
  followUpQuestionId: 'qfu',
  dimension: 'INTERESTS',
  reasonAr: 'سبب المتابعة',
  reasonEn: 'Follow-up reason',
  priority: 1,
  followUpQuestion: Q.qfu,
}

// ─── Mock factory ─────────────────────────────────────────────────────────────

function makePrisma() {
  const sessions: Record<string, any> = {}
  const answers: Record<string, any> = {}
  const sqMap: Record<string, any> = {}
  const reports: Record<string, any> = {}
  const evidenceStore: Record<string, any> = {}
  let sessIdx = 0

  function stageData(n: number) {
    const qs = n === 1 ? [Q.q1, Q.q2] : n === 2 ? [Q.q3, Q.q4] : []
    return { id: `s${n}`, stageNumber: n, versionId: VERSION_ID, titleAr: `المرحلة ${n}`, titleEn: `Stage ${n}`, questions: qs }
  }

  return {
    compassVersion: {
      findFirst: jest.fn().mockResolvedValue(ACTIVE_VERSION),
      findUnique: jest.fn().mockResolvedValue(ACTIVE_VERSION),
      findUniqueOrThrow: jest.fn().mockResolvedValue(ACTIVE_VERSION),
    },

    compassStage: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        const n = where?.versionId_stageNumber?.stageNumber ?? 1
        return Promise.resolve(stageData(n))
      }),
      findUniqueOrThrow: jest.fn().mockImplementation(({ where }: any) => {
        const n = where?.versionId_stageNumber?.stageNumber ?? 1
        return Promise.resolve(stageData(n))
      }),
      count: jest.fn().mockResolvedValue(6),
    },

    compassQuestion: {
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(Q[where.id] ?? null)
      }),
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        if (where?.id?.in) {
          return Promise.resolve(where.id.in.map((id: string) => Q[id]).filter(Boolean))
        }
        return Promise.resolve(Object.values(Q))
      }),
      count: jest.fn().mockResolvedValue(4),
    },

    compassSession: {
      create: jest.fn().mockImplementation(({ data }: any) => {
        const id = `sess${++sessIdx}`
        const s = {
          id, userId: data.userId, versionId: data.versionId,
          currentStage: data.currentStage ?? 1, status: 'IN_PROGRESS',
          startedAt: new Date(), completedAt: null, expiresAt: new Date(Date.now() + 86400000),
        }
        sessions[id] = s
        return Promise.resolve(s)
      }),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(sessions[where.id] ?? null)
      }),
      findFirst: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(sessions[where?.id] ?? null)
      }),
      findUniqueOrThrow: jest.fn().mockImplementation(({ where }: any) => {
        const s = sessions[where.id]
        if (!s) throw new Error('not found')
        return Promise.resolve(s)
      }),
      update: jest.fn().mockImplementation(({ where, data }: any) => {
        sessions[where.id] = { ...sessions[where.id], ...data }
        return Promise.resolve(sessions[where.id])
      }),
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        const matched = Object.values(sessions).filter((s: any) => s.userId === where.userId)
        return Promise.resolve(matched.map((s: any) => ({ ...s, report: reports[s.id] ?? null })))
      }),
    },

    compassSessionQuestion: {
      createMany: jest.fn().mockImplementation(({ data }: any) => {
        for (const d of data) {
          const key = `${d.sessionId}_${d.questionId}`
          if (!sqMap[key]) sqMap[key] = { ...d }
        }
        return Promise.resolve({ count: data.length })
      }),
      upsert: jest.fn().mockImplementation(({ where, create, update }: any) => {
        const key = `${where.sessionId_questionId.sessionId}_${where.sessionId_questionId.questionId}`
        sqMap[key] = sqMap[key] ? { ...sqMap[key], ...update } : { ...create }
        return Promise.resolve(sqMap[key])
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }: any) => {
        const ids: string[] = where.questionId?.in ?? []
        let count = 0
        for (const qid of ids) {
          const key = `${where.sessionId}_${qid}`
          if (sqMap[key]) { sqMap[key] = { ...sqMap[key], ...data }; count++ }
        }
        return Promise.resolve({ count })
      }),
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        let rows = Object.values(sqMap) as any[]
        rows = rows.filter((r: any) => r.sessionId === where.sessionId)
        if (where.status?.in) rows = rows.filter((r: any) => where.status.in.includes(r.status))
        if (where.question) {
          rows = rows.filter((r: any) => {
            const q = Q[r.questionId]
            return q ? !q.isBaseline : true
          })
        }
        if (where.questionId?.in) rows = rows.filter((r: any) => where.questionId.in.includes(r.questionId))
        return Promise.resolve(rows.map((r: any) => ({ ...r, question: Q[r.questionId] })))
      }),
      count: jest.fn().mockImplementation(({ where }: any) => {
        let rows = Object.values(sqMap) as any[]
        rows = rows.filter((r: any) => r.sessionId === where.sessionId)
        if (where.status?.in) rows = rows.filter((r: any) => where.status.in.includes(r.status))
        return Promise.resolve(rows.length)
      }),
      aggregate: jest.fn().mockResolvedValue({ _max: { presentedOrder: 10 } }),
    },

    compassAnswer: {
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        let rows = Object.values(answers) as any[]
        rows = rows.filter((a: any) => a.sessionId === where.sessionId)
        if (where.questionId?.in) rows = rows.filter((a: any) => where.questionId.in.includes(a.questionId))
        return Promise.resolve(rows.map((a: any) => ({
          ...a,
          question: Q[a.questionId] ?? { dimension: 'CONTEXT', type: 'SINGLE_CHOICE', isBaseline: true },
        })))
      }),
      upsert: jest.fn().mockImplementation(({ where, create, update }: any) => {
        const key = `${where.sessionId_questionId.sessionId}_${where.sessionId_questionId.questionId}`
        answers[key] = answers[key] ? { ...answers[key], ...update } : { id: key, ...create }
        return Promise.resolve(answers[key])
      }),
      deleteMany: jest.fn().mockImplementation(({ where }: any) => {
        const ids: string[] = where.questionId?.in ?? []
        let count = 0
        for (const qid of ids) {
          const key = `${where.sessionId}_${qid}`
          if (answers[key]) { delete answers[key]; count++ }
        }
        return Promise.resolve({ count })
      }),
      count: jest.fn().mockImplementation(({ where }: any) => {
        let rows = Object.values(answers) as any[]
        rows = rows.filter((a: any) => a.sessionId === where.sessionId)
        if (where.isFollowUp !== undefined) rows = rows.filter((a: any) => a.isFollowUp === where.isFollowUp)
        return Promise.resolve(rows.length)
      }),
    },

    compassFollowUpRule: {
      findMany: jest.fn().mockImplementation(({ where }: any) => {
        const ids: string[] = where?.triggerQuestionId?.in ?? []
        const rules = ids.includes('q3') ? [RULE_FU] : []
        return Promise.resolve(rules)
      }),
    },

    compassDimensionEvidence: {
      upsert: jest.fn().mockImplementation(({ where, create }: any) => {
        const ev = { id: 'ev1', ...create }
        evidenceStore[where.sessionId] = ev
        return Promise.resolve(ev)
      }),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(evidenceStore[where.sessionId] ?? null)
      }),
    },

    compassReport: {
      upsert: jest.fn().mockImplementation(({ where, create }: any) => {
        const r = { id: 'rpt1', ...create }
        reports[where.sessionId] = r
        return Promise.resolve(r)
      }),
      create: jest.fn().mockImplementation(({ data }: any) => {
        const r = { id: 'rpt1', ...data }
        reports[data.sessionId] = r
        return Promise.resolve(r)
      }),
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        return Promise.resolve(reports[where.sessionId] ?? null)
      }),
    },

    careerPath: {
      findMany: jest.fn().mockResolvedValue([]),
    },

    // Career Memory isolation — these must NEVER be called by Compass
    userCareerPath: {
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CompassService — full user journey', () => {
  let service: CompassService
  let prisma: ReturnType<typeof makePrisma>

  beforeEach(() => {
    jest.clearAllMocks()
    prisma = makePrisma()
    service = new CompassService(prisma as unknown as PrismaService)
  })

  // 1. Create session
  describe('createSession', () => {
    it('creates a new session and returns stage 1 questions', async () => {
      const state = await service.createSession('user1', {})
      expect(state.sessionId).toBeDefined()
      expect(state.status).toBe('IN_PROGRESS')
      expect(state.currentStage).toBe(1)
      expect(state.totalStages).toBe(6)
      expect(state.currentStageData?.stageNumber).toBe(1)
      expect(state.currentStageData?.questions).toHaveLength(2)
      expect(state.pendingFollowUps).toHaveLength(0)
    })

    it('returned questions have Arabic and English text', async () => {
      const state = await service.createSession('user1', {})
      const q = state.currentStageData!.questions[0]
      expect(q.textAr).toBeTruthy()
      expect(q.textEn).toBeTruthy()
      expect(state.currentStageData!.titleAr).toBeTruthy()
      expect(state.currentStageData!.titleEn).toBeTruthy()
    })
  })

  // 2. Get session
  describe('getSession', () => {
    it('returns session state for the owning user', async () => {
      const created = await service.createSession('user1', {})
      const fetched = await service.getSession(created.sessionId, 'user1')
      expect(fetched.sessionId).toBe(created.sessionId)
      expect(fetched.status).toBe('IN_PROGRESS')
    })

    it('throws ForbiddenException for a different userId', async () => {
      const created = await service.createSession('user1', {})
      await expect(service.getSession(created.sessionId, 'user2')).rejects.toThrow(ForbiddenException)
    })

    it('throws NotFoundException for unknown session id', async () => {
      await expect(service.getSession('nonexistent', 'user1')).rejects.toThrow(NotFoundException)
    })
  })

  // 3. Submit answers — auth guard
  describe('submitAnswers — auth guard', () => {
    it('throws ForbiddenException for wrong userId', async () => {
      const created = await service.createSession('user1', {})
      await expect(
        service.submitAnswers(created.sessionId, 'user_other', {
          stageNumber: 1,
          answers: [{ questionId: 'q1', selectedOptionIds: ['opt_a_q1'] }],
        }),
      ).rejects.toThrow(ForbiddenException)
    })

    it('accepts valid submission for owning user', async () => {
      const created = await service.createSession('user1', {})
      const result = await service.submitAnswers(created.sessionId, 'user1', {
        stageNumber: 1,
        answers: [{ questionId: 'q1', selectedOptionIds: ['opt_a_q1'] }],
      })
      expect(result).toHaveProperty('followUpQuestions')
      expect(result).toHaveProperty('isComplete')
    })
  })

  // 4. Follow-up triggering
  describe('follow-up triggering', () => {
    it('triggers follow-up when option_a selected on q3', async () => {
      const created = await service.createSession('user1', {})
      const result = await service.submitAnswers(created.sessionId, 'user1', {
        stageNumber: 2,
        answers: [
          { questionId: 'q3', selectedOptionIds: ['opt_a_q3'] },
          { questionId: 'q4', selectedOptionIds: ['opt_b_q4'] },
        ],
      })
      expect(result.followUpQuestions).toHaveLength(1)
      expect(result.followUpQuestions[0].id).toBe('qfu')
      expect(result.followUpQuestions[0].textAr).toBeTruthy()
      expect(result.followUpQuestions[0].textEn).toBeTruthy()
    })

    it('does NOT trigger follow-up when option_b selected on q3', async () => {
      const created = await service.createSession('user1', {})
      const result = await service.submitAnswers(created.sessionId, 'user1', {
        stageNumber: 2,
        answers: [{ questionId: 'q3', selectedOptionIds: ['opt_b_q3'] }],
      })
      expect(result.followUpQuestions).toHaveLength(0)
    })
  })

  // 5. Answer change invalidation
  describe('answer change invalidation', () => {
    it('changing q3 from option_a to option_b calls deleteMany on downstream follow-ups', async () => {
      const created = await service.createSession('user1', {})
      // Submit q3=option_a, then follow-up answer
      await service.submitAnswers(created.sessionId, 'user1', {
        stageNumber: 2,
        answers: [{ questionId: 'q3', selectedOptionIds: ['opt_a_q3'] }],
      })
      await service.submitAnswers(created.sessionId, 'user1', {
        stageNumber: 2,
        answers: [{ questionId: 'qfu', selectedOptionIds: ['opt_a_qfu'] }],
      })
      // Now change q3 to option_b
      await service.submitAnswers(created.sessionId, 'user1', {
        stageNumber: 2,
        answers: [{ questionId: 'q3', selectedOptionIds: ['opt_b_q3'] }],
      })
      expect(prisma.compassAnswer.deleteMany).toHaveBeenCalled()
    })
  })

  // 6. Complete session
  describe('completeSession', () => {
    it('generates evidence and report after answering', async () => {
      const created = await service.createSession('user1', {})
      await service.submitAnswers(created.sessionId, 'user1', {
        stageNumber: 1,
        answers: [{ questionId: 'q1', selectedOptionIds: ['opt_a_q1'] }],
      })
      const result = await service.completeSession(created.sessionId, 'user1')
      expect(result.reportId).toBeDefined()
      expect(prisma.compassSession.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
      )
    })

    it('throws BadRequestException if no answers submitted', async () => {
      const created = await service.createSession('user1', {})
      await expect(service.completeSession(created.sessionId, 'user1')).rejects.toThrow(BadRequestException)
    })

    it('throws ForbiddenException for wrong userId', async () => {
      const created = await service.createSession('user1', {})
      await expect(service.completeSession(created.sessionId, 'user_other')).rejects.toThrow(ForbiddenException)
    })
  })

  // 7. Get report
  describe('getReport', () => {
    it('returns the report for the session owner after completion', async () => {
      const created = await service.createSession('user1', {})
      await service.submitAnswers(created.sessionId, 'user1', {
        stageNumber: 1,
        answers: [{ questionId: 'q1', selectedOptionIds: ['opt_a_q1'] }],
      })
      await service.completeSession(created.sessionId, 'user1')
      const report = await service.getReport(created.sessionId, 'user1')
      expect(report).toBeDefined()
      expect((report as any).sessionId).toBe(created.sessionId)
    })

    it('throws NotFoundException when report does not exist', async () => {
      const created = await service.createSession('user1', {})
      await expect(service.getReport(created.sessionId, 'user1')).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException for wrong userId', async () => {
      const created = await service.createSession('user1', {})
      await service.submitAnswers(created.sessionId, 'user1', {
        stageNumber: 1, answers: [{ questionId: 'q1', selectedOptionIds: ['opt_a_q1'] }],
      })
      await service.completeSession(created.sessionId, 'user1')
      await expect(service.getReport(created.sessionId, 'user_other')).rejects.toThrow(ForbiddenException)
    })
  })

  // 8. List sessions
  describe('listSessions', () => {
    it('returns only sessions for the requesting user', async () => {
      await service.createSession('user1', {})
      await service.createSession('user1', {})
      await service.createSession('user2', {})
      const list = await service.listSessions('user1')
      expect(list.length).toBe(2)
    })

    it('returns empty array for a user with no sessions', async () => {
      const list = await service.listSessions('user_nobody')
      expect(list).toHaveLength(0)
    })
  })

  // 9. Idempotent answer submission
  describe('idempotent upsert', () => {
    it('submitting the same answer twice uses upsert, not duplicate create', async () => {
      const created = await service.createSession('user1', {})
      const submit = () =>
        service.submitAnswers(created.sessionId, 'user1', {
          stageNumber: 1,
          answers: [{ questionId: 'q1', selectedOptionIds: ['opt_a_q1'] }],
        })
      await submit()
      await submit()
      expect(prisma.compassAnswer.upsert).toHaveBeenCalled()
    })
  })

  // 10. Career Memory isolation
  describe('Career Memory isolation', () => {
    it('never touches UserCareerPath across the complete session lifecycle', async () => {
      const created = await service.createSession('user1', {})
      await service.submitAnswers(created.sessionId, 'user1', {
        stageNumber: 1,
        answers: [{ questionId: 'q1', selectedOptionIds: ['opt_a_q1'] }],
      })
      await service.completeSession(created.sessionId, 'user1')
      await service.getReport(created.sessionId, 'user1')
      await service.listSessions('user1')

      expect(prisma.userCareerPath.deleteMany).not.toHaveBeenCalled()
      expect(prisma.userCareerPath.updateMany).not.toHaveBeenCalled()
      expect(prisma.userCareerPath.create).not.toHaveBeenCalled()
      expect(prisma.userCareerPath.upsert).not.toHaveBeenCalled()
    })
  })
})
