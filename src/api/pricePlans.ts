import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreatePricePlanDto,
  PagedResult,
  PaginationParams,
  PricePlan,
  UpdatePricePlanDto,
} from '@/types'

export interface PricePlanParams extends PaginationParams {
  ComplexId?: string
  Scope?: string | number
  BlockId?: string
  BuildingId?: string
  UnitId?: string
}

export async function getPricePlans(params?: PricePlanParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<PricePlan>>>('/api/PricePlans', { params })
  return unwrap(res)
}

export async function getPricePlan(id: string) {
  const res = await apiClient.get<ApiResponse<PricePlan>>(`/api/PricePlans/${id}`)
  return unwrap(res)
}

export async function createPricePlan(payload: CreatePricePlanDto) {
  const res = await apiClient.post<ApiResponse<PricePlan>>('/api/PricePlans', payload)
  return unwrap(res)
}

export async function updatePricePlan(id: string, payload: UpdatePricePlanDto) {
  const res = await apiClient.put<ApiResponse<PricePlan>>(`/api/PricePlans/${id}`, payload)
  return unwrap(res)
}

export async function deletePricePlan(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/PricePlans/${id}`)
  return unwrap(res)
}
