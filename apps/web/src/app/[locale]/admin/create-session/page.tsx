'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { post, get } from '../../../../lib/api'
import {
  Calendar,
  Clock,
  User,
  Video,
  Image as ImageIcon,
  MapPin,
  CheckCircle,
  Upload,
  X,
  DollarSign,
  GraduationCap,
  FileText,
  Plus,
  Phone,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

type SessionForm = {
  studentId: string
  consultantId: string
  topic: string
  scheduledAt: string
  price: string
  meetingMethod: string
  duration: string
  notes: string
  imageUrl: string
}

const MEETING_METHODS = [
  { value: 'ONLINE', labelAr: 'أونلاين', labelEn: 'Online', icon: Video },
  { value: 'IN_PERSON', labelAr: 'حضوري', labelEn: 'In Person', icon: MapPin },
  { value: 'PHONE', labelAr: 'هاتف', labelEn: 'Phone Call', icon: Phone },
]

export default function AdminCreateSessionPage() {
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
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState<SessionForm>({
    studentId: '',
    consultantId: '',
    topic: '',
    scheduledAt: '',
    price: '0',
    meetingMethod: 'ONLINE',
    duration: '60',
    notes: '',
    imageUrl: '',
  })

  const [imageUploading, setImageUploading] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)

  const { data: students = [] } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      try {
        const res = await get('/users?role=STUDENT&limit=200')
        return (res?.data as any)?.data ?? []
      } catch { return [] }
    },
  })

  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants-list'],
    queryFn: async () => {
      try {
        const res = await get('/users?role=CONSULTANT&limit=200')
        return (res?.data as any)?.data ?? []
      } catch { return [] }
    },
  })

  const set = (key: keyof SessionForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function handleImageUpload(file: File) {
    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = typeof window !== 'undefined' ? localStorage.getItem('deveway_token') : null
      
      const res = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      set('imageUrl', data.data.url)
    } catch {
      setError(isAr ? 'فشل رفع الصورة' : 'Image upload failed')
    } finally {
      setImageUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!form.topic.trim()) { setError(isAr ? 'موضوع الجلسة مطلوب' : 'Session topic is required'); return }
    if (!form.scheduledAt) { setError(isAr ? 'موعد الجلسة مطلوب' : 'Session date/time is required'); return }
    
    setSaving(true)
    setError('')
    
    try {
      const payload = {
        studentId: form.studentId || undefined,
        consultantId: form.consultantId || undefined,
        topic: form.topic,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        price: parseFloat(form.price) || 0,
        meetingMethod: form.meetingMethod,
        duration: parseInt(form.duration) || 60,
        notes: form.notes || undefined,
        imageUrl: form.imageUrl || undefined,
        status: 'SCHEDULED',
      }

      await post('/sessions', payload)
      setSuccess(true)
      setTimeout(() => {
        router.push(`/${locale}/admin/sessions`)
      }, 1500)
      
    } catch (e: any) {
      console.error('Create session error:', e)
      setError(e?.response?.data?.message || e?.message || (isAr ? 'حدث خطأ أثناء إنشاء الجلسة' : 'Error creating session'))
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
              <Calendar size={24} color="#5120c8" />
            </div>
            <h1 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 28, fontWeight: 800, margin: 0 }}>
              {isAr ? 'إضافة جلسة جديدة' : 'Add New Session'}
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            {isAr ? 'جدولة جلسة استشارة أو محاضرة' : 'Schedule a consultation or lecture session'}
          </p>
        </div>

        {/* Success State */}
        {success && (
          <div style={{
            marginBottom: 24, padding: 16, borderRadius: 14,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <CheckCircle size={24} color="#22c55e" />
            <div>
              <p style={{ color: '#22c55e', fontWeight: 700, margin: 0 }}>
                {isAr ? 'تم إنشاء الجلسة بنجاح!' : 'Session created successfully!'}
              </p>
              <p style={{ color: 'rgba(34,197,94,0.7)', fontSize: 13, margin: 0 }}>
                {isAr ? 'جاري التحويل لصفحة الجلسات...' : 'Redirecting to sessions...'}
              </p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} style={cardStyle}>
          
          {/* Session Info Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <User size={18} color="#5120c8" />
              <h3 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 16, fontWeight: 700, margin: 0 }}>
                {isAr ? 'معلومات الجلسة' : 'Session Information'}
              </h3>
            </div>

            {/* Topic */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                {isAr ? 'موضوع الجلسة *' : 'Session Topic *'}
              </label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => set('topic', e.target.value)}
                placeholder={isAr ? 'مثال: استشارة في التسويق الرقمي' : 'e.g. Digital Marketing Consultation'}
                style={inputStyle}
                onFocus={(e: any) => e.target.style.borderColor = '#5120c8'}
                onBlur={(e: any) => e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}
              />
            </div>

            {/* Student & Consultant */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>
                  <User size={14} style={{ marginRight: 4 }} />
                  {isAr ? 'الطالب (اختياري)' : 'Student (optional)'}
                </label>
                <select
                  value={form.studentId}
                  onChange={(e) => set('studentId', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">{isAr ? 'اختر الطالب' : 'Select Student'}</option>
                  {(students as any[]).map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {student.profile?.firstName} {student.profile?.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  <GraduationCap size={14} style={{ marginRight: 4 }} />
                  {isAr ? 'المستشار / المحاضر (اختياري)' : 'Consultant / Instructor (optional)'}
                </label>
                <select
                  value={form.consultantId}
                  onChange={(e) => set('consultantId', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">{isAr ? 'اختر المستشار' : 'Select Consultant'}</option>
                  {(consultants as any[]).map((cons: any) => (
                    <option key={cons.id} value={cons.id}>
                      {cons.profile?.firstName} {cons.profile?.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Schedule, Duration, Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>
                  <Calendar size={14} style={{ marginRight: 4 }} />
                  {isAr ? 'الموعد والتوقيت *' : 'Date & Time *'}
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => set('scheduledAt', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  <Clock size={14} style={{ marginRight: 4 }} />
                  {isAr ? 'المدة' : 'Duration'}
                </label>
                <select
                  value={form.duration}
                  onChange={(e) => set('duration', e.target.value)}
                  style={inputStyle}
                >
                  <option value="30">{isAr ? '30 دقيقة' : '30 min'}</option>
                  <option value="60">{isAr ? '60 دقيقة' : '60 min'}</option>
                  <option value="90">{isAr ? '90 دقيقة' : '90 min'}</option>
                  <option value="120">{isAr ? '120 دقيقة' : '120 min'}</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  <DollarSign size={14} style={{ marginRight: 4 }} />
                  {isAr ? 'السعر' : 'Price'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Meeting Method */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 12 }}>
                <MapPin size={14} style={{ marginRight: 4 }} />
                {isAr ? 'طريقة الاجتماع' : 'Meeting Method'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {MEETING_METHODS.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => set('meetingMethod', method.value)}
                    style={{
                      padding: '12px', borderRadius: 12,
                      border: `2px solid ${form.meetingMethod === method.value ? '#5120c8' : isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                      background: form.meetingMethod === method.value ? 'rgba(81,32,200,0.1)' : 'transparent',
                      color: form.meetingMethod === method.value ? '#5120c8' : isDark ? '#94a3b8' : '#6b7280',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      transition: 'all 0.2s',
                    }}
                  >
                    <method.icon size={20} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {isAr ? method.labelAr : method.labelEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                <FileText size={14} style={{ marginRight: 4 }} />
                {isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder={isAr ? 'أي ملاحظات إضافية عن الجلسة...' : 'Any additional notes about the session...'}
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`, margin: '24px 0' }} />

          {/* Image Upload */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <ImageIcon size={18} color="#5120c8" />
              <h3 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 16, fontWeight: 700, margin: 0 }}>
                {isAr ? 'صورة الجلسة (اختياري)' : 'Session Image (optional)'}
              </h3>
            </div>
            
            <div
              onClick={() => !imageUploading && imageRef.current?.click()}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                borderRadius: 16, padding: 24,
                border: `2px dashed ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                background: isDark ? '#1a1a1a' : '#f8fafc',
                cursor: 'pointer', transition: 'border-color 0.2s',
              }}
            >
              {form.imageUrl ? (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={form.imageUrl.startsWith('http') ? form.imageUrl : `${API_URL}${form.imageUrl}`}
                    style={{ height: 120, maxWidth: '100%', objectFit: 'cover', borderRadius: 12 }} 
                    alt="session" 
                  />
                  <button
                    type="button"
                    onClick={(e: any) => { e.stopPropagation(); set('imageUrl', '') }}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(239,68,68,0.8)', padding: 4, borderRadius: 6,
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    <X size={12} color="#fff" />
                  </button>
                </div>
              ) : imageUploading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: isDark ? '#94a3b8' : '#6b7280' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #5120c8', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 14 }}>{isAr ? 'جارٍ الرفع...' : 'Uploading...'}</span>
                </div>
              ) : (
                <>
                  <Upload size={32} color={isDark ? '#94a3b8' : '#6b7280'} style={{ opacity: 0.5 }} />
                  <p style={{ color: isDark ? '#94a3b8' : '#6b7280', fontSize: 14, margin: 0 }}>
                    {isAr ? 'اضغط لإضافة صورة' : 'Click to add image'}
                  </p>
                </>
              )}
            </div>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageUpload(file)
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 16, padding: 12, borderRadius: 12,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <X size={20} color="#ef4444" />
              <p style={{ color: '#ef4444', fontSize: 14, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '12px 24px', borderRadius: 12, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                background: 'transparent', color: isDark ? '#f1f5f9' : '#0d0d0d',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            
            <button
              type="submit"
              disabled={saving || success}
              style={{
                padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: '#5120c8', color: '#fff', fontSize: 14, fontWeight: 700,
                boxShadow: '0 4px 16px rgba(81,32,200,0.3)',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s ease', opacity: saving || success ? 0.7 : 1,
              }}
            >
              {saving ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  {isAr ? 'جارٍ الإنشاء...' : 'Creating...'}
                </>
              ) : success ? (
                <>
                  <CheckCircle size={16} />
                  {isAr ? 'تم بنجاح!' : 'Success!'}
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {isAr ? 'إنشاء الجلسة' : 'Create Session'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}