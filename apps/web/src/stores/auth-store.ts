import { create } from 'zustand'
import type { User } from '../lib/types'

type AuthState = {
  user?: User
  accessToken?: string
  refreshToken?: string
  hydrated: boolean
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  setTokens: (accessToken: string, refreshToken: string) => void
  hydrate: () => void
}

const key = 'hospital-auth'

export const useAuthStore = create<AuthState>((set, get) => ({
  hydrated: false,
  login: (user, accessToken, refreshToken) => {
    localStorage.setItem(key, JSON.stringify({ user, accessToken, refreshToken }))
    set({ user, accessToken, refreshToken })
  },
  logout: () => {
    localStorage.removeItem(key)
    set({ user: undefined, accessToken: undefined, refreshToken: undefined })
  },
  setTokens: (accessToken, refreshToken) => {
    const next = { user: get().user, accessToken, refreshToken }
    localStorage.setItem(key, JSON.stringify(next))
    set({ accessToken, refreshToken })
  },
  hydrate: () => {
    const raw = localStorage.getItem(key)
    if (raw) set({ ...JSON.parse(raw), hydrated: true })
    else set({ hydrated: true })
  }
}))
