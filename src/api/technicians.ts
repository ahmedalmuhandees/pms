import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateTechnicianDto,
  PagedResult,
  PaginationParams,
  Technician,
  UpdateTechnicianDto,
} from '@/types'

export interface TechnicianParams extends PaginationParams {
  ComplexId?: string
  Department?: string | number
}

export async function getTechnicians(params?: TechnicianParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Technician>>>('/api/Technicians', { params })
  return unwrap(res)
}

export async function getTechnician(id: string) {
  const res = await apiClient.get<ApiResponse<Technician>>(`/api/Technicians/${id}`)
  return unwrap(res)
}

export async function createTechnician(payload: CreateTechnicianDto) {
  const res = await apiClient.post<ApiResponse<Technician>>('/api/Technicians', payload)
  return unwrap(res)
}

export async function updateTechnician(id: string, payload: UpdateTechnicianDto) {
  const res = await apiClient.put<ApiResponse<Technician>>(`/api/Technicians/${id}`, payload)
  return unwrap(res)
}

export async function deleteTechnician(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Technicians/${id}`)
  return unwrap(res)
}
