import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { API_URL } from './constants'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
})

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  return null
}

function readNestedString(obj: unknown, path: string[]): string | null {
  let cur: unknown = obj
  for (const key of path) {
    const rec = asRecord(cur)
    if (!rec) return null
    cur = rec[key]
  }
  return typeof cur === 'string' ? cur : null
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('careerhub_token')
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (typeof window === 'undefined') throw error
    const status = error.response?.status

    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('careerhub_refresh')
        if (!refreshToken) throw error
        const refreshRes = await api.post('/auth/refresh', { refreshToken })
        const payload: unknown = refreshRes.data
        const newToken =
          readNestedString(payload, ['data', 'accessToken']) ?? readNestedString(payload, ['accessToken'])
        const newRefresh =
          readNestedString(payload, ['data', 'refreshToken']) ?? readNestedString(payload, ['refreshToken'])
        if (newToken) localStorage.setItem('careerhub_token', String(newToken))
        if (newRefresh) localStorage.setItem('careerhub_refresh', String(newRefresh))
        return api(originalRequest)
      } catch {
        localStorage.removeItem('careerhub_token')
        localStorage.removeItem('careerhub_refresh')
        localStorage.removeItem('careerhub_user')
        const seg = window.location.pathname.split('/')[1]
        const locale = seg === 'en' ? 'en' : 'ar'
        window.location.href = `/${locale}/login`
      }
    }
    throw error
  },
)

export const get = <T>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config)
export const post = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.post<T>(url, data, config)
export const put = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.put<T>(url, data, config)
export const patch = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.patch<T>(url, data, config)
export const del = <T>(url: string, config?: AxiosRequestConfig) => api.delete<T>(url, config)

