'use client'
import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/api'
import { Camera, CheckCircle2, Upload, Loader2, X } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Step1Data = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  country: string
}

type AccountType = 'STUDENT' | 'INSTRUCTOR' | 'CONSULTANT'

type Step2Data = {
  accountType: AccountType
  cvUrl: string
  experience: string
  speciality: string
  bio: string
  linkedinUrl: string
  hourlyRate: string
  meetingMethod: string
}

// ─── Field component ─────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
  mutedColor,
}: {
  label: string
  error?: string
  children: React.ReactNode
  mutedColor: string
}) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-1.5 transition-colors duration-300"
        style={{ color: mutedColor }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Step indicators ─────────────────────────────────────────────────────────

function StepDots({ step, total, theme }: { step: number; total: number; theme: 'light' | 'dark' }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            height: 6,
            borderRadius: 999,
            width: i + 1 === step ? 28 : 8,
            background:
              i + 1 === step
                ? '#5120c8'
                : i + 1 < step
                  ? 'rgba(81,32,200,0.2)'
                  : theme === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.1)',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const locale = useLocale()
  const router = useRouter()
  const ar = locale === 'ar'

  // 🎨 حالة الثيم (فاتح/داكن)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // 🔄 الكشف عن الثيم عند التحميل
  useEffect(() => {
    const detectTheme = () => {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      if (savedTheme) {
        setTheme(savedTheme)
      } else if (systemPrefersDark) {
        setTheme('dark')
      } else {
        setTheme('light')
      }
    }

    detectTheme()

    // 🔄 الاستماع للتغييرات في الوقت الفعلي
    const handleStorageChange = () => {
      const newTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (newTheme) setTheme(newTheme)
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // تحديث دوري
    const interval = setInterval(() => {
      const currentTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme)
      }
    }, 500)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [theme])

  // ════════════════════════════════════════
  // 🎨 نظام الألوان الديناميكي - متناسق مع Login
  // ════════════════════════════════════════
  const colors = {
    // خلفية الصفحة الخارجية
    pageBg: theme === 'dark' ? '#0D0D0D' : '#FFFFFF',
    
    // بوكس التسجيل
    cardBg: theme === 'dark' ? '#141414' : '#FFFFFF',
    
    // العناوين الرئيسية
    titleColor: theme === 'dark' ? '#FFFFFF' : '#0d0d0d',
    
    // النصوص العادية
    textColor: theme === 'dark' ? '#E6E6E6' : '#1a1a2e',
    
    // النصوص الخافتة (labels, descriptions)
    mutedColor: theme === 'dark' ? '#9CA3AF' : '#6b7280',
    
    // حقول الإدخال
    inputBg: theme === 'dark' ? '#0A0A0A' : '#f8f9fa',
    inputBorder: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    inputText: theme === 'dark' ? '#E6E6E6' : '#1a1a2e',
    
    // حدود البوكس
    cardBorder: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    
    // ظل البوكس
    cardShadow: theme === 'dark' 
      ? '0 25px 60px -12px rgba(0,0,0,0.5)' 
      : '0 25px 60px -12px rgba(0,0,0,0.15)',
    
    // خلفية البطاقات الفرعية (account type cards)
    subCardBg: theme === 'dark' ? '#0A0A0A' : '#f8f9fa',
    subCardBorder: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    
    // زر ثانوي (Back button)
    secondaryBtnBorder: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
    secondaryBtnBg: theme === 'dark' ? 'transparent' : 'rgba(0,0,0,0.02)',
  }

  // ─── Input classes ──────────────────────────────────────────────────────────
  
  const INPUT_BASE = `
    w-full px-4 py-3 rounded-xl text-sm
    focus:outline-none
    transition: border-color 0.2s ease, box-shadow 0.2s ease
    placeholder:text-gray-600
  `

  const INPUT_STYLE = {
    background: colors.inputBg,
    border: `1.5px solid ${colors.inputBorder}`,
    color: colors.inputText,
  }

  const INPUT_FOCUS = `
    focus:border-[#5120c8]
    focus:shadow-[0_0_0_4px_rgba(81,32,200,0.1)]
  `

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [cvUploading, setCvUploading] = useState(false)
  const [cvFileName, setCvFileName] = useState('')
  const [cvError, setCvError] = useState('')

  const [step1, setStep1] = useState<Step1Data>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
  })

  const [step2, setStep2] = useState<Step2Data>({
    accountType: 'STUDENT',
    cvUrl: '',
    experience: '',
    speciality: '',
    bio: '',
    linkedinUrl: '',
    hourlyRate: '',
    meetingMethod: '',
  })

  const [errors1, setErrors1] = useState<Partial<Step1Data>>({})
  const [errors2, setErrors2] = useState<Partial<Record<keyof Step2Data, string>>>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // ── Step 1 validation ────────────────────────────────────────────────────

  function validateStep1(): boolean {
    const errs: Partial<Step1Data> = {}
    if (!step1.firstName.trim()) errs.firstName = ar ? 'مطلوب' : 'Required'
    if (!step1.lastName.trim()) errs.lastName = ar ? 'مطلوب' : 'Required'
    if (!step1.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1.email))
      errs.email = ar ? 'بريد إلكتروني غير صحيح' : 'Invalid email'
    if (step1.password.length < 8) errs.password = ar ? 'يجب أن تكون 8 أحرف على الأقل' : 'At least 8 characters'
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(step1.password))
      errs.password = ar
        ? 'يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص (@$!%*?&)'
        : 'Must include uppercase, lowercase, number, and special character (@$!%*?&)'
    if (step1.password !== step1.confirmPassword)
      errs.confirmPassword = ar ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'
    if (!step1.country) errs.country = ar ? 'مطلوب' : 'Required'
    setErrors1(errs)
    return Object.keys(errs).length === 0
  }

  // ── CV upload ────────────────────────────────────────────────────────────

  async function handleCvUpload(file: File) {
    setCvUploading(true)
    setCvError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/upload/cv`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      const url = data?.data?.url || data?.url
      if (url) {
        setStep2((prev) => ({ ...prev, cvUrl: url }))
        setCvFileName(data.data?.fileName || file.name)
        console.log('[CV Upload] Success:', url)
      } else {
        console.error('[CV Upload] No URL in response:', data)
        setCvError(ar ? 'فشل رفع السيرة الذاتية - حاول مرة أخرى' : 'CV upload failed — please try again')
      }
    } catch (e) {
      console.error('[CV Upload] Failed:', e)
      setCvError(ar ? 'فشل رفع السيرة الذاتية - حاول مرة أخرى' : 'CV upload failed — please try again')
    } finally {
      setCvUploading(false)
    }
  }

  // ── Step 2 validation ────────────────────────────────────────────────────

  function validateStep2(): boolean {
    const errs: Partial<Record<keyof Step2Data, string>> = {}
    const isPro = step2.accountType !== 'STUDENT'
    if (isPro && !step2.cvUrl.trim()) errs.cvUrl = ar ? 'السيرة الذاتية مطلوبة' : 'CV is required'
    if (step2.accountType === 'CONSULTANT' && !step2.meetingMethod)
      errs.meetingMethod = ar ? 'مطلوب' : 'Required'
    setErrors2(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validateStep2()) return
    if (['INSTRUCTOR', 'CONSULTANT'].includes(step2.accountType) && !step2.cvUrl) {
      setError(ar ? 'يجب رفع السيرة الذاتية أولاً' : 'Please upload your CV before submitting')
      return
    }
    setError('')
    setLoading(true)

    const isPro = step2.accountType !== 'STUDENT'
    const payload: Record<string, unknown> = {
      firstName: step1.firstName,
      lastName: step1.lastName,
      email: step1.email,
      password: step1.password,
      accountType: step2.accountType,
    }
    if (step1.country) payload.country = step1.country
    if (isPro) {
      payload.cvUrl = step2.cvUrl
      if (step2.experience) payload.experience = parseInt(step2.experience)
      if (step2.speciality) payload.speciality = step2.speciality
      if (step2.bio) payload.bio = step2.bio
      if (step2.linkedinUrl) payload.linkedinUrl = step2.linkedinUrl
      if (step2.accountType === 'CONSULTANT') {
        if (step2.hourlyRate) payload.hourlyRate = parseFloat(step2.hourlyRate)
        if (step2.meetingMethod) payload.meetingMethod = step2.meetingMethod
      }
    }

    try {
      if (avatarFile) {
        const fd = new FormData()
        fd.append('file', avatarFile)
        try {
          const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/upload/image`, { method: 'POST', body: fd })
          const uploadData = await uploadRes.json()
          const avatarUrl = uploadData?.data?.url || uploadData?.url
          if (avatarUrl) payload.avatar = avatarUrl
        } catch {}
      }
      const res = await api.post('/auth/register', payload)
      const data = res.data.data ?? res.data

      if (data.pendingReview) {
        setIsPending(true)
      } else {
        if (data.accessToken) {
          localStorage.setItem('careerhub_token', data.accessToken)
          document.cookie = `careerhub_token=${data.accessToken}; path=/; SameSite=Lax; max-age=604800`
          localStorage.setItem('careerhub_refresh', data.refreshToken || '')
        }
      }
      setStep(3)
      window.dispatchEvent(new Event('auth:updated'))
    } catch (err: unknown) {
      console.log('[Register] Error details:', (err as any)?.response?.data)
      const msg = (err as any).response?.data?.message || (ar ? 'حدث خطأ' : 'An error occurred')
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden transition-all duration-300"
      style={{ 
        background: colors.pageBg,
        color: colors.textColor 
      }}
    >
      {/* ── Ambient Glows ── */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-full overflow-hidden -z-0">
        <div
          className="absolute top-[10%] left-[10%] w-[600px] h-[600px] rounded-full opacity-100"
          style={{ 
            background: `radial-gradient(circle, ${
              theme === 'dark' 
                ? 'rgba(81,32,200,0.06)' 
                : 'rgba(81,32,200,0.03)'
            }, transparent 65%)`,
          }}
        />
        <div
          className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full opacity-100"
          style={{ 
            background: `radial-gradient(circle, ${
              theme === 'dark' 
                ? 'rgba(81,32,200,0.04)' 
                : 'rgba(81,32,200,0.02)'
            }, transparent 65%)`,
          }}
        />
      </div>

      {/* ── Card ── */}
      <div
        className="w-full max-w-lg relative z-10 animate-scale-in transition-all duration-300"
        style={{
          background: colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: colors.cardShadow,
        }}
      >
        {/* ── Logo ── */}
        <div className="text-center mb-2">
          <span
            className="font-extrabold text-xl tracking-tight"
            style={{
              fontFamily: "'28DaysLater', sans-serif",
              color: '#5120c8',
              textShadow: '0 0 20px rgba(81,32,200,0.3)',
            }}
          >
            DeveWay
          </span>
        </div>

        {step < 3 && <StepDots step={step} total={2} theme={theme} />}

        {/* ═══════════════════ STEP 1 ═══════════════════ */}
        {step === 1 && (
          <>
            {/* ✅ عنوان ديناميكي */}
            <h1
              className="text-2xl font-bold text-center mb-7 transition-colors duration-300"
              style={{ color: colors.titleColor }}
            >
              {ar ? 'إنشاء حساب جديد' : 'Create your account'}
            </h1>

            {/* Avatar Upload */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: avatarPreview ? 'transparent' : 'rgba(81,32,200,0.1)',
                  border: `2px dashed ${theme === 'dark' ? 'rgba(81,32,200,0.4)' : 'rgba(81,32,200,0.3)'}`,
                  margin: '0 auto 8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', cursor: 'pointer', position: 'relative',
                }}
                onClick={() => document.getElementById('avatar-upload-reg')?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                  <Camera size={24} color="rgba(81,32,200,0.6)" />
                )}
              </div>
              <input
                type="file" accept="image/*" id="avatar-upload-reg" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)) }
                }}
              />
              <p style={{ fontSize: 11, color: colors.mutedColor, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                {ar ? 'صورة شخصية (اختياري)' : 'Profile photo (optional)'}
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label={ar ? 'الاسم الأول' : 'First Name'} error={errors1.firstName} mutedColor={colors.mutedColor}>
                  <input
                    type="text"
                    value={step1.firstName}
                    onChange={(e) => setStep1({ ...step1, firstName: e.target.value })}
                    className={`${INPUT_BASE} ${INPUT_FOCUS}`}
                    style={INPUT_STYLE}
                    placeholder={ar ? 'أحمد' : 'John'}
                  />
                </Field>
                <Field label={ar ? 'الاسم الأخير' : 'Last Name'} error={errors1.lastName} mutedColor={colors.mutedColor}>
                  <input
                    type="text"
                    value={step1.lastName}
                    onChange={(e) => setStep1({ ...step1, lastName: e.target.value })}
                    className={`${INPUT_BASE} ${INPUT_FOCUS}`}
                    style={INPUT_STYLE}
                    placeholder={ar ? 'محمد' : 'Doe'}
                  />
                </Field>
              </div>

              <Field label={ar ? 'البريد الإلكتروني' : 'Email'} error={errors1.email} mutedColor={colors.mutedColor}>
                <input
                  type="email"
                  value={step1.email}
                  onChange={(e) => setStep1({ ...step1, email: e.target.value })}
                  className={`${INPUT_BASE} ${INPUT_FOCUS}`}
                  style={INPUT_STYLE}
                  placeholder="name@example.com"
                  dir="ltr"
                />
              </Field>

              <Field label={ar ? 'كلمة المرور' : 'Password'} error={errors1.password} mutedColor={colors.mutedColor}>
                <input
                  type="password"
                  value={step1.password}
                  onChange={(e) => setStep1({ ...step1, password: e.target.value })}
                  className={`${INPUT_BASE} ${INPUT_FOCUS}`}
                  style={INPUT_STYLE}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>

              <Field label={ar ? 'تأكيد كلمة المرور' : 'Confirm Password'} error={errors1.confirmPassword} mutedColor={colors.mutedColor}>
                <input
                  type="password"
                  value={step1.confirmPassword}
                  onChange={(e) => setStep1({ ...step1, confirmPassword: e.target.value })}
                  className={`${INPUT_BASE} ${INPUT_FOCUS}`}
                  style={INPUT_STYLE}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>

              <Field label={ar ? 'الدولة' : 'Country'} error={errors1.country} mutedColor={colors.mutedColor}>
                <select
                  value={step1.country}
                  onChange={(e) => setStep1({ ...step1, country: e.target.value })}
                  className={`${INPUT_BASE} ${INPUT_FOCUS}`}
                  style={{
                    ...INPUT_STYLE,
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%239CA3AF' viewBox='0 0 16 16'%3E%3Cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: ar ? '12px center' : 'calc(100% - 12px) center',
                    paddingRight: ar ? 16 : 36,
                    paddingLeft: ar ? 36 : 16,
                  }}
                >
                  <option value="" style={{ background: colors.cardBg, color: colors.textColor }}>
                    {ar ? 'اختر الدولة' : 'Select country'}
                  </option>
                  {[
                    { v: 'Egypt', ar: 'مصر' },
                    { v: 'Saudi Arabia', ar: 'السعودية' },
                    { v: 'UAE', ar: 'الإمارات' },
                    { v: 'Kuwait', ar: 'الكويت' },
                    { v: 'Qatar', ar: 'قطر' },
                    { v: 'Jordan', ar: 'الأردن' },
                    { v: 'Morocco', ar: 'المغرب' },
                    { v: 'Other', ar: 'أخرى' },
                  ].map((c) => (
                    <option key={c.v} value={c.v} style={{ background: colors.cardBg, color: colors.textColor }}>
                      {ar ? c.ar : c.v}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Next button */}
            <button
              onClick={() => { if (validateStep1()) setStep(2) }}
              className="mt-7 w-full py-3.5 font-semibold rounded-xl text-white text-[15px] transition-all duration-200 cursor-pointer"
              style={{
                background: '#5120c8',
                border: 'none',
                fontFamily: 'var(--font-brand), var(--font-display)',
                boxShadow: '0 4px 12px rgba(81,32,200,0.2)',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4318a8'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(81,32,200,0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#5120c8'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(81,32,200,0.2)'
              }}
            >
              {ar ? 'التالي' : 'Next'}{' '}
              <span style={{ display: 'inline-block', transform: ar ? 'scaleX(-1)' : 'none' }}>→</span>
            </button>

            {/* Google Register */}
            <div style={{ position: 'relative', margin: '16px 0 4px', textAlign: 'center' }}>
              <div style={{ height: 1, background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
              <span style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: colors.cardBg, padding: '0 12px',
                color: colors.mutedColor, fontSize: 13,
              }}>{ar ? 'أو' : 'or'}</span>
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = 'https://deve-way.onrender.com/api/auth/google' }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 12, padding: '12px 20px', borderRadius: 12,
                background: colors.cardBg, color: colors.textColor,
                border: `1px solid ${colors.inputBorder}`, cursor: 'pointer',
                fontSize: 15, fontWeight: 600,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {ar ? 'إنشاء حساب بـ Google' : 'Sign up with Google'}
            </button>

            <p className="mt-5 text-center text-sm transition-colors duration-300" style={{ color: colors.mutedColor }}>
              {ar ? 'لديك حساب؟' : 'Have an account?'}{' '}
              <Link
                href={`/${locale}/login`}
                className="font-semibold hover:underline transition-colors duration-200"
                style={{ color: '#818CF8' }}
              >
                {ar ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
            </p>
          </>
        )}

        {/* ═══════════════════ STEP 2 ═══════════════════ */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold text-center mb-2 transition-colors duration-300" style={{ color: colors.titleColor }}>
              {ar ? 'ما الذي يصفك أفضل؟' : 'What best describes you?'}
            </h1>
            <p className="text-sm text-center mb-6 transition-colors duration-300" style={{ color: colors.mutedColor }}>
              {ar ? 'اختر نوع حسابك' : 'Choose your account type'}
            </p>

            {/* Account type cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {([
                { type: 'STUDENT' as const, icon: '🎓', label: ar ? 'طالب' : 'Student', sub: ar ? 'وصول فوري' : 'Instant access' },
                { type: 'INSTRUCTOR' as const, icon: '👨‍🏫', label: ar ? 'مدرب' : 'Instructor', sub: ar ? 'يتطلب موافقة' : 'Requires approval' },
                { type: 'CONSULTANT' as const, icon: '🧑‍💼', label: ar ? 'مستشار' : 'Consultant', sub: ar ? 'يتطلب موافقة' : 'Requires approval' },
              ]).map(({ type, icon, label, sub }) => {
                const isActive = step2.accountType === type
                return (
                  <button
                    key={type}
                    onClick={() => setStep2({ ...step2, accountType: type })}
                    className="flex flex-col items-center gap-1.5 p-4 rounded-xl transition-all duration-200 text-center cursor-pointer"
                    style={{
                      border: `2px solid ${isActive ? '#5120c8' : colors.subCardBorder}`,
                      background: isActive ? 'rgba(81,32,200,0.15)' : colors.subCardBg,
                      boxShadow: isActive ? '0 0 20px rgba(81,32,200,0.15)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                        e.currentTarget.style.background = theme === 'dark' ? '#0F0F0F' : '#f0f0f0'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = colors.subCardBorder
                        e.currentTarget.style.background = colors.subCardBg
                      }
                    }}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="font-semibold text-sm transition-colors duration-200" style={{ color: colors.textColor }}>{label}</span>
                    <span className="text-[11px]" style={{ color: colors.mutedColor }}>{sub}</span>
                  </button>
                )
              })}
            </div>

            {/* Extra fields for INSTRUCTOR / CONSULTANT */}
            {step2.accountType !== 'STUDENT' && (
              <div
                className="space-y-4 pt-5"
                style={{ borderTop: `1px solid ${colors.cardBorder}` }}
              >
                <p className="text-sm font-semibold transition-colors duration-300" style={{ color: colors.titleColor }}>
                  {ar ? 'معلومات إضافية' : 'Additional information'}
                </p>

                <Field label={ar ? 'السيرة الذاتية (PDF أو Word)' : 'CV / Resume (PDF or Word)'} error={errors2.cvUrl} mutedColor={colors.mutedColor}>
                  {step2.cvUrl ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 16px', borderRadius: 10,
                      background: 'rgba(22,163,74,0.1)',
                      border: '1px solid rgba(22,163,74,0.3)',
                    }}>
                      <CheckCircle2 size={18} color="#16a34a" />
                      <span style={{ color: '#16a34a', fontSize: 14, fontWeight: 600, flex: 1 }}>
                        {cvFileName || (ar ? 'تم رفع السيرة الذاتية بنجاح' : 'CV uploaded successfully')}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setStep2(prev => ({ ...prev, cvUrl: '' })); setCvFileName(''); setCvError('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '24px', borderRadius: 10, cursor: cvUploading ? 'not-allowed' : 'pointer',
                        border: `2px dashed ${cvError || errors2.cvUrl ? '#ef4444' : colors.subCardBorder}`,
                        background: cvError || errors2.cvUrl ? 'rgba(239,68,68,0.05)' : colors.subCardBg,
                        transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={e => { if (!cvUploading && !cvError && !errors2.cvUrl) (e.currentTarget as HTMLLabelElement).style.borderColor = 'rgba(81,32,200,0.4)' }}
                      onMouseLeave={e => { if (!cvUploading && !cvError && !errors2.cvUrl) (e.currentTarget as HTMLLabelElement).style.borderColor = colors.subCardBorder }}
                    >
                      {cvUploading ? (
                        <Loader2 size={24} className="animate-spin" color="#5120c8" />
                      ) : (
                        <Upload size={24} color={cvError || errors2.cvUrl ? '#ef4444' : '#5120c8'} />
                      )}
                      <span style={{ fontSize: 14, marginTop: 8, color: colors.textColor, fontWeight: 500 }}>
                        {cvUploading
                          ? (ar ? 'جاري الرفع...' : 'Uploading...')
                          : (ar ? 'اضغط لرفع السيرة الذاتية' : 'Click to upload your CV')}
                      </span>
                      <span style={{ fontSize: 12, marginTop: 4, color: colors.mutedColor }}>
                        {ar ? 'PDF أو Word — حجم أقصى 5MB' : 'PDF or Word — max 5 MB'}
                      </span>
                      <input
                        id="cv-file-input"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        style={{ display: 'none' }}
                        disabled={cvUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleCvUpload(file)
                        }}
                      />
                    </label>
                  )}
                  {cvError && (
                    <p style={{ color: '#ef4444', fontSize: 13, marginTop: 6 }}>{cvError}</p>
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={ar ? 'سنوات الخبرة' : 'Years of Experience'} mutedColor={colors.mutedColor}>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={step2.experience}
                      onChange={(e) => setStep2({ ...step2, experience: e.target.value })}
                      className={`${INPUT_BASE} ${INPUT_FOCUS}`}
                      style={INPUT_STYLE}
                      placeholder="0"
                    />
                  </Field>
                  <Field label={ar ? 'مجال التخصص' : 'Speciality / Field'} mutedColor={colors.mutedColor}>
                    <input
                      type="text"
                      value={step2.speciality}
                      onChange={(e) => setStep2({ ...step2, speciality: e.target.value })}
                      className={`${INPUT_BASE} ${INPUT_FOCUS}`}
                      style={INPUT_STYLE}
                      placeholder={ar ? 'مثال: تطوير ويب' : 'e.g. Web Dev'}
                    />
                  </Field>
                </div>

                <Field label={ar ? 'نبذة مهنية' : 'Professional Bio'} mutedColor={colors.mutedColor}>
                  <textarea
                    value={step2.bio}
                    onChange={(e) => setStep2({ ...step2, bio: e.target.value })}
                    rows={3}
                    maxLength={1000}
                    className={`${INPUT_BASE} ${INPUT_FOCUS} resize-none`}
                    style={INPUT_STYLE}
                    placeholder={ar ? 'اكتب نبذة مختصرة عن نفسك...' : 'Write a short bio...'}
                  />
                </Field>

                <Field label={ar ? 'رابط LinkedIn' : 'LinkedIn URL'} mutedColor={colors.mutedColor}>
                  <input
                    type="url"
                    value={step2.linkedinUrl}
                    onChange={(e) => setStep2({ ...step2, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    dir="ltr"
                    className={`${INPUT_BASE} ${INPUT_FOCUS}`}
                    style={INPUT_STYLE}
                  />
                </Field>

                {step2.accountType === 'CONSULTANT' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={ar ? 'السعر بالساعة (ريال)' : 'Hourly Rate (SAR)'} mutedColor={colors.mutedColor}>
                      <input
                        type="number"
                        min={0}
                        value={step2.hourlyRate}
                        onChange={(e) => setStep2({ ...step2, hourlyRate: e.target.value })}
                        className={`${INPUT_BASE} ${INPUT_FOCUS}`}
                        style={INPUT_STYLE}
                        placeholder="0"
                        dir="ltr"
                      />
                    </Field>
                    <Field label={ar ? 'طريقة الاجتماع' : 'Meeting Method'} error={errors2.meetingMethod} mutedColor={colors.mutedColor}>
                      <select
                        value={step2.meetingMethod}
                        onChange={(e) => setStep2({ ...step2, meetingMethod: e.target.value })}
                        className={`${INPUT_BASE} ${INPUT_FOCUS}`}
                        style={{
                          ...INPUT_STYLE,
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%239CA3AF' viewBox='0 0 16 16'%3E%3Cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: ar ? '12px center' : 'calc(100% - 12px) center',
                          paddingRight: ar ? 16 : 36,
                          paddingLeft: ar ? 36 : 16,
                        }}
                      >
                        <option value="" style={{ background: colors.cardBg, color: colors.textColor }}>
                          {ar ? 'اختر' : 'Select'}
                        </option>
                        <option value="ZOOM" style={{ background: colors.cardBg, color: colors.textColor }}>Zoom</option>
                        <option value="GOOGLE_MEET" style={{ background: colors.cardBg, color: colors.textColor }}>Google Meet</option>
                        <option value="BOTH" style={{ background: colors.cardBg, color: colors.textColor }}>
                          {ar ? 'كلاهما' : 'Both'}
                        </option>
                      </select>
                    </Field>
                  </div>
                )}
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div
                className="mt-5 p-3.5 rounded-xl text-sm transition-all duration-200"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#FCA5A5',
                }}
              >
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-7">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 font-semibold rounded-xl text-[15px] transition-all duration-200 cursor-pointer"
                style={{
                  background: colors.secondaryBtnBg,
                  border: `1.5px solid ${colors.secondaryBtnBorder}`,
                  color: colors.mutedColor,
                  fontFamily: 'var(--font-brand), var(--font-display)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                  e.currentTarget.style.background = theme === 'dark' ? '#0A0A0A' : 'rgba(0,0,0,0.04)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.secondaryBtnBorder
                  e.currentTarget.style.background = colors.secondaryBtnBg
                }}
              >
                {ar ? 'رجوع' : 'Back'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] py-3.5 font-semibold rounded-xl text-white text-[15px] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading ? 'rgba(81,32,200,0.5)' : '#5120c8',
                  border: 'none',
                  fontFamily: 'var(--font-brand), var(--font-display)',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#4318a8'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(81,32,200,0.35)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#5120c8'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {loading
                  ? (ar ? 'جاري الإنشاء...' : 'Creating...')
                  : (ar ? 'إنشاء الحساب' : 'Create Account')}
              </button>
            </div>
          </>
        )}

        {/* ═══════════════════ STEP 3 — Success ═══════════════════ */}
        {step === 3 && (
          <div className="text-center py-6">
            {isPending ? (
              <>
                <div className="text-6xl mb-5">⏳</div>
                <h1 className="text-2xl font-bold mb-3 transition-colors duration-300" style={{ color: colors.titleColor }}>
                  {ar ? 'تم إرسال طلبك!' : 'Application Submitted!'}
                </h1>
                <p className="mb-6 leading-relaxed transition-colors duration-300" style={{ color: colors.mutedColor }}>
                  {ar
                    ? 'طلبك قيد المراجعة من قِبل فريق DeveWay. سنخطرك خلال 48 ساعة بمجرد الموافقة على حسابك.'
                    : 'Your application is under review by the DeveWay team. We will notify you within 48 hours once your account is approved.'}
                </p>
                <div
                  className="rounded-xl p-4 text-sm mb-7"
                  style={{
                    background: 'rgba(245,166,35,0.1)',
                    border: '1px solid rgba(245,166,35,0.2)',
                    color: '#FCD34D',
                  }}
                >
                  {ar ? 'تحقق من بريدك الإلكتروني للحصول على التحديثات' : 'Check your email for updates'}
                </div>
                <Link
                  href={`/${locale}/login`}
                  className="inline-block px-8 py-3 font-semibold rounded-xl text-white text-[15px] transition-all duration-200"
                  style={{
                    background: '#5120c8',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-brand), var(--font-display)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4318a8'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(81,32,200,0.35)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#5120c8'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {ar ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Link>
              </>
            ) : (
              <>
                <div className="text-6xl mb-5">🎉</div>
                <h1 className="text-2xl font-bold mb-3 transition-colors duration-300" style={{ color: colors.titleColor }}>
                  {ar ? 'مرحباً بك في DeveWay!' : 'Welcome to DeveWay!'}
                </h1>
                <p className="mb-8 transition-colors duration-300" style={{ color: colors.mutedColor }}>
                  {ar
                    ? 'تم إنشاء حسابك بنجاح. ابدأ رحلتك المهنية الآن.'
                    : 'Your account was created successfully. Start your career journey now.'}
                </p>
                <button
                  onClick={() => router.push(`/${locale}/dashboard/assessment`)}
                  className="w-full py-3.5 font-semibold rounded-xl text-white text-[15px] transition-all duration-200 cursor-pointer"
                  style={{
                    background: '#5120c8',
                    border: 'none',
                    fontFamily: 'var(--font-brand), var(--font-display)',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4318a8'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(81,32,200,0.35)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#5120c8'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {ar ? 'ابدأ التقييم المهني →' : 'Start Career Assessment →'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}