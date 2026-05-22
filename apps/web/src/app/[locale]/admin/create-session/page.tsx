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

  const handleConsultantChange = (consultantId: string) => {
    set('consultantId', consultantId)
    const consultant = (consultants as any[]).find((c: any) => c.id === consultantId)
    const rate = Number(consultant?.hourlyRate || 0)
    set('price', rate > 0 ? String(rate) : '0')
  }

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

      await post('/admin/sessions', payload)
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
    width: '100%', maxWidth: '100%', boxSizing: 'border-box',
    padding: '12px 16px', borderRadius: 10,
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
    width: '100%',
    maxWidth: '640px',
    margin: '0 auto',
    padding: 'clamp(16px, 4vw, 32px)',
    boxSizing: 'border-box',
    overflowX: 'hidden',
    background: isDark ? '#111111' : '#fff',
    borderRadius: 20,
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      minHeight: '100vh',
      background: isDark ? '#0d0d0d' : '#f8fafc',
      padding: '32px 16px',
      direction: isAr ? 'rtl' : 'ltr',
    }}>
      <div style={{ width: '100%', maxWidth: 800, margin: '0 auto', boxSizing: 'border-box' }}>
        
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
            <h1 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 800, margin: 0 }}>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>
                  <User size={14} style={{ marginLeft: isAr ? 4 : 0, marginRight: isAr ? 0 : 4 }} />
                  {isAr ? 'المستخدم (اختياري)' : 'User (optional)'}
                </label>
                <select
                  value={form.studentId}
                  onChange={(e) => set('studentId', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">{isAr ? 'اختر المستخدم' : 'Select User'}</option>
                  {(students as any[]).map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {student.profile?.firstName} {student.profile?.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  <GraduationCap size={14} style={{ marginLeft: isAr ? 4 : 0, marginRight: isAr ? 0 : 4 }} />
                  {isAr ? 'المستشار / المحاضر (اختياري)' : 'Consultant / Instructor (optional)'}
                </label>
                <select
                  value={form.consultantId}
                  onChange={(e) => handleConsultantChange(e.target.value)}
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

            {/* Schedule */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                <Calendar size={14} style={{ marginLeft: isAr ? 4 : 0, marginRight: isAr ? 0 : 4 }} />
                {isAr ? 'الموعد والتوقيت *' : 'Date & Time *'}
              </label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => set('scheduledAt', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Duration */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>
                <Clock size={14} style={{ marginLeft: isAr ? 4 : 0, marginRight: isAr ? 0 : 4 }} />
                {isAr ? 'المدة' : 'Duration'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                {['30', '60', '90', '120'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set('duration', d)}
                    style={{
                      padding: '10px 4px', borderRadius: 10,
                      border: `2px solid ${form.duration === d ? '#5120c8' : isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                      background: form.duration === d ? 'rgba(81,32,200,0.1)' : 'transparent',
                      color: form.duration === d ? '#5120c8' : isDark ? '#94a3b8' : '#6b7280',
                      cursor: 'pointer', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 600,
                      width: '100%', textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isAr ? `${d} دقيقة` : `${d} min`}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                <DollarSign size={14} style={{ marginLeft: isAr ? 4 : 0, marginRight: isAr ? 0 : 4 }} />
                {isAr ? 'السعر' : 'Price'}
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '8px', width: '100%',
                padding: '12px 16px', borderRadius: '10px',
                background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                color: isDark ? '#fff' : '#0d0d0d',
                fontSize: '14px', fontWeight: '600',
                opacity: 0.8, boxSizing: 'border-box',
              }}>
                <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', fontSize: '13px' }}>
                  {isAr ? 'تلقائي من المستشار' : 'Auto from consultant'}
                </span>
                <span>
                  {parseFloat(form.price) > 0 ? `${form.price} ${isAr ? 'ر.س' : 'SAR'}` : form.consultantId ? (isAr ? 'مجاني' : 'Free') : '—'}
                </span>
              </div>
            </div>

            {/* Meeting Method */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>
                <MapPin size={14} style={{ marginLeft: isAr ? 4 : 0, marginRight: isAr ? 0 : 4 }} />
                {isAr ? 'طريقة الاجتماع' : 'Meeting Method'}
              </label>
              <div className="grid grid-cols-3 gap-2 w-full">
                {MEETING_METHODS.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => set('meetingMethod', method.value)}
                    style={{
                      padding: '8px 4px', borderRadius: 12,
                      border: `2px solid ${form.meetingMethod === method.value ? '#5120c8' : isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                      background: form.meetingMethod === method.value ? 'rgba(81,32,200,0.1)' : 'transparent',
                      color: form.meetingMethod === method.value ? '#5120c8' : isDark ? '#94a3b8' : '#6b7280',
                      cursor: 'pointer', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 600,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      width: '100%', textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <method.icon size={18} />
                    <span>{isAr ? method.labelAr : method.labelEn}</span>
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
                width: '100%', boxSizing: 'border-box',
                padding: '24px 16px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                borderRadius: 16,
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
          <div className="grid grid-cols-2 gap-3 w-full mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                width: '100%', padding: '12px 4px', borderRadius: 12,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                background: 'transparent', color: isDark ? '#f1f5f9' : '#0d0d0d',
                fontSize: 'clamp(12px, 2.5vw, 14px)', fontWeight: 600, cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            
            <button
              type="submit"
              disabled={saving || success}
              style={{
                width: '100%', padding: '12px 4px', borderRadius: 12,
                border: 'none', cursor: 'pointer',
                background: '#5120c8', color: '#fff',
                fontSize: 'clamp(12px, 2.5vw, 14px)', fontWeight: 700,
                boxShadow: '0 4px 16px rgba(81,32,200,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s ease', opacity: saving || success ? 0.7 : 1,
              }}
            >
              {saving ? (
                <>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  {isAr ? 'جارٍ الإنشاء...' : 'Creating...'}
                </>
              ) : success ? (
                <>
                  <CheckCircle size={14} />
                  {isAr ? 'تم بنجاح!' : 'Success!'}
                </>
              ) : (
                <>
                  <Plus size={14} />
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