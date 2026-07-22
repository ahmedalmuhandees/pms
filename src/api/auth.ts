import { apiClient, unwrap } from './client'
import type { ApiResponse, LoginRequest, LoginResponse } from '@/types'

export async function login(payload: LoginRequest) {
  const res = await apiClient.post<ApiResponse<LoginResponse>>('/api/Auth/login', payload)
  return unwrap(res)
}
