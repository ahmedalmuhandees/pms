import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateSalesContractDto,
  SalesContract,
  PagedResult,
  PaginationParams,
  UpdateSalesContractDto,
} from '@/types'

export interface SalesContractParams extends PaginationParams {
  ComplexId?: string
  CustomerId?: string
  UnitId?: string
  SalesAgentId?: string
  ContractStatus?: string | number
}

export async function getSalesContracts(params?: SalesContractParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<SalesContract>>>('/api/SalesContracts', { params })
  return unwrap(res)
}

export async function getSalesContract(id: string) {
  const res = await apiClient.get<ApiResponse<SalesContract>>(`/api/SalesContracts/${id}`)
  return unwrap(res)
}

export async function createSalesContract(payload: CreateSalesContractDto) {
  const res = await apiClient.post<ApiResponse<SalesContract>>('/api/SalesContracts', payload)
  return unwrap(res)
}

export async function updateSalesContract(id: string, payload: UpdateSalesContractDto) {
  const res = await apiClient.put<ApiResponse<SalesContract>>(`/api/SalesContracts/${id}`, payload)
  return unwrap(res)
}

export async function deleteSalesContract(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/SalesContracts/${id}`)
  return unwrap(res)
}
