import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  Building,
  CreateBuildingDto,
  PagedResult,
  PaginationParams,
  UpdateBuildingDto,
} from '@/types'

export interface BuildingParams extends PaginationParams {
  BlockId?: string
}

export async function getBuildings(params?: BuildingParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Building>>>('/api/Buildings', { params })
  return unwrap(res)
}

export async function getBuilding(id: string) {
  const res = await apiClient.get<ApiResponse<Building>>(`/api/Buildings/${id}`)
  return unwrap(res)
}

export async function createBuilding(payload: CreateBuildingDto) {
  const res = await apiClient.post<ApiResponse<Building>>('/api/Buildings', payload)
  return unwrap(res)
}

export async function updateBuilding(id: string, payload: UpdateBuildingDto) {
  const res = await apiClient.put<ApiResponse<Building>>(`/api/Buildings/${id}`, payload)
  return unwrap(res)
}

export async function deleteBuilding(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Buildings/${id}`)
  return unwrap(res)
}
