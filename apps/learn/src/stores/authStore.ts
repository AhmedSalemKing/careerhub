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
    // Same user (by id) → nothing to do. Prevents redundant notifications when
    // several auth/me callers resolve with the same user object.
    if (get().user?.id && get().user?.id === user?.id) return
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
    // Idempotent: skip the state write when nothing actually changed. Without
    // this guard every hydrate() call produced a brand-new state object, which
    // notified all store subscribers and re-rendered the whole layout subtree
    // (Navbar + Footer) on each call — Navbar alone calls hydrate() 4x on mount.
    // getUser() deserializes fresh from localStorage each time, so compare by
    // value (id) rather than reference.
    const current = get()
    const sameUser =
      current.user === user ||
      (current.user != null && user != null && current.user.id === user.id)
    if (current.token === token && sameUser && current.isLoading === false) {
      return
    }
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
