import axios from 'axios'

// ✅ FIXED: دالة تحديد baseURL محسنة تماماً
const getBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  
  // ✅ Debug: سجل القيمة المستخدمة
  if (typeof window !== 'undefined') {
    console.log('[API] Environment NEXT_PUBLIC_API_URL:', envUrl || '(not set)')
  }
  
  if (envUrl && envUrl.trim()) {
    // Use envUrl as-is — it already includes /api (e.g. https://api.host.com/api)
    const cleaned = envUrl.replace(/\/+$/, '')
    console.log('[API] Using env URL:', cleaned)
    return cleaned
  }
  
  // ✅ FIXED: في المتصفح، استخدم localhost:3001 وليس /api
  // لأن /api سيطلب من Next.js نفسه وليس من backend منفصل!
  if (typeof window !== 'undefined') {
    const fallback = 'http://localhost:3001/api'
    console.log('[API] Using browser fallback:', fallback)
    return fallback
  }
  
  // Server-side fallback
  const serverFallback = 'http://localhost:3001/api'
  console.log('[API] Using server fallback:', serverFallback)
  return serverFallback
}

export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 30000,
})

// ✅ Log baseURL عند الإنشاء (لمرة واحدة)
if (typeof window !== 'undefined') {
  console.log('[API] ✅ Initialized with baseURL:', api.defaults.baseURL)
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token')
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  
  // ✅ Debug: سجل كل طلب
  const fullUrl = config.url?.startsWith('http') ? config.url : `${config.baseURL}/${config.url?.replace(/^\//, '')}`
  console.log(`[API] ➡️ ${config.method?.toUpperCase()} ${fullUrl}`)
  
  return config
})

api.interceptors.response.use(
  (response) => {
    // ✅ Debug: سجل كل استجابة ناجحة
    console.log(`[API] ✅ ${response.config.url} → ${response.status}`)
    return response
  },
  (error) => {
    // ✅ Debug: سجل كل خطأ بالتفصيل
    console.error(`[API] ❌ Error:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    })
    
    console.error('[API]', error.config?.url, error.response?.status, error.response?.data?.message)
    return Promise.reject(error)
  }
)

export default api
export const get = (url: string, config?: any) => api.get(url, config)
export const post = (url: string, data?: any, config?: any) => api.post(url, data, config)
export const put = (url: string, data?: any) => api.put(url, data)
export const patch = (url: string, data?: any) => api.patch(url, data)
export const del = (url: string) => api.delete(url)