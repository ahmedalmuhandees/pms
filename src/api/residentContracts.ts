import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  KeyHandoverDto,
  OccupancyDto,
  PagedResult,
  PaginationParams,
  ResidentBuildingStats,
  ResidentContractUnit,
} from '@/types'

export interface ResidentContractParams extends PaginationParams {
  ComplexId?: string
  BuildingId?: string
  BlockId?: string
  Phase?: string | number
}

export async function getResidentContractUnits(params?: ResidentContractParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<ResidentContractUnit>>>('/api/ResidentContracts', {
    params,
  })
  return unwrap(res)
}

export async function getKeyHandover(unitId: string) {
  const res = await apiClient.get<ApiResponse<KeyHandoverDto>>(`/api/ResidentContracts/${unitId}/handover`)
  return unwrap(res)
}

export async function upsertKeyHandover(unitId: string, payload: KeyHandoverDto) {
  const res = await apiClient.post<ApiResponse<KeyHandoverDto>>(
    `/api/ResidentContracts/${unitId}/handover`,
    payload,
  )
  return unwrap(res)
}

export async function uploadHandoverPhoto(unitId: string, kind: 'electricity' | 'water' | 'gas', file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post<ApiResponse<{ path: string }>>(
    `/api/ResidentContracts/${unitId}/handover/photos/${kind}`,
    form,
  )
  return unwrap(res)
}

export async function getOccupancy(unitId: string) {
  const res = await apiClient.get<ApiResponse<OccupancyDto>>(`/api/ResidentContracts/${unitId}/occupancy`)
  return unwrap(res)
}

export async function upsertOccupancy(unitId: string, payload: OccupancyDto) {
  const res = await apiClient.post<ApiResponse<OccupancyDto>>(
    `/api/ResidentContracts/${unitId}/occupancy`,
    payload,
  )
  return unwrap(res)
}

export async function uploadOccupancyIdentity(unitId: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post<ApiResponse<{ path: string }>>(
    `/api/ResidentContracts/${unitId}/occupancy/identity`,
    form,
  )
  return unwrap(res)
}

export async function deleteResidentContract(unitId: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/ResidentContracts/${unitId}`)
  return unwrap(res)
}

export async function downloadHandoverPdf(unitId: string) {
  const res = await apiClient.get(`/api/ResidentContracts/${unitId}/handover/pdf`, {
    responseType: 'blob',
  })
  return res.data as Blob
}

export async function downloadOccupancyPdf(unitId: string) {
  const res = await apiClient.get(`/api/ResidentContracts/${unitId}/occupancy/pdf`, {
    responseType: 'blob',
  })
  return res.data as Blob
}

export async function getResidentBuildingStats(complexId?: string | null) {
  const res = await apiClient.get<ApiResponse<ResidentBuildingStats[]>>('/api/ResidentBuildings/stats', {
    params: complexId ? { complexId } : undefined,
  })
  return unwrap(res)
}
