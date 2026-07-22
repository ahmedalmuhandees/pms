import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateVehicleDto,
  PagedResult,
  PaginationParams,
  UpdateVehicleDto,
  Vehicle,
} from '@/types'

export interface VehicleParams extends PaginationParams {
  ResidentId?: string
}

export async function getVehicles(params?: VehicleParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Vehicle>>>('/api/Vehicles', { params })
  return unwrap(res)
}

export async function getVehicle(id: string) {
  const res = await apiClient.get<ApiResponse<Vehicle>>(`/api/Vehicles/${id}`)
  return unwrap(res)
}

export async function createVehicle(payload: CreateVehicleDto) {
  const res = await apiClient.post<ApiResponse<Vehicle>>('/api/Vehicles', payload)
  return unwrap(res)
}

export async function updateVehicle(id: string, payload: UpdateVehicleDto) {
  const res = await apiClient.put<ApiResponse<Vehicle>>(`/api/Vehicles/${id}`, payload)
  return unwrap(res)
}

export async function deleteVehicle(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Vehicles/${id}`)
  return unwrap(res)
}
