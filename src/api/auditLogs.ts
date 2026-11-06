import { apiClient, unwrap } from './client'
import type { ApiResponse, PagedResult, PaginationParams } from '@/types'

export type AuditActionType = 1 | 2 | 3 | 4
export type AuditModule = 0 | 1 | 2 | 3 | 4

export interface AuditLogItem {
  id: number
  occurredAt: string
  userId?: string | null
  userName: string
  actionType: AuditActionType
  actionTypeLabel: string
  module: AuditModule
  moduleLabel: string
  entityName: string
  entityId?: string | null
  referenceNumber?: string | null
  description: string
  oldValuesJson?: string | null
  newValuesJson?: string | null
  hasChanges: boolean
  changesSummary?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  complexId?: string | null
}

export interface AuditLogKpis {
  totalCount: number
  deleteCount: number
  updateCount: number
  topUserName: string | null
  topUserCount: number
}

export interface AuditLogUserOption {
  id: string
  name: string
}

export interface AuditLogParams extends PaginationParams {
  FromDate?: string
  ToDate?: string
  ActionType?: number
  Module?: number
  UserId?: string
  ComplexId?: string
  Search?: string
}

function toQuery(params?: AuditLogParams) {
  const q: Record<string, string | number> = {}
  if (!params) return q
  if (params.Page != null) q.Page = params.Page
  if (params.PageSize != null) q.PageSize = params.PageSize
  if (params.Search) q.Search = params.Search
  if (params.FromDate) q.FromDate = params.FromDate
  if (params.ToDate) q.ToDate = params.ToDate
  if (params.ActionType != null) q.ActionType = params.ActionType
  if (params.Module != null) q.Module = params.Module
  if (params.UserId) q.UserId = params.UserId
  if (params.ComplexId) q.ComplexId = params.ComplexId
  return q
}

export async function getAuditLogs(params?: AuditLogParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<AuditLogItem>>>('/api/AuditLogs', {
    params: toQuery(params),
  })
  return unwrap(res)
}

export async function getAuditLogKpis(params?: AuditLogParams) {
  const res = await apiClient.get<ApiResponse<AuditLogKpis>>('/api/AuditLogs/kpis', {
    params: toQuery(params),
  })
  return unwrap(res)
}

export async function getAuditLogUsers() {
  const res = await apiClient.get<ApiResponse<AuditLogUserOption[]>>('/api/AuditLogs/users')
  return unwrap(res)
}

export async function getAuditLogById(id: number) {
  const res = await apiClient.get<ApiResponse<AuditLogItem>>(`/api/AuditLogs/${id}`)
  return unwrap(res)
}
