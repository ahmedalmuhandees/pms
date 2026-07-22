import { apiClient, unwrap } from './client'
import type { ApiResponse, PagedResult, PaginationParams, UnitImage } from '@/types'

export async function getUnitImages(unitId: string, params?: PaginationParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<UnitImage>>>(
    `/api/units/${unitId}/images`,
    { params },
  )
  return unwrap(res)
}

export async function uploadUnitImage(unitId: string, file: File, sortOrder = 0) {
  const form = new FormData()
  form.append('file', file)
  form.append('SortOrder', String(sortOrder))
  const res = await apiClient.post<ApiResponse<UnitImage>>(
    `/api/units/${unitId}/images`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return unwrap(res)
}

export async function updateUnitImage(unitId: string, id: string, sortOrder: number) {
  const res = await apiClient.put<ApiResponse<UnitImage>>(
    `/api/units/${unitId}/images/${id}`,
    { sortOrder },
  )
  return unwrap(res)
}

export async function deleteUnitImage(unitId: string, id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(
    `/api/units/${unitId}/images/${id}`,
  )
  return unwrap(res)
}
