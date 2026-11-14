import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  ResidentLoginRequest,
  UserInfo,
} from '@/types'

export async function login(payload: LoginRequest) {
  const res = await apiClient.post<ApiResponse<LoginResponse>>('/api/Auth/login', payload)
  return unwrap(res)
}

export async function residentLogin(payload: ResidentLoginRequest) {
  const res = await apiClient.post<ApiResponse<LoginResponse>>('/api/Auth/resident-login', payload)
  return unwrap(res)
}

export async function getMe() {
  const res = await apiClient.get<ApiResponse<UserInfo>>('/api/Auth/me')
  return unwrap(res)
}

export interface ComplexPortalInfo {
  slug: string
  complexId: string
  name?: string | null
  nameAr?: string | null
  primaryColor?: string | null
  logoUrl?: string | null
  loginBackgroundUrl?: string | null
}

export async function getPortal(slug: string) {
  const res = await apiClient.get<ApiResponse<ComplexPortalInfo>>(`/api/Auth/portal/${encodeURIComponent(slug)}`)
  return unwrap(res)
}
