'use client'

import { useState, useRef } from 'react'
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
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// ─── Types ──────────────────────────────────────────────────────────────────

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
  { value: 'ONLINE', label: 'عبر الإنترنت (Zoom/Meet)', icon: Video },
  { value: 'IN_PERSON', label: 'حضورياً في المقر', icon: MapPin },
  { value: 'PHONE', label: 'اتصال هاتفي', icon: Phone },
]

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminCreateSessionPage() {
  const locale = useLocale()
  const router = useRouter()

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

  // جلب الطلاب
  const { data: students = [] } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      try {
        const res = await get('/users?role=STUDENT&limit=200')
        return (res?.data as any)?.data ?? []
      } catch { return [] }
    },
  })

  // جلب المستشارين/المحاضرين
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

  // ─── Image Upload ───────────────────────────────────────────

  async function handleImageUpload(file: File) {
    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const token = typeof window !== 'undefined' ? localStorage.getItem('deveway_token') : null
      
      const res = await fetch(`${API_URL}/api/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      set('imageUrl', data.data.url)
    } catch {
      setError('فشل رفع الصورة')
    } finally {
      setImageUploading(false)
    }
  }

  // ─── Submit ─────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!form.topic.trim()) { setError('موضوع الجلسة مطلوب'); return }
    if (!form.scheduledAt) { setError('موعد الجلسة مطلوب'); return }
    
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
        status: 'SCHEDULED', // حالة افتراضية
      }

      // ✅ استخدام endpoint sessions العادي (يعمل مع الأدمن أيضاً)
      await post('/sessions', payload)
      
      setSuccess(true)
      
      // Redirect بعد ثانيتين
      setTimeout(() => {
        router.push(`/${locale}/admin/sessions`)
      }, 1500)
      
    } catch (e: any) {
      console.error('Create session error:', e)
      setError(e?.response?.data?.message || e?.message || 'حدث خطأ أثناء إنشاء الجلسة')
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-2xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">إضافة جلسة جديدة</h1>
            <p className="text-sm text-[color:var(--muted)]">جدولة جلسة استشارة أو محاضرة</p>
          </div>
        </div>
      </div>

      {/* Success State */}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <div>
            <p className="font-bold text-green-400">تم إنشاء الجلسة بنجاح!</p>
            <p className="text-sm text-green-300">جاري التحويل لصفحة الجلسات...</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 space-y-5">
          
          {/* 基本信息 */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              معلومات الجلسة
            </h2>

            {/* Topic */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                موضوع الجلسة *
              </label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => set('topic', e.target.value)}
                placeholder="مثال: استشارة في التسويق الرقمي"
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Student & Consultant */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  👤 الطالب (اختياري)
                </label>
                <select
                  value={form.studentId}
                  onChange={(e) => set('studentId', e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="">-- اختر الطالب --</option>
                  {(students as any[]).map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {student.profile?.firstName} {student.profile?.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  🎓 المستشار / المحاضر (اختياري)
                </label>
                <select
                  value={form.consultantId}
                  onChange={(e) => set('consultantId', e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="">-- اختر المستشار --</option>
                  {(consultants as any[]).map((cons: any) => (
                    <option key={cons.id} value={cons.id}>
                      {cons.profile?.firstName} {cons.profile?.lastName} - {cons.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Schedule & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  📅 الموعد والتوقيت *
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => set('scheduledAt', e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  ⏱️ المدة (دقيقة)
                </label>
                <select
                  value={form.duration}
                  onChange={(e) => set('duration', e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="30">30 دقيقة</option>
                  <option value="60">60 دقيقة</option>
                  <option value="90">90 دقيقة</option>
                  <option value="120">120 دقيقة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  💰 السعر (ريال)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Meeting Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                📍 طريقة الاجتماع
              </label>
              <div className="grid grid-cols-3 gap-3">
                {MEETING_METHODS.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => set('meetingMethod', method.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      form.meetingMethod === method.value
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
                        : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-foreground hover:border-primary/30'
                    }`}
                  >
                    <method.icon className={`h-5 w-5 mx-auto mb-1 ${form.meetingMethod === method.value ? 'text-primary' : 'text-[color:var(--muted)]'}`} />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                📝 ملاحظات (اختياري)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="أي ملاحظات إضافية عن الجلسة..."
                rows={3}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              صورة الجلسة (اختياري)
            </h2>
            
            <div
              onClick={() => !imageUploading && imageRef.current?.click()}
              className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[color:var(--border)] bg-[color:var(--surface-2)] p-6 cursor-pointer hover:border-primary/50 transition-colors"
            >
              {form.imageUrl ? (
                <>
                  <img 
                    src={form.imageUrl.startsWith('http') ? form.imageUrl : `${API_URL}${form.imageUrl}`}
                    className="h-32 w-auto max-w-full object-cover rounded-xl" 
                    alt="session" 
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); set('imageUrl', '') }}
                    className="absolute top-2 left-2 rounded-full bg-red-500/80 p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : imageUploading ? (
                <div className="flex items-center gap-2 text-[color:var(--muted)]">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm">جارٍ الرفع...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-[color:var(--muted)] opacity-50" />
                  <p className="text-sm text-[color:var(--muted)]">اضغط لإضافة صورة</p>
                </>
              )}
            </div>
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageUpload(file)
              }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 flex items-start gap-3">
            <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-[color:var(--border)] px-6 py-2.5 text-sm font-medium text-foreground hover:bg-[color:var(--surface-2)] transition-all"
          >
            إلغاء
          </button>
          
          <button
            type="submit"
            disabled={saving || success}
            className="rounded-xl bg-primary px-8 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                جارٍ الإنشاء...
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-4 w-4" />
                تم بنجاح!
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                إنشاء الجلسة
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Missing import for Phone icon
function Phone(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  )
}