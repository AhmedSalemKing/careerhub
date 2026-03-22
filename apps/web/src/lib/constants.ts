// ⚠️ LEGAL: Training on separate domain for Saudi e-learning licensing
// Saudi Arabia requires independent license from National eLearning Center
// careerhub.com can operate freely; learn.careerhub.com licensed separately
export const LMS_URL =
  process.env.NEXT_PUBLIC_LMS_URL || 'http://localhost:3002'

export const MAIN_URL =
  process.env.NEXT_PUBLIC_MAIN_URL || 'https://careerhub.com'

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || API_URL

