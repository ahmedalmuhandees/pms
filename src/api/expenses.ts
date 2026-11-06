import { apiClient, unwrap } from './client'
import type { ApiResponse, PagedResult, PaginationParams } from '@/types'

export interface ExpenseCategory {
  id: string
  name: string
  complexId: string
}

export interface Expense {
  id: string
  categoryId: string
  categoryName: string
  amount: number
  payee: string
  documentNumber?: string | null
  attachmentPath?: string | null
  attachmentOriginalName?: string | null
  attachmentContentType?: string | null
  expenseDate: string
  notes?: string | null
  complexId: string
  createdAt: string
}

export interface ExpenseParams extends PaginationParams {
  ComplexId?: string
  CategoryId?: string
  Payee?: string
  FromDate?: string
  ToDate?: string
}

export interface ExpenseReportFilter {
  complexId?: string | null
  categoryId?: string | null
  categoryName?: string | null
  payee?: string | null
  fromDate?: string | null
  toDate?: string | null
  month?: number | null
  year?: number | null
  search?: string | null
}

export interface ExpenseReport {
  kpis: {
    totalAmount: number
    topCategoryName: string | null
    topCategoryAmount: number
    operationsCount: number
  }
  categorySummaries: {
    categoryId: string
    categoryName: string
    totalAmount: number
    billsCount: number
  }[]
  rows: Expense[]
}

export async function getExpenses(params?: ExpenseParams) {
  const res = await apiClient.get<ApiResponse<PagedResult<Expense>>>('/api/Expenses', { params })
  return unwrap(res)
}

export async function getExpenseCategories(params?: { complexId?: string; search?: string }) {
  const res = await apiClient.get<ApiResponse<ExpenseCategory[]>>('/api/Expenses/categories', {
    params,
  })
  return unwrap(res)
}

export async function getExpenseReport(params?: ExpenseReportFilter) {
  const res = await apiClient.get<ApiResponse<ExpenseReport>>('/api/Expenses/report', { params })
  return unwrap(res)
}

export async function createExpense(payload: {
  categoryName: string
  categoryId?: string | null
  amount: number
  payee: string
  documentNumber?: string | null
  expenseDate?: string | null
  notes?: string | null
  complexId: string
  file?: File | null
}) {
  const form = new FormData()
  form.append('categoryName', payload.categoryName)
  if (payload.categoryId) form.append('categoryId', payload.categoryId)
  form.append('amount', String(payload.amount))
  form.append('payee', payload.payee)
  if (payload.documentNumber) form.append('documentNumber', payload.documentNumber)
  if (payload.expenseDate) form.append('expenseDate', payload.expenseDate)
  if (payload.notes) form.append('notes', payload.notes)
  form.append('complexId', payload.complexId)
  if (payload.file) form.append('file', payload.file)

  const res = await apiClient.post<ApiResponse<Expense>>('/api/Expenses', form)
  return unwrap(res)
}

export async function updateExpense(
  id: string,
  payload: {
    categoryName: string
    categoryId?: string | null
    amount: number
    payee: string
    documentNumber?: string | null
    expenseDate?: string | null
    notes?: string | null
    complexId: string
    file?: File | null
  },
) {
  const form = new FormData()
  form.append('categoryName', payload.categoryName)
  if (payload.categoryId) form.append('categoryId', payload.categoryId)
  form.append('amount', String(payload.amount))
  form.append('payee', payload.payee)
  if (payload.documentNumber) form.append('documentNumber', payload.documentNumber)
  if (payload.expenseDate) form.append('expenseDate', payload.expenseDate)
  if (payload.notes) form.append('notes', payload.notes)
  form.append('complexId', payload.complexId)
  if (payload.file) form.append('file', payload.file)

  const res = await apiClient.put<ApiResponse<Expense>>(`/api/Expenses/${id}`, form)
  return unwrap(res)
}

export async function deleteExpense(id: string) {
  const res = await apiClient.delete<ApiResponse<boolean>>(`/api/Expenses/${id}`)
  return unwrap(res)
}
