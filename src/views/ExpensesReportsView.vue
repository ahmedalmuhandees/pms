<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex } from '@/types'
import {
  getExpenseCategories,
  getExpenseReport,
  type ExpenseCategory,
  type ExpenseReport,
} from '@/api/expenses'
import { getComplexes } from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import { asSelectOptions, formatDate, formatMoney, monthOptions } from '@/utils/enums'
import { resolveMediaUrl } from '@/utils/media'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import { useAuthStore } from '@/stores/auth'
import { sortByTableMode, type TableSortMode } from '@/utils/tableSort'

const auth = useAuthStore()
const notify = useNotify()

const complexes = ref<Complex[]>([])
const categories = ref<ExpenseCategory[]>([])
const loading = ref(false)
const filterDialogVisible = ref(false)
const report = ref<ExpenseReport | null>(null)
const search = ref('')
const sortMode = ref<TableSortMode>('latest')

const now = new Date()
const filters = reactive({
  complexId: (auth.scopedComplexId || null) as string | null,
  categoryId: null as string | null,
  payee: '' as string,
  fromDate: null as Date | null,
  toDate: null as Date | null,
  month: (now.getMonth() + 1) as number | null,
  year: now.getFullYear() as number | null,
})
const draft = reactive({ ...filters })

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)
const categoryOptions = computed(() =>
  categories.value.map((c) => ({ label: c.name, value: c.id })),
)
const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => ({ value: y - i, label: String(y - i) }))
})

const kpis = computed(() => report.value?.kpis)
const summaries = computed(() => report.value?.categorySummaries ?? [])
const rows = computed(() =>
  sortByTableMode(report.value?.rows ?? [], sortMode.value, [
    'createdAt',
    'expenseDate',
    'date',
  ]),
)

const activeFiltersCount = computed(() => {
  let n = 0
  if (filters.categoryId) n++
  if (filters.payee.trim()) n++
  if (filters.fromDate || filters.toDate) n++
  if (filters.month || filters.year) n++
  return n
})

async function loadCategories(complexId: string | null) {
  if (!complexId) {
    categories.value = []
    return
  }
  categories.value = await getExpenseCategories({ complexId })
}

async function loadReport() {
  loading.value = true
  try {
    report.value = await getExpenseReport({
      complexId: filters.complexId || undefined,
      categoryId: filters.categoryId || undefined,
      payee: filters.payee.trim() || undefined,
      fromDate: filters.fromDate ? filters.fromDate.toISOString() : undefined,
      toDate: filters.toDate ? filters.toDate.toISOString() : undefined,
      month: filters.fromDate || filters.toDate ? undefined : filters.month,
      year: filters.fromDate || filters.toDate ? undefined : filters.year,
      search: search.value.trim() || undefined,
    })
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
}

function openFilters() {
  Object.assign(draft, filters)
  filterDialogVisible.value = true
}

async function applyFilters() {
  const complexChanged = draft.complexId !== filters.complexId
  Object.assign(filters, {
    ...draft,
    payee: draft.payee,
  })
  filterDialogVisible.value = false
  if (complexChanged) await loadCategories(filters.complexId)
  await loadReport()
}

function exportExcel() {
  if (!rows.value.length) {
    notify.warning('لا توجد بيانات للتصدير')
    return
  }
  const header = [
    'رقم المستند',
    'اسم المصروف',
    'المبلغ',
    'جهة الصرف',
    'تاريخ الصرف',
    'المرفقات',
    'ملاحظات',
  ]
  const lines = rows.value.map((r) =>
    [
      r.documentNumber || '',
      r.categoryName,
      r.amount,
      r.payee,
      formatDate(r.expenseDate),
      r.attachmentPath || '',
      (r.notes || '').replaceAll(',', ' '),
    ].join(','),
  )
  const csv = '\uFEFF' + [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expenses-report-${filters.month || 'all'}-${filters.year || 'all'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function printReport() {
  const kpi = kpis.value
  const summaryHtml = summaries.value
    .map(
      (s) =>
        `<div class="card"><strong>${s.categoryName}</strong><div>إجمالي: ${formatMoney(s.totalAmount)}</div><div>عدد الفواتير: ${s.billsCount}</div></div>`,
    )
    .join('')
  const tableRows = rows.value
    .map(
      (r) => `<tr>
      <td>${r.documentNumber || '—'}</td>
      <td>${r.categoryName}</td>
      <td>${formatMoney(r.amount)}</td>
      <td>${r.payee}</td>
      <td>${formatDate(r.expenseDate)}</td>
      <td>${r.notes || '—'}</td>
    </tr>`,
    )
    .join('')
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير المصاريف</title>
  <style>
    body{font-family:Tahoma,Arial,sans-serif;padding:24px;color:#0f172a}
    h1{margin:0 0 8px;font-size:20px}
    .meta{color:#64748b;margin-bottom:16px}
    .kpis,.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
    .kpi,.card{border:1px solid #e2e8f0;border-radius:10px;padding:10px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:right}
    th{background:#f8fafc}
  </style></head><body>
  <h1>تقارير المصاريف والإحصائيات</h1>
  <div class="meta">الفترة حسب الفلاتر المحددة</div>
  <div class="kpis">
    <div class="kpi"><span>إجمالي المصاريف</span><strong>${formatMoney(kpi?.totalAmount ?? 0)}</strong></div>
    <div class="kpi"><span>أعلى بند صرف</span><strong>${kpi?.topCategoryName || '—'} (${formatMoney(kpi?.topCategoryAmount ?? 0)})</strong></div>
    <div class="kpi"><span>عدد العمليات</span><strong>${kpi?.operationsCount ?? 0}</strong></div>
  </div>
  <div class="cards">${summaryHtml}</div>
  <table><thead><tr>
    <th>رقم المستند</th><th>اسم المصروف</th><th>المبلغ</th><th>جهة الصرف</th><th>تاريخ الصرف</th><th>ملاحظات</th>
  </tr></thead><tbody>${tableRows}</tbody></table>
  </body></html>`
  const win = window.open('', '_blank')
  if (!win) {
    notify.warning('اسمح بالنوافذ المنبثقة للطباعة')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 250)
}

onMounted(async () => {
  try {
    const result = await getComplexes({ Page: 1, PageSize: 200 })
    complexes.value = result.items ?? []
    if (!filters.complexId) filters.complexId = complexes.value[0]?.id || null
    Object.assign(draft, filters)
    await loadCategories(filters.complexId)
    await loadReport()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
})
</script>

<template>
  <div class="page">
    <PageHeader title="تقارير المصاريف والإحصائيات" subtitle="ملخص المصاريف حسب الفترة والفئة وجهة الصرف">
      <template #actions>
        <Button
          :label="activeFiltersCount ? `فلترة (${activeFiltersCount})` : 'فلترة'"
          icon="pi pi-filter"
          severity="secondary"
          outlined
          @click="openFilters"
        />
        <Button label="تصدير Excel" icon="pi pi-file-excel" severity="help" outlined @click="exportExcel" />
        <Button label="طباعة التقرير" icon="pi pi-print" severity="secondary" outlined @click="printReport" />
      </template>
    </PageHeader>

    <div class="data-panel" style="margin-bottom: 1rem">
      <FilterBar
        v-model:search="search"
        v-model:sort-mode="sortMode"
        placeholder="ابحث برقم المستند أو الجهة أو الاسم..."
        @search="loadReport"
      />
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">إجمالي المصاريف الكلية</span>
        <strong>{{ formatMoney(kpis?.totalAmount ?? 0) }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">أعلى بنود الصرف</span>
        <strong>{{ kpis?.topCategoryName || '—' }}</strong>
        <small>{{ formatMoney(kpis?.topCategoryAmount ?? 0) }}</small>
      </div>
      <div class="stat-card">
        <span class="stat-label">عدد العمليات / المستندات</span>
        <strong>{{ kpis?.operationsCount ?? 0 }}</strong>
      </div>
    </div>

    <section class="category-cards">
      <div v-for="item in summaries" :key="item.categoryId" class="category-card">
        <h3>{{ item.categoryName }}</h3>
        <div class="category-meta">
          <span>إجمالي المصروف</span>
          <strong>{{ formatMoney(item.totalAmount) }}</strong>
        </div>
        <div class="category-meta">
          <span>عدد الفواتير</span>
          <strong>{{ item.billsCount }}</strong>
        </div>
      </div>
      <div v-if="!summaries.length" class="empty-box">لا توجد تصنيفات للفترة المحددة</div>
    </section>

    <div class="data-panel">
      <DataTable
        :value="rows"
        :loading="loading"
        data-key="id"
        paginator
        :rows="20"
        :rows-per-page-options="[10, 20, 50]"
        striped-rows
        size="small"
      >
        <Column header="رقم المستند" style="width: 120px">
          <template #body="{ data }">{{ data.documentNumber || '—' }}</template>
        </Column>
        <Column header="اسم المصروف">
          <template #body="{ data }">{{ data.categoryName }}</template>
        </Column>
        <Column header="المبلغ" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
        </Column>
        <Column header="جهة الصرف">
          <template #body="{ data }">{{ data.payee }}</template>
        </Column>
        <Column header="تاريخ الصرف" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.expenseDate) }}</template>
        </Column>
        <Column header="المرفقات" style="width: 110px">
          <template #body="{ data }">
            <a
              v-if="data.attachmentPath"
              :href="resolveMediaUrl(data.attachmentPath)"
              target="_blank"
              rel="noopener"
              class="link"
            >معاينة</a>
            <span v-else>—</span>
          </template>
        </Column>
        <Column header="ملاحظات">
          <template #body="{ data }">{{ data.notes || '—' }}</template>
        </Column>
        <template #empty><div class="empty-box">لا توجد بيانات للفترة المحددة</div></template>
      </DataTable>
    </div>

    <Dialog v-model:visible="filterDialogVisible" modal header="فلترة تقرير المصاريف" :style="{ width: '440px' }">
      <div class="form-grid single">
        <div v-if="auth.canSelectComplex" class="field">
          <label>المجمع</label>
          <Select
            v-model="draft.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            show-clear
            append-to="body"
            @update:model-value="(v: string | null) => loadCategories(v)"
          />
        </div>
        <div class="field">
          <label>اسم المصروف</label>
          <Select
            v-model="draft.categoryId"
            :options="categoryOptions"
            option-label="label"
            option-value="value"
            show-clear
            filter
            append-to="body"
          />
        </div>
        <div class="field">
          <label>جهة الصرف</label>
          <InputText v-model="draft.payee" placeholder="مورد / شركة" />
        </div>
        <div class="field">
          <label>من تاريخ</label>
          <DatePicker v-model="draft.fromDate" date-format="yy-mm-dd" show-icon show-clear append-to="body" class="w-full" />
        </div>
        <div class="field">
          <label>إلى تاريخ</label>
          <DatePicker v-model="draft.toDate" date-format="yy-mm-dd" show-icon show-clear append-to="body" class="w-full" />
        </div>
        <div class="field">
          <label>الشهر (إن لم يُحدد نطاق تاريخ)</label>
          <Select
            v-model="draft.month"
            :options="monthOptions"
            option-label="label"
            option-value="value"
            show-clear
            append-to="body"
          />
        </div>
        <div class="field">
          <label>السنة</label>
          <Select
            v-model="draft.year"
            :options="yearOptions"
            option-label="label"
            option-value="value"
            show-clear
            append-to="body"
          />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="filterDialogVisible = false" />
          <Button label="تطبيق" @click="applyFilters" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.stat-label {
  color: var(--muted);
  font-size: 0.82rem;
}
.stat-card strong {
  font-size: 1.1rem;
  font-weight: 800;
}
.stat-card small {
  color: var(--muted);
}
.category-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.category-card {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.9rem 1rem;
}
.category-card h3 {
  margin: 0 0 0.65rem;
  font-size: 1rem;
}
.category-meta {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.35rem;
  font-size: 0.88rem;
}
.link {
  color: #156574;
  font-weight: 700;
  text-decoration: none;
}
@media (max-width: 800px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
