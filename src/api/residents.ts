import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateResidentDto,
  PagedResult,
  PaginationParams,
  Resident,
  ResidentProfile,
  ResidentStats,
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

export async function getResidentStats(complexId?: string | null) {
  const res = await apiClient.get<ApiResponse<ResidentStats>>('/api/Residents/stats', {
    params: complexId ? { complexId } : undefined,
  })
  return unwrap(res)
}

export interface ResidentExportRow {
  rowNumber: number
  buildingCode: string | null
  unitNumber: string | null
  primaryResidentName: string
  occupancyTypeLabel: string
  nationalIdOrPassport: string | null
  phone: string | null
  email: string | null
  totalOccupants: number
  maleCount: number
  femaleCount: number
  occupancyDate: string | null
  emergencyContactName: string | null
  emergencyPhone: string | null
  unitStatusLabel: string
}

export async function getResidentsExport(params?: ResidentParams) {
  const res = await apiClient.get<ApiResponse<ResidentExportRow[]>>('/api/Residents/export', {
    params,
  })
  return unwrap(res)
}

export async function getResident(id: string) {
  const res = await apiClient.get<ApiResponse<Resident>>(`/api/Residents/${id}`)
  return unwrap(res)
}

export async function getResidentProfile(id: string) {
  const res = await apiClient.get<ApiResponse<ResidentProfile>>(`/api/Residents/${id}/profile`)
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

export async function revealResidentLoginCode(id: string, password: string) {
  const res = await apiClient.post<ApiResponse<{ code: string }>>(
    `/api/Residents/${id}/reveal-login-code`,
    { password: password.trim() },
  )
  return unwrap(res)
}

export async function regenerateResidentLoginCode(id: string, password: string) {
  const res = await apiClient.post<ApiResponse<{ code: string }>>(
    `/api/Residents/${id}/regenerate-login-code`,
    { password: password.trim() },
  )
  return unwrap(res)
}
