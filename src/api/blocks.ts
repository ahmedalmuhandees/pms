import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  Block,
  CreateBlockDto,
  PagedResult,
  PaginationParams,
  UpdateBlockDto,
} from '@/types'

export interface BlockParams extends PaginationParams {
  ComplexId?: string
}

export async function getBlocks(params?: BlockParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Block>>>('/api/Blocks', { params })
  return unwrap(res)
}

export async function getBlock(id: string) {
  const res = await apiClient.get<ApiResponse<Block>>(`/api/Blocks/${id}`)
  return unwrap(res)
}

export async function createBlock(payload: CreateBlockDto) {
  const res = await apiClient.post<ApiResponse<Block>>('/api/Blocks', payload)
  return unwrap(res)
}

export async function updateBlock(id: string, payload: UpdateBlockDto) {
  const res = await apiClient.put<ApiResponse<Block>>(`/api/Blocks/${id}`, payload)
  return unwrap(res)
}

export async function deleteBlock(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Blocks/${id}`)
  return unwrap(res)
}
