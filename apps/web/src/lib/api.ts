import axios from 'axios'
import { useAuthStore } from '../stores/auth-store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api'
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const store = useAuthStore.getState()
    if (error.response?.status === 401 && store.refreshToken && !original._retry) {
      original._retry = true
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL ?? '/api'}/auth/refresh`, { refreshToken: store.refreshToken })
      store.setTokens(data.accessToken, data.refreshToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    }
    return Promise.reject(error)
  }
)

export const fetcher = async <T>(url: string) => {
  const { data } = await api.get<T>(url)
  return data
}
