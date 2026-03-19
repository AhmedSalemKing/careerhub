'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
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

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    enabled: !!store.token,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ user: AuthUser }>>('/auth/me')
      const user = res.data.data?.user
      if (user) {
        store.setUser(user)
      }
      return user ?? null
    },
  })

  const login = useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const res = await api.post<ApiResponse<{ user: AuthUser; accessToken: string }>>('/auth/login', payload)
      return res.data
    },
    onSuccess: (data) => {
      const token = data.data?.accessToken
      const user = data.data?.user
      if (token) {
        store.setToken(token)
        setToken(token)
      }
      if (user) {
        store.setUser(user)
        setUser(user)
      }
      toast({ variant: 'success', description: data.message || t('toast_login_success') })
      window.location.href = `/${locale}/dashboard`
    },
    onError: () => toast({ variant: 'danger', description: t('toast_login_failed') }),
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
      const res = await api.post<ApiResponse<{ user: AuthUser; accessToken: string }>>('/auth/register', payload)
      return res.data
    },
    onSuccess: (data) => {
      const token = data.data?.accessToken
      const user = data.data?.user
      if (token) {
        store.setToken(token)
        setToken(token)
      }
      if (user) {
        store.setUser(user)
        setUser(user)
      }
      toast({ variant: 'success', description: data.message || t('toast_register_success') })
      window.location.href = `/${locale}/dashboard/assessment`
    },
    onError: () => toast({ variant: 'danger', description: t('toast_register_failed') }),
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

