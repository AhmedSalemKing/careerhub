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

  useEffect(() => {
    if (token && user) {
      const params = new URLSearchParams(window.location.search)
      const redirectTo = params.get('redirect')
      if (redirectTo && !redirectTo.includes('/login')) {
        window.location.href = redirectTo
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
        window.location.href = returnTo
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

  if (isPending) {
    return (
      <div
        dir={ar ? 'rtl' : 'ltr'}
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ 
          background: '#0D0D0D',
          color: '#E6E6E6'
        }}
      >
        <div
          className="w-full max-w-md relative z-10"
          style={{
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
            padding: '40px 32px',
            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)',
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
              className="text-2xl font-bold mb-2"
              style={{ color: '#ffffff', fontFamily: ar ? "'PingARLT', sans-serif" : "'Plus Jakarta Sans', sans-serif" }}
            >
              {ar ? 'طلبك قيد المراجعة' : 'Application Under Review'}
            </h2>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
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
              style={{ color: '#9CA3AF' }}
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
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ 
        background: '#0D0D0D',
        color: '#E6E6E6'
      }}
    >
      {/* Glossy Ambient Glows */}
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

      <div
        className="w-full max-w-md relative z-10 animate-scale-in"
        style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
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

        <h1
          className="text-2xl font-bold text-center mb-1"
          style={{ color: '#ffffff' }}
        >
          {t('login_title')}
        </h1>
        <p className="text-center text-sm mb-6" style={{ color: '#9CA3AF' }}>
          {t('have_account')}
        </p>

        {/* Error */}
        {loginError && (
          <div
            className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
            dir="rtl"
          >
            <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {loginError}
          </div>
        )}

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#9CA3AF' }}
            >
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="off"
              placeholder="name@example.com"
              dir="ltr"
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all duration-200 placeholder:text-gray-600 focus:border-[#5120c8] focus:shadow-[0_0_0_3px_rgba(81,32,200,0.15)]"
              style={{
                background: '#0A0A0A',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#E6E6E6',
              }}
              {...form.register('email', { onChange: () => setLoginError(null) })}
            />
            {form.formState.errors.email?.message && (
              <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: '#9CA3AF' }}
            >
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="off"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all duration-200 placeholder:text-gray-600 focus:border-[#5120c8] focus:shadow-[0_0_0_3px_rgba(81,32,200,0.15)]"
              style={{
                background: '#0A0A0A',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#E6E6E6',
              }}
              {...form.register('password', { onChange: () => setLoginError(null) })}
            />
            {form.formState.errors.password?.message && (
              <p className="text-xs mt-1.5" style={{ color: '#ef4444' }}>
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 font-semibold rounded-xl text-white text-[15px] transition-all duration-200 cursor-pointer disabled:opacity-50"
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
            {isSubmitting ? c('loading') : t('login_btn')}
          </button>

          <div className="flex items-center justify-between text-sm">
            <Link
              href={`/${locale}/forgot-password`}
              className="font-semibold hover:underline"
              style={{ color: '#818CF8' }}
            >
              {t('forgot_password')}
            </Link>
            <Link
              href={`/${locale}/register`}
              className="font-semibold hover:underline"
              style={{ color: '#9CA3AF' }}
            >
              {t('no_account')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}