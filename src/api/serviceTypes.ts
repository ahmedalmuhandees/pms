import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateServiceTypeDto,
  PagedResult,
  PaginationParams,
  ServiceType,
  UpdateServiceTypeDto,
} from '@/types'

export interface ServiceTypeParams extends PaginationParams {
  ComplexId?: string
  BillingMode?: string | number
  IsActive?: boolean
  Name?: number
}

export async function getServiceTypes(params?: ServiceTypeParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<ServiceType>>>('/api/ServiceTypes', { params })
  return unwrap(res)
}

export async function getServiceType(id: string) {
  const res = await apiClient.get<ApiResponse<ServiceType>>(`/api/ServiceTypes/${id}`)
  return unwrap(res)
}

export async function createServiceType(payload: CreateServiceTypeDto) {
  const res = await apiClient.post<ApiResponse<ServiceType>>('/api/ServiceTypes', payload)
  return unwrap(res)
}

export async function updateServiceType(id: string, payload: UpdateServiceTypeDto) {
  const res = await apiClient.put<ApiResponse<ServiceType>>(`/api/ServiceTypes/${id}`, payload)
  return unwrap(res)
}

export async function deleteServiceType(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/ServiceTypes/${id}`)
  return unwrap(res)
}
