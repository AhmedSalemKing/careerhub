import axios from 'axios'

// ✅ FIXED: دالة تحديد baseURL محسنة تماماً
const getBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL

  if (envUrl && envUrl.trim()) {
    // Use envUrl as-is — it already includes /api (e.g. https://api.host.com/api)
    return envUrl.replace(/\/+$/, '')
  }

  // ✅ FIXED: في المتصفح، استخدم localhost:3001 وليس /api
  // لأن /api سيطلب من Next.js نفسه وليس من backend منفصل!
  // (Browser and server share the same fallback.)
  return 'http://localhost:3001/api'
}

export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 60000, // 60s for cold starts
})

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getCookie('access_token') || localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token')
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
    const config = error.config

    // Retry on network errors or server sleeping (502/503)
    if (config) {
      if (!config._retryCount) config._retryCount = 0
      const shouldRetry =
        config._retryCount < 2 &&
        (!error.response ||
          error.response.status === 503 ||
          error.response.status === 502 ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ERR_NETWORK')

      if (shouldRetry) {
        config._retryCount++
        const delay = config._retryCount * 2000 // 2s, 4s
        await new Promise((r) => setTimeout(r, delay))
        return api(config)
      }
    }

    const status = error.response?.status
    const data = error.response?.data
    const message = data?.message || ''
    const code = data?.code || message
    
    console.error('[API] ❌ Error:', {
      url: error.config?.url,
      status,
      message,
      code,
    })

    // Handle auth errors - force logout and redirect
    if (status === 401) {
      const isAuthPath = window.location.pathname.includes('/login')
      const isRegisterPath = window.location.pathname.includes('/register')
      
      // Clear auth data
      const clearAuth = () => {
        localStorage.removeItem('careerhub_token')
        localStorage.removeItem('careerhub_user')
        localStorage.removeItem('deveway_token')
        localStorage.removeItem('deveway_user')
        document.cookie = 'careerhub_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict'
      }

      // Check specific error codes
      if (code === 'ACCOUNT_BANNED' || message.includes('محظور')) {
        clearAuth()
        window.location.href = '/ar/banned'
        return Promise.reject(error)
      }

      if (code === 'ACCOUNT_REJECTED' || message.includes('رفض')) {
        clearAuth()
        window.location.href = '/ar/rejected'
        return Promise.reject(error)
      }

      if (code === 'ACCOUNT_DELETED' || message.includes('no longer exists') || message.includes('not found')) {
        clearAuth()
        window.location.href = '/ar/login?error=account_deleted'
        return Promise.reject(error)
      }

      if (code === 'ACCOUNT_INACTIVE') {
        clearAuth()
        window.location.href = '/ar/login?error=account_inactive'
        return Promise.reject(error)
      }

      // Regular 401 - invalid token, redirect to login if not already there
      clearAuth()
      if (!isAuthPath && !isRegisterPath) {
        window.location.href = '/ar/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
export const get = (url: string, config?: any) => api.get(url, config)
export const post = (url: string, data?: any, config?: any) => api.post(url, data, config)
export const put = (url: string, data?: any) => api.put(url, data)
export const patch = (url: string, data?: any) => api.patch(url, data)
export const del = (url: string) => api.delete(url)