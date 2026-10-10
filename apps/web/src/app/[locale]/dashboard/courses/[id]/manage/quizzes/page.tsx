'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowRight, Plus, FileQuestion, ListChecks, Trash2, Clock, Layers } from 'lucide-react'
import { get, del } from '@/lib/api'
import StatusBadge from '@/components/quizzes/StatusBadge'
import ConfirmModal from '@/components/ConfirmModal'

export default function ManageQuizzesPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'ar'
  const courseId = params.id as string
  const qc = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['instructor-quizzes', courseId],
    queryFn: async () => {
      const res = await get(`/quizzes?courseId=${courseId}`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!courseId,
  })

  const back = () => router.push(`/${locale}/dashboard/courses/${courseId}/manage`)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await del(`/quizzes/${deleteTarget.id}`)
      toast.success('تم حذف الاختبار')
      qc.invalidateQueries({ queryKey: ['instructor-quizzes', courseId] })
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'حدث خطأ أثناء الحذف')
    } finally {
      setDeleteTarget(null)
    }
  }

  const list = Array.isArray(quizzes) ? quizzes : []

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-2 rounded-[10px] bg-[color:var(--surface-2)] px-3 py-2 text-sm font-semibold text-[color:var(--muted)] hover:text-foreground transition-colors duration-150"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-madinet text-foreground">اختبارات الكورس</h1>
            <p className="text-sm text-[color:var(--muted)] mt-1">أنشئ وادير اختبارات متعددة مع أسئلة اختيار من متعدد وأسئلة مقالية ورفع ملفات</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/dashboard/courses/${courseId}/manage/quizzes/new`)}
          className="flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-all duration-150"
        >
          <Plus className="h-4 w-4" />
          اختبار جديد
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-[14px] bg-[color:var(--surface-2)]" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--surface-2)]">
            <FileQuestion className="h-8 w-8 text-[color:var(--muted)]" />
          </div>
          <h3 className="text-lg font-bold text-foreground">لا توجد اختبارات بعد</h3>
          <p className="mt-2 text-sm text-[color:var(--muted)]">ابدأ بإنشاء أول اختبار لطلاب هذا الكورس</p>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/dashboard/courses/${courseId}/manage/quizzes/new`)}
            className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-all duration-150"
          >
            <Plus className="h-4 w-4" />
            إنشاء اختبار
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((quiz: any) => (
            <div
              key={quiz.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[color:var(--surface-2)]">
                  <FileQuestion className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-foreground truncate">{quiz.titleAr || quiz.title}</h3>
                    <StatusBadge status={quiz.status} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--muted)]">
                    {quiz.lessonTitleAr && <span className="truncate">{quiz.lessonTitleAr}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {quiz.durationMinutes} دقيقة
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {quiz._count?.questions ?? 0} سؤال
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-3.5 w-3.5" />
                      {quiz._count?.attempts ?? 0} محاولة
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/dashboard/courses/${courseId}/manage/quizzes/${quiz.id}/builder`)}
                  className="flex items-center gap-2 rounded-[10px] bg-[color:var(--surface-2)] px-4 py-2 text-sm font-semibold text-foreground hover:opacity-80 transition-opacity duration-150"
                >
                  تحرير الأسئلة
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/dashboard/courses/${courseId}/manage/quizzes/${quiz.id}/attempts`)}
                  className="flex items-center gap-2 rounded-[10px] bg-[color:var(--surface-2)] px-4 py-2 text-sm font-semibold text-foreground hover:opacity-80 transition-opacity duration-150"
                >
                  المحاولات
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(quiz)}
                  className="flex items-center gap-2 rounded-[10px] bg-[#ef4444]/10 px-3 py-2 text-sm font-semibold text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors duration-150"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="حذف الاختبار"
        message="سيتم حذف الاختبار مع جميع أسئلته ومحاولات الطلاب نهائياً. هل أنت متأكد؟"
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        confirmDestructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}