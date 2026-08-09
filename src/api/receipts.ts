import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateReceiptDto,
  Receipt,
  PagedResult,
  PaginationParams,
  UpdateReceiptDto,
} from '@/types'

export interface ReceiptParams extends PaginationParams {
  PaymentId?: string
  DateFrom?: string
  DateTo?: string
}

export async function getReceipts(params?: ReceiptParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Receipt>>>('/api/Receipts', { params })
  return unwrap(res)
}

export async function getReceipt(id: string) {
  const res = await apiClient.get<ApiResponse<Receipt>>(`/api/Receipts/${id}`)
  return unwrap(res)
}

export async function createReceipt(payload: CreateReceiptDto) {
  const res = await apiClient.post<ApiResponse<Receipt>>('/api/Receipts', payload)
  return unwrap(res)
}

export async function updateReceipt(id: string, payload: UpdateReceiptDto) {
  const res = await apiClient.put<ApiResponse<Receipt>>(`/api/Receipts/${id}`, payload)
  return unwrap(res)
}

export async function deleteReceipt(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Receipts/${id}`)
  return unwrap(res)
}
