import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateCustomerDto,
  Customer,
  PagedResult,
  PaginationParams,
  UpdateCustomerDto,
} from '@/types'

export interface CustomerParams extends PaginationParams {
  ComplexId?: string
}

export async function getCustomers(params?: CustomerParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Customer>>>('/api/Customers', { params })
  return unwrap(res)
}

export async function getCustomer(id: string) {
  const res = await apiClient.get<ApiResponse<Customer>>(`/api/Customers/${id}`)
  return unwrap(res)
}

export async function createCustomer(payload: CreateCustomerDto) {
  const res = await apiClient.post<ApiResponse<Customer>>('/api/Customers', payload)
  return unwrap(res)
}

export async function updateCustomer(id: string, payload: UpdateCustomerDto) {
  const res = await apiClient.put<ApiResponse<Customer>>(`/api/Customers/${id}`, payload)
  return unwrap(res)
}

export async function deleteCustomer(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Customers/${id}`)
  return unwrap(res)
}
