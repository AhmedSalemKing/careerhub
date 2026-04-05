import { create } from 'zustand'
import { getToken, getUser, logout as hardLogout, removeToken, removeUser, setToken, setUser } from '../lib/auth'

export type AuthUser = {
  id: string
  email: string
  role?: string
  accountType?: string // STUDENT | INSTRUCTOR | CONSULTANT | ADMIN
  status?: string
  profile?: { firstName?: string; lastName?: string; avatar?: string; language?: string }
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setToken: (token: string | null) => void
  setRefreshToken: (token: string | null) => void
  hydrate: () => void
  logout: () => void
  updateUser: (partial: Partial<AuthUser>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  setUser: (user) => {
    set({ user })
    if (user) setUser(user)
    else removeUser()
  },
  setToken: (token) => {
    set({ token })
    if (token) setToken(token)
    else removeToken()
  },
  setRefreshToken: (token) => {
    set({ refreshToken: token })
    if (token) {
      try { localStorage.setItem('deveway_refresh', token) } catch {}
    } else {
      try { localStorage.removeItem('deveway_refresh') } catch {}
    }
  },
  hydrate: () => {
    const token = getToken()
    const user = getUser<AuthUser>()
    let refreshToken: string | null = null
    try { refreshToken = localStorage.getItem('deveway_refresh') } catch {}
    set({ token, user, refreshToken, isLoading: false })
  },
  logout: () => {
    hardLogout()
    try { localStorage.removeItem('deveway_refresh') } catch {}
    set({ user: null, token: null, refreshToken: null })
  },
  updateUser: (partial) => {
    const current = get().user
    if (!current) return
    const next = { ...current, ...partial }
    set({ user: next })
    setUser(next)
  },
}))