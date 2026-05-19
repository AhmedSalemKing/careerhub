'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clock } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { api } from '../../../lib/api'
import { setToken, setRefreshToken, setUser } from '../../../lib/auth'

export default function LoginPage() {
  const locale = useLocale() as 'ar' | 'en'
  const router = useRouter()
  const t = useTranslations('auth')
  const c = useTranslations('common')
  const store = useAuthStore()
  const { token, user } = useAuthStore()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  // Handle URL error params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (error === 'pending_approval') {
      setLoginError(ar ? 'حسابك في انتظار مراجعة الإدارة. سنخطرك عند القبول.' : 'Your account is under review. We will notify you when approved.')
    } else if (error === 'account_rejected') {
      setLoginError(ar ? 'تم رفض حسابك. تواصل مع الدعم للمزيد من المعلومات.' : 'Your application was rejected. Please contact support for more information.')
    } else if (error === 'google_failed') {
      setLoginError(ar ? 'فشل تسجيل الدخول بـ Google. حاول مرة أخرى.' : 'Google sign-in failed. Please try again.')
    }
  }, [ar])

  useEffect(() => {
    if (token && user) {
      const params = new URLSearchParams(window.location.search)
      const redirectTo = params.get('redirect')
      if (redirectTo && !redirectTo.includes('/login')) {
        // Append token to cross-domain redirects (e.g. learn app)
        if (redirectTo.startsWith('http')) {
          try {
            const url = new URL(redirectTo)
            const t = localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token')
            if (t) url.searchParams.set('token', t)
            window.location.href = url.toString()
          } catch {
            window.location.href = redirectTo
          }
        } else {
          window.location.href = redirectTo
        }
        return
      }
      if (user.accountType === 'ADMIN' || user.accountType === 'SUPER_ADMIN') {
        window.location.href = `/${locale}/admin`
      } else {
        window.location.href = `/${locale}/dashboard`
      }
    }
  }, [token, user, locale])

  const schema = z.object({
    email: z.string().min(1, { message: t('errors.email_required') }).email({ message: t('errors.email_invalid') }),
    password: z.string().min(1, { message: t('errors.password_required') }),
  })

  type Values = z.infer<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: Values) => {
    setLoginError(null)
    setIsSubmitting(true)
    try {
      const res = await api.post<{ data?: { user?: { accountType?: string; status?: string; [key: string]: unknown }; accessToken?: string; refreshToken?: string; pendingApproval?: boolean }; message?: string }>('/auth/login', values)
      const data = res?.data
      const token = data?.data?.accessToken
      const refreshToken = data?.data?.refreshToken
      const user = data?.data?.user as any
      const pendingApproval = data?.data?.pendingApproval

      if (!token || !user) {
        setLoginError(ar ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Email or password is incorrect')
        return
      }

      // Handle PENDING users - redirect to pending page
      if (pendingApproval || user.status === 'PENDING') {
        store.setToken(token)
        setToken(token)
        localStorage.setItem('deveway_token', token)
        localStorage.setItem('careerhub_token', token)
        localStorage.setItem('deveway_user', JSON.stringify(user))
        localStorage.setItem('careerhub_user', JSON.stringify(user))
        store.setUser(user)
        window.dispatchEvent(new Event('auth:updated'))
        router.push(`/${locale}/pending-approval`)
        return
      }

      store.setToken(token)
      setToken(token)
      localStorage.setItem('deveway_token', token)
      localStorage.setItem('careerhub_token', token)
      document.cookie = `careerhub_token=${token}; path=/; SameSite=Lax; max-age=604800`
      if (refreshToken) {
        store.setRefreshToken(refreshToken)
        setRefreshToken(refreshToken)
        localStorage.setItem('deveway_refresh', refreshToken)
        localStorage.setItem('careerhub_refresh', refreshToken)
      }
      store.setUser(user)
      setUser(user)
      localStorage.setItem('deveway_user', JSON.stringify(user))
      localStorage.setItem('careerhub_user', JSON.stringify(user))

      window.dispatchEvent(new Event('auth:updated'))

      if (user.accountType === 'ADMIN' || user.accountType === 'SUPER_ADMIN') {
        window.location.href = `/${locale}/admin`
      } else {
        const params = new URLSearchParams(window.location.search)
        const returnTo = params.get('redirect') || `/${locale}/dashboard`
        if (returnTo.startsWith('http')) {
          try {
            const url = new URL(returnTo)
            url.searchParams.set('token', token)
            window.location.href = url.toString()
          } catch {
            window.location.href = returnTo
          }
        } else {
          window.location.href = returnTo
        }
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
      const status = axiosError.response?.status
      const serverMessage = axiosError.response?.data?.message

      if (status === 401 || status === 400) {
        setLoginError(ar ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Email or password is incorrect')
      } else if (status === 404) {
        setLoginError(ar ? 'هذا الحساب غير موجود' : 'Account not found')
      } else if (status === 403) {
        const msg = (serverMessage || '').toLowerCase()
        if (msg.includes('under review') || msg.includes('pending') || msg.includes('مراجعة')) {
          setIsPending(true)
          return
        }
        setLoginError(serverMessage || (ar ? 'لا يمكن تسجيل الدخول' : 'Cannot sign in'))
      } else {
        setLoginError(ar ? 'حدث خطأ، يرجى المحاولة لاحقاً' : 'An error occurred, please try again')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ════════════════════════════════════════
  // 🎨 نظام الألوان - يستخدم متغيرات CSS
  // ════════════════════════════════════════
  const colors = {
    pageBg: 'var(--background)',
    cardBg: 'var(--card)',
    titleColor: 'var(--foreground)',
    textColor: 'var(--foreground)',
    mutedColor: 'var(--muted)',
    inputBg: 'var(--input-bg)',
    inputBorder: 'var(--border)',
    inputText: 'var(--foreground)',
    inputPlaceholder: 'var(--muted)',
    cardBorder: 'var(--border)',
    cardShadow: 'var(--shadow-xl)',
  }

  if (isPending) {
    return (
      <div
        dir={ar ? 'rtl' : 'ltr'}
        className="min-h-screen flex items-center justify-center px-4 py-12 transition-all duration-300"
        style={{ 
          background: colors.pageBg,
          color: colors.textColor
        }}
      >
        <div
          className="w-full max-w-md relative z-10"
          style={{
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 24,
            padding: '40px 32px',
            boxShadow: colors.cardShadow,
          }}
        >
          <div className="text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'rgba(245,166,35,0.15)' }}
            >
              <Clock className="h-8 w-8" style={{ color: '#FCD34D' }} />
            </div>
            <h2
              className="text-2xl font-bold mb-2 transition-colors duration-300"
              style={{ 
                color: colors.titleColor, 
                fontFamily: ar ? "'PingARLT', sans-serif" : "'Plus Jakarta Sans', sans-serif" 
              }}
            >
              {ar ? 'طلبك قيد المراجعة' : 'Application Under Review'}
            </h2>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: colors.mutedColor }}>
              {ar
                ? 'شكراً لتسجيلك! فريقنا يراجع بياناتك حالياً. سيتم إشعارك خلال 24-48 ساعة.'
                : 'Thank you for registering! Our team is reviewing your application. You will be notified within 24-48 hours.'}
            </p>
            <div
              className="rounded-xl p-4 text-sm mb-6"
              style={{
                background: 'rgba(245,166,35,0.1)',
                border: '1px solid rgba(245,166,35,0.2)',
                color: '#FCD34D',
              }}
            >
              {ar ? 'متوسط وقت المراجعة: 24-48 ساعة' : 'Average review time: 24-48 hours'}
            </div>
            <button
              onClick={() => setIsPending(false)}
              className="text-sm hover:underline"
              style={{ color: colors.mutedColor }}
            >
              {ar ? '← العودة لتسجيل الدخول' : '← Back to login'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden transition-all duration-300"
      style={{ 
        background: colors.pageBg,
        color: colors.textColor
      }}
    >
      {/* ✨ Ambient Glows - خفيفة ومتناسقة */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-full overflow-hidden -z-0">
        {/* Glow علوي */}
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
        {/* Glow سفلي */}
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

      {/* ✅ بوكس تسجيل الدخول - متناسق */}
      <div
        className="w-full max-w-md relative z-10 animate-scale-in transition-all duration-300"
        style={{
          background: colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 24,
          padding: '44px 36px',
          boxShadow: colors.cardShadow,
        }}
      >
        {/* Logo */}
        <div className="text-center mb-3">
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

        {/* ✅ عنوان "تسجيل الدخول" - Dynamic Color */}
        <h1
          className="text-2xl font-bold text-center mb-1.5 transition-colors duration-300"
          style={{ 
            color: colors.titleColor
          }}
        >
          {t('login_title')}
        </h1>
        
        <p className="text-center text-sm mb-7 transition-colors duration-300" style={{ color: colors.mutedColor }}>
          {t('have_account')}
        </p>

        {/* Error Message */}
        {loginError && (
          <div
            className="mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm transition-all duration-200"
            style={{
              borderColor: theme === 'dark' ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.3)',
              background: theme === 'dark' ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)',
              color: '#ef4444',
            }}
            dir="rtl"
          >
            <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {loginError}
          </div>
        )}

        <form className="space-y-4.5" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Email Field */}
          <div>
            <label
              className="block text-sm font-medium mb-2 transition-colors duration-300"
              style={{ color: colors.mutedColor }}
            >
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="off"
              placeholder="name@example.com"
              dir="ltr"
              className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none transition-all duration-200 focus:border-[#5120c8] focus:shadow-[0_0_0_4px_rgba(81,32,200,0.1)]"
              style={{
                background: colors.inputBg,
                border: `1.5px solid ${colors.inputBorder}`,
                color: colors.inputText,
                caretColor: '#5120c8',
              }}
              {...form.register('email', { onChange: () => setLoginError(null) })}
            />
            {form.formState.errors.email?.message && (
              <p className="text-xs mt-1.5 ml-1" style={{ color: '#ef4444' }}>
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              className="block text-sm font-medium mb-2 transition-colors duration-300"
              style={{ color: colors.mutedColor }}
            >
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="off"
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none transition-all duration-200 focus:border-[#5120c8] focus:shadow-[0_0_0_4px_rgba(81,32,200,0.1)]"
              style={{
                background: colors.inputBg,
                border: `1.5px solid ${colors.inputBorder}`,
                color: colors.inputText,
                caretColor: '#5120c8',
              }}
              {...form.register('password', { onChange: () => setLoginError(null) })}
            />
            {form.formState.errors.password?.message && (
              <p className="text-xs mt-1.5 ml-1" style={{ color: '#ef4444' }}>
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* ✅ زر تسجيل الدخول - نص أبيض دائمًا + مسافة إضافية mt-8 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 font-semibold rounded-xl text-[15px] transition-all duration-200 cursor-pointer disabled:opacity-50 mt-8"
            style={{
              background: '#5120c8',
              border: 'none',
              fontFamily: 'var(--font-brand), var(--font-display)',
              color: '#ffffff',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4318a8'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(81,32,200,0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#5120c8'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {isSubmitting ? c('loading') : t('login_btn')}
          </button>

          {/* Google Login */}
          <div style={{ position: 'relative', margin: '20px 0 4px', textAlign: 'center' }}>
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
            onClick={() => {
              const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api').replace(/\/api$/, '')
              window.location.href = `${apiUrl}/api/auth/google`
            }}
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
            {ar ? 'تسجيل الدخول بـ Google' : 'Continue with Google'}
          </button>

          {/* Links */}
          <div className="flex items-center justify-between text-sm pt-1">
            <Link
              href={`/${locale}/forgot-password`}
              className="font-semibold hover:underline transition-colors duration-200"
              style={{ color: '#818CF8' }}
            >
              {t('forgot_password')}
            </Link>
            <Link
              href={`/${locale}/register`}
              className="font-semibold hover:underline transition-colors duration-200"
              style={{ color: colors.mutedColor }}
            >
              {t('no_account')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}