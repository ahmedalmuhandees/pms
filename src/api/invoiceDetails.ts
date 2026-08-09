import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateInvoiceDetailDto,
  InvoiceDetail,
  PagedResult,
  PaginationParams,
  UpdateInvoiceDetailDto,
} from '@/types'

export interface InvoiceDetailParams extends PaginationParams {
  InvoiceId?: string
}

export async function getInvoiceDetails(params?: InvoiceDetailParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<InvoiceDetail>>>('/api/InvoiceDetails', { params })
  return unwrap(res)
}

export async function getInvoiceDetail(id: string) {
  const res = await apiClient.get<ApiResponse<InvoiceDetail>>(`/api/InvoiceDetails/${id}`)
  return unwrap(res)
}

export async function createInvoiceDetail(payload: CreateInvoiceDetailDto) {
  const res = await apiClient.post<ApiResponse<InvoiceDetail>>('/api/InvoiceDetails', payload)
  return unwrap(res)
}

export async function updateInvoiceDetail(id: string, payload: UpdateInvoiceDetailDto) {
  const res = await apiClient.put<ApiResponse<InvoiceDetail>>(`/api/InvoiceDetails/${id}`, payload)
  return unwrap(res)
}

export async function deleteInvoiceDetail(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/InvoiceDetails/${id}`)
  return unwrap(res)
}
