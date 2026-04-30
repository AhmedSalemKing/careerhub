export const PRODUCTION_API_URL = 'https://deve-way.onrender.com/api'
export const PRODUCTION_MAIN_URL = 'https://deveway-teal.vercel.app'
export const PRODUCTION_LEARN_URL = typeof window !== 'undefined' ? window.location.origin : 'https://deveway-teal.vercel.app'

export const MAIN_URL =
  (() => { const u = process.env.NEXT_PUBLIC_MAIN_URL; return (u && u.trim()) ? u.replace(/\/+$/, '') : PRODUCTION_MAIN_URL })()

export const API_URL =
  (() => { const u = process.env.NEXT_PUBLIC_API_URL; const v = (u && u.trim()) ? u : PRODUCTION_API_URL; return v.replace(/\/+$/, '') })()

export const LEARN_URL =
  (() => { const u = process.env.NEXT_PUBLIC_LEARN_URL; return (u && u.trim()) ? u.replace(/\/+$/, '') : PRODUCTION_LEARN_URL })()

export const TRAINING_URL = LEARN_URL
