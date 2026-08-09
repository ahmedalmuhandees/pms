import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreatePaymentDto,
  Payment,
  PagedResult,
  PaginationParams,
  UpdatePaymentDto,
} from '@/types'

export interface PaymentParams extends PaginationParams {
  ComplexId?: string
  ContractId?: string
  CustomerId?: string
  InstallmentId?: string
  PaymentMethod?: string | number
  DateFrom?: string
  DateTo?: string
}

export async function getPayments(params?: PaymentParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Payment>>>('/api/Payments', { params })
  return unwrap(res)
}

export async function getPayment(id: string) {
  const res = await apiClient.get<ApiResponse<Payment>>(`/api/Payments/${id}`)
  return unwrap(res)
}

export async function createPayment(payload: CreatePaymentDto) {
  const res = await apiClient.post<ApiResponse<Payment>>('/api/Payments', payload)
  return unwrap(res)
}

export async function updatePayment(id: string, payload: UpdatePaymentDto) {
  const res = await apiClient.put<ApiResponse<Payment>>(`/api/Payments/${id}`, payload)
  return unwrap(res)
}

export async function deletePayment(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Payments/${id}`)
  return unwrap(res)
}
