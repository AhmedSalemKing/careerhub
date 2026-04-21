import axios from 'axios'

const getBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  if (envUrl) return `${envUrl}/api`
  if (typeof window !== 'undefined') return '/api'
  return 'http://localhost:3001/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('deveway_token')
      || localStorage.getItem('careerhub_token')
      || document.cookie.match(/deveway_token=([^;]+)/)?.[1]
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window === 'undefined') throw error
    const status = error.response?.status
    const originalRequest = error.config as any
    if (status === 401 && originalRequest && !originalRequest._retry) {
      // /auth/me is a background "try to load user" call — never redirect on failure
      if (originalRequest.url?.includes('/auth/me')) throw error

      originalRequest._retry = true
      try {
        // Read refresh token from localStorage OR cookie (cross-port on localhost)
        const refreshToken = localStorage.getItem('deveway_refresh')
          || document.cookie.match(/deveway_refresh=([^;]+)/)?.[1]
        if (!refreshToken) throw error
        const refreshRes = await api.post('/auth/refresh', { refreshToken })
        const newToken = refreshRes.data?.data?.accessToken ?? refreshRes.data?.accessToken
        const newRefresh = refreshRes.data?.data?.refreshToken ?? refreshRes.data?.refreshToken
        if (newToken) localStorage.setItem('deveway_token', newToken)
        if (newRefresh) localStorage.setItem('deveway_refresh', newRefresh)
        return api(originalRequest)
      } catch {
        localStorage.removeItem('deveway_token')
        localStorage.removeItem('deveway_refresh')
        localStorage.removeItem('deveway_user')
        const seg = window.location.pathname.split('/')[1]
        const locale = seg === 'en' ? 'en' : 'ar'
        window.location.href = `/${locale}/login`
      }
    }
    console.error('[API Error]', error.config?.url, error.response?.status)
    throw error
  }
)

export const get = <T>(url: string, config?: any) => api.get<T>(url, config)
export const post = <T>(url: string, data?: unknown, config?: any) => api.post<T>(url, data, config)
export const put = <T>(url: string, data?: unknown, config?: any) => api.put<T>(url, data, config)
export const patch = <T>(url: string, data?: unknown, config?: any) => api.patch<T>(url, data, config)
export const del = <T>(url: string, config?: any) => api.delete<T>(url, config)

export { api }
export default api
