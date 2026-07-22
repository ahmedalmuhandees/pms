import { apiClient, unwrap } from './client'
import type { ApiResponse, PagedResult, PaginationParams, UnitDocument } from '@/types'

export async function getUnitDocuments(unitId: string, params?: PaginationParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<UnitDocument>>>(
    `/api/units/${unitId}/documents`,
    { params },
  )
  return unwrap(res)
}

export async function uploadUnitDocument(unitId: string, file: File, title: string) {
  const form = new FormData()
  form.append('file', file)
  form.append('Title', title)
  const res = await apiClient.post<ApiResponse<UnitDocument>>(
    `/api/units/${unitId}/documents`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return unwrap(res)
}

export async function updateUnitDocument(unitId: string, id: string, title: string) {
  const res = await apiClient.put<ApiResponse<UnitDocument>>(
    `/api/units/${unitId}/documents/${id}`,
    { title },
  )
  return unwrap(res)
}

export async function deleteUnitDocument(unitId: string, id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(
    `/api/units/${unitId}/documents/${id}`,
  )
  return unwrap(res)
}
