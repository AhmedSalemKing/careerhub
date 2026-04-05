'use client'
import { useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/api'

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
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: '#9CA3AF' }} // رمادي فاتح على الخلفية السوداء
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

function StepDots({ step, total }: { step: number; total: number }) {
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
                ? '#5120c8' // Primary Purple
                : i + 1 < step
                  ? 'rgba(81,32,200,0.2)'
                  : 'rgba(255,255,255,0.1)', // رمادي شفاف على الأسود
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Input classes ──────────────────────────────────────────────────────────────

const INPUT_BASE = `
  w-full px-4 py-3 rounded-xl text-sm
  focus:outline-none
  transition: border-color 0.2s ease, box-shadow 0.2s ease
  placeholder:text-gray-600
`

const INPUT_STYLE = {
  background: '#0A0A0A', // خلفية الحقل أغمق من الكرت
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#E6E6E6',
}

const INPUT_FOCUS = `
  focus:border-[#5120c8]
  focus:shadow-[0_0_0_3px_rgba(81,32,200,0.15)]
`

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const locale = useLocale()
  const router = useRouter()
  const ar = locale === 'ar'

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [cvUploading, setCvUploading] = useState(false)
  const [cvFileName, setCvFileName] = useState('')

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
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/upload/cv`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success && data.data?.url) {
        setStep2((prev) => ({ ...prev, cvUrl: data.data.url }))
        setCvFileName(data.data.fileName || file.name)
      } else {
        setError(ar ? 'فشل رفع الملف' : 'File upload failed')
      }
    } catch {
      setError(ar ? 'فشل رفع الملف' : 'File upload failed')
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
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ 
        background: '#0D0D0D', // الأسود الأساسي
        color: '#E6E6E6' 
      }}
    >
      {/* ── Glossy Ambient Glows ── */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-full overflow-hidden -z-0">
        <div
          className="absolute top-[10%] left-[10%] w-[600px] h-[600px] rounded-full opacity-100"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03), transparent 60%)' }}
        />
        <div
          className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full opacity-100"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.02), transparent 60%)' }}
        />
      </div>

      {/* ── Card (Glossy Dark) ── */}
      <div
        className="w-full max-w-lg relative z-10 animate-scale-in"
        style={{
          background: '#141414', // لون الكرت الأسود المطفأ
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)',
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

        {step < 3 && <StepDots step={step} total={2} />}

        {/* ═══════════════════ STEP 1 ═══════════════════ */}
        {step === 1 && (
          <>
            <h1
              className="text-2xl font-bold text-center mb-7"
              style={{ color: '#ffffff' }}
            >
              {ar ? 'إنشاء حساب جديد' : 'Create your account'}
            </h1>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label={ar ? 'الاسم الأول' : 'First Name'} error={errors1.firstName}>
                  <input
                    type="text"
                    value={step1.firstName}
                    onChange={(e) => setStep1({ ...step1, firstName: e.target.value })}
                    className={`${INPUT_BASE} ${INPUT_FOCUS}`}
                    style={INPUT_STYLE}
                    placeholder={ar ? 'أحمد' : 'John'}
                  />
                </Field>
                <Field label={ar ? 'الاسم الأخير' : 'Last Name'} error={errors1.lastName}>
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

              <Field label={ar ? 'البريد الإلكتروني' : 'Email'} error={errors1.email}>
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

              <Field label={ar ? 'كلمة المرور' : 'Password'} error={errors1.password}>
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

              <Field label={ar ? 'تأكيد كلمة المرور' : 'Confirm Password'} error={errors1.confirmPassword}>
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

              <Field label={ar ? 'الدولة' : 'Country'} error={errors1.country}>
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
                  <option value="" style={{ background: '#141414', color: '#fff' }}>
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
                    <option key={c.v} value={c.v} style={{ background: '#141414', color: '#fff' }}>
                      {ar ? c.ar : c.v}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Next button */}
            <button
              onClick={() => { if (validateStep1()) setStep(2) }}
              className="mt-7 w-full py-3.5 font-semibold rounded-xl text-white text-[15px] transition-all duration-200"
              style={{
                background: '#5120c8',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-brand), var(--font-display)',
                boxShadow: '0 4px 12px rgba(81,32,200,0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4318a8'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(81,32,200,0.3)'
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

            <p className="mt-5 text-center text-sm" style={{ color: '#9CA3AF' }}>
              {ar ? 'لديك حساب؟' : 'Have an account?'}{' '}
              <Link
                href={`/${locale}/login`}
                className="font-semibold hover:underline"
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
            <h1 className="text-2xl font-bold text-center mb-2" style={{ color: '#ffffff' }}>
              {ar ? 'ما الذي يصفك أفضل؟' : 'What best describes you?'}
            </h1>
            <p className="text-sm text-center mb-6" style={{ color: '#9CA3AF' }}>
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
                      border: `2px solid ${isActive ? '#5120c8' : 'rgba(255,255,255,0.1)'}`,
                      background: isActive ? 'rgba(81,32,200,0.15)' : '#0A0A0A',
                      boxShadow: isActive ? '0 0 20px rgba(81,32,200,0.15)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                        e.currentTarget.style.background = '#0F0F0F'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                        e.currentTarget.style.background = '#0A0A0A'
                      }
                    }}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className="font-semibold text-sm" style={{ color: '#E6E6E6' }}>{label}</span>
                    <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{sub}</span>
                  </button>
                )
              })}
            </div>

            {/* Extra fields for INSTRUCTOR / CONSULTANT */}
            {step2.accountType !== 'STUDENT' && (
              <div
                className="space-y-4 pt-5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                  {ar ? 'معلومات إضافية' : 'Additional information'}
                </p>

                <Field label={ar ? 'السيرة الذاتية (PDF أو Word)' : 'CV / Resume (PDF or Word)'} error={errors2.cvUrl}>
                  <div
                    className="rounded-xl p-5 text-center cursor-pointer transition-all duration-200"
                    style={{
                      border: `2px dashed ${errors2.cvUrl ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                      background: errors2.cvUrl ? 'rgba(239,68,68,0.06)' : '#0A0A0A',
                    }}
                    onClick={() => document.getElementById('cv-file-input')?.click()}
                    onMouseEnter={(e) => {
                      if (!errors2.cvUrl) e.currentTarget.style.borderColor = 'rgba(81,32,200,0.4)'
                    }}
                    onMouseLeave={(e) => {
                      if (!errors2.cvUrl) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <input
                      id="cv-file-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleCvUpload(file)
                      }}
                    />
                    {cvUploading ? (
                      <p className="text-sm" style={{ color: '#818CF8' }}>{ar ? 'جاري رفع الملف...' : 'Uploading...'}</p>
                    ) : cvFileName ? (
                      <p className="text-sm font-medium" style={{ color: '#34D399' }}>✅ {cvFileName}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium" style={{ color: '#E6E6E6' }}>
                          {ar ? 'اضغط لرفع السيرة الذاتية' : 'Click to upload your CV'}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                          {ar ? 'PDF أو Word — حجم أقصى 5MB' : 'PDF or Word — max 5 MB'}
                        </p>
                      </>
                    )}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={ar ? 'سنوات الخبرة' : 'Years of Experience'}>
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
                  <Field label={ar ? 'مجال التخصص' : 'Speciality / Field'}>
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

                <Field label={ar ? 'نبذة مهنية' : 'Professional Bio'}>
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

                <Field label={ar ? 'رابط LinkedIn' : 'LinkedIn URL'}>
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
                    <Field label={ar ? 'السعر بالساعة (ريال)' : 'Hourly Rate (SAR)'}>
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
                    <Field label={ar ? 'طريقة الاجتماع' : 'Meeting Method'} error={errors2.meetingMethod}>
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
                        <option value="" style={{ background: '#141414', color: '#fff' }}>
                          {ar ? 'اختر' : 'Select'}
                        </option>
                        <option value="ZOOM" style={{ background: '#141414', color: '#fff' }}>Zoom</option>
                        <option value="GOOGLE_MEET" style={{ background: '#141414', color: '#fff' }}>Google Meet</option>
                        <option value="BOTH" style={{ background: '#141414', color: '#fff' }}>
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
                className="mt-5 p-3.5 rounded-xl text-sm"
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
                  background: 'transparent',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  color: '#9CA3AF',
                  fontFamily: 'var(--font-brand), var(--font-display)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  e.currentTarget.style.background = '#0A0A0A'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.background = 'transparent'
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
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#4318a8'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(81,32,200,0.3)'
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
                <h1 className="text-2xl font-bold mb-3" style={{ color: '#ffffff' }}>
                  {ar ? 'تم إرسال طلبك!' : 'Application Submitted!'}
                </h1>
                <p className="mb-6 leading-relaxed" style={{ color: '#9CA3AF' }}>
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
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(81,32,200,0.3)'
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
                <h1 className="text-2xl font-bold mb-3" style={{ color: '#ffffff' }}>
                  {ar ? 'مرحباً بك في DeveWay!' : 'Welcome to DeveWay!'}
                </h1>
                <p className="mb-8" style={{ color: '#9CA3AF' }}>
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
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4318a8'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(81,32,200,0.3)'
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