import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateVisitorDto,
  PagedResult,
  PaginationParams,
  UpdateVisitorDto,
  Visitor,
} from '@/types'

export interface VisitorParams extends PaginationParams {
  ResidentId?: string
  VisitDate?: string
}

export async function getVisitors(params?: VisitorParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Visitor>>>('/api/Visitors', { params })
  return unwrap(res)
}

export async function getVisitor(id: string) {
  const res = await apiClient.get<ApiResponse<Visitor>>(`/api/Visitors/${id}`)
  return unwrap(res)
}

export async function createVisitor(payload: CreateVisitorDto) {
  const res = await apiClient.post<ApiResponse<Visitor>>('/api/Visitors', payload)
  return unwrap(res)
}

export async function updateVisitor(id: string, payload: UpdateVisitorDto) {
  const res = await apiClient.put<ApiResponse<Visitor>>(`/api/Visitors/${id}`, payload)
  return unwrap(res)
}

export async function deleteVisitor(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Visitors/${id}`)
  return unwrap(res)
}
