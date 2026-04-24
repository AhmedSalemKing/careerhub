'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { post, patch, get } from '../../../../lib/api'
import { AuthGate } from '../../../components/AuthGate'
import { useAuthStore } from '../../../../stores/authStore'
import {
  BookOpen,
  Image as ImageIcon,
  Video,
  Plus,
  Trash2,
  CheckCircle,
  Upload,
  X,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// ─── Helpers ────────────────────────────────────────────────────────────────

async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const token = typeof window !== 'undefined' ? localStorage.getItem('deveway_token') : null
  const res = await fetch(`${API_URL}/upload/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) throw new Error('Image upload failed')
  const data = await res.json()
  return data.data.url as string
}

async function uploadVideoFile(
  file: File,
  onProgress: (p: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)
    const token = typeof window !== 'undefined' ? localStorage.getItem('deveway_token') : null
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        resolve(data.data.url as string)
      } catch {
        reject(new Error('Invalid response'))
      }
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.open('POST', `${API_URL}/upload/video`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8" dir="rtl">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${
              step > n
                ? 'bg-green-500 text-white'
                : step === n
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-[color:var(--surface-2)] text-[color:var(--muted)]'
            }`}
          >
            {step > n ? <CheckCircle className="h-4 w-4" /> : n}
          </div>
          {n < total && (
            <div className={`h-0.5 w-12 transition-all ${step > n ? 'bg-primary' : 'bg-[color:var(--border)]'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Types ──────────────────────────────────────────────────────────────────

type Section = { title: string }
type CourseForm = {
  title: string
  titleAr: string
  description: string
  price: string
  level: string
  status: string
  categoryId: string
  thumbnail: string
  previewVideo: string
  sections: Section[]
}

const LEVELS = [
  { value: 'BEGINNER', label: 'مبتدئ' },
  { value: 'INTERMEDIATE', label: 'متوسط' },
  { value: 'ADVANCED', label: 'متقدم' },
]

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CreateCoursePage() {
  const locale = useLocale()
  const router = useRouter()
  const { user, hydrate } = useAuthStore()

  useEffect(() => { hydrate() }, [hydrate])

  useEffect(() => {
    if (user && (user.accountType === 'CONSULTANT' || user.accountType === 'STUDENT')) {
      router.push(`/${locale}/dashboard`)
    }
  }, [user, locale, router])

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<CourseForm>({
    title: '',
    titleAr: '',
    description: '',
    price: '0',
    level: 'BEGINNER',
    status: 'DRAFT',
    categoryId: '',
    thumbnail: '',
    previewVideo: '',
    sections: [{ title: '' }],
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['course-categories'],
    queryFn: async () => {
      try {
        const res = await get('/courses/categories')
        return (res?.data as any)?.data ?? []
      } catch { return [] }
    },
  })

  // Upload states
  const [thumbUploading, setThumbUploading] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const thumbRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof CourseForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  // ─── Upload handlers ─────────────────────────────────────────

  async function handleThumbUpload(file: File) {
    setThumbUploading(true)
    try {
      const url = await uploadImageFile(file)
      set('thumbnail', url)
    } catch {
      setError('فشل رفع الصورة')
    } finally {
      setThumbUploading(false)
    }
  }

  async function handleVideoUpload(file: File) {
    setVideoUploading(true)
    setVideoProgress(0)
    try {
      const url = await uploadVideoFile(file, setVideoProgress)
      set('previewVideo', url)
    } catch {
      setError('فشل رفع الفيديو')
    } finally {
      setVideoUploading(false)
    }
  }

  // ─── Sections ────────────────────────────────────────────────

  function addSection() {
    setForm((f) => ({ ...f, sections: [...f.sections, { title: '' }] }))
  }

  function removeSection(i: number) {
    setForm((f) => ({ ...f, sections: f.sections.filter((_, j) => j !== i) }))
  }

  function updateSection(i: number, title: string) {
    setForm((f) => {
      const sections = [...f.sections]
      sections[i] = { title }
      return { ...f, sections }
    })
  }

  // ─── Submit ──────────────────────────────────────────────────

  async function handleSubmit() {
    if (!form.title.trim()) { setError('عنوان الكورس مطلوب'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: form.title,
        titleAr: form.titleAr,
        description: form.description,
        categoryId: form.categoryId || undefined,
        price: parseFloat(form.price) || 0,
        level: form.level,
        status: form.status,
        thumbnail: form.thumbnail || undefined,
        previewVideo: form.previewVideo || undefined,
        sections: form.sections.filter((s) => s.title.trim()).map((s) => ({ title: s.title })),
      }
      await post('/courses', payload)
      router.push(`/${locale}/dashboard/my-courses`)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'حدث خطأ، حاول مرة أخرى')
    } finally {
      setSaving(false)
    }
  }

  // ─── Validation per step ─────────────────────────────────────

  function canProceed(): boolean {
    if (step === 1) return form.title.trim().length > 0
    if (step === 2) return true
    if (step === 3) return true
    return true
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <AuthGate>
      <div className="p-6 max-w-2xl mx-auto" dir="rtl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-madinet text-foreground">بدء كورس جديد</h1>
          <p className="text-sm text-[color:var(--muted)] mt-1">أنشئ كورسك التعليمي خطوة بخطوة</p>
        </div>

        <StepIndicator step={step} total={4} />

        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 space-y-5">
          {/* ── Step 1: Basic Info ── */}
          {step === 1 && (
            <>
              <h2 className="text-lg font-bold font-madinet text-foreground">المعلومات الأساسية</h2>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">عنوان الكورس *</label>
                <input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="مثال: برمجة Python للمبتدئين"
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">العنوان بالعربية</label>
                <input
                  value={form.titleAr}
                  onChange={(e) => set('titleAr', e.target.value)}
                  placeholder="مثال: برمجة بايثون"
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">وصف الكورس</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="اكتب وصفاً مختصراً للكورس..."
                  rows={4}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">السعر (ريال)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">المستوى</label>
                  <select
                    value={form.level}
                    onChange={(e) => set('level', e.target.value)}
                    className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  >
                    {LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(categories as any[]).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">التخصص</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => set('categoryId', e.target.value)}
                    className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  >
                    <option value="">اختر التخصص</option>
                    {(categories as any[]).filter((c: any) => !c.parentId).map((mainCat: any) => (
                      <optgroup key={mainCat.id} label={mainCat.name}>
                        {(mainCat.children || []).map((sub: any) => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* ── Step 2: Media ── */}
          {step === 2 && (
            <>
              <h2 className="text-lg font-bold font-madinet text-foreground">الصورة والفيديو التعريفي</h2>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">صورة الغلاف</label>
                <div
                  onClick={() => thumbRef.current?.click()}
                  className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)] p-8 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {form.thumbnail ? (
                    <>
                      <img
src={form.thumbnail.startsWith('http') ? form.thumbnail : `${API_URL}${form.thumbnail}`}                        className="h-32 w-full object-cover rounded-xl"
                        alt="thumbnail"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); set('thumbnail', '') }}
                        className="absolute top-3 left-3 rounded-full bg-red-500/80 p-1 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : thumbUploading ? (
                    <div className="flex items-center gap-2 text-[color:var(--muted)]">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm">جارٍ الرفع...</span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-[color:var(--muted)] opacity-50" />
                      <p className="text-sm text-[color:var(--muted)]">اضغط لاختيار صورة (JPG, PNG — 10MB max)</p>
                    </>
                  )}
                </div>
                <input
                  ref={thumbRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleThumbUpload(file)
                  }}
                />
              </div>

              {/* Preview video */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">فيديو تعريفي (اختياري)</label>
                <div
                  onClick={() => !videoUploading && videoRef.current?.click()}
                  className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)] p-8 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {form.previewVideo ? (
                    <>
                      <Video className="h-8 w-8 text-green-400" />
                      <p className="text-sm font-medium text-green-400">تم رفع الفيديو ✓</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); set('previewVideo', '') }}
                        className="absolute top-3 left-3 rounded-full bg-red-500/80 p-1 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : videoUploading ? (
                    <div className="w-full max-w-xs space-y-2">
                      <div className="flex items-center gap-2 text-[color:var(--muted)] justify-center">
                        <Upload className="h-4 w-4 animate-bounce" />
                        <span className="text-sm">جارٍ رفع الفيديو... {videoProgress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[color:var(--border)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Video className="h-8 w-8 text-[color:var(--muted)] opacity-50" />
                      <p className="text-sm text-[color:var(--muted)]">اضغط لاختيار فيديو (MP4 — 500MB max)</p>
                    </>
                  )}
                </div>
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleVideoUpload(file)
                  }}
                />
              </div>
            </>
          )}

          {/* ── Step 3: Sections ── */}
          {step === 3 && (
            <>
              <h2 className="text-lg font-bold font-madinet text-foreground">أقسام الكورس</h2>
              <p className="text-sm text-[color:var(--muted)] -mt-3">أضف الأقسام (يمكنك إضافة المحاضرات لاحقاً)</p>
              <div className="space-y-3">
                {form.sections.map((section, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <input
                      value={section.title}
                      onChange={(e) => updateSection(i, e.target.value)}
                      placeholder={`اسم القسم ${i + 1}`}
                      className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                    />
                    {form.sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(i)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSection}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Plus className="h-4 w-4" />
                إضافة قسم آخر
              </button>
            </>
          )}

          {/* ── Step 4: Review & Publish ── */}
          {step === 4 && (
            <>
              <h2 className="text-lg font-bold font-madinet text-foreground">مراجعة ونشر</h2>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 space-y-3 text-sm">
                <Row label="العنوان" value={form.title} />
                <Row label="العنوان بالعربية" value={form.titleAr || '—'} />
                <Row label="الوصف" value={form.description ? form.description.slice(0, 80) + '...' : '—'} />
                <Row label="السعر" value={`${form.price} ريال`} />
                <Row label="المستوى" value={LEVELS.find((l) => l.value === form.level)?.label ?? form.level} />
                <Row label="الصورة" value={form.thumbnail ? 'تم الرفع ✓' : 'لا توجد'} />
                <Row label="الفيديو التعريفي" value={form.previewVideo ? 'تم الرفع ✓' : 'لا يوجد'} />
                <Row
                  label="الأقسام"
                  value={form.sections.filter((s) => s.title.trim()).map((s) => s.title).join('، ') || 'لا توجد أقسام'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">حالة النشر</label>
                <div className="flex gap-3">
                  {[
                    { value: 'DRAFT', label: 'حفظ كمسودة', desc: 'لن يُعرض للطلاب' },
                    { value: 'PENDING_REVIEW', label: 'إرسال للمراجعة', desc: 'سيراجعه فريق DeveWay قبل النشر' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('status', opt.value)}
                      className={`flex-1 rounded-xl border p-3 text-right transition-all ${
                        form.status === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-foreground hover:border-primary/50'
                      }`}
                    >
                      <div className="text-sm font-bold">{opt.label}</div>
                      <div className="text-xs text-[color:var(--muted)] mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-xl border border-[color:var(--border)] px-5 py-2.5 text-sm font-medium text-foreground hover:bg-[color:var(--surface-2)] disabled:opacity-30 transition-all"
          >
            السابق
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => { setError(''); setStep((s) => s + 1) }}
              disabled={!canProceed()}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              التالي
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {form.status === 'PENDING_REVIEW' ? 'إرسال للمراجعة' : 'حفظ كمسودة'}
            </button>
          )}
        </div>
      </div>
    </AuthGate>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[color:var(--muted)] shrink-0">{label}</span>
      <span className="text-foreground font-medium text-left break-all">{value}</span>
    </div>
  )
}
