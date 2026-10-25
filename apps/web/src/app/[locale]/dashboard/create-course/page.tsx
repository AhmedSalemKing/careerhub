'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { post, get } from '../../../../lib/api'
import { getUploadErrorMessage } from '../../../../lib/upload-error'
import Toast from '../../../components/Toast'
import {
  BookOpen,
  Image as ImageIcon,
  Video,
  Plus,
  Trash2,
  CheckCircle,
  Upload,
  X,
  User,
  FileText,
  Globe,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const token = typeof window !== 'undefined' ? localStorage.getItem('deveway_token') : null
  const res = await fetch(`${API_URL}/upload/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const err: Error & { status?: number } = new Error(body?.message || 'Image upload failed')
    err.status = res.status
    throw err
  }
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
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve(data.data.url as string)
        } catch {
          reject(new Error('Invalid response'))
        }
      } else {
        let msg = ''
        try {
          const body = JSON.parse(xhr.responseText)
          msg = body?.message || body?.error || ''
        } catch {}
        const err: Error & { status?: number } = new Error(msg || 'Video upload failed')
        err.status = xhr.status
        reject(err)
      }
    }
    xhr.onerror = () => reject(new Error('تعذر الاتصال بالخادم، تحقق من اتصالك'))
    xhr.open('POST', `${API_URL}/upload/video`)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

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
  { value: 'BEGINNER', labelAr: 'مبتدئ', labelEn: 'Beginner' },
  { value: 'INTERMEDIATE', labelAr: 'متوسط', labelEn: 'Intermediate' },
  { value: 'ADVANCED', labelAr: 'متقدم', labelEn: 'Advanced' },
]

const CURRENCIES = [
  { value: 'SAR', labelAr: 'ريال سعودي', labelEn: 'SAR' },
  { value: 'USD', labelAr: 'دولار أمريكي', labelEn: 'USD' },
  { value: 'EGP', labelAr: 'جنيه مصري', labelEn: 'EGP' },
]

export default function AdminCreateCoursePage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const check = () => setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    check()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', check)
    return () => media.removeEventListener('change', check)
  }, [])

  const [saving, setSaving] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [publishMode, setPublishMode] = useState<'draft' | 'review'>('draft')
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

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

  const { data: categories = [] } = useQuery({
    queryKey: ['course-categories'],
    queryFn: async () => {
      try {
        const res = await get('/courses/categories')
        return (res?.data as any)?.data ?? []
      } catch { return [] }
    },
  })

  const { data: careerPaths = [] } = useQuery({
    queryKey: ['career-paths'],
    queryFn: async () => {
      try {
        const res = await get('/career/paths')
        return (res?.data as any)?.data?.careerPaths ?? []
      } catch { return [] }
    },
  })

  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors-list'],
    queryFn: async () => {
      try {
        const res = await get('/users/instructors?limit=100')
        return (res?.data as any)?.data ?? []
      } catch { return [] }
    },
  })

  const [thumbUploading, setThumbUploading] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const thumbRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof CourseForm, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function handleThumbUpload(file: File) {
    setThumbUploading(true)
    try {
      const url = await uploadImageFile(file)
      set('thumbnail', url)
    } catch (err) {
      setError(getUploadErrorMessage(err, { kind: 'image', isAr, maxMB: 10 }))
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
    } catch (err) {
      setError(getUploadErrorMessage(err, { kind: 'video', isAr, maxMB: 500 }))
    } finally {
      setVideoUploading(false)
    }
  }

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

  async function handleSubmit(status: 'DRAFT' | 'PUBLISHED' = 'PUBLISHED') {
    if (!form.titleEn.trim()) { setError(isAr ? 'عنوان الكورس مطلوب' : 'Course title is required'); return }
    setSaving(true)
    setError('')
    try {
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
        status,
        thumbnail: form.thumbnail || undefined,
        previewVideo: form.previewVideo || undefined,
        duration: parseInt(form.duration) || 0,
        isInstructor: form.isInstructor,
        instructorId: !form.isInstructor ? form.instructorId : undefined,
        sections: form.sections.filter((s) => s.title && s.title.trim()).map((s) => ({ title: s.title.trim() })),
      }
      
      const response = await post('/admin/courses/create', payload)
      
      const msg = status === 'PUBLISHED'
        ? (isAr ? 'تم إنشاء الكورس ونشره بنجاح!' : 'Course created and published successfully!')
        : (isAr ? 'تم حفظ الكورس كمسودة بنجاح!' : 'Course saved as draft successfully!')
      setToast({ show: true, message: msg, type: 'success' })

      setTimeout(() => router.push(`/${locale}/admin/courses`), 1500)
      
    } catch (e: any) {
      console.error('[Admin] Create course error:', e)
      let errorMsg = isAr ? 'حدث خطأ، حاول مرة أخرى' : 'An error occurred, please try again'
      if (e?.response?.data?.message) errorMsg = e.response.data.message
      setError(errorMsg)
      setToast({ show: true, message: errorMsg, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', maxWidth: '100%', boxSizing: 'border-box',
    padding: '12px 16px', borderRadius: 10,
    background: isDark ? '#1a1a1a' : '#f8fafc',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
    color: isDark ? '#f1f5f9' : '#0d0d0d',
    fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', color: 'var(--muted)',
    fontSize: 13, fontWeight: 600, marginBottom: 8,
  }

  const cardStyle: React.CSSProperties = {
    background: isDark ? '#111111' : '#fff',
    borderRadius: 20, padding: 32,
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      padding: '32px 16px',
      direction: isAr ? 'rtl' : 'ltr',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(81,32,200,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={24} color="#5120c8" />
            </div>
            <h1 style={{ color: 'var(--foreground)', fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 800, margin: 0 }}>
              {isAr ? 'إضافة كورس جديد' : 'Add New Course'}
            </h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
            {isAr ? 'أضف كورسا جديدا للمنصة' : 'Add a new course to the platform'}
          </p>
        </div>

        {/* Toast */}
        {toast.show && (
          <div style={{
            position: 'fixed', top: 20, right: isAr ? 'auto' : 20, left: isAr ? 20 : 'auto',
            padding: '12px 20px', borderRadius: 12, zIndex: 50,
            background: toast.type === 'success' ? '#22c55e' : '#ef4444',
            color: '#fff', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}>
            {toast.message}
          </div>
        )}

        {/* Form Card */}
        {!showReview && <form onSubmit={(e) => { e.preventDefault(); if (!form.titleEn.trim()) { setError(isAr ? 'عنوان الكورس مطلوب' : 'Course title is required'); return; } setShowReview(true) }} style={cardStyle}>
          
          {/* Basic Info Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <BookOpen size={18} color="#5120c8" />
              <h3 style={{ color: 'var(--foreground)', fontSize: 16, fontWeight: 700, margin: 0 }}>
                {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
              </h3>
            </div>

            {/* Assign Instructor */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '100%', boxSizing: 'border-box', marginBottom: 16 }}>
              <label style={labelStyle}>
                <User size={14} style={{ marginLeft: isAr ? 4 : 0, marginRight: isAr ? 0 : 4 }} />
                {isAr ? 'تعيين المحاضر' : 'Assign Instructor'}
              </label>
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
                style={{
                  ...inputStyle,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <option value="self" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isAr ? 'الأدمن هو صاحب الكورس' : 'Admin is the course owner'}
                </option>
                {(instructors as any[]).map((inst: any) => (
                  <option key={inst.id} value={inst.id} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inst.profile?.firstName} {inst.profile?.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>{isAr ? 'عنوان الكورس (إنجليزي) *' : 'Course Title (English) *'}</label>
                <input
                  value={form.titleEn}
                  onChange={(e) => set('titleEn', e.target.value)}
                  placeholder="e.g. Introduction to Programming"
                  style={inputStyle}
                  onFocus={(e: any) => e.target.style.borderColor = '#5120c8'}
                  onBlur={(e: any) => e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}
                />
              </div>
              <div>
                <label style={labelStyle}>{isAr ? 'عنوان الكورس (عربي)' : 'Course Title (Arabic)'}</label>
                <input
                  value={form.titleAr}
                  onChange={(e) => set('titleAr', e.target.value)}
                  placeholder="مثال: مقدمة في البرمجة"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>{isAr ? 'وصف الكورس (إنجليزي)' : 'Course Description (English)'}</label>
                <textarea
                  value={form.descriptionEn}
                  onChange={(e) => set('descriptionEn', e.target.value)}
                  placeholder="Describe the course..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>
              <div>
                <label style={labelStyle}>{isAr ? 'وصف الكورس (عربي)' : 'Course Description (Arabic)'}</label>
                <textarea
                  value={form.descriptionAr}
                  onChange={(e) => set('descriptionAr', e.target.value)}
                  placeholder="وصف الكورس..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>
            </div>

            {/* Price, Duration, Level, Currency */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>{isAr ? 'السعر' : 'Price'}</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>{isAr ? 'المدة' : 'Duration'}</label>
                <input
                  type="number"
                  min="0"
                  value={form.duration}
                  onChange={(e) => set('duration', e.target.value)}
                  placeholder={isAr ? 'بالساعات' : 'Hours'}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>{isAr ? 'المستوى' : 'Level'}</label>
                <select
                  value={form.level}
                  onChange={(e) => set('level', e.target.value)}
                  style={inputStyle}
                >
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {isAr ? l.labelAr : l.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{isAr ? 'العملة' : 'Currency'}</label>
                <select
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  style={inputStyle}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.labelAr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Career Path & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>{isAr ? 'المسار المهني' : 'Career Path'}</label>
                <select
                  value={form.careerPathId}
                  onChange={(e) => set('careerPathId', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">{isAr ? 'اختر المسار' : 'Select Career Path'}</option>
                  {(careerPaths as any[]).map((cp) => (
                    <option key={cp.id} value={cp.id}>{isAr ? cp.titleAr : cp.titleEn}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{isAr ? 'التصنيف' : 'Category'}</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => set('categoryId', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">{isAr ? 'اختر التصنيف' : 'Select Category'}</option>
                  {(categories as any[]).map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`, margin: '24px 0' }} />

          {/* Media Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <ImageIcon size={18} color="#5120c8" />
              <h3 style={{ color: 'var(--foreground)', fontSize: 16, fontWeight: 700, margin: 0 }}>
                {isAr ? 'الوسائط' : 'Media'}
              </h3>
            </div>

            {/* Thumbnail */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{isAr ? 'صورة الغلاف' : 'Thumbnail Image'}</label>
              <div
                onClick={() => !thumbUploading && thumbRef.current?.click()}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  borderRadius: 12, padding: 20,
                  border: `2px dashed ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                  background: isDark ? '#1a1a1a' : '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                {form.thumbnail ? (
                  <img 
                    src={form.thumbnail.startsWith('http') ? form.thumbnail : `${API_URL}${form.thumbnail}`}
                    style={{ height: 100, maxWidth: '100%', objectFit: 'cover', borderRadius: 8 }} 
                    alt="thumbnail" 
                  />
                ) : thumbUploading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #5120c8', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    {isAr ? 'جارٍ الرفع...' : 'Uploading...'}
                  </div>
                ) : (
                  <>
                    <Upload size={28} color={isDark ? '#94a3b8' : '#6b7280'} style={{ opacity: 0.5 }} />
                    <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
                      {isAr ? 'اضغط لرفع صورة' : 'Click to upload image'}
                    </p>
                  </>
                )}
              </div>
              <input ref={thumbRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleThumbUpload(file) }}
              />
            </div>

            {/* Preview Video */}
            <div>
              <label style={labelStyle}>{isAr ? 'فيديو المعاينة' : 'Preview Video'}</label>
              <div
                onClick={() => !videoUploading && videoRef.current?.click()}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  borderRadius: 12, padding: 20,
                  border: `2px dashed ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                  background: isDark ? '#1a1a1a' : '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                {form.previewVideo ? (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <video
                      src={form.previewVideo}
                      style={{
                        width: '100%',
                        maxHeight: 180,
                        borderRadius: 8,
                        objectFit: 'cover',
                        background: '#000',
                      }}
                      preload="metadata"
                      onLoadedMetadata={(e) => { e.currentTarget.currentTime = 1 }}
                    />
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginTop: 8, padding: '4px 8px',
                      background: 'rgba(34,197,94,0.1)', borderRadius: 6,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14} color="#22c55e" />
                        <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 600 }}>
                          {isAr ? 'تم الرفع' : 'Uploaded'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); set('previewVideo', '') }}
                        style={{
                          background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 4,
                          padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        <X size={12} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                ) : videoUploading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #5120c8', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    {isAr ? `جارٍ الرفع... ${videoProgress}%` : `Uploading... ${videoProgress}%`}
                  </div>
                ) : (
                  <>
                    <Video size={28} color={isDark ? '#94a3b8' : '#6b7280'} style={{ opacity: 0.5 }} />
                    <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
                      {isAr ? 'اضغط لرفع فيديو' : 'Click to upload video'}
                    </p>
                  </>
                )}
              </div>
              <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }}
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleVideoUpload(file) }}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`, margin: '24px 0' }} />

          {/* Sections */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} color="#5120c8" />
                <h3 style={{ color: 'var(--foreground)', fontSize: 16, fontWeight: 700, margin: 0 }}>
                  {isAr ? 'المحتوى' : 'Content'}
                </h3>
              </div>
              <button
                type="button"
                onClick={addSection}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: 'rgba(81,32,200,0.1)', color: '#5120c8',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Plus size={14} />
                {isAr ? 'إضافة درس' : 'Add Lesson'}
              </button>
            </div>

            {form.sections.map((section, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input
                  value={section.title}
                  onChange={(e) => updateSection(i, e.target.value)}
                  placeholder={isAr ? `الدرس ${i + 1}` : `Lesson ${i + 1}`}
                  style={{ ...inputStyle, flex: 1 }}
                />
                {form.sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(i)}
                    style={{
                      padding: 8, borderRadius: 8, border: 'none',
                      background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: 12, borderRadius: 12,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            }}>
              <X size={20} color="#ef4444" />
              <p style={{ color: '#ef4444', fontSize: 14, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="grid grid-cols-3 gap-2 w-full mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: 'clamp(8px, 2vw, 12px) clamp(8px, 2vw, 16px)',
                fontSize: 'clamp(11px, 2.5vw, 14px)', fontWeight: 600,
                borderRadius: '10px', width: '100%', whiteSpace: 'nowrap',
                border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--foreground)',
                cursor: 'pointer', textAlign: 'center',
              }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            
            <button
              type="button"
              onClick={() => handleSubmit('DRAFT')}
              disabled={saving}
              style={{
                padding: 'clamp(8px, 2vw, 12px) clamp(8px, 2vw, 16px)',
                fontSize: 'clamp(11px, 2.5vw, 14px)', fontWeight: 600,
                borderRadius: '10px', width: '100%', whiteSpace: 'nowrap',
                background: 'transparent',
                border: '2px solid var(--border)',
                color: 'var(--muted)',
                cursor: 'pointer', textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <FileText size={14} />
              {saving ? (isAr ? 'جاري...' : 'Saving...') : (isAr ? 'مسودة' : 'Draft')}
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (!form.titleEn.trim()) { setError(isAr ? 'عنوان الكورس مطلوب' : 'Course title is required'); return; }
                setError('');
                setShowReview(true);
              }}
              style={{
                padding: 'clamp(8px, 2vw, 12px) clamp(8px, 2vw, 16px)',
                fontSize: 'clamp(11px, 2.5vw, 14px)', fontWeight: 600,
                borderRadius: '10px', width: '100%', whiteSpace: 'nowrap',
                border: 'none', cursor: 'pointer', textAlign: 'center',
                background: '#5120c8',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(81,32,200,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <CheckCircle size={14} />
              {isAr ? 'مراجعة وإنشاء' : 'Review & Create'}
            </button>
          </div>
        </form>}

        {/* Step 4 — Review Card */}
        {showReview && (
          <>
            <style>{`
              @font-face {
                font-family: 'PingARLT';
                src: url('/fonts/alfont_com_PingARLT-Medium.otf') format('opentype');
                font-weight: 500;
              }
              @font-face {
                font-family: 'PingARLT';
                src: url('/fonts/alfont_com_PingARLT-Light.otf') format('opentype');
                font-weight: 300;
              }
            `}</style>
            <div style={{
              maxWidth: 640,
              margin: '0 auto',
              background: '#0f1117',
              border: '1px solid #1e2030',
              borderRadius: 16,
              padding: '28px 24px',
              fontFamily: "'PingARLT', sans-serif",
              direction: 'rtl',
            }}>
              <h2 style={{ color: '#f9fafb', fontWeight: 700, fontSize: '1.1rem', marginBottom: 20, fontFamily: "'PingARLT', sans-serif", margin: '0 0 20px' }}>
                مراجعة وإنشاء الكورس
              </h2>

              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <span style={{
                    background: '#1e3a5f', color: '#60a5fa', borderRadius: 999,
                    padding: '3px 12px', fontSize: '0.75rem', fontWeight: 500,
                    display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
                    fontFamily: "'PingARLT', sans-serif",
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#93c5fd', display: 'inline-block' }} />
                    كورس
                  </span>
                  <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.3rem', color: '#f9fafb', fontFamily: "'PingARLT', sans-serif" }}>
                    {form.titleAr || form.titleEn || '—'}
                  </h2>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: '#1e1b4b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem',
                }}>
                  🎓
                </div>
              </div>

              {/* Info grid — 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {([
                  { label: 'الوصف', value: (form.descriptionAr || form.descriptionEn || '—').slice(0, 50) + ((form.descriptionAr || form.descriptionEn || '').length > 50 ? '...' : ''), icon: '📄' },
                  { label: 'العنوان بالإنجليزية', value: form.titleEn || '—', icon: '📝' },
                  { label: 'المستوى', value: LEVELS.find(l => l.value === form.level)?.labelAr || form.level, icon: '📊' },
                  { label: 'السعر', value: `${form.price} ${form.currency}`, icon: '🏷️' },
                  { label: 'عدد الدروس', value: `${form.sections.filter(s => s.title.trim()).length} درس`, icon: '📚' },
                  { label: 'الصورة', value: form.thumbnail ? 'تم الرفع ✓' : 'لا توجد', icon: '🖼️' },
                  { label: 'المدة التقريبية', value: form.duration ? `${form.duration} ساعة` : '—', icon: '⏱️' },
                ] as { label: string; value: string; icon: string }[]).map(({ label, value, icon }) => (
                  <div key={label} style={{
                    background: '#161b27', borderRadius: 10, padding: '12px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ color: '#9ca3af', fontSize: '0.72rem', fontWeight: 300, marginBottom: 4, fontFamily: "'PingARLT', sans-serif" }}>
                        {label}
                      </div>
                      <div style={{ color: '#f3f4f6', fontWeight: 500, fontSize: '0.92rem', fontFamily: "'PingARLT', sans-serif" }}>
                        {value}
                      </div>
                    </div>
                    <span style={{ fontSize: '1.1rem', opacity: 0.5 }}>{icon}</span>
                  </div>
                ))}
              </div>

              {/* Publication status */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#9ca3af', fontSize: '0.78rem', fontWeight: 300, fontFamily: "'PingARLT', sans-serif", marginBottom: 10 }}>
                  حالة النشر
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setPublishMode('draft')}
                    style={{
                      background: publishMode === 'draft' ? '#7c3aed' : '#161b27',
                      border: `1px solid ${publishMode === 'draft' ? '#7c3aed' : '#1e2030'}`,
                      borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                      color: '#f3f4f6', textAlign: 'right',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontFamily: "'PingARLT', sans-serif",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>حفظ كمسودة</div>
                      <div style={{ fontWeight: 300, fontSize: '0.73rem', color: '#d1d5db', marginTop: 2 }}>
                        لن يُعرض للطلاب
                      </div>
                    </div>
                    <span>📋</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPublishMode('review')}
                    style={{
                      background: publishMode === 'review' ? '#1e2030' : '#161b27',
                      border: `1px solid ${publishMode === 'review' ? '#4f46e5' : '#1e2030'}`,
                      borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                      color: '#f3f4f6', textAlign: 'right',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontFamily: "'PingARLT', sans-serif",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>إرسال للمراجعة</div>
                      <div style={{ fontWeight: 300, fontSize: '0.73rem', color: '#d1d5db', marginTop: 2 }}>
                        سيراجعه فريق DeveWay
                      </div>
                    </div>
                    <span>📤</span>
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: 12, borderRadius: 12, marginBottom: 12,
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5', fontSize: '0.875rem', fontFamily: "'PingARLT', sans-serif",
                }}>
                  {error}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => handleSubmit(publishMode === 'draft' ? 'DRAFT' : 'PUBLISHED')}
                  disabled={saving}
                  style={{
                    flex: 1, background: saving ? '#4b5563' : '#7c3aed', color: '#fff',
                    border: 'none', borderRadius: 10, padding: '13px',
                    fontWeight: 500, fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: "'PingARLT', sans-serif",
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {saving ? (
                    <>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                      جارٍ الإنشاء...
                    </>
                  ) : (
                    'إنشاء الكورس +'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReview(false); setError(''); }}
                  style={{
                    padding: '13px 20px', background: '#161b27',
                    border: '1px solid #1e2030', borderRadius: 10,
                    color: '#d1d5db', fontWeight: 300, fontSize: '0.9rem',
                    cursor: 'pointer', fontFamily: "'PingARLT', sans-serif",
                  }}
                >
                  السابق ←
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}