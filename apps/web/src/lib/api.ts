import axios from 'axios'

const getBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  if (envUrl && envUrl.trim()) {
    // Use envUrl as-is — it already includes /api (e.g. https://api.host.com/api)
    return envUrl.replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined') return '/api'
  return 'http://localhost:3001/api'
}

export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token')
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.config?.url, error.response?.status, error.response?.data?.message)
    return Promise.reject(error)
  }
)

export default api
export const get = (url: string, config?: any) => api.get(url, config)
export const post = (url: string, data?: any, config?: any) => api.post(url, data, config)
export const put = (url: string, data?: any) => api.put(url, data)
export const patch = (url: string, data?: any) => api.patch(url, data)
export const del = (url: string) => api.delete(url)
