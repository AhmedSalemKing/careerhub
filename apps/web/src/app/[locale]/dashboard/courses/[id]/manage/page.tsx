'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Users, Settings, Video, Plus, X, Upload, CheckCircle } from 'lucide-react'
import { get, post, patch } from '../../../../../../lib/api'
import { AuthGate } from '../../../../../components/AuthGate'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

type Tab = 'content' | 'lectures' | 'students' | 'settings'

// ─── Video upload with progress ──────────────────────────────────────────────

async function uploadVideo(file: File, onProgress: (p: number) => void): Promise<string> {
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
        reject(new Error('فشل رفع الفيديو'))
      }
    }
    xhr.onerror = () => reject(new Error('فشل الاتصال'))
    xhr.open('POST', `${API_URL}/api/upload/video`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

// ─── Add Lecture Modal ────────────────────────────────────────────────────────

type LessonForm = {
  title: string
  description: string
  sectionId: string
  isFree: boolean
  videoUrl: string
}

function AddLectureModal({
  courseId,
  sections,
  onClose,
  onSaved,
}: {
  courseId: string
  sections: { id: string; title: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<LessonForm>({
    title: '',
    description: '',
    sectionId: sections[0]?.id ?? '',
    isFree: false,
    videoUrl: '',
  })
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof LessonForm>(k: K, v: LessonForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  async function handleVideoSelect(file: File) {
    setUploading(true)
    setProgress(0)
    try {
      const url = await uploadVideo(file, setProgress)
      set('videoUrl', url)
    } catch {
      setError('فشل رفع الفيديو')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('اسم المحاضرة مطلوب'); return }
    if (!form.sectionId) { setError('اختر القسم'); return }
    setSaving(true)
    setError('')
    try {
      await post(`/courses/sections/${form.sectionId}/lessons`, {
        title: form.title,
        description: form.description,
        videoUrl: form.videoUrl || undefined,
        isFree: form.isFree,
      })
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold font-madinet text-foreground">رفع محاضرة جديدة</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[color:var(--surface-2)] transition-colors">
            <X className="h-4 w-4 text-[color:var(--muted)]" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">اسم المحاضرة *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="مثال: مقدمة في البرمجة"
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">وصف (اختياري)</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">القسم *</label>
            <select
              value={form.sectionId}
              onChange={(e) => set('sectionId', e.target.value)}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          {/* Video upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">ملف الفيديو</label>
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)] p-5 cursor-pointer hover:border-primary/50 transition-colors"
            >
              {form.videoUrl ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">تم رفع الفيديو ✓</span>
                </div>
              ) : uploading ? (
                <div className="w-full space-y-2">
                  <div className="flex items-center gap-2 text-[color:var(--muted)] justify-center">
                    <Upload className="h-4 w-4 animate-bounce" />
                    <span className="text-sm">جارٍ الرفع... {progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[color:var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <Video className="h-7 w-7 text-[color:var(--muted)] opacity-40" />
                  <p className="text-xs text-[color:var(--muted)]">اضغط لرفع فيديو (MP4 — 500MB)</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleVideoSelect(f)
              }}
            />
          </div>

          {/* Free toggle */}
          <div className="flex items-center justify-between rounded-xl bg-[color:var(--surface-2)] px-4 py-3">
            <div>
              <div className="text-sm font-medium text-foreground">محاضرة مجانية؟</div>
              <div className="text-xs text-[color:var(--muted)]">تُعرض للطلاب غير المشتركين</div>
            </div>
            <button
              type="button"
              onClick={() => set('isFree', !form.isFree)}
              className={`relative h-6 w-11 rounded-full transition-all ${form.isFree ? 'bg-primary' : 'bg-[color:var(--border)]'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.isFree ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`}
              />
            </button>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[color:var(--border)] py-2.5 text-sm font-medium text-foreground hover:bg-[color:var(--surface-2)] transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            حفظ المحاضرة
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Manage Page ─────────────────────────────────────────────────────────

export default function ManageCoursePage() {
  const params = useParams()
  const locale = useLocale()
  const courseId = params.id as string
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>('content')
  const [showAddLecture, setShowAddLecture] = useState(false)
  const [addSectionTitle, setAddSectionTitle] = useState('')
  const [addingSec, setAddingSec] = useState(false)

  const { data: course, isLoading } = useQuery({
    queryKey: ['instructor-course-details', courseId],
    queryFn: async () => {
      const res = await get(`/courses/instructor/${courseId}/details`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!courseId,
  })

  async function handleAddSection() {
    if (!addSectionTitle.trim()) return
    setAddingSec(true)
    try {
      await post(`/courses/instructor/${courseId}/sections`, { title: addSectionTitle })
      setAddSectionTitle('')
      queryClient.invalidateQueries({ queryKey: ['instructor-course-details', courseId] })
    } finally {
      setAddingSec(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof BookOpen }[] = [
    { key: 'content', label: 'المحتوى', icon: BookOpen },
    { key: 'lectures', label: 'المحاضرات', icon: Video },
    { key: 'students', label: 'الطلاب', icon: Users },
    { key: 'settings', label: 'الإعدادات', icon: Settings },
  ]

  if (isLoading) {
    return (
      <div className="p-6 space-y-4" dir="rtl">
        <div className="h-8 w-48 animate-pulse rounded bg-[color:var(--surface-2)]" />
        <div className="h-48 animate-pulse rounded-2xl bg-[color:var(--surface)]" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="p-6 text-center" dir="rtl">
        <p className="text-[color:var(--muted)]">الكورس غير موجود أو ليس لديك صلاحية إدارته.</p>
      </div>
    )
  }

  const sections: { id: string; title: string; lessons: any[] }[] = course.sections ?? []

  return (
    <AuthGate>
      <div className="p-6" dir="rtl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-madinet text-foreground">{course.titleEn}</h1>
              {course.titleAr && <p className="text-sm text-[color:var(--muted)] mt-0.5">{course.titleAr}</p>}
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                course.status === 'PUBLISHED'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {course.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
            </span>
          </div>
          <div className="mt-2 flex gap-4 text-sm text-[color:var(--muted)]">
            <span>{course._count?.enrollments ?? 0} طالب</span>
            <span>·</span>
            <span>{sections.length} قسم</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl bg-[color:var(--surface)] border border-[color:var(--border)] p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-md'
                  : 'text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Content ── */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-madinet text-foreground">أقسام الكورس</h2>
            {sections.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-8 text-center text-sm text-[color:var(--muted)]">
                لا توجد أقسام بعد. أضف قسماً أولاً.
              </div>
            )}
            {sections.map((sec, i) => (
              <div key={sec.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-foreground">{sec.title}</h3>
                  <span className="text-xs text-[color:var(--muted)] mr-auto">
                    {sec.lessons?.length ?? 0} محاضرة
                  </span>
                </div>
                {sec.lessons?.length > 0 && (
                  <div className="space-y-1.5 mr-10">
                    {sec.lessons.map((lesson: any) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-2 rounded-xl bg-[color:var(--surface-2)] px-3 py-2 text-sm"
                      >
                        <Video className="h-3.5 w-3.5 text-[color:var(--muted)] shrink-0" />
                        <span className="flex-1 text-foreground truncate">{lesson.title}</span>
                        {lesson.isFree && (
                          <span className="text-xs rounded-full bg-green-500/15 text-green-400 px-2 py-0.5">مجانية</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Add section */}
            <div className="flex gap-3">
              <input
                value={addSectionTitle}
                onChange={(e) => setAddSectionTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                placeholder="اسم القسم الجديد"
                className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={handleAddSection}
                disabled={addingSec || !addSectionTitle.trim()}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {addingSec ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                إضافة قسم
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Lectures ── */}
        {activeTab === 'lectures' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-madinet text-foreground">المحاضرات</h2>
              {sections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddLecture(true)}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  رفع محاضرة
                </button>
              )}
            </div>

            {sections.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-8 text-center text-sm text-[color:var(--muted)]">
                أضف أقسام للكورس أولاً من تبويب "المحتوى"، ثم ارفع المحاضرات.
              </div>
            )}

            {sections.map((sec) => (
              <div key={sec.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 bg-[color:var(--surface-2)] border-b border-[color:var(--border)]">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">{sec.title}</h3>
                  <span className="text-xs text-[color:var(--muted)] mr-auto">{sec.lessons?.length ?? 0} محاضرة</span>
                </div>
                {sec.lessons?.length > 0 ? (
                  <div className="divide-y divide-[color:var(--border)]">
                    {sec.lessons.map((lesson: any) => (
                      <div key={lesson.id} className="flex items-center gap-3 px-5 py-3">
                        <Video className={`h-4 w-4 shrink-0 ${lesson.videoUrl ? 'text-primary' : 'text-[color:var(--muted)] opacity-30'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{lesson.title}</div>
                          {lesson.videoUrl && (
                            <div className="text-xs text-green-400 mt-0.5">فيديو مرفوع ✓</div>
                          )}
                        </div>
                        {lesson.isFree && (
                          <span className="text-xs rounded-full bg-green-500/15 text-green-400 px-2 py-0.5 shrink-0">مجانية</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-4 text-sm text-[color:var(--muted)]">لا توجد محاضرات في هذا القسم بعد.</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Students ── */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-madinet text-foreground">
              الطلاب ({course._count?.enrollments ?? 0})
            </h2>
            {(course.enrollments ?? []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] p-10 text-center">
                <Users className="h-10 w-10 mx-auto opacity-20 mb-3" />
                <p className="text-sm text-[color:var(--muted)]">لا يوجد طلاب مسجلون بعد</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
                <div className="divide-y divide-[color:var(--border)]">
                  {course.enrollments.map((en: any) => {
                    const firstName = en.user?.profile?.firstName ?? ''
                    const lastName = en.user?.profile?.lastName ?? ''
                    const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '؟'
                    return (
                      <div key={en.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                          {en.user?.profile?.avatar ? (
                            <img src={en.user.profile.avatar} className="h-full w-full rounded-full object-cover" alt="" />
                          ) : initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{firstName} {lastName}</div>
                          <div className="text-xs text-[color:var(--muted)]">{en.user?.email}</div>
                        </div>
                        <div className="mr-auto text-xs text-[color:var(--muted)]">
                          تقدم: {Math.round(en.progress ?? 0)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Settings ── */}
        {activeTab === 'settings' && (
          <CourseSettingsTab course={course} courseId={courseId} onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ['instructor-course-details', courseId] })
          } />
        )}
      </div>

      {/* Add lecture modal */}
      {showAddLecture && sections.length > 0 && (
        <AddLectureModal
          courseId={courseId}
          sections={sections.map((s) => ({ id: s.id, title: s.title }))}
          onClose={() => setShowAddLecture(false)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['instructor-course-details', courseId] })}
        />
      )}
    </AuthGate>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function CourseSettingsTab({
  course,
  courseId,
  onRefresh,
}: {
  course: any
  courseId: string
  onRefresh: () => void
}) {
  const [form, setForm] = useState({
    title: course.titleEn ?? '',
    titleAr: course.titleAr ?? '',
    description: course.descriptionEn ?? '',
    price: String(course.price ?? '0'),
    level: course.level ?? 'BEGINNER',
    status: course.status ?? 'DRAFT',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const setF = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSave() {
    setSaving(true)
    try {
      await patch(`/courses/${courseId}`, {
        title: form.title,
        titleAr: form.titleAr,
        description: form.description,
        price: parseFloat(form.price) || 0,
        level: form.level,
        status: form.status,
      })
      setSaved(true)
      onRefresh()
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const LEVELS = [
    { value: 'BEGINNER', label: 'مبتدئ' },
    { value: 'INTERMEDIATE', label: 'متوسط' },
    { value: 'ADVANCED', label: 'متقدم' },
  ]

  return (
    <div className="max-w-lg space-y-5">
      <h2 className="text-lg font-bold font-madinet text-foreground">إعدادات الكورس</h2>

      {[
        { label: 'العنوان', key: 'title' as const },
        { label: 'العنوان بالعربية', key: 'titleAr' as const },
      ].map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-foreground mb-1.5">{field.label}</label>
          <input
            value={form[field.key]}
            onChange={(e) => setF(field.key, e.target.value)}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">الوصف</label>
        <textarea
          value={form.description}
          onChange={(e) => setF('description', e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">السعر</label>
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => setF('price', e.target.value)}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">المستوى</label>
          <select
            value={form.level}
            onChange={(e) => setF('level', e.target.value)}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
          >
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">الحالة</label>
        <div className="flex gap-3">
          {[
            { value: 'DRAFT', label: 'مسودة' },
            { value: 'PUBLISHED', label: 'منشور' },
            { value: 'ARCHIVED', label: 'مؤرشف' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setF('status', opt.value)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                form.status === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)] hover:border-primary/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
      >
        {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
        {saved ? '✓ تم الحفظ' : 'حفظ التغييرات'}
      </button>
    </div>
  )
}
