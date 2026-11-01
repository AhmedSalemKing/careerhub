import type { CareerPath } from '@prisma/client'
import type { EvidenceFindings, CandidateCareerPath } from './types'

export interface CareerPathWithCourses extends CareerPath {
  courses: { id: string; titleAr: string; titleEn: string }[]
}

/**
 * Provisional career path matching based on evidence observations.
 *
 * IMPORTANT: This engine does NOT rank paths numerically or assign match scores.
 * Numerical ranking requires CTO-approved dimension weights.
 * All returned paths are marked status='PROVISIONAL', ranked=false.
 *
 * minMarketReadiness thresholds and estimatedReadyInMonths are disabled
 * until their business rules are approved.
 */
export function findCandidatePaths(
  evidenceFindings: EvidenceFindings,
  careerPaths: CareerPathWithCourses[],
): CandidateCareerPath[] {
  const candidates: CandidateCareerPath[] = []

  const interestObs = evidenceFindings['INTERESTS']
  const skillsObs = evidenceFindings['SKILLS']
  const marketObs = evidenceFindings['MARKET_READINESS']

  for (const path of careerPaths) {
    if (!path.isActive) continue

    const skillsPresent: string[] = []
    const skillsMissing: string[] = []
    const evidenceFor: string[] = []
    const evidenceAgainst: string[] = []

    // Skill intersection (from SKILLS evidence)
    if (skillsObs && path.skills?.length > 0) {
      const mentionedSkills = extractMentionedSkills(skillsObs.observations)
      for (const skill of path.skills) {
        if (mentionedSkills.includes(skill.toLowerCase())) {
          skillsPresent.push(skill)
          evidenceFor.push(`مهارة "${skill}" ذُكرت في إجاباتك`)
        } else {
          skillsMissing.push(skill)
        }
      }
    }

    // Interest alignment (structural check only — no weights)
    if (interestObs && interestObs.observations.length > 0) {
      evidenceFor.push('لديك إجابات في بُعد الاهتمامات')
    }

    // Market readiness level from Stage 6
    const marketReadinessLevel = deriveMarketLevel(marketObs?.observations ?? [])

    // Mark path as evidence-against if no matching skills at all
    if (path.skills?.length > 0 && skillsPresent.length === 0 && skillsObs) {
      evidenceAgainst.push('لم تُذكر أي من مهارات هذا المسار الأساسية')
    }

    // Only include path if there is at least some positive evidence
    if (evidenceFor.length > 0 || skillsPresent.length > 0) {
      candidates.push({
        pathSlug: path.slug,
        titleAr: path.titleAr,
        titleEn: path.titleEn,
        status: 'PROVISIONAL',
        ranked: false,
        evidenceFor,
        evidenceAgainst,
        skillsPresent,
        skillsMissing,
        workStyleMatch: null,     // requires workStyleTags metadata not yet in DB
        motivationMatch: null,    // requires motivationTags metadata not yet in DB
        marketReadinessLevel,
        recommendedCourseIds: path.courses.slice(0, 3).map(c => c.id),
      })
    }
  }

  return candidates
}

function extractMentionedSkills(observations: string[]): string[] {
  const skills: string[] = []
  for (const obs of observations) {
    if (obs.startsWith('selected:')) {
      skills.push(...obs.replace('selected:', '').split(',').map(s => s.trim().toLowerCase()))
    }
    if (obs.startsWith('text_answer:')) {
      // Text answers are not auto-parsed for skills without approved NLP
    }
  }
  return skills
}

function deriveMarketLevel(observations: string[]): 'LOW' | 'MEDIUM' | 'HIGH' | null {
  if (observations.length === 0) return null
  const hasPortfolio = observations.some(o => o.includes('portfolio') || o.includes('project'))
  const hasExperience = observations.some(o => o.includes('experience') || o.includes('work'))
  if (hasPortfolio && hasExperience) return 'HIGH'
  if (hasPortfolio || hasExperience) return 'MEDIUM'
  return 'LOW'
}
