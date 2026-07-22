import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateFloorDto,
  Floor,
  PagedResult,
  PaginationParams,
  UpdateFloorDto,
} from '@/types'

export interface FloorParams extends PaginationParams {
  BuildingId?: string
}

export async function getFloors(params?: FloorParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Floor>>>('/api/Floors', { params })
  return unwrap(res)
}

export async function getFloor(id: string) {
  const res = await apiClient.get<ApiResponse<Floor>>(`/api/Floors/${id}`)
  return unwrap(res)
}

export async function createFloor(payload: CreateFloorDto) {
  const res = await apiClient.post<ApiResponse<Floor>>('/api/Floors', payload)
  return unwrap(res)
}

export async function updateFloor(id: string, payload: UpdateFloorDto) {
  const res = await apiClient.put<ApiResponse<Floor>>(`/api/Floors/${id}`, payload)
  return unwrap(res)
}

export async function deleteFloor(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Floors/${id}`)
  return unwrap(res)
}
