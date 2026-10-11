'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowRight, Save } from 'lucide-react'
import { get, post } from '@/lib/api'
import ToggleSwitch from '@/components/quizzes/ToggleSwitch'
import SegmentedControl from '@/components/quizzes/SegmentedControl'

const inputCls =
  'w-full rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors duration-150 placeholder:text-[color:var(--muted)]'
const labelCls = 'block text-sm font-semibold text-foreground mb-1.5'

export default function NewQuizPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'ar'
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
      toast.error('أدخل عنوان الاختبار')
      return
    }
    if (!form.lessonId) {
      toast.error('اختر الدرس الذي سيظهر البرنامج الاختباري عنده')
      return
    }
    if (!form.sectionId) {
      toast.error('اختر القسم الذي ينتمي إليه الدرس')
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
      toast.success('تم إنشاء الاختبار')
      router.push(`/${locale}/dashboard/courses/${courseId}/manage/quizzes/${quiz?.id ?? ''}/builder`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'حدث خطأ أثناء الإنشاء')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <button
          type="button"
          onClick={back}
          className="flex items-center gap-2 rounded-[10px] bg-[color:var(--surface-2)] px-3 py-2 text-sm font-semibold text-[color:var(--muted)] hover:text-foreground transition-colors duration-150"
        >
          <ArrowRight className="h-4 w-4" />
          الرجوع للاختبارات
        </button>
        <h1 className="mt-3 text-xl font-bold font-madinet text-foreground">اختبار جديد</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <h2 className="mb-4 font-bold text-foreground">بيانات الاختبار</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>عنوان الاختبار *</label>
                <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثال: اختبار الفصل الأول" />
              </div>
              <div>
                <label className={labelCls}>العنوان بالإنجليزية</label>
                <input className={inputCls} value={form.titleAr} onChange={(e) => set('titleAr', e.target.value)} placeholder="Quiz 1 (اختياري)" />
              </div>
              <div>
                <label className={labelCls}>الوصف</label>
                <textarea
                  className={`${inputCls} min-h-[90px] resize-y`}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="وصف قصير يظهر للطلاب"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>الدرس المرتبط *</label>
                  <select
                    className={inputCls}
                    value={form.lessonId}
                    onChange={(e) => {
                      set('lessonId', e.target.value)
                      const lesson = lessons.find((l) => l.id === e.target.value)
                      if (lesson) set('sectionId', lesson.sectionId)
                    }}
                  >
                    <option value="">اختر الدرس...</option>
                    {sections.map((s: any) => (
                      <optgroup key={s.id} label={s.title}>
                        {(s.lessons ?? []).map((l: any) => (
                          <option key={l.id} value={l.id}>
                            {l.titleAr || l.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>القسم</label>
                  <input className={inputCls} value={sections.find((s) => s.id === form.sectionId)?.title ?? ''} readOnly placeholder="يُحدد تلقائياً" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>المدة (دقيقة)</label>
                  <input className={inputCls} type="number" min={1} value={form.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>درجة النجاح (%)</label>
                  <input className={inputCls} type="number" min={0} max={100} value={form.passingScore} onChange={(e) => set('passingScore', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>عدد المحاولات</label>
                  <input className={inputCls} type="number" min={1} value={form.maxAttempts} onChange={(e) => set('maxAttempts', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <h2 className="mb-4 font-bold text-foreground">الإعدادات</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <ToggleSwitch checked={form.shuffleQuestions} onChange={(v) => set('shuffleQuestions', v)} label="خلط ترتيب الأسئلة" />
              <ToggleSwitch checked={form.shuffleChoices} onChange={(v) => set('shuffleChoices', v)} label="خلط ترتيب الخيارات" />
              <ToggleSwitch checked={form.allowRetake} onChange={(v) => set('allowRetake', v)} label="السماح بإعادة المحاولة" />
              <ToggleSwitch checked={form.showResults} onChange={(v) => set('showResults', v)} label="إظهار النتيجة والإجابات الصحيحة بعد التسليم" />
            </div>
          </div>

          <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <h2 className="mb-4 font-bold text-foreground">سياسة إعادة المحاولة</h2>
            <div className="space-y-5">
              <ToggleSwitch
                checked={form.unlimitedRetakes}
                onChange={(v) => set('unlimitedRetakes', v)}
                label="محاولات غير محدودة"
              />

              {!form.unlimitedRetakes && (
                <div>
                  <label className={labelCls}>عدد المحاولات</label>
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
                  حد إعادة المحاولة — {Math.min(100, Math.max(0, parseInt(form.retakeThreshold, 10) || 0))}%
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

              <p className="rounded-[10px] bg-[color:var(--surface-2)]/60 p-3 text-xs leading-5 text-[color:var(--muted)]">
                {form.unlimitedRetakes
                  ? `الطالب يقدّر يعيد المحاولة بدون حد إذا كانت درجته أقل من ${Math.min(100, Math.max(0, parseInt(form.retakeThreshold, 10) || 0))}%.`
                  : `الطالب يقدّر يعيد المحاولة حتى ${Math.max(1, parseInt(form.maxAttempts, 10) || 1)} مرة إذا كانت درجته أقل من ${Math.min(100, Math.max(0, parseInt(form.retakeThreshold, 10) || 0))}%.`}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
              <h2 className="mb-3 font-bold text-foreground">نوع التصحيح</h2>
              <SegmentedControl
                options={[
                  { value: 'auto', label: 'تلقائي' },
                  { value: 'manual', label: 'يدوي' },
                ]}
                value="auto"
                onChange={() => {}}
              />
              <p className="mt-3 text-xs leading-5 text-[color:var(--muted)]">
                يمكنك إضافة أسئلة اختيار من متعدد تُصحّح تلقائياً، وأسئلة مقالية أو رفع ملفات تُصحّح يدوياً.
              </p>
            </div>
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
              إنشاء والانتقال لبناء الأسئلة
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}