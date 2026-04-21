'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
      const res = await api.post<{ data?: { user?: { accountType?: string; [key: string]: unknown }; accessToken?: string; refreshToken?: string }; message?: string }>('/auth/login', values)
      const data = res?.data
      const token = data?.data?.accessToken
      const refreshToken = data?.data?.refreshToken
      const user = data?.data?.user

      if (!token || !user) {
        setLoginError(ar ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Email or password is incorrect')
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
      store.setUser(user as Parameters<typeof store.setUser>[0])
      setUser(user as Parameters<typeof setUser>[0])
      localStorage.setItem('deveway_user', JSON.stringify(user))
      localStorage.setItem('careerhub_user', JSON.stringify(user))

      window.dispatchEvent(new Event('auth:updated'))

      if (user.accountType === 'ADMIN' || user.accountType === 'SUPER_ADMIN') {
        window.location.href = `/${locale}/admin`
      } else {
        const params = new URLSearchParams(window.location.search)
        const returnTo = params.get('redirect') || `/${locale}/dashboard`
        // Append token to cross-domain redirects (e.g. learn app)
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
  // 🎨 نظام الألوان الديناميكي - متناسق
  // ════════════════════════════════════════
  const colors = {
    // ✅ خلفية الصفحة الخارجية: Dark→داكن | Light→أبيض
    pageBg: theme === 'dark' ? '#0D0D0D' : '#FFFFFF',
    
    // ✅ بوكس تسجيل الدخول: Dark→داكن | Light→أبيض
    cardBg: theme === 'dark' ? '#141414' : '#FFFFFF',
    
    // ✅ عنوان "تسجيل الدخول": Dark→أبيض | Light→أسود
    titleColor: theme === 'dark' ? '#FFFFFF' : '#0d0d0d',
    
    // النصوص العادية
    textColor: theme === 'dark' ? '#E6E6E6' : '#1a1a2e',
    
    // النصوص الخافتة (labels, descriptions)
    mutedColor: theme === 'dark' ? '#9CA3AF' : '#6b7280',
    
    // حقول الإدخال
    inputBg: theme === 'dark' ? '#0A0A0A' : '#f8f9fa',
    inputBorder: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    inputText: theme === 'dark' ? '#E6E6E6' : '#1a1a2e',
    inputPlaceholder: theme === 'dark' ? '#6b7280' : '#9ca3af',
    
    // حدود البوكس
    cardBorder: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    
    // ظل البوكس
    cardShadow: theme === 'dark' 
      ? '0 25px 60px -12px rgba(0,0,0,0.5)' 
      : '0 25px 60px -12px rgba(0,0,0,0.15)',
    
    // Glow Effects
    glowOpacity: theme === 'dark' ? 0.03 : 0.008,
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