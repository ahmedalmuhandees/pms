import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateEmployeeDto,
  Employee,
  PagedResult,
  PaginationParams,
  UpdateEmployeeDto,
} from '@/types'

export interface EmployeeParams extends PaginationParams {
  ComplexId?: string
}

export async function getEmployees(params?: EmployeeParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Employee>>>('/api/Employees', { params })
  return unwrap(res)
}

export async function getEmployee(id: string) {
  const res = await apiClient.get<ApiResponse<Employee>>(`/api/Employees/${id}`)
  return unwrap(res)
}

export async function createEmployee(payload: CreateEmployeeDto) {
  const res = await apiClient.post<ApiResponse<Employee>>('/api/Employees', payload)
  return unwrap(res)
}

export async function updateEmployee(id: string, payload: UpdateEmployeeDto) {
  const res = await apiClient.put<ApiResponse<Employee>>(`/api/Employees/${id}`, payload)
  return unwrap(res)
}

export async function deleteEmployee(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Employees/${id}`)
  return unwrap(res)
}
