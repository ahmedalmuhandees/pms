import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateInstallmentDto,
  Installment,
  PagedResult,
  PaginationParams,
  UpdateInstallmentDto,
} from '@/types'

export interface InstallmentParams extends PaginationParams {
  ComplexId?: string
  PlanId?: string
  Status?: string | number
  DueFrom?: string
  DueTo?: string
}

export async function getInstallments(params?: InstallmentParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Installment>>>('/api/Installments', { params })
  return unwrap(res)
}

export async function getInstallment(id: string) {
  const res = await apiClient.get<ApiResponse<Installment>>(`/api/Installments/${id}`)
  return unwrap(res)
}

export async function createInstallment(payload: CreateInstallmentDto) {
  const res = await apiClient.post<ApiResponse<Installment>>('/api/Installments', payload)
  return unwrap(res)
}

export async function updateInstallment(id: string, payload: UpdateInstallmentDto) {
  const res = await apiClient.put<ApiResponse<Installment>>(`/api/Installments/${id}`, payload)
  return unwrap(res)
}

export async function deleteInstallment(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Installments/${id}`)
  return unwrap(res)
}
