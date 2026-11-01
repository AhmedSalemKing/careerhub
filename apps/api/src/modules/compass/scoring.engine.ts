import type { CompassDimension } from '@prisma/client'
import type { AnswerRecord, DimensionObservation, EvidenceFindings } from './types'
import { SCORED_DIMENSIONS } from './types'

/**
 * Evidence-based dimension analysis.
 *
 * IMPORTANT: This engine builds qualitative observations and evidence records.
 * It does NOT compute numerical 0–100 scores. Numerical scoring requires
 * CTO-approved weights and mappings. All numerical fields remain null until
 * those are approved.
 *
 * Self-reported ratings and practical answers are stored separately.
 * Discrepancies are flagged but not resolved by this engine.
 */
export function buildEvidenceFindings(answers: AnswerRecord[]): EvidenceFindings {
  const findings: EvidenceFindings = {}

  for (const dim of SCORED_DIMENSIONS) {
    const dimAnswers = answers.filter(a => a.dimension === dim)
    if (dimAnswers.length === 0) continue

    const observations: string[] = []
    const discrepancies: string[] = []
    let selfReportedLevel: string | undefined
    let practicalEvidence: string | undefined

    for (const answer of dimAnswers) {
      switch (answer.type) {
        case 'SINGLE_CHOICE':
        case 'MULTI_SELECT':
          if (answer.selectedOptionIds.length > 0) {
            observations.push(`selected:${answer.selectedOptionIds.join(',')}`)
          }
          break
        case 'RANKING':
          if (answer.rankingOrder) {
            const rankStr = answer.rankingOrder
              .sort((a, b) => a.rank - b.rank)
              .map(r => `${r.optionId}@${r.rank}`)
              .join(',')
            observations.push(`ranking:${rankStr}`)
          }
          break
        case 'RATING_SCALE':
          if (answer.ratingValue != null) {
            selfReportedLevel = ratingLabel(answer.ratingValue)
            observations.push(`self_reported_rating:${answer.ratingValue}`)
          }
          break
        case 'SHORT_TEXT':
        case 'SCENARIO':
          if (answer.textValue) {
            observations.push(`text_answer:provided`)
          }
          break
        case 'PRACTICAL_MINI':
          if (answer.textValue) {
            practicalEvidence = 'provided'
            observations.push('practical_evidence:provided')
            // Flag for manual review — not auto-graded without approved rubric
            observations.push('practical_review_pending:true')
          }
          break
      }
    }

    // Record discrepancy if both self-reported rating and practical evidence exist
    if (selfReportedLevel && practicalEvidence) {
      discrepancies.push(
        `self_reported=${selfReportedLevel};practical=provided;resolution=pending_rubric_approval`
      )
    }

    const finding: DimensionObservation = {
      dimension: dim as CompassDimension,
      observations,
      selfReportedLevel,
      practicalEvidence,
      discrepancies,
      answerCount: dimAnswers.length,
      isComplete: isComplete(dim as CompassDimension, dimAnswers),
    }

    findings[dim as CompassDimension] = finding
  }

  return findings
}

function ratingLabel(v: number): string {
  if (v <= 1) return 'beginner'
  if (v === 2) return 'elementary'
  if (v === 3) return 'intermediate'
  if (v === 4) return 'advanced'
  return 'expert'
}

// Minimum answers required for a dimension to be considered complete
const MINIMUM_ANSWERS: Partial<Record<CompassDimension, number>> = {
  INTERESTS: 2,
  SKILLS: 2,
  BEHAVIORAL_INDICATORS: 2,
  MOTIVATION: 1,
  WORK_PREFERENCES: 1,
  MARKET_READINESS: 3,
}

function isComplete(dim: CompassDimension, answers: AnswerRecord[]): boolean {
  const min = MINIMUM_ANSWERS[dim] ?? 1
  return answers.filter(a => hasValue(a)).length >= min
}

function hasValue(a: AnswerRecord): boolean {
  return (
    a.selectedOptionIds.length > 0 ||
    a.rankingOrder != null ||
    a.textValue != null ||
    a.ratingValue != null
  )
}

/**
 * Compute an overall confidence score (0–100) based on how complete the
 * evidence is, without involving any unapproved scoring weights.
 *
 * Returns null if fewer than 3 scored dimensions have evidence.
 */
export function computeConfidence(findings: EvidenceFindings): number | null {
  const completeDims = SCORED_DIMENSIONS.filter(
    d => findings[d as CompassDimension]?.isComplete
  )
  if (completeDims.length < 3) return null

  // Simple completeness ratio: complete dimensions / total scored dimensions
  return Math.round((completeDims.length / SCORED_DIMENSIONS.length) * 100)
}
