import axios from 'axios'
import type { ApiResponse } from '@/types'
import { translateMessage } from '@/utils/enums'

const TOKEN_KEY = 'pms_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// In development, call same-origin `/api` so Vite proxy avoids CORS.
// In production, use the configured API base URL.
const baseURL = import.meta.env.DEV
  ? ''
  : import.meta.env.VITE_API_BASE_URL || 'https://pmsaas-api.execute-iq.com'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setStoredToken(null)
      localStorage.removeItem('pms_user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export function unwrap<T>(response: { data: ApiResponse<T> }): T {
  const body = response.data
  if (!body.success) {
    throw new Error(translateMessage(body.message || 'حدث خطأ في الطلب'))
  }
  return body.data
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message
    if (typeof msg === 'string' && msg) return translateMessage(msg)
    if (error.message) return translateMessage(error.message)
  }
  if (error instanceof Error) return translateMessage(error.message)
  return 'حدث خطأ غير متوقع'
}
