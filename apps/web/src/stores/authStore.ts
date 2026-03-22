import { create } from 'zustand'

export type AuthUser = {
  id: string
  email: string
  role: 'USER' | 'COACH' | 'ADMIN'
  profile?: { firstName?: string; lastName?: string; avatar?: string | null; language?: string }
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  setUser: (user: AuthUser | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null }),
}))
