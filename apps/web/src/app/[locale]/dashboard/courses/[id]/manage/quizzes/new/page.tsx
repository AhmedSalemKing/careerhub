'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowRight, Save } from 'lucide-react'
import { get, post } from '@/lib/api'
import ToggleSwitch from '@/components/quizzes/ToggleSwitch'
import CustomSelect from '@/app/components/CustomSelect'

const inputCls =
  'w-full rounded-[10px] border border-[color:var(--line)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-primary transition-colors duration-150 placeholder:text-[color:var(--ink-2)]'
const labelCls = 'block text-sm font-semibold text-[var(--ink)] mb-1.5'

export default function NewQuizPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'ar'
  const isAr = locale === 'ar'
  const courseId = params.id as string

  const [form, setForm] = useState({
    title: '',
    titleAr: '' as string,
    description: '',
    durationMinutes: '30',
    passingScore: '60',
    maxAttempts: '1',
    allowRetake: true,
    retakeThreshold: '50',
    unlimitedRetakes: false,
    showResults: true,
    shuffleQuestions: false,
    shuffleChoices: false,
    sectionId: '',
    lessonId: '',
  })
  const [saving, setSaving] = useState(false)

  const { data: course } = useQuery({
    queryKey: ['instructor-course-details', courseId],
    queryFn: async () => {
      const res = await get(`/courses/instructor/${courseId}/details`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!courseId,
  })

  const sections: any[] = course?.sections ?? []
  const lessons = sections.flatMap((s: any) => (s.lessons ?? []).map((l: any) => ({ ...l, sectionId: s.id })))

  const set = (key: keyof typeof form, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }))

  const back = () => router.push(`/${locale}/dashboard/courses/${courseId}/manage/quizzes`)

  const save = async () => {
    if (!form.title.trim()) {
      toast.error((isAr ? 'أدخل عنوان الاختبار' : 'Enter the quiz title'))
      return
    }
    if (!form.lessonId) {
      toast.error((isAr ? 'اختر الدرس الذي سيظهر البرنامج الاختباري عنده' : 'Choose the lesson where the quiz will appear'))
      return
    }
    if (!form.sectionId) {
      toast.error((isAr ? 'اختر القسم الذي ينتمي إليه الدرس' : 'Choose the section the lesson belongs to'))
      return
    }
    setSaving(true)
    try {
      const res = await post('/quizzes', {
        courseId,
        title: form.title,
        titleAr: form.titleAr || form.title,
        description: form.description || null,
        durationMinutes: parseInt(form.durationMinutes, 10) || 30,
        passingScore: Math.min(100, Math.max(0, parseInt(form.passingScore, 10) || 60)),
        maxAttempts: Math.max(1, parseInt(form.maxAttempts, 10) || 1),
        allowRetake: form.allowRetake,
        retakeThreshold: Math.min(100, Math.max(0, parseInt(form.retakeThreshold, 10) || 0)),
        unlimitedRetakes: form.unlimitedRetakes,
        showResults: form.showResults,
        shuffleQuestions: form.shuffleQuestions,
        shuffleChoices: form.shuffleChoices,
        sectionId: form.sectionId,
        lessonId: form.lessonId,
      })
      const quiz = (res?.data as any)?.data ?? (res as any)?.data ?? null
      toast.success((isAr ? 'تم إنشاء الاختبار' : 'Quiz created'))
      router.push(`/${locale}/dashboard/courses/${courseId}/manage/quizzes/${quiz?.id ?? ''}/builder`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? (isAr ? 'حدث خطأ أثناء الإنشاء' : 'An error occurred while creating'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <button
          type="button"
          onClick={back}
          className="flex items-center gap-2 rounded-[10px] bg-[color:var(--surface-2)] px-3 py-2 text-sm font-semibold text-[color:var(--ink-2)] hover:text-[var(--ink)] transition-colors duration-150"
        >
          <ArrowRight className="h-4 w-4" />
          {isAr ? 'الرجوع للاختبارات' : 'Back to quizzes'}
        </button>
        <h1 className="mt-3 text-xl font-bold font-madinet text-[var(--ink)]">{isAr ? 'اختبار جديد' : 'New quiz'}</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
            <h2 className="mb-4 font-bold text-[var(--ink)]">{isAr ? 'بيانات الاختبار' : 'Quiz details'}</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>{isAr ? 'عنوان الاختبار *' : 'Quiz title *'}</label>
                <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={isAr ? 'مثال: اختبار الفصل الأول' : 'Example: First term quiz'} />
              </div>
              <div>
                <label className={labelCls}>{isAr ? 'العنوان بالإنجليزية' : 'Title in English'}</label>
                <input className={inputCls} value={form.titleAr} onChange={(e) => set('titleAr', e.target.value)} placeholder={isAr ? 'Quiz 1 (اختياري)' : 'Quiz 1 (optional)'} />
              </div>
              <div>
                <label className={labelCls}>{isAr ? 'الوصف' : 'Description'}</label>
                <textarea
                  className={`${inputCls} min-h-[90px] resize-y`}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder={isAr ? 'وصف قصير يظهر للطلاب' : 'A short description shown to students'}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>{isAr ? 'الدرس المرتبط *' : 'Linked lesson *'}</label>
                  <CustomSelect
                    value={form.lessonId}
                    onChange={(v) => {
                      set('lessonId', v)
                      const lesson = lessons.find((l) => l.id === v)
                      if (lesson) set('sectionId', lesson.sectionId)
                    }}
                    options={sections.flatMap((s: any) =>
                      (s.lessons ?? []).map((l: any) => ({ value: l.id as string, label: (l.titleAr || l.title) as string, group: s.title as string })),
                    )}
                    placeholder={isAr ? 'اختر الدرس...' : 'Choose the lesson...'}
                  />
                </div>
                <div>
                  <label className={labelCls}>{isAr ? 'القسم' : 'Section'}</label>
                  <input className={inputCls} value={sections.find((s) => s.id === form.sectionId)?.title ?? ''} readOnly placeholder={isAr ? 'يُحدد تلقائياً' : 'Set automatically'} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>{isAr ? 'المدة (دقيقة)' : 'Duration (minutes)'}</label>
                  <input className={inputCls} type="number" min={1} value={form.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>{isAr ? 'درجة النجاح (%)' : 'Passing score (%)'}</label>
                  <input className={inputCls} type="number" min={0} max={100} value={form.passingScore} onChange={(e) => set('passingScore', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
            <h2 className="mb-4 font-bold text-[var(--ink)]">{isAr ? 'الإعدادات' : 'Settings'}</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <ToggleSwitch checked={form.shuffleQuestions} onChange={(v) => set('shuffleQuestions', v)} label={isAr ? 'خلط ترتيب الأسئلة' : 'Shuffle question order'} />
              <ToggleSwitch checked={form.shuffleChoices} onChange={(v) => set('shuffleChoices', v)} label={isAr ? 'خلط ترتيب الخيارات' : 'Shuffle choice order'} />
              <ToggleSwitch checked={form.allowRetake} onChange={(v) => set('allowRetake', v)} label={isAr ? 'السماح بإعادة المحاولة' : 'Allow retaking'} />
              <ToggleSwitch checked={form.showResults} onChange={(v) => set('showResults', v)} label={isAr ? 'إظهار النتيجة والإجابات الصحيحة بعد التسليم' : 'Show the result and correct answers after submission'} />
            </div>
          </div>

          <div className="rounded-[14px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
            <h2 className="mb-4 font-bold text-[var(--ink)]">{isAr ? 'سياسة إعادة المحاولة' : 'Retake policy'}</h2>
            <div className="space-y-5">
              <ToggleSwitch
                checked={form.unlimitedRetakes}
                onChange={(v) => set('unlimitedRetakes', v)}
                label={isAr ? 'محاولات غير محدودة' : 'Unlimited attempts'}
              />

              {!form.unlimitedRetakes && (
                <div>
                  <label className={labelCls}>{isAr ? 'عدد المحاولات' : 'Number of attempts'}</label>
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    max={20}
                    value={form.maxAttempts}
                    onChange={(e) => set('maxAttempts', e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className={labelCls}>
                  {isAr ? 'حد إعادة المحاولة —' : 'Retake limit —'} {Math.min(100, Math.max(0, parseInt(form.retakeThreshold, 10) || 0))}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.min(100, Math.max(0, parseInt(form.retakeThreshold, 10) || 0))}
                  onChange={(e) => set('retakeThreshold', e.target.value)}
                  className="w-full accent-[color:var(--primary)]"
                />
              </div>

              <p className="rounded-[10px] bg-[color:var(--surface-2)]/60 p-3 text-xs leading-5 text-[color:var(--ink-2)]">
                {form.unlimitedRetakes
                  ? (isAr ? `الطالب يقدّر يعيد المحاولة بدون حد إذا كانت درجته أقل من ${Math.min(100, Math.max(0, parseInt(form.retakeThreshold, 10) || 0))}%.` : `The student can retake without a limit if their score is below ${Math.min(100, Math.max(0, parseInt(form.retakeThreshold, 10) || 0))}%.`)
                  : (isAr ? `الطالب يقدّر يعيد المحاولة حتى ${Math.max(1, parseInt(form.maxAttempts, 10) || 1)} مرة إذا كانت درجته أقل من ${Math.min(100, Math.max(0, parseInt(form.retakeThreshold, 10) || 0))}%.` : `The student can retake up to ${Math.max(1, parseInt(form.maxAttempts, 10) || 1)} times if their score is below ${Math.min(100, Math.max(0, parseInt(form.retakeThreshold, 10) || 0))}%.`)}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all duration-150"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isAr ? 'إنشاء والانتقال لبناء الأسئلة' : 'Create and go to building the questions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}