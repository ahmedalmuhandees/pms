import axios from 'axios'
import type { ApiResponse } from '@/types'
import { translateMessage } from '@/utils/enums'

const TOKEN_KEY = 'pms_token'
const AUTH_KIND_KEY = 'pms_auth_kind'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getStoredAuthKind(): 'staff' | 'resident' {
  const kind = localStorage.getItem(AUTH_KIND_KEY)
  return kind === 'resident' ? 'resident' : 'staff'
}

export function setStoredAuthKind(kind: 'staff' | 'resident' | null) {
  if (kind) localStorage.setItem(AUTH_KIND_KEY, kind)
  else localStorage.removeItem(AUTH_KIND_KEY)
}

// In development, call same-origin `/api` so Vite proxy avoids CORS.
// In production, use the configured API base URL.
const baseURL = import.meta.env.DEV
  ? ''
  : import.meta.env.VITE_API_BASE_URL || 'https://apicomplex.solidcode-iq.com'

export const apiClient = axios.create({
  baseURL,
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Let the browser set multipart boundary for FormData uploads.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Content-Type', undefined as unknown as string)
    } else if (config.headers) {
      delete (config.headers as Record<string, unknown>)['Content-Type']
      delete (config.headers as Record<string, unknown>)['content-type']
    }
  } else if (!config.headers?.['Content-Type'] && !config.headers?.['content-type']) {
    config.headers = config.headers ?? {}
    config.headers['Content-Type'] = 'application/json'
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = String(error.config?.url || '')
      // أخطاء إظهار/تجديد رمز الساكن تُعالَج في الواجهة دون إسقاط الجلسة
      if (
        url.includes('/reveal-login-code') ||
        url.includes('/regenerate-login-code') ||
        url.includes('/Auth/login') ||
        url.includes('/Auth/resident-login')
      ) {
        return Promise.reject(error)
      }
      const kind = getStoredAuthKind()
      setStoredToken(null)
      setStoredAuthKind(null)
      localStorage.removeItem('pms_user')
      const target = kind === 'resident' ? '/resident-login' : '/login'
      if (window.location.pathname !== target) {
        window.location.href = target
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
