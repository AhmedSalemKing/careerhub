'use client'

import { useMutation } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { api } from '../lib/api'
import { setToken, setUser } from '../lib/auth'
import { useAuthStore, type AuthUser } from '../stores/authStore'
import { useToast } from '../lib/toast'

type ApiResponse<T> = { success?: boolean; message?: string; data?: T }

export function useAuth() {
  const { toast } = useToast()
  const locale = useLocale() as 'ar' | 'en'
  const store = useAuthStore()

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
      toast({
        variant: 'success',
        description: locale === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful',
      })
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } } }
      const status = axiosError.response?.status
      const serverMessage = axiosError.response?.data?.message

      let msg = locale === 'ar' ? 'حدث خطأ' : 'An error occurred'
      if (status === 401) {
        msg = locale === 'ar'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : 'Email or password is incorrect'
      } else if (status === 404) {
        msg = locale === 'ar' ? 'هذا الحساب غير موجود' : 'Account not found'
      } else if (serverMessage) {
        msg = serverMessage
      }
      toast({ variant: 'danger', description: msg })
    },
  })

  const logout = () => {
    store.logout()
  }

  return {
    user: store.user,
    token: store.token,
    isLoading: store.isLoading,
    isAuthenticated: !!store.token,
    login,
    logout,
  }
}
