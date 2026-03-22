import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Add token to EVERY request 
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('careerhub_token')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 - clear token and redirect 
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('careerhub_token')
        localStorage.removeItem('careerhub_user')
        document.cookie = 'careerhub_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        const seg = window.location.pathname.split('/')[1]
        const locale = seg === 'en' ? 'en' : 'ar'
        // Only redirect if not already on login page 
        if (!window.location.pathname.includes('/login')) {
          window.location.href = `/${locale}/login`
        }
      }
    }
    return Promise.reject(error)
  }
)

export const get = <T>(url: string, config?: any) => api.get<T>(url, config)
export const post = <T>(url: string, data?: any, config?: any) => api.post<T>(url, data, config)
export const put = <T>(url: string, data?: any, config?: any) => api.put<T>(url, data, config)
export const patch = <T>(url: string, data?: any, config?: any) => api.patch<T>(url, data, config)
export const del = <T>(url: string, config?: any) => api.delete<T>(url, config)

export default api
