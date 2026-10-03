import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  ContractClause,
  CreateContractClauseDto,
  PagedResult,
  PaginationParams,
  UpdateContractClauseDto,
} from '@/types'

export interface ContractClauseParams extends PaginationParams {
  ComplexId?: string
}

export async function getContractClauses(params?: ContractClauseParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<ContractClause>>>('/api/ContractClauses', {
    params,
  })
  return unwrap(res)
}

export async function getContractClause(id: string) {
  const res = await apiClient.get<ApiResponse<ContractClause>>(`/api/ContractClauses/${id}`)
  return unwrap(res)
}

export async function createContractClause(payload: CreateContractClauseDto) {
  const res = await apiClient.post<ApiResponse<ContractClause>>('/api/ContractClauses', payload)
  return unwrap(res)
}

export async function updateContractClause(id: string, payload: UpdateContractClauseDto) {
  const res = await apiClient.put<ApiResponse<ContractClause>>(`/api/ContractClauses/${id}`, payload)
  return unwrap(res)
}

export async function deleteContractClause(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/ContractClauses/${id}`)
  return unwrap(res)
}
