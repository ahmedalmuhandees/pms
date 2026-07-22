import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  Complex,
  CreateComplexDto,
  PagedResult,
  PaginationParams,
  UpdateComplexDto,
} from '@/types'

export async function getComplexes(params?: PaginationParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Complex>>>('/api/Complexes', { params })
  return unwrap(res)
}

export async function getComplex(id: string) {
  const res = await apiClient.get<ApiResponse<Complex>>(`/api/Complexes/${id}`)
  return unwrap(res)
}

export async function createComplex(payload: CreateComplexDto) {
  const res = await apiClient.post<ApiResponse<Complex>>('/api/Complexes', payload)
  return unwrap(res)
}

export async function updateComplex(id: string, payload: UpdateComplexDto) {
  const res = await apiClient.put<ApiResponse<Complex>>(`/api/Complexes/${id}`, payload)
  return unwrap(res)
}

export async function deleteComplex(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Complexes/${id}`)
  return unwrap(res)
}
