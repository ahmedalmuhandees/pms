import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateInstallmentPlanDto,
  InstallmentPlan,
  PagedResult,
  PaginationParams,
  UpdateInstallmentPlanDto,
} from '@/types'

export interface InstallmentPlanParams extends PaginationParams {
  ComplexId?: string
  ContractId?: string
}

export async function getInstallmentPlans(params?: InstallmentPlanParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<InstallmentPlan>>>('/api/InstallmentPlans', { params })
  return unwrap(res)
}

export async function getInstallmentPlan(id: string) {
  const res = await apiClient.get<ApiResponse<InstallmentPlan>>(`/api/InstallmentPlans/${id}`)
  return unwrap(res)
}

export async function createInstallmentPlan(payload: CreateInstallmentPlanDto) {
  const res = await apiClient.post<ApiResponse<InstallmentPlan>>('/api/InstallmentPlans', payload)
  return unwrap(res)
}

export async function updateInstallmentPlan(id: string, payload: UpdateInstallmentPlanDto) {
  const res = await apiClient.put<ApiResponse<InstallmentPlan>>(`/api/InstallmentPlans/${id}`, payload)
  return unwrap(res)
}

export async function deleteInstallmentPlan(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/InstallmentPlans/${id}`)
  return unwrap(res)
}
