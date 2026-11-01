'use client'
import { useState, useCallback, useRef } from 'react'
import { getToken } from '@/lib/auth'

export interface CompassOption { id: string; textAr: string; textEn: string; order: number }
export interface CompassQuestion {
  id: string; type: string; dimension: string
  textAr: string; textEn: string
  hintAr?: string | null; hintEn?: string | null
  isBaseline: boolean; order: number
  minAnswers?: number | null; maxAnswers?: number | null
  options: CompassOption[]
  branchingReason?: string | null
}
export interface CompassStageData { stageNumber: number; titleAr: string; titleEn: string; questions: CompassQuestion[] }
export interface CompassProgress { answeredBaseline: number; totalBaseline: number; answeredFollowUp: number }
export type CompassSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED'

export interface SessionState {
  sessionId: string
  versionId: string
  status: CompassSessionStatus
  currentStage: number
  totalStages: number
  progress: CompassProgress
  currentStageData?: CompassStageData
  pendingFollowUps: CompassQuestion[]
  answeredQuestionIds?: string[]
}

export interface AnswerInput {
  questionId: string
  selectedOptionIds?: string[]
  rankingOrder?: { optionId: string; rank: number }[]
  textValue?: string
  ratingValue?: number
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function useCompassSession() {
  const [session, setSession] = useState<SessionState | null>(null)
  const [followUpQuestions, setFollowUpQuestions] = useState<CompassQuestion[]>([])
  const [report, setReport] = useState<object | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadingRef = useRef(false)

  const startSession = useCallback(async (versionId?: string) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/compass/sessions', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ versionId }),
      })
      const data = await res.json() as SessionState
      if (!res.ok) { setError('تعذّر بدء الاختبار. حاول مجدداً.'); return }
      setSession(data)
      setFollowUpQuestions(data.pendingFollowUps ?? [])
    } finally { loadingRef.current = false; setIsLoading(false) }
  }, [])

  const loadSession = useCallback(async (sessionId: string) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/compass/sessions/${sessionId}`, { headers: authHeaders() })
      const data = await res.json() as SessionState
      if (!res.ok) { setError('تعذّر تحميل الجلسة.'); return }
      setSession(data)
      setFollowUpQuestions(data.pendingFollowUps ?? [])
    } finally { loadingRef.current = false; setIsLoading(false) }
  }, [])

  const submitAnswers = useCallback(async (stageNumber: number, answers: AnswerInput[]) => {
    if (!session || loadingRef.current) return
    loadingRef.current = true
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/compass/sessions/${session.sessionId}/answers`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ stageNumber, answers }),
      })
      const data = await res.json() as {
        followUpQuestions: CompassQuestion[]
        nextStage: number | null
        isComplete: boolean
        progress: CompassProgress
      }
      if (!res.ok) { setError('تعذّر حفظ الإجابات. حاول مجدداً.'); return }
      setFollowUpQuestions(data.followUpQuestions ?? [])
      setSession(prev =>
        prev
          ? {
              ...prev,
              currentStage: data.nextStage ?? prev.currentStage,
              progress: data.progress,
              status: data.isComplete ? 'COMPLETED' : prev.status,
            }
          : prev,
      )
      return data
    } finally { loadingRef.current = false; setIsLoading(false) }
  }, [session])

  const completeSession = useCallback(async () => {
    if (!session || loadingRef.current) return
    loadingRef.current = true
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/compass/sessions/${session.sessionId}/complete`, {
        method: 'POST',
        headers: authHeaders(),
      })
      if (!res.ok) { setError('تعذّر إنهاء الاختبار.'); return }
      setSession(prev => prev ? { ...prev, status: 'COMPLETED' } : prev)
      await fetchReport(session.sessionId)
    } finally { loadingRef.current = false; setIsLoading(false) }
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReport = useCallback(async (sessionId: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/compass/sessions/${sessionId}/report`, { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setReport(data)
    } finally { setIsLoading(false) }
  }, [])

  return {
    session, followUpQuestions, report,
    isLoading, error,
    startSession, loadSession, submitAnswers, completeSession, fetchReport,
  }
}
