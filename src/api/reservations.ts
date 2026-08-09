import { apiClient, unwrap } from './client'
import type {
  ApiResponse,
  CreateReservationDto,
  Reservation,
  PagedResult,
  PaginationParams,
  UpdateReservationDto,
} from '@/types'

export interface ReservationParams extends PaginationParams {
  ComplexId?: string
  CustomerId?: string
  UnitId?: string
  Status?: string | number
  ExpireFrom?: string
  ExpireTo?: string
}

export async function getReservations(params?: ReservationParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Reservation>>>('/api/Reservations', { params })
  return unwrap(res)
}

export async function getReservation(id: string) {
  const res = await apiClient.get<ApiResponse<Reservation>>(`/api/Reservations/${id}`)
  return unwrap(res)
}

export async function createReservation(payload: CreateReservationDto) {
  const res = await apiClient.post<ApiResponse<Reservation>>('/api/Reservations', payload)
  return unwrap(res)
}

export async function updateReservation(id: string, payload: UpdateReservationDto) {
  const res = await apiClient.put<ApiResponse<Reservation>>(`/api/Reservations/${id}`, payload)
  return unwrap(res)
}

export async function deleteReservation(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Reservations/${id}`)
  return unwrap(res)
}
