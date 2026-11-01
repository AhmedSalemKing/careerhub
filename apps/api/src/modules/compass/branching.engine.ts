import type { CompassFollowUpRule, CompassQuestion } from '@prisma/client'
import type { AnswerRecord, CompassQuestionDto } from './types'
import { MAX_QUESTIONS_PER_SESSION } from './types'

export interface BranchingContext {
  rules: (CompassFollowUpRule & { followUpQuestion: CompassQuestion & { options: { id: string; textAr: string; textEn: string; order: number }[] } })[]
  alreadyPresentedIds: Set<string>
  answeredIds: Set<string>
  totalPresentedCount: number
}

export interface FollowUpResult {
  questions: CompassQuestionDto[]
  reasons: Record<string, string> // questionId -> reasonAr
}

/**
 * Deterministic follow-up selection.
 * Pure function — no side effects, no DB calls, fully testable.
 *
 * Rules:
 * 1. A follow-up is eligible if its trigger condition matches the submitted answer.
 * 2. A question is never presented twice per session (alreadyPresentedIds guard).
 * 3. Hard cap: if totalPresentedCount >= MAX_QUESTIONS_PER_SESSION, no follow-ups.
 * 4. Follow-up depth is bounded by the trigger question's maxFollowUpDepth.
 */
export function selectFollowUps(
  submittedAnswers: AnswerRecord[],
  context: BranchingContext,
): FollowUpResult {
  if (context.totalPresentedCount >= MAX_QUESTIONS_PER_SESSION) {
    return { questions: [], reasons: {} }
  }

  const selected: CompassQuestionDto[] = []
  const reasons: Record<string, string> = {}
  const seenInThisBatch = new Set<string>()

  for (const answer of submittedAnswers) {
    const matchingRules = context.rules
      .filter(r => r.triggerQuestionId === answer.questionId)
      .filter(r => !context.alreadyPresentedIds.has(r.followUpQuestionId))
      .filter(r => !seenInThisBatch.has(r.followUpQuestionId))
      .filter(r => ruleMatches(r, answer))
      .sort((a, b) => a.priority - b.priority)

    for (const rule of matchingRules) {
      if (context.totalPresentedCount + selected.length >= MAX_QUESTIONS_PER_SESSION) break

      const q = rule.followUpQuestion
      selected.push({
        id: q.id,
        type: q.type,
        dimension: q.dimension,
        textAr: q.textAr,
        textEn: q.textEn,
        hintAr: q.hintAr,
        hintEn: q.hintEn,
        isBaseline: false,
        order: 0,
        minAnswers: q.minAnswers,
        maxAnswers: q.maxAnswers,
        options: q.options.sort((a, b) => a.order - b.order),
        branchingReason: rule.reasonAr,
      })
      reasons[q.id] = rule.reasonAr
      seenInThisBatch.add(q.id)
    }
  }

  return { questions: selected, reasons }
}

function ruleMatches(rule: CompassFollowUpRule, answer: AnswerRecord): boolean {
  // No specific trigger option or condition = matches any answer
  if (!rule.triggerOptionId && !rule.triggerCondition) return true

  // Option-based trigger
  if (rule.triggerOptionId) {
    return answer.selectedOptionIds.includes(rule.triggerOptionId)
  }

  // Condition-based trigger (e.g., "rating>=4")
  if (rule.triggerCondition && answer.ratingValue != null) {
    return evaluateCondition(rule.triggerCondition, answer.ratingValue)
  }

  return false
}

function evaluateCondition(condition: string, value: number): boolean {
  const m = condition.match(/^rating\s*(>=|<=|>|<|==|!=)\s*(\d+)$/)
  if (!m) return false
  const threshold = parseInt(m[2], 10)
  switch (m[1]) {
    case '>=': return value >= threshold
    case '<=': return value <= threshold
    case '>':  return value > threshold
    case '<':  return value < threshold
    case '==': return value === threshold
    case '!=': return value !== threshold
    default:   return false
  }
}

/**
 * When a user changes a previous answer, compute which follow-up question IDs
 * were triggered by the old answer and must be invalidated.
 */
export function getInvalidatedFollowUpIds(
  changedQuestionId: string,
  rules: CompassFollowUpRule[],
  answeredIds: Set<string>,
): string[] {
  const directFollowUps = rules
    .filter(r => r.triggerQuestionId === changedQuestionId)
    .map(r => r.followUpQuestionId)
    .filter(id => answeredIds.has(id))

  // Also invalidate any follow-ups of follow-ups
  const all = new Set<string>(directFollowUps)
  let changed = true
  while (changed) {
    changed = false
    for (const rule of rules) {
      if (all.has(rule.triggerQuestionId) && !all.has(rule.followUpQuestionId)) {
        all.add(rule.followUpQuestionId)
        changed = true
      }
    }
  }

  return Array.from(all)
}
