<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type { Building, Complex } from '@/types'
import { PaymentMethod } from '@/types'
import {
  getGeneralReport,
  GeneralReportFilterMode,
  GeneralReportServiceScope,
  type GeneralReport,
} from '@/api/generalReports'
import { getComplexes } from '@/api/complexes'
import { getBlocks } from '@/api/blocks'
import { getBuildings } from '@/api/buildings'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatDate,
  formatMoney,
  labelOf,
  monthOptions,
  serviceBillPaymentOptions,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import { useAuthStore } from '@/stores/auth'
import { sortByTableMode, type TableSortMode } from '@/utils/tableSort'

const auth = useAuthStore()
const notify = useNotify()

const complexes = ref<Complex[]>([])
const buildings = ref<Building[]>([])
const loading = ref(false)
const filterDialogVisible = ref(false)
const report = ref<GeneralReport | null>(null)
const search = ref('')
const sortMode = ref<TableSortMode>('latest')

const now = new Date()
function defaultFilters() {
  return {
    complexId: (auth.scopedComplexId || null) as string | null,
    buildingId: null as string | null,
    filterMode: GeneralReportFilterMode.BillingPeriod as number,
    month: (now.getMonth() + 1) as number | null,
    year: now.getFullYear() as number | null,
    fromDate: null as Date | null,
    toDate: null as Date | null,
    paid: 'all' as 'all' | 'paid' | 'unpaid',
    serviceScope: GeneralReportServiceScope.All as number,
    paymentMethod: null as number | null,
  }
}

const filters = reactive(defaultFilters())
const draft = reactive({ ...filters })

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)
const buildingOptions = computed(() =>
  asSelectOptions(buildings.value, (b) => b.name || b.description || b.id.slice(0, 8)),
)
const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => ({ value: y - i, label: String(y - i) }))
})

const filterModeOptions = [
  { value: GeneralReportFilterMode.BillingPeriod, label: 'حسب تاريخ استحقاق الفاتورة' },
  { value: GeneralReportFilterMode.PaymentDate, label: 'حسب تاريخ السداد الفعلي' },
]
const paidOptions = [
  { value: 'all', label: 'الكل' },
  { value: 'paid', label: 'مسدد' },
  { value: 'unpaid', label: 'غير مسدد' },
]
const serviceScopeOptions = [
  { value: GeneralReportServiceScope.All, label: 'الكل' },
  { value: GeneralReportServiceScope.FixedServices, label: 'خدمات ثابتة' },
  { value: GeneralReportServiceScope.Electricity, label: 'كهرباء' },
  { value: GeneralReportServiceScope.Gas, label: 'غاز' },
  { value: GeneralReportServiceScope.Water, label: 'مياه' },
]
const paymentMethodOptions = [
  { value: null, label: 'الكل' },
  ...serviceBillPaymentOptions,
]

const cash = computed(() => report.value?.cash)
const accrual = computed(() => report.value?.accrual)
const operational = computed(() => report.value?.operational)
const rows = computed(() =>
  sortByTableMode(report.value?.rows ?? [], sortMode.value, [
    'createdAt',
    'billDate',
    'periodLabel',
  ]),
)

const activeFiltersCount = computed(() => {
  let n = 0
  if (filters.buildingId) n++
  if (filters.paid !== 'all') n++
  if (filters.serviceScope !== GeneralReportServiceScope.All) n++
  if (filters.paymentMethod != null) n++
  if (filters.fromDate || filters.toDate) n++
  if (filters.filterMode !== GeneralReportFilterMode.BillingPeriod) n++
  return n
})

async function loadBuildings(complexId: string | null) {
  if (!complexId) {
    buildings.value = []
    return
  }
  const blocks = await getBlocks({ ComplexId: complexId, Page: 1, PageSize: 500 })
  const blockIds = new Set((blocks.items ?? []).map((b) => b.id))
  const result = await getBuildings({ Page: 1, PageSize: 1000 })
  buildings.value = (result.items ?? []).filter((b) => blockIds.has(b.blockId))
}

async function loadReport() {
  loading.value = true
  try {
    report.value = await getGeneralReport({
      complexId: filters.complexId || undefined,
      buildingId: filters.buildingId || undefined,
      filterMode: filters.filterMode as GeneralReportFilterMode,
      month: filters.fromDate || filters.toDate ? undefined : filters.month,
      year: filters.fromDate || filters.toDate ? undefined : filters.year,
      fromDate: filters.fromDate ? filters.fromDate.toISOString() : undefined,
      toDate: filters.toDate ? filters.toDate.toISOString() : undefined,
      paid: filters.paid === 'all' ? undefined : filters.paid === 'paid',
      serviceScope: filters.serviceScope as GeneralReportServiceScope,
      paymentMethod: (filters.paymentMethod as PaymentMethod | null) ?? undefined,
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
  Object.assign(filters, { ...draft })
  filterDialogVisible.value = false
  if (complexChanged) {
    filters.buildingId = null
    await loadBuildings(filters.complexId)
  }
  await loadReport()
}

async function resetFilters() {
  const defaults = defaultFilters()
  if (!defaults.complexId) defaults.complexId = complexes.value[0]?.id || null
  Object.assign(filters, defaults)
  Object.assign(draft, filters)
  await loadBuildings(filters.complexId)
  search.value = ''
  await loadReport()
}

function paymentLabel(method?: number | null) {
  if (method == null) return '—'
  return labelOf(serviceBillPaymentOptions, method) || '—'
}

function exportExcel() {
  if (!rows.value.length) {
    notify.warning('لا توجد بيانات للتصدير')
    return
  }
  const header = [
    'الشقة',
    'البناية',
    'المالك / الساكن',
    'الخدمة',
    'شهر/فترة الفاتورة',
    'قيمة الخدمة',
    'مبلغ الخصم',
    'المبلغ بعد الخصم',
    'الحالة',
    'تاريخ السداد',
    'نوع الدفع',
  ]
  const lines = rows.value.map((r) =>
    [
      r.unitNumber || '',
      r.buildingName || '',
      r.residentName || '',
      r.serviceDisplayName,
      r.periodLabel,
      r.amount,
      r.discount,
      r.netAmount,
      r.paid ? 'مسدد' : 'غير مسدد',
      r.paidAt ? formatDate(r.paidAt) : '',
      paymentLabel(r.paymentMethod),
    ].join(','),
  )
  const csv = '\uFEFF' + [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `general-report-${filters.month || 'range'}-${filters.year || 'all'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function printReport() {
  const c = cash.value
  const a = accrual.value
  const o = operational.value
  const tableRows = rows.value
    .map(
      (r) => `<tr>
      <td>${r.unitNumber || '—'}</td>
      <td>${r.residentName || '—'}</td>
      <td>${r.serviceDisplayName}</td>
      <td>${r.periodLabel}</td>
      <td>${formatMoney(r.amount)}</td>
      <td>${formatMoney(r.discount || 0)}</td>
      <td>${formatMoney(r.netAmount)}</td>
      <td>${r.paid ? 'مسدد' : 'غير مسدد'}</td>
      <td>${r.paidAt ? formatDate(r.paidAt) : '—'}</td>
      <td>${paymentLabel(r.paymentMethod)}</td>
    </tr>`,
    )
    .join('')
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>التقرير العام</title>
  <style>
    body{font-family:Tahoma,Arial,sans-serif;padding:24px;color:#0f172a}
    h1{margin:0 0 8px;font-size:20px}
    .meta{color:#64748b;margin-bottom:16px}
    .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
    .kpi{border:1px solid #e2e8f0;border-radius:10px;padding:10px}
    .kpi span{display:block;color:#64748b;font-size:12px}
    .kpi strong{font-size:15px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:right}
    th{background:#f8fafc}
    h2{font-size:14px;margin:18px 0 8px}
  </style></head><body>
  <h1>التقارير العامة — نظرة مالية للمجمع</h1>
  <div class="meta">وضع التصفية: ${
    filters.filterMode === GeneralReportFilterMode.PaymentDate
      ? 'حسب تاريخ السداد الفعلي'
      : 'حسب استحقاق الفاتورة'
  }</div>
  <h2>التدفق النقدي (Cash)</h2>
  <div class="kpis">
    <div class="kpi"><span>تحصيل نقدي للفترة</span><strong>${formatMoney(c?.cashCollectedInPeriod ?? 0)}</strong></div>
    <div class="kpi"><span>متأخرات محصلة</span><strong>${formatMoney(c?.arrearsCollectedInPeriod ?? 0)}</strong></div>
    <div class="kpi"><span>تحصيل فواتير الفترة</span><strong>${formatMoney(c?.currentPeriodCollectedCash ?? 0)}</strong></div>
  </div>
  <h2>المطالبات (Accrual)</h2>
  <div class="kpis">
    <div class="kpi"><span>إجمالي رسوم الخدمة</span><strong>${formatMoney(a?.totalBilled ?? 0)}</strong></div>
    <div class="kpi"><span>إجمالي الخصومات</span><strong>${formatMoney(a?.totalDiscount ?? 0)}</strong></div>
    <div class="kpi"><span>الرسوم المدفوعة</span><strong>${formatMoney(a?.totalPaid ?? 0)}</strong></div>
    <div class="kpi"><span>الرسوم غير المدفوعة</span><strong>${formatMoney(a?.totalUnpaid ?? 0)}</strong></div>
  </div>
  <h2>المؤشرات التشغيلية</h2>
  <div class="kpis">
    <div class="kpi"><span>وحدات / مسددة / غير مسددة</span><strong>${o?.totalUnits ?? 0} / ${o?.paidUnits ?? 0} / ${o?.unpaidUnits ?? 0}</strong></div>
    <div class="kpi"><span>نسبة التحصيل</span><strong>${o?.collectionRate ?? 0}%</strong></div>
    <div class="kpi"><span>نسبة الالتزام</span><strong>${o?.complianceRate ?? 0}%</strong></div>
  </div>
  <table><thead><tr>
    <th>الشقة</th><th>الساكن</th><th>الخدمة</th><th>الفترة</th><th>قيمة الخدمة</th><th>مبلغ الخصم</th><th>المبلغ بعد الخصم</th><th>الحالة</th><th>تاريخ السداد</th><th>نوع الدفع</th>
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
    await loadBuildings(filters.complexId)
    await loadReport()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
})
</script>

<template>
  <div class="page">
    <PageHeader
      title="التقارير العامة"
      subtitle="نظرة مالية وتشغيلية — تمييز بين مستحقات الفترة والتحصيل النقدي الفعلي"
    >
      <template #actions>
        <Button
          :label="activeFiltersCount ? `فلترة (${activeFiltersCount})` : 'فلترة'"
          icon="pi pi-filter"
          severity="secondary"
          outlined
          @click="openFilters"
        />
        <Button label="إعادة ضبط" icon="pi pi-refresh" severity="secondary" text @click="resetFilters" />
        <Button label="تصدير Excel" icon="pi pi-file-excel" severity="help" outlined @click="exportExcel" />
        <Button label="طباعة التقرير" icon="pi pi-print" severity="secondary" outlined @click="printReport" />
      </template>
    </PageHeader>

    <div class="data-panel" style="margin-bottom: 1rem">
      <FilterBar
        v-model:search="search"
        v-model:sort-mode="sortMode"
        placeholder="ابحث بالوحدة أو الساكن أو الخدمة..."
        @search="loadReport"
      />
    </div>

    <section class="section-block">
      <h2 class="section-title">التدفق النقدي الفعلي (حسب تاريخ السداد)</h2>
      <div class="stats-grid cols-3">
        <div class="stat-card is-cash">
          <span class="stat-label">إجمالي التحصيل النقدي للفترة</span>
          <strong>{{ formatMoney(cash?.cashCollectedInPeriod ?? 0) }}</strong>
        </div>
        <div class="stat-card is-cash">
          <span class="stat-label">متأخرات محصلة (فواتير أشهر سابقة)</span>
          <strong>{{ formatMoney(cash?.arrearsCollectedInPeriod ?? 0) }}</strong>
        </div>
        <div class="stat-card is-cash">
          <span class="stat-label">تحصيل فواتير نفس الفترة</span>
          <strong>{{ formatMoney(cash?.currentPeriodCollectedCash ?? 0) }}</strong>
        </div>
      </div>
    </section>

    <section class="section-block">
      <h2 class="section-title">المطالبات والمستحقات (حسب إصدار الفاتورة)</h2>
      <div class="stats-grid cols-3">
        <div class="stat-card">
          <span class="stat-label">إجمالي رسوم الخدمة (المطالبات)</span>
          <strong>{{ formatMoney(accrual?.totalBilled ?? 0) }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">إجمالي مبلغ الخصم</span>
          <strong>{{ formatMoney(accrual?.totalDiscount ?? 0) }}</strong>
        </div>
        <div class="stat-card is-ok">
          <span class="stat-label">إجمالي الرسوم المدفوعة</span>
          <strong>{{ formatMoney(accrual?.totalPaid ?? 0) }}</strong>
        </div>
        <div class="stat-card is-warn">
          <span class="stat-label">إجمالي الرسوم غير المدفوعة</span>
          <strong>{{ formatMoney(accrual?.totalUnpaid ?? 0) }}</strong>
        </div>
      </div>
    </section>

    <section class="section-block">
      <h2 class="section-title">المؤشرات التشغيلية والنسب</h2>
      <div class="stats-grid cols-3">
        <div class="stat-card">
          <span class="stat-label">الوحدات الكلية / المسددة / غير المسددة</span>
          <strong>
            {{ operational?.totalUnits ?? 0 }}
            <span class="muted">/</span>
            {{ operational?.paidUnits ?? 0 }}
            <span class="muted">/</span>
            {{ operational?.unpaidUnits ?? 0 }}
          </strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">نسبة التحصيل المالية</span>
          <strong>{{ operational?.collectionRate ?? 0 }}%</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">نسبة التزام الوحدات</span>
          <strong>{{ operational?.complianceRate ?? 0 }}%</strong>
        </div>
        <div class="stat-card wide">
          <span class="stat-label">أعلى خدمة تحصيلاً</span>
          <strong>{{ operational?.topCollectedServiceName || '—' }}</strong>
          <small>{{ formatMoney(operational?.topCollectedServiceAmount ?? 0) }}</small>
        </div>
      </div>
    </section>

    <div class="data-panel">
      <DataTable
        :value="rows"
        :loading="loading"
        data-key="billId"
        paginator
        :rows="20"
        :rows-per-page-options="[10, 20, 50, 100]"
        striped-rows
        size="small"
      >
        <Column header="الشقة / الوحدة" style="width: 110px">
          <template #body="{ data }">{{ data.unitNumber || '—' }}</template>
        </Column>
        <Column header="المالك / الساكن">
          <template #body="{ data }">{{ data.residentName || '—' }}</template>
        </Column>
        <Column header="الخدمة">
          <template #body="{ data }">{{ data.serviceDisplayName }}</template>
        </Column>
        <Column header="شهر/فترة الفاتورة" style="width: 120px">
          <template #body="{ data }">{{ data.periodLabel }}</template>
        </Column>
        <Column header="قيمة الخدمة" style="width: 110px">
          <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
        </Column>
        <Column header="مبلغ الخصم" style="width: 110px">
          <template #body="{ data }">{{ formatMoney(data.discount || 0) }}</template>
        </Column>
        <Column header="المبلغ بعد الخصم" style="width: 130px">
          <template #body="{ data }">{{ formatMoney(data.netAmount) }}</template>
        </Column>
        <Column header="الحالة" style="width: 100px">
          <template #body="{ data }">
            <Tag :value="data.paid ? 'مسدد' : 'غير مسدد'" :severity="data.paid ? 'success' : 'warn'" />
          </template>
        </Column>
        <Column header="تاريخ السداد" style="width: 120px">
          <template #body="{ data }">{{ data.paidAt ? formatDate(data.paidAt) : '—' }}</template>
        </Column>
        <Column header="نوع الدفع" style="width: 110px">
          <template #body="{ data }">{{ paymentLabel(data.paymentMethod) }}</template>
        </Column>
        <template #empty><div class="empty-box">لا توجد بيانات للفلاتر المحددة</div></template>
      </DataTable>
    </div>

    <Dialog v-model:visible="filterDialogVisible" modal header="فلترة التقرير العام" :style="{ width: '460px' }">
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
            @update:model-value="(v: string | null) => loadBuildings(v)"
          />
        </div>
        <div class="field">
          <label>طريقة التصفية</label>
          <Select
            v-model="draft.filterMode"
            :options="filterModeOptions"
            option-label="label"
            option-value="value"
            append-to="body"
          />
        </div>
        <div class="field">
          <label>البناية</label>
          <Select
            v-model="draft.buildingId"
            :options="buildingOptions"
            option-label="label"
            option-value="id"
            placeholder="جميع البنايات"
            show-clear
            filter
            append-to="body"
          />
        </div>
        <div class="field">
          <label>حالة السداد</label>
          <Select v-model="draft.paid" :options="paidOptions" option-label="label" option-value="value" append-to="body" />
        </div>
        <div class="field">
          <label>نوع الخدمة</label>
          <Select
            v-model="draft.serviceScope"
            :options="serviceScopeOptions"
            option-label="label"
            option-value="value"
            append-to="body"
          />
        </div>
        <div class="field">
          <label>طريقة الدفع</label>
          <Select
            v-model="draft.paymentMethod"
            :options="paymentMethodOptions"
            option-label="label"
            option-value="value"
            append-to="body"
          />
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
.section-block {
  margin-bottom: 1rem;
}
.section-title {
  margin: 0 0 0.65rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: #0b3d4a;
}
.stats-grid {
  display: grid;
  gap: 0.75rem;
}
.stats-grid.cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
.stat-card.wide {
  grid-column: 1 / -1;
}
.stat-card.is-cash {
  background: #f0f9ff;
  border-color: #bae6fd;
}
.stat-card.is-ok {
  background: #ecfdf5;
  border-color: #a7f3d0;
}
.stat-card.is-warn {
  background: #fff7ed;
  border-color: #fed7aa;
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
.muted {
  color: var(--muted);
  font-weight: 500;
  margin: 0 0.2rem;
}
@media (max-width: 900px) {
  .stats-grid.cols-3 {
    grid-template-columns: 1fr;
  }
}
</style>
