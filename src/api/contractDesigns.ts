import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  ContractDesign,
  CreateContractDesignDto,
  PagedResult,
  PaginationParams,
  UpdateContractDesignDto,
} from '@/types'

export interface ContractDesignParams extends PaginationParams {
  ComplexId?: string
}

export async function getContractDesigns(params?: ContractDesignParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<ContractDesign>>>('/api/ContractDesigns', {
    params,
  })
  return unwrap(res)
}

export async function getContractDesign(id: string) {
  const res = await apiClient.get<ApiResponse<ContractDesign>>(`/api/ContractDesigns/${id}`)
  return unwrap(res)
}

export async function createContractDesign(payload: CreateContractDesignDto) {
  const res = await apiClient.post<ApiResponse<ContractDesign>>('/api/ContractDesigns', payload)
  return unwrap(res)
}

export async function updateContractDesign(id: string, payload: UpdateContractDesignDto) {
  const res = await apiClient.put<ApiResponse<ContractDesign>>(`/api/ContractDesigns/${id}`, payload)
  return unwrap(res)
}

export async function deleteContractDesign(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/ContractDesigns/${id}`)
  return unwrap(res)
}

export async function uploadContractDesignLogo(id: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post<ApiResponse<ContractDesign>>(
    `/api/ContractDesigns/${id}/logo`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return unwrap(res)
}

export async function uploadContractDesignTemplate(id: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post<ApiResponse<ContractDesign>>(
    `/api/ContractDesigns/${id}/template`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return unwrap(res)
}

/** kind: corner | middle | exterior */
export async function uploadContractDesignAsset(
  id: string,
  kind: 'corner' | 'middle' | 'exterior',
  file: File,
) {
  const form = new FormData()
  form.append('file', file)
  const res = await apiClient.post<ApiResponse<ContractDesign>>(
    `/api/ContractDesigns/${id}/assets/${kind}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return unwrap(res)
}
