'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Eye } from 'lucide-react'
import { get } from '@/lib/api'
import StatusBadge from '@/components/quizzes/StatusBadge'
import SegmentedControl from '@/components/quizzes/SegmentedControl'

export default function QuizAttemptsPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'ar'
  const courseId = params.id as string
  const quizId = params.quizId as string
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data: quiz } = useQuery({
    queryKey: ['instructor-quiz', quizId],
    queryFn: async () => {
      const res = await get(`/quizzes/${quizId}`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!quizId,
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['instructor-quiz-attempts', quizId, status, page],
    queryFn: async () => {
      const res = await get(`/quizzes/${quizId}/attempts?page=${page}&limit=20&status=${status}`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!quizId,
  })

  useEffect(() => {
    setPage(1)
  }, [status])

  const attempts: any[] = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  const back = () => router.push(`/${locale}/dashboard/courses/${courseId}/manage/quizzes`)
  const review = (aid: string) =>
    router.push(`/${locale}/dashboard/courses/${courseId}/manage/quizzes/attempts/${aid}`)

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-2 rounded-[10px] bg-[color:var(--surface-2)] px-3 py-2 text-sm font-semibold text-[color:var(--muted)] hover:text-foreground transition-colors duration-150"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-madinet text-foreground">محاولات الاختبار</h1>
            <p className="text-sm text-[color:var(--muted)] mt-1">{quiz?.titleAr || quiz?.title || ''}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 max-w-sm">
        <SegmentedControl
          options={[
            { value: 'ALL', label: 'الكل' },
            { value: 'SUBMITTED', label: 'بانتظار التصحيح' },
            { value: 'GRADED', label: 'مصحّحة' },
          ]}
          value={status}
          onChange={(v) => setStatus(v)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[14px] bg-[color:var(--surface-2)]" />
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center">
          <Eye className="mx-auto mb-3 h-8 w-8 text-[color:var(--muted)]" />
          <p className="text-sm text-[color:var(--muted)]">لا توجد محاولات في هذا القسم بعد.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] text-right">
                  <th className="px-4 py-3 font-bold text-foreground">الطالب</th>
                  <th className="px-4 py-3 font-bold text-foreground">البداية</th>
                  <th className="px-4 py-3 font-bold text-foreground">الحالة</th>
                  <th className="px-4 py-3 font-bold text-foreground">الدرجة</th>
                  <th className="px-4 py-3 font-bold text-foreground">النتيجة</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {attempts.map((a: any) => {
                  const name = `${a.user?.profile?.firstName ?? ''} ${a.user?.profile?.lastName ?? ''}`.trim() || a.user?.email || '—'
                  const date = a.startedAt ? new Date(a.startedAt).toLocaleString('ar-EG-u-ca-gregory', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
                  return (
                    <tr key={a.id} className="border-b border-[color:var(--border)] last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[color:var(--muted)]">{date}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {Math.round((a.totalScore ?? 0) * 100) / 100} / {Math.round((a.maxScore ?? 0) * 100) / 100}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.passed ? 'PASSED' : 'FAILED'} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => review(a.id)}
                          className="flex items-center gap-1.5 rounded-[10px] bg-[color:var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-foreground hover:opacity-80 transition-opacity duration-150"
                        >
                          مراجعة
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-[10px] bg-[color:var(--surface-2)] px-3 py-1.5 text-sm font-semibold disabled:opacity-30 transition-opacity duration-150"
              >
                السابق
              </button>
              <span className="text-sm text-[color:var(--muted)]">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-[10px] bg-[color:var(--surface-2)] px-3 py-1.5 text-sm font-semibold disabled:opacity-30 transition-opacity duration-150"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}