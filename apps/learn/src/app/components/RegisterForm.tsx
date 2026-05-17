'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

// مطابق تماماً لـ RegisterDto في الـ Backend
const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'الاسم الأول يجب أن يكون حرفين على الأقل')
      .max(50, 'الاسم الأول لا يتجاوز 50 حرف')
      .regex(/^[a-zA-Z\u0600-\u06FF\s]+$/, 'الاسم يجب أن يحتوي على حروف فقط'),
    lastName: z
      .string()
      .min(2, 'الاسم الأخير يجب أن يكون حرفين على الأقل')
      .max(50, 'الاسم الأخير لا يتجاوز 50 حرف')
      .regex(/^[a-zA-Z\u0600-\u06FF\s]+$/, 'الاسم يجب أن يحتوي على حروف فقط'),
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z
      .string()
      .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      .max(128, 'كلمة المرور لا تتجاوز 128 حرف')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'كلمة المرور يجب أن تحتوي على: حرف كبير، حرف صغير، رقم، ورمز خاص (@$!%*?&)'
      ),
    confirmPassword: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
    country: z
      .string()
      .min(1, 'الدولة مطلوبة')
      .max(50, 'اسم الدولة لا يتجاوز 50 حرف'),
    language: z.enum(['ar', 'en']).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمة المرور وتأكيدها غير متطابقين',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const locale = useLocale()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      country: 'Egypt',
      language: locale as 'ar' | 'en',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setServerError('')
    try {
      // لا نبعت confirmPassword للـ API — فقط الحقول المطلوبة
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        country: data.country,
        language: locale as 'ar' | 'en',
      }

      const res = await api.post('/auth/register', payload)
      const responseData = (res.data as any)?.data

      if (responseData?.accessToken) {
        localStorage.setItem('deveway_token', responseData.accessToken)
        if (responseData.refreshToken) {
          localStorage.setItem('deveway_refresh', responseData.refreshToken)
        }
      }

      reset()
      router.push(`/${locale}/my-courses`)
    } catch (error: any) {
      const msg = error.response?.data?.message
      if (Array.isArray(msg)) {
        setServerError(msg.join(' — '))
      } else {
        setServerError(
          msg || (locale === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'Registration failed')
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm'
  const errorClass = 'text-red-500 text-xs mt-1'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

      {serverError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {serverError}
        </div>
      )}

      {/* الاسم الأول والأخير */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            {...register('firstName')}
            type="text"
            placeholder={locale === 'ar' ? 'الاسم الأول' : 'First Name'}
            autoComplete="given-name"
            className={inputClass}
          />
          {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
        </div>
        <div>
          <input
            {...register('lastName')}
            type="text"
            placeholder={locale === 'ar' ? 'الاسم الأخير' : 'Last Name'}
            autoComplete="family-name"
            className={inputClass}
          />
          {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
        </div>
      </div>

      {/* البريد الإلكتروني */}
      <div>
        <input
          {...register('email')}
          type="email"
          placeholder={locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
          autoComplete="email"
          className={inputClass}
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      {/* كلمة المرور */}
      <div>
        <input
          {...register('password')}
          type="password"
          placeholder={locale === 'ar' ? 'كلمة المرور' : 'Password'}
          autoComplete="new-password"
          className={inputClass}
        />
        {errors.password && <p className={errorClass}>{errors.password.message}</p>}
        <p className="text-gray-400 text-xs mt-1">
          {locale === 'ar'
            ? 'مثال: Ahmed@123 (حرف كبير + صغير + رقم + رمز)'
            : 'Example: Ahmed@123 (uppercase + lowercase + number + symbol)'}
        </p>
      </div>

      {/* تأكيد كلمة المرور */}
      <div>
        <input
          {...register('confirmPassword')}
          type="password"
          placeholder={locale === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
          autoComplete="new-password"
          className={inputClass}
        />
        {errors.confirmPassword && (
          <p className={errorClass}>{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* الدولة */}
      <div>
        <select {...register('country')} className={inputClass}>
          <option value="Egypt">{locale === 'ar' ? 'مصر' : 'Egypt'}</option>
          <option value="Saudi Arabia">{locale === 'ar' ? 'السعودية' : 'Saudi Arabia'}</option>
          <option value="UAE">{locale === 'ar' ? 'الإمارات' : 'UAE'}</option>
          <option value="Kuwait">{locale === 'ar' ? 'الكويت' : 'Kuwait'}</option>
          <option value="Qatar">{locale === 'ar' ? 'قطر' : 'Qatar'}</option>
          <option value="Jordan">{locale === 'ar' ? 'الأردن' : 'Jordan'}</option>
          <option value="Other">{locale === 'ar' ? 'أخرى' : 'Other'}</option>
        </select>
        {errors.country && <p className={errorClass}>{errors.country.message}</p>}
      </div>

      {/* زر الإرسال */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors text-sm"
      >
        {loading
          ? locale === 'ar' ? 'جاري الإنشاء...' : 'Creating...'
          : locale === 'ar' ? 'إنشاء الحساب' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {locale === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
        <Link href={`/${locale}/login`} className="text-blue-600 hover:underline font-medium">
          {locale === 'ar' ? 'تسجيل الدخول' : 'Login'}
        </Link>
      </p>
    </form>
  )
}