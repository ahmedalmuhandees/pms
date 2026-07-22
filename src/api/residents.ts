import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateResidentDto,
  PagedResult,
  PaginationParams,
  Resident,
  UpdateResidentDto,
} from '@/types'

export interface ResidentParams extends PaginationParams {
  ComplexId?: string
  CustomerId?: string
  UnitId?: string
  Status?: string | number
}

export async function getResidents(params?: ResidentParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Resident>>>('/api/Residents', { params })
  return unwrap(res)
}

export async function getResident(id: string) {
  const res = await apiClient.get<ApiResponse<Resident>>(`/api/Residents/${id}`)
  return unwrap(res)
}

export async function createResident(payload: CreateResidentDto) {
  const res = await apiClient.post<ApiResponse<Resident>>('/api/Residents', payload)
  return unwrap(res)
}

export async function updateResident(id: string, payload: UpdateResidentDto) {
  const res = await apiClient.put<ApiResponse<Resident>>(`/api/Residents/${id}`, payload)
  return unwrap(res)
}

export async function deleteResident(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Residents/${id}`)
  return unwrap(res)
}
