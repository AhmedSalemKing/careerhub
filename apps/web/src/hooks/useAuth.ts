'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { setRefreshToken, setToken, setUser } from '../lib/auth'
import { useAuthStore, type AuthUser } from '../stores/authStore'
import { useToast } from '../lib/toast'

type ApiResponse<T> = { success?: boolean; message?: string; data?: T }

export function useAuth() {
  const { toast } = useToast()
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('auth')
  const store = useAuthStore()
  const prevRoleRef = useRef<string | null>(null)

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    enabled: !!store.token,
    refetchInterval: 30 * 1000, // 30 seconds - keeps role in sync with DB
    queryFn: async () => {
      const res = await api.get<ApiResponse<AuthUser>>('/auth/me')
      const user = res.data.data
      if (user) {
        store.setUser(user)
        localStorage.setItem('deveway_user', JSON.stringify(user))
      }
      return user ?? null
    },
  })

  // Detect role changes and notify user
  useEffect(() => {
    if (!meQuery.data) return
    
    const prevRole = prevRoleRef.current || store.user?.accountType
    
    if (meQuery.data.accountType && prevRole && meQuery.data.accountType !== prevRole) {
      const roleNames: Record<string, string> = {
        STUDENT: 'طالب',
        INSTRUCTOR: 'محاضر',
        CONSULTANT: 'مستشار',
        ADMIN: 'مدير',
      }
      
      console.log(`[Auth] Role changed from ${prevRole} to ${meQuery.data.accountType}`)
      
      // Update store
      store.setUser(meQuery.data)
      localStorage.setItem('deveway_user', JSON.stringify({
        ...meQuery.data,
        accessToken: store.token,
      }))
      
      // Show notification
      toast({
        variant: 'success',
        description: `تم تحديث دورك إلى ${roleNames[meQuery.data.accountType] || meQuery.data.accountType}`,
      })
      
      // Dispatch event for other listeners
      window.dispatchEvent(new CustomEvent('role:changed', { detail: { role: meQuery.data.accountType } }))
    }
    
    // Always sync latest data
    if (meQuery.data.accountType !== store.user?.accountType || 
        meQuery.data.isVerified !== store.user?.isVerified) {
      store.setUser(meQuery.data)
      localStorage.setItem('deveway_user', JSON.stringify({
        ...meQuery.data,
        accessToken: store.token,
      }))
    }
    
    prevRoleRef.current = meQuery.data.accountType
  }, [meQuery.data, store, toast])

  const login = useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const res = await api.post<ApiResponse<{ user: AuthUser; accessToken: string; refreshToken?: string }>>('/auth/login', payload)
      return res.data
    },
    onSuccess: (data) => {
      const token = data.data?.accessToken
      const refreshToken = data.data?.refreshToken
      const user = data.data?.user

      // ── SAVE TO ALL STORAGE BEFORE REDIRECT ──
      if (token) {
        store.setToken(token)
        setToken(token)
        localStorage.setItem('deveway_token', token)
      }
      if (refreshToken) {
        store.setRefreshToken(refreshToken)
        setRefreshToken(refreshToken)
        localStorage.setItem('deveway_refresh', refreshToken)
      }
      if (user) {
        store.setUser(user)
        setUser(user)
        localStorage.setItem('deveway_user', JSON.stringify(user))

        api.post('/users/track-activity', { action: 'LOGIN', page: '/login' }).catch(() => {})
      }

      toast({ variant: 'success', description: data.message || t('toast_login_success') })

      // ── Notify Navbar + redirect ──
      window.dispatchEvent(new Event('auth:updated'))

      if (user?.accountType === 'ADMIN' || user?.accountType === 'SUPER_ADMIN') {
        window.location.href = `/${locale}/admin`
        return
      }
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const returnTo = searchParams?.get('redirect') || `/${locale}/dashboard`
      window.location.href = returnTo
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } }
      const status = axiosError.response?.status
      const serverMessage = axiosError.response?.data?.message

      let errorMessage = t('toast_login_failed')

      if (status === 401) {
        errorMessage = locale === 'ar'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : 'Email or password is incorrect'
      } else if (status === 404) {
        errorMessage = locale === 'ar'
          ? 'هذا الحساب غير موجود، يرجى إنشاء حساب جديد'
          : 'Account not found, please create a new account'
      } else if (status === 403) {
        errorMessage = serverMessage || (locale === 'ar'
          ? 'لا يمكن تسجيل الدخول. تواصل مع الدعم.'
          : 'Cannot sign in. Contact support.')
      } else if (serverMessage) {
        errorMessage = serverMessage
      }

      toast({ variant: 'danger', description: errorMessage })
    },
  })

  const register = useMutation({
    mutationFn: async (payload: {
      email: string
      password: string
      firstName: string
      lastName: string
      phone?: string
      country?: string
      city?: string
      language?: string
    }) => {
      const res = await api.post<ApiResponse<{ user: AuthUser; accessToken: string; refreshToken?: string }>>('/auth/register', payload)
      return res.data
    },
    onSuccess: (data) => {
      const token = data.data?.accessToken
      const refreshToken = data.data?.refreshToken
      const user = data.data?.user

      if (token) {
        store.setToken(token)
        setToken(token)
        localStorage.setItem('deveway_token', token)
      }
      if (refreshToken) {
        store.setRefreshToken(refreshToken)
        setRefreshToken(refreshToken)
        localStorage.setItem('deveway_refresh', refreshToken)
      }
      if (user) {
        store.setUser(user)
        setUser(user)
        localStorage.setItem('deveway_user', JSON.stringify(user))
      }

      toast({ variant: 'success', description: data.message || t('toast_register_success') })
      window.dispatchEvent(new Event('auth:updated'))
      window.location.href = `/${locale}/dashboard/assessment`
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } }
      const serverMessage = axiosError.response?.data?.message
      toast({ variant: 'danger', description: serverMessage || t('toast_register_failed') })
    },
  })

  const forgotPassword = useMutation({
    mutationFn: async (payload: { email: string }) => {
      const res = await api.post<ApiResponse<unknown>>('/auth/forgot-password', payload)
      return res.data
    },
    onSuccess: () => toast({ variant: 'success', description: t('toast_forgot_success') }),
    onError: () => toast({ variant: 'danger', description: t('toast_forgot_failed') }),
  })

  const resetPassword = useMutation({
    mutationFn: async (payload: { token: string; newPassword: string }) => {
      const res = await api.post<ApiResponse<unknown>>('/auth/reset-password', payload)
      return res.data
    },
    onSuccess: () => {
      toast({ variant: 'success', description: t('toast_reset_success') })
      window.location.href = `/${locale}/login`
    },
    onError: () => toast({ variant: 'danger', description: t('toast_reset_failed') }),
  })

  const doLogout = () => {
    store.logout()
    window.dispatchEvent(new Event('auth:updated'))
  }

  return {
    user: store.user,
    token: store.token,
    isLoading: store.isLoading || meQuery.isLoading,
    isAuthenticated: !!store.token,
    meQuery,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout: doLogout,
  }
}