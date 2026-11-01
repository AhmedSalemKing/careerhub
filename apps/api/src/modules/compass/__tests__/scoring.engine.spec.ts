import { buildEvidenceFindings, computeConfidence } from '../scoring.engine'
import type { AnswerRecord } from '../types'

const makeAnswer = (overrides: Partial<AnswerRecord>): AnswerRecord => ({
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

describe('ScoringEngine — buildEvidenceFindings', () => {
  it('returns empty findings for empty answers', () => {
    const result = buildEvidenceFindings([])
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('CONTEXT dimension answers are excluded from findings', () => {
    const answer = makeAnswer({ dimension: 'CONTEXT', type: 'SINGLE_CHOICE', selectedOptionIds: ['opt_1'] })
    const result = buildEvidenceFindings([answer])
    expect(result['CONTEXT']).toBeUndefined()
  })

  it('records SINGLE_CHOICE selection as observation', () => {
    const answer = makeAnswer({
      questionId: 'q1', dimension: 'INTERESTS', type: 'SINGLE_CHOICE',
      selectedOptionIds: ['opt_data'],
    })
    const result = buildEvidenceFindings([answer])
    expect(result['INTERESTS']).toBeDefined()
    expect(result['INTERESTS']!.observations).toContain('selected:opt_data')
  })

  it('records RATING_SCALE as self-reported level', () => {
    const answer = makeAnswer({
      dimension: 'SKILLS', type: 'RATING_SCALE', ratingValue: 4,
    })
    const result = buildEvidenceFindings([answer])
    expect(result['SKILLS']?.selfReportedLevel).toBe('advanced')
  })

  it('records PRACTICAL_MINI as practical evidence and flags review_pending', () => {
    const answer = makeAnswer({
      dimension: 'SKILLS', type: 'PRACTICAL_MINI', textValue: 'I would use binary search...',
    })
    const result = buildEvidenceFindings([answer])
    expect(result['SKILLS']?.practicalEvidence).toBe('provided')
    expect(result['SKILLS']?.observations).toContain('practical_review_pending:true')
  })

  it('flags discrepancy when both rating and practical evidence exist', () => {
    const answers = [
      makeAnswer({ questionId: 'q1', dimension: 'SKILLS', type: 'RATING_SCALE', ratingValue: 5 }),
      makeAnswer({ questionId: 'q2', dimension: 'SKILLS', type: 'PRACTICAL_MINI', textValue: 'answer' }),
    ]
    const result = buildEvidenceFindings(answers)
    const discrepancies = result['SKILLS']!.discrepancies
    expect(discrepancies.length).toBeGreaterThan(0)
    expect(discrepancies[0]).toContain('resolution=pending_rubric_approval')
  })

  it('does NOT assign a 0 score when evidence is missing — field stays absent', () => {
    const result = buildEvidenceFindings([])
    // No dimension should get a numerical score — scores are null until CTO approval
    expect(result['BEHAVIORAL_INDICATORS']).toBeUndefined()
  })

  it('records RANKING answer in observations', () => {
    const answer = makeAnswer({
      dimension: 'MOTIVATION', type: 'RANKING',
      rankingOrder: [{ optionId: 'salary', rank: 1 }, { optionId: 'impact', rank: 2 }],
    })
    const result = buildEvidenceFindings([answer])
    const obs = result['MOTIVATION']!.observations
    expect(obs.some(o => o.startsWith('ranking:'))).toBe(true)
  })
})

describe('ScoringEngine — computeConfidence', () => {
  it('returns null when fewer than 3 dimensions have complete evidence', () => {
    const findings = {
      INTERESTS: { dimension: 'INTERESTS' as const, observations: ['selected:a'], discrepancies: [], answerCount: 2, isComplete: true },
      SKILLS: { dimension: 'SKILLS' as const, observations: [], discrepancies: [], answerCount: 0, isComplete: false },
    }
    expect(computeConfidence(findings)).toBeNull()
  })

  it('returns a value 0–100 when 3+ dimensions are complete', () => {
    const complete = (dim: string) => ({
      dimension: dim as any,
      observations: ['selected:a', 'selected:b'],
      discrepancies: [],
      answerCount: 3,
      isComplete: true,
    })
    const findings = {
      INTERESTS: complete('INTERESTS'),
      SKILLS: complete('SKILLS'),
      BEHAVIORAL_INDICATORS: complete('BEHAVIORAL_INDICATORS'),
      MOTIVATION: complete('MOTIVATION'),
      WORK_PREFERENCES: complete('WORK_PREFERENCES'),
      MARKET_READINESS: complete('MARKET_READINESS'),
    }
    const conf = computeConfidence(findings)
    expect(conf).not.toBeNull()
    expect(conf!).toBeGreaterThanOrEqual(0)
    expect(conf!).toBeLessThanOrEqual(100)
    expect(conf).toBe(100) // all 6 scored dimensions complete
  })
})
