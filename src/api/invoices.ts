import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateInvoiceDto,
  Invoice,
  PagedResult,
  PaginationParams,
  UpdateInvoiceDto,
} from '@/types'

export interface InvoiceParams extends PaginationParams {
  ComplexId?: string
  CustomerId?: string
  ContractId?: string
  InvoiceType?: string | number
  Status?: string | number
  DateFrom?: string
  DateTo?: string
}

export async function getInvoices(params?: InvoiceParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Invoice>>>('/api/Invoices', { params })
  return unwrap(res)
}

export async function getInvoice(id: string) {
  const res = await apiClient.get<ApiResponse<Invoice>>(`/api/Invoices/${id}`)
  return unwrap(res)
}

export async function createInvoice(payload: CreateInvoiceDto) {
  const res = await apiClient.post<ApiResponse<Invoice>>('/api/Invoices', payload)
  return unwrap(res)
}

export async function updateInvoice(id: string, payload: UpdateInvoiceDto) {
  const res = await apiClient.put<ApiResponse<Invoice>>(`/api/Invoices/${id}`, payload)
  return unwrap(res)
}

export async function deleteInvoice(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Invoices/${id}`)
  return unwrap(res)
}
