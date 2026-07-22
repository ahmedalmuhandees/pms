import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateUnitDto,
  PagedResult,
  PaginationParams,
  Unit,
  UpdateUnitDto,
} from '@/types'

export interface UnitParams extends PaginationParams {
  ComplexId?: string
  FloorId?: string
  Status?: string
}

export async function getUnits(params?: UnitParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Unit>>>('/api/Units', { params })
  return unwrap(res)
}

export async function getUnit(id: string) {
  const res = await apiClient.get<ApiResponse<Unit>>(`/api/Units/${id}`)
  return unwrap(res)
}

export async function createUnit(payload: CreateUnitDto) {
  const res = await apiClient.post<ApiResponse<Unit>>('/api/Units', payload)
  return unwrap(res)
}

export async function updateUnit(id: string, payload: UpdateUnitDto) {
  const res = await apiClient.put<ApiResponse<Unit>>(`/api/Units/${id}`, payload)
  return unwrap(res)
}

export async function deleteUnit(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Units/${id}`)
  return unwrap(res)
}
