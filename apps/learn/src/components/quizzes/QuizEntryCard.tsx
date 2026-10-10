'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Clock, FileQuestion, Play } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { get } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from 'next-intl'
import toast from 'react-hot-toast'

interface QuizSummary {
  id: string
  title: string
  titleAr: string | null
  durationMinutes: number
  passingScore: number
  allowRetake: boolean
  maxAttempts: number
  _count: { questions: number }
}

export default function QuizEntryCard({ lessonId }: { lessonId?: string | null }) {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const { user } = useAuth()
  const courseId = params.courseId as string

  const { data } = useQuery({
    queryKey: ['lesson-quiz-active', lessonId],
    queryFn: async () => {
      if (!lessonId) return null
      const res = await get(`/quizzes/lesson/${lessonId}/active`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!lessonId,
  })

  const quiz: QuizSummary | null = data

  if (!quiz) return null

  return (
    <div
      className="mb-6 rounded-2xl p-5 border"
      style={{
        background: 'color-mix(in srgb, var(--card), transparent 5%)',
        borderColor: 'var(--border)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.02)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'rgba(81,32,200,0.08)' }}>
            <FileQuestion className="h-6 w-6" style={{ color: '#5120c8' }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground truncate">{quiz.titleAr || quiz.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
              <span className="flex items-center gap-1">
                <FileQuestion className="h-3.5 w-3.5" />
                {quiz._count.questions} سؤال
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {quiz.durationMinutes} دقيقة
              </span>
              <span>درجة النجاح: {quiz.passingScore}%</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/${locale}/learn/${courseId}/quiz/${quiz.id}`)}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity duration-150"
          style={{ background: '#5120c8' }}
        >
          <Play className="h-4 w-4" />
          ابدأ الاختبار
        </button>
      </div>
    </div>
  )
}