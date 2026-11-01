import { selectFollowUps, getInvalidatedFollowUpIds, type BranchingContext } from '../branching.engine'
import type { AnswerRecord } from '../types'
import { MAX_QUESTIONS_PER_SESSION } from '../types'

const makeAnswer = (overrides: Partial<AnswerRecord> = {}): AnswerRecord => ({
  questionId: 'q1',
  dimension: 'SKILLS',
  type: 'SINGLE_CHOICE',
  selectedOptionIds: [],
  rankingOrder: null,
  textValue: null,
  ratingValue: null,
  isFollowUp: false,
  followUpDepth: 0,
  ...overrides,
})

const baseCtx = (overrides: Partial<BranchingContext> = {}): BranchingContext => ({
  rules: [],
  alreadyPresentedIds: new Set(),
  answeredIds: new Set(),
  totalPresentedCount: 0,
  ...overrides,
})

describe('BranchingEngine — selectFollowUps', () => {
  it('returns no follow-ups when there are no rules', () => {
    const result = selectFollowUps([makeAnswer()], baseCtx())
    expect(result.questions).toHaveLength(0)
  })

  it('triggers follow-up when option matches', () => {
    const rule: any = {
      id: 'r1',
      triggerQuestionId: 'q1',
      triggerOptionId: 'opt_data',
      triggerCondition: null,
      followUpQuestionId: 'q_followup',
      dimension: 'INTERESTS',
      reasonAr: 'سبب الاختيار',
      reasonEn: 'Reason',
      priority: 0,
      followUpQuestion: {
        id: 'q_followup',
        type: 'MULTI_SELECT',
        dimension: 'INTERESTS',
        textAr: 'سؤال متابعة',
        textEn: 'Follow-up',
        hintAr: null,
        hintEn: null,
        isBaseline: false,
        order: 0,
        minAnswers: null,
        maxAnswers: null,
        maxFollowUpDepth: 1,
        options: [],
      },
    }
    const answer = makeAnswer({ questionId: 'q1', selectedOptionIds: ['opt_data'] })
    const result = selectFollowUps([answer], baseCtx({ rules: [rule] }))
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0].id).toBe('q_followup')
    expect(result.reasons['q_followup']).toBe('سبب الاختيار')
  })

  it('does NOT trigger follow-up when option does not match', () => {
    const rule: any = {
      id: 'r1',
      triggerQuestionId: 'q1',
      triggerOptionId: 'opt_data',
      triggerCondition: null,
      followUpQuestionId: 'q_followup',
      dimension: 'INTERESTS',
      reasonAr: 'سبب',
      reasonEn: 'Reason',
      priority: 0,
      followUpQuestion: { id: 'q_followup', options: [], type: 'SINGLE_CHOICE', dimension: 'INTERESTS', textAr: '', textEn: '', isBaseline: false, order: 0, hintAr: null, hintEn: null, minAnswers: null, maxAnswers: null, maxFollowUpDepth: 1 },
    }
    const answer = makeAnswer({ questionId: 'q1', selectedOptionIds: ['opt_other'] })
    const result = selectFollowUps([answer], baseCtx({ rules: [rule] }))
    expect(result.questions).toHaveLength(0)
  })

  it('rating >= 4 triggers follow-up', () => {
    const rule: any = {
      id: 'r1',
      triggerQuestionId: 'q1',
      triggerOptionId: null,
      triggerCondition: 'rating>=4',
      followUpQuestionId: 'q_fup',
      dimension: 'SKILLS',
      reasonAr: 'سبب',
      reasonEn: 'Reason',
      priority: 0,
      followUpQuestion: { id: 'q_fup', options: [], type: 'MULTI_SELECT', dimension: 'SKILLS', textAr: '', textEn: '', isBaseline: false, order: 0, hintAr: null, hintEn: null, minAnswers: null, maxAnswers: null, maxFollowUpDepth: 1 },
    }
    const answer = makeAnswer({ questionId: 'q1', type: 'RATING_SCALE', ratingValue: 4 })
    const result = selectFollowUps([answer], baseCtx({ rules: [rule] }))
    expect(result.questions).toHaveLength(1)
  })

  it('rating < 4 does NOT trigger follow-up for rating>=4 rule', () => {
    const rule: any = {
      id: 'r1', triggerQuestionId: 'q1', triggerOptionId: null, triggerCondition: 'rating>=4',
      followUpQuestionId: 'q_fup', dimension: 'SKILLS', reasonAr: '', reasonEn: '', priority: 0,
      followUpQuestion: { id: 'q_fup', options: [], type: 'SINGLE_CHOICE', dimension: 'SKILLS', textAr: '', textEn: '', isBaseline: false, order: 0, hintAr: null, hintEn: null, minAnswers: null, maxAnswers: null, maxFollowUpDepth: 1 },
    }
    const answer = makeAnswer({ questionId: 'q1', type: 'RATING_SCALE', ratingValue: 3 })
    const result = selectFollowUps([answer], baseCtx({ rules: [rule] }))
    expect(result.questions).toHaveLength(0)
  })

  it('does not present already-presented question', () => {
    const rule: any = {
      id: 'r1', triggerQuestionId: 'q1', triggerOptionId: 'opt_a', triggerCondition: null,
      followUpQuestionId: 'q_fup', dimension: 'SKILLS', reasonAr: '', reasonEn: '', priority: 0,
      followUpQuestion: { id: 'q_fup', options: [], type: 'SINGLE_CHOICE', dimension: 'SKILLS', textAr: '', textEn: '', isBaseline: false, order: 0, hintAr: null, hintEn: null, minAnswers: null, maxAnswers: null, maxFollowUpDepth: 1 },
    }
    const answer = makeAnswer({ questionId: 'q1', selectedOptionIds: ['opt_a'] })
    const ctx = baseCtx({ rules: [rule], alreadyPresentedIds: new Set(['q_fup']) })
    const result = selectFollowUps([answer], ctx)
    expect(result.questions).toHaveLength(0)
  })

  it('respects MAX_QUESTIONS_PER_SESSION hard cap', () => {
    const rule: any = {
      id: 'r1', triggerQuestionId: 'q1', triggerOptionId: null, triggerCondition: null,
      followUpQuestionId: 'q_fup', dimension: 'SKILLS', reasonAr: '', reasonEn: '', priority: 0,
      followUpQuestion: { id: 'q_fup', options: [], type: 'SINGLE_CHOICE', dimension: 'SKILLS', textAr: '', textEn: '', isBaseline: false, order: 0, hintAr: null, hintEn: null, minAnswers: null, maxAnswers: null, maxFollowUpDepth: 1 },
    }
    const answer = makeAnswer({ questionId: 'q1' })
    const ctx = baseCtx({ rules: [rule], totalPresentedCount: MAX_QUESTIONS_PER_SESSION })
    const result = selectFollowUps([answer], ctx)
    expect(result.questions).toHaveLength(0)
  })
})

describe('BranchingEngine — getInvalidatedFollowUpIds', () => {
  it('returns follow-up IDs triggered by changed question', () => {
    const rules: any[] = [
      { triggerQuestionId: 'q1', followUpQuestionId: 'q_fup1' },
      { triggerQuestionId: 'q1', followUpQuestionId: 'q_fup2' },
    ]
    const answered = new Set(['q_fup1', 'q_fup2', 'q_baseline'])
    const result = getInvalidatedFollowUpIds('q1', rules, answered)
    expect(result).toContain('q_fup1')
    expect(result).toContain('q_fup2')
    expect(result).not.toContain('q_baseline')
  })

  it('cascades through multi-level follow-ups', () => {
    const rules: any[] = [
      { triggerQuestionId: 'q1', followUpQuestionId: 'q_fup1' },
      { triggerQuestionId: 'q_fup1', followUpQuestionId: 'q_fup2' },
    ]
    const answered = new Set(['q_fup1', 'q_fup2'])
    const result = getInvalidatedFollowUpIds('q1', rules, answered)
    expect(result).toContain('q_fup1')
    expect(result).toContain('q_fup2')
  })

  it('returns empty array when no follow-ups were answered', () => {
    const rules: any[] = [{ triggerQuestionId: 'q1', followUpQuestionId: 'q_fup1' }]
    const answered = new Set<string>()
    const result = getInvalidatedFollowUpIds('q1', rules, answered)
    expect(result).toHaveLength(0)
  })
})
