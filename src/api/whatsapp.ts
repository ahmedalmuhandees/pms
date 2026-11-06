import { apiClient, unwrap } from './client'
import type { ApiResponse } from '@/types'

export const WhatsAppTemplateType = {
  PaymentReceipt: 1,
  InstallmentReminder: 2,
  PaymentDetails: 3,
  InstallmentAlert: 4,
  InstallmentPenalty: 5,
} as const

export type WhatsAppTemplateType =
  (typeof WhatsAppTemplateType)[keyof typeof WhatsAppTemplateType]

export interface WhatsAppSettings {
  id?: string
  phoneNumber: string
  deviceId?: string | null
  apiBaseUrl: string
  apiUsername?: string | null
  hasApiPassword?: boolean
  isEnabled: boolean
  paymentReceiptTemplate?: string | null
  installmentReminderTemplate?: string | null
  paymentDetailsTemplate?: string | null
  reminderDays?: number
  alertTemplate?: string | null
  alertDays?: number
  penaltyNoticeTemplate?: string | null
  penaltyDays?: number
  autoSendEnabled?: boolean
  complexId?: string
}

export interface UpdateWhatsAppSettingsPayload {
  phoneNumber: string
  deviceId?: string | null
  apiBaseUrl?: string | null
  apiUsername?: string | null
  apiPassword?: string | null
  isEnabled: boolean
  paymentReceiptTemplate?: string | null
  installmentReminderTemplate?: string | null
  paymentDetailsTemplate?: string | null
  reminderDays?: number
  alertTemplate?: string | null
  alertDays?: number
  penaltyNoticeTemplate?: string | null
  penaltyDays?: number
  autoSendEnabled?: boolean
  complexId?: string | null
}

export interface WhatsAppPairCodeResult {
  phoneNumber: string
  deviceId: string
  pairCode?: string | null
  message?: string | null
}

export interface WhatsAppStatus {
  deviceId?: string | null
  isConnected: boolean
  isLoggedIn: boolean
  phoneNumber?: string | null
  state?: string | null
  message?: string | null
}

export interface WhatsAppMessageLog {
  id: string
  customerId?: string | null
  toPhone: string
  message: string
  success: boolean
  providerMessageId?: string | null
  errorMessage?: string | null
  isTest: boolean
  createdAt: string
}

export interface WhatsAppTemplatePreview {
  templateType: WhatsAppTemplateType
  message: string
  toPhone: string
  customerId: string
}

export interface DueWhatsAppAlert {
  templateType: WhatsAppTemplateType
  customerId: string
  contractId: string
  installmentId: string
  dueDate: string
  customerName: string
  phone?: string | null
}

export async function getWhatsAppSettings(complexId?: string | null) {
  const res = await apiClient.get<ApiResponse<WhatsAppSettings>>('/api/whatsapp/settings', {
    params: complexId ? { complexId } : undefined,
  })
  return unwrap(res)
}

export async function saveWhatsAppSettings(payload: UpdateWhatsAppSettingsPayload) {
  const res = await apiClient.put<ApiResponse<WhatsAppSettings>>('/api/whatsapp/settings', payload)
  return unwrap(res)
}

export async function requestWhatsAppPairCode(complexId?: string | null) {
  const res = await apiClient.post<ApiResponse<WhatsAppPairCodeResult>>(
    '/api/whatsapp/pair-code',
    null,
    { params: complexId ? { complexId } : undefined },
  )
  return unwrap(res)
}

export async function getWhatsAppStatus(complexId?: string | null) {
  const res = await apiClient.get<ApiResponse<WhatsAppStatus>>('/api/whatsapp/status', {
    params: complexId ? { complexId } : undefined,
  })
  return unwrap(res)
}

export async function sendWhatsAppMessage(payload: {
  customerId?: string | null
  phone?: string | null
  message: string
  isTest?: boolean
  complexId?: string | null
}) {
  const res = await apiClient.post<ApiResponse<WhatsAppMessageLog>>('/api/whatsapp/send', payload)
  return unwrap(res)
}

export async function previewWhatsAppTemplate(payload: {
  templateType: WhatsAppTemplateType
  customerId: string
  contractId?: string | null
  paymentId?: string | null
  batchId?: string | null
  installmentId?: string | null
  complexId?: string | null
}) {
  const res = await apiClient.post<ApiResponse<WhatsAppTemplatePreview>>(
    '/api/whatsapp/templates/preview',
    payload,
  )
  return unwrap(res)
}

export async function sendWhatsAppTemplate(payload: {
  templateType: WhatsAppTemplateType
  customerId: string
  contractId?: string | null
  paymentId?: string | null
  batchId?: string | null
  installmentId?: string | null
  complexId?: string | null
}) {
  const res = await apiClient.post<ApiResponse<WhatsAppMessageLog>>(
    '/api/whatsapp/templates/send',
    payload,
  )
  return unwrap(res)
}

export async function getDueWhatsAppAlerts(complexId?: string | null) {
  const res = await apiClient.get<ApiResponse<DueWhatsAppAlert[]>>('/api/whatsapp/due-alerts', {
    params: complexId ? { complexId } : undefined,
  })
  return unwrap(res)
}

export async function getCustomerWhatsAppLogs(customerId: string) {
  const res = await apiClient.get<ApiResponse<WhatsAppMessageLog[]>>(
    `/api/whatsapp/customers/${customerId}/logs`,
  )
  return unwrap(res)
}

export const whatsAppTemplateOptions = [
  { value: WhatsAppTemplateType.PaymentReceipt, label: 'رسالة دفع' },
  { value: WhatsAppTemplateType.InstallmentReminder, label: 'تذكير قسط' },
  { value: WhatsAppTemplateType.PaymentDetails, label: 'رسالة تفاصيل الدفعات' },
  { value: WhatsAppTemplateType.InstallmentAlert, label: 'تنبيه استحقاق' },
  { value: WhatsAppTemplateType.InstallmentPenalty, label: 'تطبيق الغرامة' },
]
