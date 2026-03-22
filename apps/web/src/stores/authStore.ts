import { create } from 'zustand'
import { getToken, getUser, logout as hardLogout, removeToken, removeUser, setToken, setUser } from '../lib/auth'

export type AuthUser = {
  id: string
  email: string
  role?: string
  profile?: { firstName?: string; lastName?: string; avatar?: string; language?: string }
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setToken: (token: string | null) => void
  hydrate: () => void
  logout: () => void
  updateUser: (partial: Partial<AuthUser>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
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
  hydrate: () => {
    const token = getToken()
    const user = getUser<AuthUser>()
    set({ token, user, isLoading: false })
  },
  logout: () => {
    hardLogout()
    set({ user: null, token: null })
  },
  updateUser: (partial) => {
    const current = get().user
    if (!current) return
    const next = { ...current, ...partial }
    set({ user: next })
    setUser(next)
  },
}))

