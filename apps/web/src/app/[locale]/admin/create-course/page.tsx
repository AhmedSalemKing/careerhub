'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { post, get } from '../../../../lib/api'
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
    } catch {
      setError(isAr ? 'فشل رفع الصورة' : 'Image upload failed')
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
      setError(isAr ? 'فشل رفع الفيديو' : 'Video upload failed')
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
    width: '100%', padding: '12px 16px', borderRadius: 10,
    background: isDark ? '#1a1a1a' : '#f8fafc',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
    color: isDark ? '#f1f5f9' : '#0d0d0d',
    fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', color: isDark ? '#94a3b8' : '#6b7280',
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
      background: isDark ? '#0d0d0d' : '#f8fafc',
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
            <h1 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 28, fontWeight: 800, margin: 0 }}>
              {isAr ? 'إضافة كورس جديد' : 'Add New Course'}
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
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
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit('PUBLISHED') }} style={cardStyle}>
          
          {/* Basic Info Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <BookOpen size={18} color="#5120c8" />
              <h3 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 16, fontWeight: 700, margin: 0 }}>
                {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
              </h3>
            </div>

            {/* Assign Instructor */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                <User size={14} style={{ marginRight: 4 }} />
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
                style={inputStyle}
              >
                <option value="self">{isAr ? 'الأدمن هو صاحب الكورس' : 'Admin is the course owner'}</option>
                {(instructors as any[]).map((inst: any) => (
                  <option key={inst.id} value={inst.id}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
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
              <h3 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 16, fontWeight: 700, margin: 0 }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isDark ? '#94a3b8' : '#6b7280' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #5120c8', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    {isAr ? 'جارٍ الرفع...' : 'Uploading...'}
                  </div>
                ) : (
                  <>
                    <Upload size={28} color={isDark ? '#94a3b8' : '#6b7280'} style={{ opacity: 0.5 }} />
                    <p style={{ color: isDark ? '#94a3b8' : '#6b7280', fontSize: 13, margin: 0 }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isDark ? '#94a3b8' : '#6b7280' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #5120c8', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    {isAr ? `جارٍ الرفع... ${videoProgress}%` : `Uploading... ${videoProgress}%`}
                  </div>
                ) : (
                  <>
                    <Video size={28} color={isDark ? '#94a3b8' : '#6b7280'} style={{ opacity: 0.5 }} />
                    <p style={{ color: isDark ? '#94a3b8' : '#6b7280', fontSize: 13, margin: 0 }}>
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
                <h3 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 16, fontWeight: 700, margin: 0 }}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '12px 24px', borderRadius: 12, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                background: 'transparent', color: isDark ? '#f1f5f9' : '#0d0d0d',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            
            <button
              type="button"
              onClick={() => handleSubmit('DRAFT')}
              disabled={saving}
              style={{
                padding: '12px 24px', borderRadius: 12, cursor: 'pointer',
                background: 'transparent',
                border: `2px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
                color: isDark ? '#94a3b8' : '#6b7280',
                fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <FileText size={16} />
              {saving ? (isAr ? 'جاري...' : 'Saving...') : (isAr ? 'حفظ كمسودة' : 'Save as Draft')}
            </button>
            
            <button
              type="button"
              onClick={() => handleSubmit('PUBLISHED')}
              disabled={saving}
              style={{
                padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: saving ? '#4b5563' : '#5120c8',
                color: '#fff', fontSize: 14, fontWeight: 700,
                boxShadow: '0 4px 16px rgba(81,32,200,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {saving ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  {isAr ? 'جاري النشر...' : 'Publishing...'}
                </>
              ) : (
                <>
                  <Globe size={16} />
                  {isAr ? 'نشر الكورس' : 'Publish Course'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}