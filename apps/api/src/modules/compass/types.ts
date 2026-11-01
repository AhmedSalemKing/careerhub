import type { CompassDimension, CompassQuestionType, CompassSessionStatus, CompassQuestionStatus } from '@prisma/client'

export type { CompassDimension, CompassQuestionType, CompassSessionStatus, CompassQuestionStatus }

// Dimensions that contribute to analytical scoring (excludes CONTEXT)
export const SCORED_DIMENSIONS: CompassDimension[] = [
  'INTERESTS',
  'SKILLS',
  'BEHAVIORAL_INDICATORS',
  'MOTIVATION',
  'WORK_PREFERENCES',
  'MARKET_READINESS',
]

export const STAGE_COUNT = 6
export const MAX_QUESTIONS_PER_SESSION = 36 // 24 baseline + 12 follow-up cap

export interface CompassOptionDto {
  id: string
  textAr: string
  textEn: string
  order: number
}

export interface CompassQuestionDto {
  id: string
  type: CompassQuestionType
  dimension: CompassDimension
  textAr: string
  textEn: string
  hintAr?: string | null
  hintEn?: string | null
  isBaseline: boolean
  order: number
  minAnswers?: number | null
  maxAnswers?: number | null
  options: CompassOptionDto[]
  branchingReason?: string | null // populated for follow-up questions
}

export interface CompassStageDto {
  stageNumber: number
  titleAr: string
  titleEn: string
  questions: CompassQuestionDto[]
}

export interface AnswerRecord {
  questionId: string
  dimension: CompassDimension
  type: CompassQuestionType
  selectedOptionIds: string[]
  rankingOrder: { optionId: string; rank: number }[] | null
  textValue: string | null
  ratingValue: number | null
  isFollowUp: boolean
  followUpDepth: number
}

// Evidence observation for a single dimension
export interface DimensionObservation {
  dimension: CompassDimension
  observations: string[]       // human-readable findings from answers
  selfReportedLevel?: string   // from rating scales
  practicalEvidence?: string   // from PRACTICAL_MINI answers
  discrepancies: string[]      // self-reported vs practical mismatches
  answerCount: number
  isComplete: boolean          // enough answers to form a view
}

export type EvidenceFindings = Partial<Record<CompassDimension, DimensionObservation>>

// A candidate career path — provisional, unranked
export interface CandidateCareerPath {
  pathSlug: string
  titleAr: string
  titleEn: string
  status: 'PROVISIONAL'  // always
  ranked: false           // always false until CTO approves weights
  evidenceFor: string[]
  evidenceAgainst: string[]
  skillsPresent: string[]
  skillsMissing: string[]
  workStyleMatch: boolean | null    // null = metadata not available
  motivationMatch: boolean | null   // null = metadata not available
  marketReadinessLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null
  recommendedCourseIds: string[]
}

// Session state for the frontend
export interface CompassSessionState {
  sessionId: string
  versionId: string
  status: CompassSessionStatus
  currentStage: number
  totalStages: number
  progress: {
    answeredBaseline: number
    totalBaseline: number
    answeredFollowUp: number
  }
  currentStageData?: CompassStageDto
  pendingFollowUps: CompassQuestionDto[]
}

// GET /sessions/:id response
export interface CompassSessionDetail extends CompassSessionState {
  answeredQuestionIds: string[]
}
