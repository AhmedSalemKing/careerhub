'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { post, get } from '../../../../lib/api'
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
  formData.append('image', file)
  const token = typeof window !== 'undefined' ? localStorage.getItem('deveway_token') : null
  const res = await fetch(`${API_URL}/api/upload/image`, {
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
    formData.append('video', file)
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
    xhr.open('POST', `${API_URL}/api/upload/video`)
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
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  price: string
  currency: string
  level: string
  status: string
  careerPathId: string
  categoryId: string
  thumbnail: string
  previewVideo: string
  sections: Section[]
  isInstructor: boolean
  instructorId: string
  duration: string
}

const LEVELS = [
  { value: 'BEGINNER', label: 'مبتدئ' },
  { value: 'INTERMEDIATE', label: 'متوسط' },
  { value: 'ADVANCED', label: 'متقدم' },
]

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminCreateCoursePage() {
  const locale = useLocale()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<CourseForm>({
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    price: '0',
    currency: 'SAR',
    level: 'BEGINNER',
    status: 'DRAFT',
    careerPathId: '',
    categoryId: '',
    thumbnail: '',
    previewVideo: '',
    sections: [{ title: '' }],
    isInstructor: true,
    instructorId: '',
    duration: '0',
  })

  // جلب التصنيفات
  const { data: categories = [] } = useQuery({
    queryKey: ['course-categories'],
    queryFn: async () => {
      try {
        const res = await get('/courses/categories')
        return (res?.data as any)?.data ?? []
      } catch { return [] }
    },
  })

  // جلب قائمة المحاضرين (للاختيار)
  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors-list'],
    queryFn: async () => {
      try {
        const res = await get('/users?role=INSTRUCTOR&limit=100')
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

  const set = (key: keyof CourseForm, value: string | boolean) =>
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

  // ─── Submit - استخدام endpoint الأدمن الصحيح ───────────────

  async function handleSubmit() {
    if (!form.titleEn.trim()) { setError('عنوان الكورس مطلوب'); return }
    setSaving(true)
    setError('')
    try {
      console.log('[Admin] Submitting course creation...')
      
      // ✅ Prepare payload with ALL data
      const payload = {
        titleEn: form.titleEn.trim(),
        titleAr: form.titleAr?.trim() || form.titleEn.trim(),
        descriptionEn: form.descriptionEn?.trim(),
        descriptionAr: form.descriptionAr?.trim() || form.descriptionEn?.trim(),
        careerPathId: form.careerPathId || undefined,
        categoryId: form.categoryId || undefined,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        level: form.level,
        status: form.status === 'PENDING_REVIEW' ? 'PUBLISHED' : (form.status === 'APPROVED' ? 'PUBLISHED' : form.status),
        thumbnail: form.thumbnail || undefined,
        previewVideo: form.previewVideo || undefined,
        duration: parseInt(form.duration) || 0,
        isInstructor: form.isInstructor,
        instructorId: !form.isInstructor ? form.instructorId : undefined,
        sections: form.sections
          .filter((s) => s.title && s.title.trim())
          .map((s) => ({ title: s.title.trim() })),
      }
      
      console.log('[Admin] Payload:', JSON.stringify(payload, null, 2))
      
      // ✅ Call the FIXED endpoint
      const response = await post('/admin/courses/create', payload)
      
      console.log('[Admin] ✅ Course created successfully!', response)
      
      // Success notification
      alert(`✅ تم إنشاء الكورس بنجاح!\n\n${form.status === 'PUBLISHED' ? 'تم نشره مباشرة' : 'تم حفظ كمسودة'}`)
      
      // Redirect to courses list or dashboard
      router.push(`/${locale}/admin/courses`)
      
    } catch (e: any) {
      console.error('[Admin] ❌ Create course error:', e)
      
      // Better error messages
      let errorMsg = 'حدث خطأ، حاول مرة أخرى'
      
      if (e?.response?.status === 404) {
        errorMsg = 'خطأ: الـ endpoint غير موجود (404) - تأكد من تشغيل السيرفر'
      } else if (e?.response?.status === 401 || e?.response?.status === 403) {
        errorMsg = 'ليس لديك صلاحية لإنشاء كورس'
      } else if (e?.response?.data?.message) {
        errorMsg = e.response.data.message
      } else if (e?.message) {
        errorMsg = e.message
      }
      
      setError(errorMsg)
    } finally {
      setSaving(false)
    }
  }

  // ─── Validation per step ─────────────────────────────────────

  function canProceed(): boolean {
    if (step === 1) return form.titleEn.trim().length > 0
    if (step === 2) return true
    if (step === 3) return true
    return true
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">إضافة كورس جديد (لوحة التحكم)</h1>
            <p className="text-sm text-[color:var(--muted)]">أنشئ كورس جديد بنفس طريقة المحاضر</p>
          </div>
        </div>
      </div>

      <StepIndicator step={step} total={4} />

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 space-y-5">
        
        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">1</span>
              المعلومات الأساسية
            </h2>
            
            {/* اختيار المحاضر */}
            <div className="p-4 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)]">
              <label className="block text-sm font-medium text-foreground mb-2">👤 تعيين المحاضر</label>
              <select
                value={form.isInstructor ? 'self' : form.instructorId}
                onChange={(e) => {
                  if (e.target.value === 'self') {
                    set('isInstructor', true)
                    set('instructorId', '')
                  } else {
                    set('isInstructor', false)
                    set('instructorId', e.target.value)
                  }
                }}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="self">✅ الأدمن هو صاحب الكورس</option>
                {(instructors as any[]).map((inst: any) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.profile?.firstName} {inst.profile?.lastName} ({inst.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">عنوان الكورس (إنجليزي) *</label>
                <input
                  value={form.titleEn}
                  onChange={(e) => set('titleEn', e.target.value)}
                  placeholder="Course Title in English"
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">عنوان الكورس (عربي)</label>
                <input
                  value={form.titleAr}
                  onChange={(e) => set('titleAr', e.target.value)}
                  placeholder="عنوان الكورس بالعربية"
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">وصف الكورس (إنجليزي)</label>
                <textarea
                  value={form.descriptionEn}
                  onChange={(e) => set('descriptionEn', e.target.value)}
                  placeholder="Course description..."
                  rows={3}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">وصف الكورس (عربي)</label>
                <textarea
                  value={form.descriptionAr}
                  onChange={(e) => set('descriptionAr', e.target.value)}
                  placeholder="وصف الكورس بالعربية..."
                  rows={3}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <label className="block text-sm font-medium text-foreground mb-1.5">المدة (ساعة)</label>
                <input
                  type="number"
                  min="0"
                  value={form.duration}
                  onChange={(e) => set('duration', e.target.value)}
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
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">العملة</label>
                <select
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="SAR">ريال سعودي</option>
                  <option value="USD">دولار أمريكي</option>
                  <option value="EGP">جنيه مصري</option>
                </select>
              </div>
            </div>

            {(categories as any[]).length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">المسار المهني</label>
                  <select
                    value={form.careerPathId}
                    onChange={(e) => set('careerPathId', e.target.value)}
                    className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  >
                    <option value="">اختر المسار</option>
                    {(categories as any[]).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">التصنيف</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => set('categoryId', e.target.value)}
                    className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  >
                    <option value="">اختر التصنيف</option>
                    {(categories as any[]).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: Media ── */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">2</span>
              الصورة والفيديو التعريفي
            </h2>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">صورة الغلاف (Thumbnail)</label>
              <div
                onClick={() => thumbRef.current?.click()}
                className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)] p-8 cursor-pointer hover:border-primary/50 transition-colors"
              >
                {form.thumbnail ? (
                  <>
                    <img 
                      src={form.thumbnail.startsWith('http') ? form.thumbnail : `${API_URL}${form.thumbnail}`}
                      className="h-40 w-auto max-w-full object-cover rounded-xl" 
                      alt="thumbnail" 
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); set('thumbnail', '') }}
                      className="absolute top-3 left-3 rounded-full bg-red-500/80 p-1.5 text-white hover:bg-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-xs text-green-400 mt-2">✓ تم رفع الصورة</p>
                  </>
                ) : thumbUploading ? (
                  <div className="flex items-center gap-2 text-[color:var(--muted)]">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>جارٍ رفع الصورة...</span>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12 text-[color:var(--muted)] opacity-40" />
                    <p className="text-sm text-[color:var(--muted)] text-center">اضغط لاختيار صورة<br/><span className="text-xs">(JPG, PNG — أقصى 10MB)</span></p>
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

            {/* Preview Video */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">فيديو تعريفي (اختياري)</label>
              <div
                onClick={() => !videoUploading && videoRef.current?.click()}
                className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)] p-8 cursor-pointer hover:border-primary/50 transition-colors"
              >
                {form.previewVideo ? (
                  <>
                    <Video className="h-12 w-12 text-green-400" />
                    <p className="text-sm font-medium text-green-400">✓ تم رفع الفيديو</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); set('previewVideo', '') }}
                      className="absolute top-3 left-3 rounded-full bg-red-500/80 p-1.5 text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : videoUploading ? (
                  <div className="w-full max-w-xs space-y-3">
                    <div className="flex items-center gap-2 text-[color:var(--muted)] justify-center">
                      <Upload className="h-5 w-5 animate-bounce text-primary" />
                      <span className="text-sm">جارٍ رفع الفيديو... {videoProgress}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-[color:var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <Video className="h-12 w-12 text-[color:var(--muted)] opacity-40" />
                    <p className="text-sm text-[color:var(--muted)] text-center">اضغط لاختيار فيديو<br/><span className="text-xs">(MP4 — أقصى 500MB)</span></p>
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
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">3</span>
              أقسام الكورس
            </h2>
            <p className="text-sm text-[color:var(--muted)] -mt-3 mb-4">أضف الأقسام (يمكنك إضافة المحاضرات لاحقاً من صفحة الكورس)</p>
            
            <div className="space-y-3">
              {form.sections.map((section, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <input
                    value={section.title}
                    onChange={(e) => updateSection(i, e.target.value)}
                    placeholder={`اسم القسم ${i + 1}...`}
                    className="flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  />
                  {form.sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(i)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-[color:var(--border)] text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              إضافة قسم آخر
            </button>
          </>
        )}

        {/* ── Step 4: Review & Publish ── */}
        {step === 4 && (
          <>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm text-green-500">4</span>
              مراجعة ونشر
            </h2>
            
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-5 space-y-4">
              <Row label="العنوان (EN)" value={form.titleEn || '—'} />
              <Row label="العنوان (AR)" value={form.titleAr || '—'} />
              <Row label="السعر" value={`${form.price} ${form.currency}`} />
              <Row label="المستوى" value={LEVELS.find(l => l.value === form.level)?.label} />
              <Row label="المدة" value={`${form.duration} ساعة`} />
              <Row label="المحاضر" value={form.isInstructor ? 'الأدمن' : 'محادر محدد'} />
              <Row label="الصورة" value={form.thumbnail ? '✓ تم الرفع' : '✗ لا توجد'} />
              <Row label="الفيديو" value={form.previewVideo ? '✓ تم الرفع' : '—'} />
              <Row label="الأقسام" value={`${form.sections.filter(s => s.title.trim()).length} قسم`} />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">حالة النشر</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'DRAFT', label: '📝 حفظ كمسودة', desc: 'لن يظهر للطلاب', color: 'border-[color:var(--border)]' },
                  { value: 'PUBLISHED', label: '✅ نشر مباشرة', desc: 'يظهر فوراً (صلاحيات الأدمن)', color: 'border-green-500' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('status', opt.value)}
                    className={`rounded-xl border p-4 text-right transition-all ${
                      form.status === opt.value
                        ? `${opt.color} bg-opacity-10 ring-2 ring-primary/30`
                        : 'border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-primary/30'
                    }`}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="text-xs text-[color:var(--muted)] mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 flex items-start gap-3">
            <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">خطأ</p>
              <p className="text-xs text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="rounded-xl border border-[color:var(--border)] px-6 py-2.5 text-sm font-medium text-foreground hover:bg-[color:var(--surface-2)] disabled:opacity-30 transition-all"
        >
          ← السابق
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => { setError(''); setStep((s) => s + 1) }}
            disabled={!canProceed()}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            التالي →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl bg-green-500 px-8 py-2.5 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                جارٍ الإنشاء...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                {form.status === 'PUBLISHED' ? 'نشر الكورس ✓' : 'حفظ كمسودة'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Helper Component ────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 pb-3 border-b border-[color:var(--border)] last:border-0">
      <span className="text-[color:var(--muted)] text-sm shrink-0">{label}</span>
      <span className="text-foreground font-medium text-sm text-left break-all">{value || '—'}</span>
    </div>
  )
}