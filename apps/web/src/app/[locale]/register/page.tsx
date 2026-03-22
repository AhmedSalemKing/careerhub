'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { post } from '../../../lib/api'
import { useAuthStore } from '../../../stores/authStore'

export default function RegisterPage() {
  const locale = useLocale()
  const router = useRouter()
  const setToken = useAuthStore((s) => s.setToken)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [country, setCountry] = useState('EG')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ar = locale === 'ar'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(ar ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await post('/auth/register', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        country,
        language: locale,
      })
      const d = (res as any)?.data?.data ?? (res as any)?.data
      if (d?.accessToken) {
        setToken(d.accessToken)
        // Use window.location.href to ensure a fresh load and bypass potential router state issues
        window.location.href = `/${locale}/dashboard/assessment`
      } else {
        setError(ar ? 'فشل إنشاء الحساب. حاول مرة أخرى.' : 'Registration failed. Please try again.')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message
      if (Array.isArray(msg)) {
        setError(msg[0])
      } else if (typeof msg === 'string') {
        if (msg === 'Email already exists') {
          setError(ar ? 'البريد الإلكتروني مسجل بالفعل' : 'Email already exists')
        } else {
          setError(msg)
        }
      } else {
        setError(ar ? 'حدث خطأ أثناء الاتصال بالخادم. حاول مرة أخرى.' : 'An error occurred while connecting to the server. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {ar ? 'إنشاء حساب جديد' : 'Create a new account'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
                placeholder={ar ? 'الاسم الأول' : 'First Name'}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                type="text"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
                placeholder={ar ? 'اسم العائلة' : 'Last Name'}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <input
              type="email"
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
              placeholder={ar ? 'البريد الإلكتروني' : 'Email address'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
              placeholder={ar ? 'كلمة المرور' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
              placeholder={ar ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <select
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="EG">{ar ? 'مصر' : 'Egypt'}</option>
              <option value="SA">{ar ? 'المملكة العربية السعودية' : 'Saudi Arabia'}</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (ar ? 'جاري التحميل...' : 'Loading...') : (ar ? 'إنشاء حساب' : 'Sign up')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
