import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateUserDto,
  PagedResult,
  PaginationParams,
  UpdateUserDto,
  User,
} from '@/types'

export async function getUsers(params?: PaginationParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<User>>>('/api/Users', { params })
  return unwrap(res)
}

export async function getUser(id: string) {
  const res = await apiClient.get<ApiResponse<User>>(`/api/Users/${id}`)
  return unwrap(res)
}

export async function createUser(payload: CreateUserDto) {
  const res = await apiClient.post<ApiResponse<User>>('/api/Users', payload)
  return unwrap(res)
}

export async function updateUser(id: string, payload: UpdateUserDto) {
  const res = await apiClient.put<ApiResponse<User>>(`/api/Users/${id}`, payload)
  return unwrap(res)
}

export async function deleteUser(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Users/${id}`)
  return unwrap(res)
}
