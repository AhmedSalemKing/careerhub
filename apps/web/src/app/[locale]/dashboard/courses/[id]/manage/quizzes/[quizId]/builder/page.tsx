'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Send,
  X,
  Image as ImageIcon,
  CheckCheck,
  ListChecks,
  Upload,
} from 'lucide-react'
import { get, post, patch, del } from '@/lib/api'
import { getUploadErrorMessage } from '@/lib/upload-error'
import ToggleSwitch from '@/components/quizzes/ToggleSwitch'
import SegmentedControl from '@/components/quizzes/SegmentedControl'
import StatusBadge from '@/components/quizzes/StatusBadge'
import ConfirmModal from '@/components/ConfirmModal'

const inputCls =
  'w-full rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors duration-150 placeholder:text-[color:var(--muted)]'
const labelCls = 'block text-sm font-semibold text-foreground mb-1.5'

type QType = 'MCQ' | 'SHORT_ANSWER' | 'FILE_UPLOAD'

interface ChoiceDraft {
  id?: string
  text: string
  isCorrect: boolean
}

const emptyChoice = (): ChoiceDraft => ({ text: '', isCorrect: false })

const TYPE_META: Record<QType, { label: string }> = {
  MCQ: { label: 'اختيار من متعدد' },
  SHORT_ANSWER: { label: 'سؤال مقالي' },
  FILE_UPLOAD: { label: 'رفع ملف' },
}

export default function QuizBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'ar'
  const courseId = params.id as string
  const quizId = params.quizId as string
  const qc = useQueryClient()

  const [settings, setSettings] = useState({
    title: '',
    titleAr: '',
    description: '',
    durationMinutes: '',
    passingScore: '',
    maxAttempts: '',
    allowRetake: true,
    retakeThreshold: '50',
    unlimitedRetakes: false,
    showResults: true,
    shuffleQuestions: false,
    shuffleChoices: false,
  })
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const hydratedRef = useRef(false)
  const lastSavedRef = useRef('')

  const { data: quizData, isLoading } = useQuery({
    queryKey: ['instructor-quiz', quizId],
    queryFn: async () => {
      const res = await get(`/quizzes/${quizId}`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!quizId,
  })

  const quiz = quizData ?? null
  const questions: any[] = quiz?.questions ?? []
  const totalPoints = questions.reduce((sum, q) => sum + (q.points ?? 0), 0)

  useEffect(() => {
    if (quiz && !hydratedRef.current) {
      hydratedRef.current = true
      setSettings({
        title: quiz.title ?? '',
        titleAr: quiz.titleAr ?? '',
        description: quiz.description ?? '',
        durationMinutes: String(quiz.durationMinutes ?? 30),
        passingScore: String(quiz.passingScore ?? 60),
        maxAttempts: String(quiz.maxAttempts ?? 1),
        allowRetake: quiz.allowRetake ?? true,
        retakeThreshold: String(quiz.retakeThreshold ?? 50),
        unlimitedRetakes: quiz.unlimitedRetakes ?? false,
        showResults: quiz.showResults ?? true,
        shuffleQuestions: quiz.shuffleQuestions ?? false,
        shuffleChoices: quiz.shuffleChoices ?? false,
      })
      lastSavedRef.current = JSON.stringify({
        title: quiz.title ?? '',
        titleAr: quiz.titleAr ?? '',
        description: quiz.description ?? '',
        durationMinutes: quiz.durationMinutes ?? 30,
        passingScore: quiz.passingScore ?? 60,
        maxAttempts: quiz.maxAttempts ?? 1,
        allowRetake: quiz.allowRetake ?? true,
        retakeThreshold: quiz.retakeThreshold ?? 50,
        unlimitedRetakes: quiz.unlimitedRetakes ?? false,
        showResults: quiz.showResults ?? true,
        shuffleQuestions: quiz.shuffleQuestions ?? false,
        shuffleChoices: quiz.shuffleChoices ?? false,
      })
      setSaveState('saved')
    }
  }, [quiz])

  // Debounced auto-save of quiz settings
  useEffect(() => {
    if (!hydratedRef.current) return
    const snapshot = {
      title: settings.title,
      titleAr: settings.titleAr,
      description: settings.description,
      durationMinutes: parseInt(settings.durationMinutes, 10) || 30,
      passingScore: Math.min(100, Math.max(0, parseInt(settings.passingScore, 10) || 60)),
      maxAttempts: Math.max(1, parseInt(settings.maxAttempts, 10) || 1),
      allowRetake: settings.allowRetake,
      retakeThreshold: Math.min(100, Math.max(0, parseInt(settings.retakeThreshold, 10) || 0)),
      unlimitedRetakes: settings.unlimitedRetakes,
      showResults: settings.showResults,
      shuffleQuestions: settings.shuffleQuestions,
      shuffleChoices: settings.shuffleChoices,
    }
    if (JSON.stringify(snapshot) === lastSavedRef.current) return

    setSaveState('saving')
    const t = setTimeout(async () => {
      try {
        await patch(`/quizzes/${quizId}`, snapshot)
        lastSavedRef.current = JSON.stringify(snapshot)
        setSaveState('saved')
      } catch (e: any) {
        setSaveState('idle')
        toast.error(e?.response?.data?.message ?? 'تعذر حفظ الإعدادات')
      }
    }, 600)
    return () => clearTimeout(t)
  }, [settings, quizId])

  // ---- Editor state ----
  const [editorOpen, setEditorOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>('__new__')
  const [qForm, setQForm] = useState({
    type: 'MCQ' as QType,
    questionText: '',
    questionImage: '',
    note: '',
    points: '1',
    allowMultipleAnswers: false,
    choices: [] as ChoiceDraft[],
  })
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [deleteQuestion, setDeleteQuestion] = useState<any>(null)
  const [uploadingImg, setUploadingImg] = useState(false)

  const openNew = () => {
    setEditId('__new__')
    setQForm({
      type: 'MCQ',
      questionText: '',
      questionImage: '',
      note: '',
      points: '1',
      allowMultipleAnswers: false,
      choices: [emptyChoice(), emptyChoice()],
    })
    setEditorOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEdit = (q: any) => {
    setEditId(q.id)
    setQForm({
      type: (q.type as QType) ?? 'MCQ',
      questionText: q.questionText ?? '',
      questionImage: q.questionImage ?? '',
      note: q.note ?? '',
      points: String(q.points ?? 1),
      allowMultipleAnswers: q.allowMultipleAnswers ?? false,
      choices: (q.choices ?? []).map((c: any) => ({ id: c.id, text: c.text, isCorrect: c.isCorrect })),
    })
    setEditorOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const setType = (t: string) => {
    setQForm((f) => ({
      ...f,
      type: t as QType,
      allowMultipleAnswers: t === 'MCQ' ? f.allowMultipleAnswers : false,
      choices: t === 'MCQ' ? f.choices : [],
    }))
  }

  const setSingleCorrect = (idx: number) => {
    setQForm((f) => ({
      ...f,
      choices: f.choices.map((c, i) => ({ ...c, isCorrect: i === idx })),
    }))
  }

  const toggleCorrect = (idx: number) => {
    setQForm((f) => ({
      ...f,
      choices: f.choices.map((c, i) => (i === idx ? { ...c, isCorrect: !c.isCorrect } : c)),
    }))
  }

  const updateChoice = (idx: number, text: string) => {
    setQForm((f) => ({
      ...f,
      choices: f.choices.map((c, i) => (i === idx ? { ...c, text } : c)),
    }))
  }

  const addChoice = () => setQForm((f) => ({ ...f, choices: [...f.choices, emptyChoice()] }))
  const removeChoice = (idx: number) => setQForm((f) => ({ ...f, choices: f.choices.filter((_, i) => i !== idx) }))

  const uploadImage = async (file: File) => {
    setUploadingImg(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await post('/upload/image', fd)
      const url = (res?.data as any)?.data?.url ?? ''
      // Hide auto "تم الحفظ" toast from other flows; simply return url
      setQForm((f) => ({ ...f, questionImage: url }))
    } catch (e: any) {
      toast.error(getUploadErrorMessage(e, { kind: 'image', isAr: true, maxMB: 10 }))
    } finally {
      setUploadingImg(false)
    }
  }

  const saveQuestion = async () => {
    if (!qForm.questionText.trim()) {
      toast.error('اكتب نص السؤال')
      return
    }
    if (qForm.type === 'MCQ') {
      const filled = qForm.choices.filter((c) => c.text.trim())
      if (filled.length < 2) {
        toast.error('أضف خيارين على الأقل للسؤال')
        return
      }
      const correctCount = filled.filter((c) => c.isCorrect).length
      if (correctCount < 1) {
        toast.error('حدد إجابة صحيحة واحدة على الأقل')
        return
      }
      if (!qForm.allowMultipleAnswers && correctCount !== 1) {
        toast.error('للسؤال أحادي الإجابة اختر إجابة واحدة صحيحة فقط')
        return
      }
    }

    const payload = {
      type: qForm.type,
      questionText: qForm.questionText,
      questionImage: qForm.questionImage || null,
      note: qForm.note || null,
      points: Math.max(1, parseInt(qForm.points, 10) || 1),
      allowMultipleAnswers: qForm.type === 'MCQ' ? qForm.allowMultipleAnswers : false,
      choices:
        qForm.type === 'MCQ'
          ? qForm.choices.filter((c) => c.text.trim().length > 0).map((c, i) => ({ text: c.text, isCorrect: c.isCorrect, order: i }))
          : undefined,
    }

    setSavingQuestion(true)
    try {
      if (editId === '__new__') {
        await post(`/quizzes/${quizId}/questions`, payload)
        toast.success('تمت إضافة السؤال')
      } else {
        await patch(`/quizzes/${quizId}/questions/${editId}`, payload)
        toast.success('تم حفظ تعديلات السؤال')
      }
      qc.invalidateQueries({ queryKey: ['instructor-quiz', quizId] })
      setEditorOpen(false)
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'تعذر حفظ السؤال')
    } finally {
      setSavingQuestion(false)
    }
  }

  const confirmDeleteQuestion = async () => {
    if (!deleteQuestion) return
    try {
      await del(`/quizzes/${quizId}/questions/${deleteQuestion.id}`)
      toast.success('تم حذف السؤال')
      qc.invalidateQueries({ queryKey: ['instructor-quiz', quizId] })
      if (editId === deleteQuestion.id) setEditorOpen(false)
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'تعذر حذف السؤال')
    } finally {
      setDeleteQuestion(null)
    }
  }

  const moveQuestion = async (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= questions.length) return
    const next = [...questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    ;[next[index], next[target]] = [next[target], next[index]]
    try {
      await post(`/quizzes/${quizId}/reorder`, { order: next.map((q) => q.id) })
      qc.invalidateQueries({ queryKey: ['instructor-quiz', quizId] })
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'تعذر إعادة الترتيب')
    }
  }

  const publish = async (status: 'PUBLISHED' | 'DRAFT') => {
    try {
      const action = status === 'PUBLISHED' ? 'publish' : 'unpublish'
      await post(`/quizzes/${quizId}/${action}`)
      toast.success(status === 'PUBLISHED' ? 'تم نشر الاختبار' : 'تم إيقاف الاختبار')
      qc.invalidateQueries({ queryKey: ['instructor-quiz', quizId] })
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'تعذر تنفيذ العملية')
    }
  }

  const back = () => router.push(`/${locale}/dashboard/courses/${courseId}/manage/quizzes`)
  const setS = (key: keyof typeof settings, value: string | boolean) => setSettings((f) => ({ ...f, [key]: value }))

  const retakeThresholdNum = Math.min(100, Math.max(0, parseInt(settings.retakeThreshold, 10) || 0))
  const passingNum = Math.min(100, Math.max(0, parseInt(settings.passingScore, 10) || 60))
  const thresholdInvalid = retakeThresholdNum > passingNum
  const maxAttemptsNum = Math.max(1, parseInt(settings.maxAttempts, 10) || 1)

  const orderedQuestions = [...questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  if (isLoading) {
    return (
      <div className="p-6 space-y-4" dir="rtl">
        <div className="h-10 w-64 animate-pulse rounded-[10px] bg-[color:var(--surface-2)]" />
        <div className="h-40 animate-pulse rounded-[14px] bg-[color:var(--surface-2)]" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="p-6 text-center" dir="rtl">
        <p className="text-[color:var(--muted)]">الاختبار غير موجود</p>
      </div>
    )
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={back}
          className="flex items-center gap-2 rounded-[10px] bg-[color:var(--surface-2)] px-3 py-2 text-sm font-semibold text-[color:var(--muted)] hover:text-foreground transition-colors duration-150"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold font-madinet text-foreground">{settings.title || quiz.title || 'الاختبار'}</h1>
            <StatusBadge status={quiz.status} />
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--muted)]">
            <span>{questions.length} سؤال</span>
            <span className="text-[color:var(--border)]">•</span>
            <span>{totalPoints} نقطة</span>
            <span className="text-[color:var(--border)]">•</span>
            {saveState === 'saving' ? (
              <span className="text-[color:var(--muted)]">جارٍ الحفظ...</span>
            ) : saveState === 'saved' ? (
              <span className="flex items-center gap-1 text-[#10b981]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                تم الحفظ
              </span>
            ) : null}
          </div>
        </div>
        {quiz.status === 'PUBLISHED' ? (
          <button
            type="button"
            onClick={() => publish('DRAFT')}
            className="flex items-center gap-2 rounded-[10px] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm font-semibold text-[color:var(--muted)] hover:text-foreground transition-colors duration-150"
          >
            إيقاف النشر
          </button>
        ) : (
          <button
            type="button"
            onClick={() => publish('PUBLISHED')}
            className="flex items-center gap-2 rounded-[10px] bg-[#10b981] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-all duration-150"
          >
            <Send className="h-4 w-4" />
            نشر الاختبار
          </button>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5 min-w-0">
          <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-foreground">الأسئلة</h2>
              <button
                type="button"
                onClick={openNew}
                className="flex items-center gap-2 rounded-[10px] bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-all duration-150"
              >
                <Plus className="h-4 w-4" />
                إضافة سؤال
              </button>
            </div>

            {orderedQuestions.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)]/40 p-10 text-center">
                <ListChecks className="mx-auto mb-3 h-8 w-8 text-[color:var(--muted)]" />
                <p className="text-sm text-[color:var(--muted)]">لا توجد أسئلة بعد. أضف أول سؤال لبدء بناء الاختبار.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderedQuestions.map((q, index) => (
                  <div
                    key={q.id}
                    className="rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-2)]/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          <span className="rounded-full bg-[color:var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--muted)] border border-[color:var(--border)]">
                            {TYPE_META[(q.type as QType) ?? 'MCQ']?.label ?? q.type}
                          </span>
                          <span className="text-xs font-semibold text-[color:var(--muted)]">{q.points} نقطة</span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-foreground">{q.questionText}</p>
                        {q.type === 'MCQ' && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {q.choices.map((c: any) => (
                              <span
                                key={c.id}
                                className="truncate rounded-full bg-[color:var(--surface-2)] px-2.5 py-1 text-xs text-[color:var(--muted)] border border-[color:var(--border)] max-w-[200px]"
                              >
                                {c.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, -1)}
                          disabled={index === 0}
                          className="rounded-lg p-2 text-[color:var(--muted)] hover:text-foreground hover:bg-[color:var(--surface-2)] transition-colors duration-150 disabled:opacity-30"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(index, 1)}
                          disabled={index === orderedQuestions.length - 1}
                          className="rounded-lg p-2 text-[color:var(--muted)] hover:text-foreground hover:bg-[color:var(--surface-2)] transition-colors duration-150 disabled:opacity-30"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(q)}
                          className="flex items-center gap-1.5 rounded-[10px] bg-[color:var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-foreground hover:opacity-80 transition-opacity duration-150"
                        >
                          تحرير
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteQuestion(q)}
                          className="rounded-lg p-2 text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors duration-150"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 min-w-0">
          {editorOpen && (
            <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-foreground">{editId === '__new__' ? 'سؤال جديد' : 'تعديل السؤال'}</h2>
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-lg p-2 text-[color:var(--muted)] hover:text-foreground transition-colors duration-150"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>نوع السؤال</label>
                  <SegmentedControl
                    options={[
                      { value: 'MCQ', label: 'اختيار من متعدد' },
                      { value: 'SHORT_ANSWER', label: 'مقالي' },
                      { value: 'FILE_UPLOAD', label: 'رفع ملف' },
                    ]}
                    value={qForm.type}
                    onChange={setType}
                  />
                </div>

                <div>
                  <label className={labelCls}>نص السؤال</label>
                  <textarea
                    className={`${inputCls} min-h-[80px] resize-y`}
                    value={qForm.questionText}
                    onChange={(e) => setQForm((f) => ({ ...f, questionText: e.target.value }))}
                    placeholder="اكتب السؤال هنا"
                  />
                </div>

                <div>
                  <label className={labelCls}>صورة السؤال (اختياري)</label>
                  <div className="flex gap-2">
                    <input
                      className={inputCls}
                      value={qForm.questionImage}
                      onChange={(e) => setQForm((f) => ({ ...f, questionImage: e.target.value }))}
                      placeholder="رابط الصورة"
                    />
                    <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-[10px] bg-[color:var(--surface-2)] px-3 py-2.5 text-sm font-semibold text-foreground hover:opacity-80 transition-opacity duration-150">
                      {uploadingImg ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) uploadImage(file)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                  {qForm.questionImage && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-[color:var(--muted)]">
                      <ImageIcon className="h-3.5 w-3.5" />
                      تم إرفاق صورة
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelCls}>ملاحظة للطالب</label>
                  <input
                    className={inputCls}
                    value={qForm.note}
                    onChange={(e) => setQForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="تظهر فوق الخيارات / حقل الإجابة"
                  />
                </div>

                <div>
                  <label className={labelCls}>الدرجة</label>
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    value={qForm.points}
                    onChange={(e) => setQForm((f) => ({ ...f, points: e.target.value }))}
                  />
                </div>

                {qForm.type === 'MCQ' && (
                  <div className="rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-2)]/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-foreground">الخيارات</h3>
                      <button
                        type="button"
                        onClick={addChoice}
                        className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-bold text-[#5120c8] bg-[#5120c8]/10 hover:bg-[#5120c8]/20 transition-colors duration-150"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        إضافة خيار
                      </button>
                    </div>

                    <ToggleSwitch
                      checked={qForm.allowMultipleAnswers}
                      onChange={(v) => setQForm((f) => ({ ...f, allowMultipleAnswers: v }))}
                      label="إجابات متعددة صحيحة"
                    />

                    <div className="mt-3 space-y-2">
                      {qForm.choices.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <button
                            type="button"
                            title={qForm.allowMultipleAnswers ? 'تبديل الصحة' : 'الإجابة الصحيحة'}
                            onClick={() => (qForm.allowMultipleAnswers ? toggleCorrect(idx) : setSingleCorrect(idx))}
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
                              c.isCorrect
                                ? 'border-[#10b981] bg-[#10b981] text-white'
                                : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-transparent'
                            }`}
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </button>
                          <input
                            className={inputCls}
                            value={c.text}
                            onChange={(e) => updateChoice(idx, e.target.value)}
                            placeholder={`الخيار ${idx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeChoice(idx)}
                            disabled={qForm.choices.length <= 1}
                            className="shrink-0 rounded-lg p-2 text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors duration-150 disabled:opacity-30"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-[color:var(--muted)]">
                      {qForm.allowMultipleAnswers
                        ? 'حدد كل الإجابات الصحيحة. يتطابق الاختيار معها كاملاً للمطابقة.'
                        : 'حدد إجابة صحيحة واحدة (زر دائري).'}
                    </p>
                  </div>
                )}

                {qForm.type === 'SHORT_ANSWER' && (
                  <p className="rounded-[10px] bg-[color:var(--surface-2)]/60 p-3 text-sm text-[color:var(--muted)]">
                    سؤال مقالي: يكتب الطالب إجابته نصياً، وتُصحَّح يدوياً من صفحة المحاولات.
                  </p>
                )}

                {qForm.type === 'FILE_UPLOAD' && (
                  <p className="rounded-[10px] bg-[color:var(--surface-2)]/60 p-3 text-sm text-[color:var(--muted)]">
                    سؤال رفع ملفات: يرفع الطالب ملفاً كإجابة، وتُصحَّح يدوياً من صفحة المحاولات.
                  </p>
                )}

                <button
                  type="button"
                  onClick={saveQuestion}
                  disabled={savingQuestion}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all duration-150"
                >
                  {savingQuestion ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editId === '__new__' ? 'إضافة السؤال' : 'حفظ التعديلات'}
                </button>
              </div>
            </div>
          )}

          <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <h2 className="mb-4 font-bold text-foreground">إعدادات الاختبار</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>عنوان الاختبار (عربي)</label>
                <input className={inputCls} value={settings.title} onChange={(e) => setS('title', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>العنوان بالإنجليزية</label>
                <input className={inputCls} value={settings.titleAr} onChange={(e) => setS('titleAr', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>الوصف</label>
                <textarea
                  className={`${inputCls} min-h-[70px] resize-y`}
                  value={settings.description}
                  onChange={(e) => setS('description', e.target.value)}
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className={labelCls}>المدة (دقيقة)</label>
                  <input className={inputCls} type="number" min={1} value={settings.durationMinutes} onChange={(e) => setS('durationMinutes', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>درجة النجاح (%)</label>
                  <input className={inputCls} type="number" min={0} max={100} value={settings.passingScore} onChange={(e) => setS('passingScore', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>عدد المحاولات</label>
                  <input className={inputCls} type="number" min={1} value={settings.maxAttempts} onChange={(e) => setS('maxAttempts', e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ToggleSwitch checked={settings.shuffleQuestions} onChange={(v) => setS('shuffleQuestions', v)} label="خلط الأسئلة" />
                <ToggleSwitch checked={settings.shuffleChoices} onChange={(v) => setS('shuffleChoices', v)} label="خلط الخيارات" />
                <ToggleSwitch checked={settings.allowRetake} onChange={(v) => setS('allowRetake', v)} label="السماح بالإعادة" />
                <ToggleSwitch checked={settings.showResults} onChange={(v) => setS('showResults', v)} label="إظهار النتيجة بعد التسليم" />
              </div>

              <details className="mt-4 rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-2)]/40 p-4">
                <summary className="cursor-pointer text-sm font-bold text-foreground">سياسة إعادة المحاولة</summary>
                <div className="mt-4 space-y-4">
                  <ToggleSwitch
                    checked={settings.unlimitedRetakes}
                    onChange={(v) => setS('unlimitedRetakes', v)}
                    label="محاولات غير محدودة"
                  />

                  {!settings.unlimitedRetakes && (
                    <div>
                      <label className={labelCls}>عدد المحاولات</label>
                      <input
                        className={inputCls}
                        type="number"
                        min={1}
                        max={20}
                        value={settings.maxAttempts}
                        onChange={(e) => setS('maxAttempts', e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelCls}>حد إعادة المحاولة — {retakeThresholdNum}%</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={retakeThresholdNum}
                      onChange={(e) => setS('retakeThreshold', e.target.value)}
                      className="w-full accent-[color:var(--primary)]"
                    />
                    {thresholdInvalid && (
                      <p className="mt-1 text-xs font-semibold text-[#ef4444]">
                        حد إعادة المحاولة يجب ألا يتجاوز درجة النجاح ({passingNum}%).
                      </p>
                    )}
                  </div>

                  <p className="rounded-[10px] bg-[color:var(--surface)] p-3 text-xs leading-5 text-[color:var(--muted)]">
                    {settings.unlimitedRetakes
                      ? `الطالب يقدّر يعيد المحاولة بدون حد إذا كانت درجته أقل من ${retakeThresholdNum}%.`
                      : `الطالب يقدّر يعيد المحاولة حتى ${maxAttemptsNum} مرة إذا كانت درجته أقل من ${retakeThresholdNum}%.`}
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteQuestion}
        title="حذف السؤال"
        message="سيتم حذف السؤال من الاختبار نهائياً."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        confirmDestructive
        onConfirm={confirmDeleteQuestion}
        onCancel={() => setDeleteQuestion(null)}
      />
    </div>
  )
}