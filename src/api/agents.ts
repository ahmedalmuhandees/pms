import { apiClient, unwrap } from './client'
import type {
  Agent,
  ApiResponse,
  CreateAgentDto,
  PagedResult,
  PaginationParams,
  UpdateAgentDto,
} from '@/types'

export type AgentParams = PaginationParams & {
  ComplexId?: string
  IsActive?: boolean
}

export async function getAgents(params?: AgentParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Agent>>>('/api/Agents', { params })
  return unwrap(res)
}

export async function getAgent(id: string) {
  const res = await apiClient.get<ApiResponse<Agent>>(`/api/Agents/${id}`)
  return unwrap(res)
}

export async function createAgent(payload: CreateAgentDto) {
  const res = await apiClient.post<ApiResponse<Agent>>('/api/Agents', payload)
  return unwrap(res)
}

export async function updateAgent(id: string, payload: UpdateAgentDto) {
  const res = await apiClient.put<ApiResponse<Agent>>(`/api/Agents/${id}`, payload)
  return unwrap(res)
}

export async function deleteAgent(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Agents/${id}`)
  return unwrap(res)
}
