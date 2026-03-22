'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { post } from '../../../lib/api'
import { useAuthStore } from '../../../stores/authStore'

export default function LoginPage() {
  const locale = useLocale()
  const router = useRouter()
  const setToken = useAuthStore((s) => s.setToken)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ar = locale === 'ar'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await post('/auth/login', { email: email.trim(), password })
      const d = (res as any)?.data?.data ?? (res as any)?.data
      if (d?.accessToken) {
        const accessToken = d.accessToken
        const user = d.user

        // 1. Save to localStorage
        localStorage.setItem('careerhub_token', accessToken)
        // 2. Save to cookie
        document.cookie = `careerhub_token=${accessToken}; path=/; max-age=604800`
        // 3. Save user info
        if (user) localStorage.setItem('careerhub_user', JSON.stringify(user))

        // 4. Update store
        setToken(accessToken)

        // 5. Redirect with a small delay to ensure storage is committed
        setTimeout(() => {
          window.location.href = `/${locale}/dashboard`
        }, 100)
      } else {
        setError(ar ? 'فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.' : 'Login failed. Please check your email and password.')
      }
    } catch (err: any) {
      setError(ar ? 'حدث خطأ أثناء الاتصال بالخادم. حاول مرة أخرى.' : 'An error occurred while connecting to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {ar ? 'تسجيل الدخول' : 'Sign In'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <input
                type="email"
                required
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
                placeholder={ar ? 'البريد الإلكتروني' : 'Email address'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
                placeholder={ar ? 'كلمة المرور' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (ar ? 'جاري التحميل...' : 'Loading...') : (ar ? 'تسجيل الدخول' : 'Sign in')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
