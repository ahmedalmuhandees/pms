<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { ChartData } from 'chart.js'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type { Building, Complex, ServiceTypeName } from '@/types'
import { MeterReadingSource, ServiceTypeName as ServiceTypeNameEnum } from '@/types'
import {
  getElectricityReport,
  type ElectricityReport,
  type ElectricityReportFilter,
} from '@/api/buildingMeterBilling'
import { getComplexes } from '@/api/complexes'
import { getBlocks } from '@/api/blocks'
import { getBuildings } from '@/api/buildings'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import { asSelectOptions, formatMoney, monthOptions } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import DashboardChart from '@/components/DashboardChart.vue'
import { useAuthStore } from '@/stores/auth'
import { sortByTableMode, type TableSortMode } from '@/utils/tableSort'

const auth = useAuthStore()
const route = useRoute()
const notify = useNotify()

const serviceTypeName = computed(
  () => (route.meta.serviceTypeName as ServiceTypeName | undefined) ?? ServiceTypeNameEnum.Electricity,
)
const pageTitle = computed(
  () => (route.meta.pageTitle as string | undefined) || 'تقارير الكهرباء',
)
const pageSubtitle = computed(
  () =>
    (route.meta.pageSubtitle as string | undefined) ||
    'إحصائيات الاستهلاك والتحصيل حسب الفترة والبناية',
)
const unitLabel = computed(() => {
  if (serviceTypeName.value === ServiceTypeNameEnum.Gas) return 'لتر'
  if (serviceTypeName.value === ServiceTypeNameEnum.Water) return 'م³'
  return 'واط'
})
const unitPriceLabel = computed(() => {
  if (serviceTypeName.value === ServiceTypeNameEnum.Gas) return 'سعر اللتر'
  if (serviceTypeName.value === ServiceTypeNameEnum.Water) return 'سعر المتر المكعب'
  return 'سعر الواط'
})
const reportFilePrefix = computed(() => {
  if (serviceTypeName.value === ServiceTypeNameEnum.Gas) return 'gas-report'
  if (serviceTypeName.value === ServiceTypeNameEnum.Water) return 'water-report'
  return 'electricity-report'
})

const complexes = ref<Complex[]>([])
const buildings = ref<Building[]>([])
const loading = ref(false)
const filterDialogVisible = ref(false)
const report = ref<ElectricityReport | null>(null)
const search = ref('')
const sortMode = ref<TableSortMode>('latest')

const sortedRows = computed(() =>
  sortByTableMode(report.value?.rows ?? [], sortMode.value, [
    'createdAt',
    'billDate',
    'periodLabel',
  ]),
)

const now = new Date()
const filters = reactive({
  complexId: (auth.scopedComplexId || null) as string | null,
  buildingId: null as string | null,
  fromMonth: now.getMonth() + 1 as number | null,
  fromYear: now.getFullYear() as number | null,
  toMonth: now.getMonth() + 1 as number | null,
  toYear: now.getFullYear() as number | null,
  paymentStatus: 'all' as 'all' | 'paid' | 'unpaid' | 'overdue',
  readingSource: 'all' as 'all' | 'manual' | 'api',
  unitOccupancy: 'all' as 'all' | 'occupied' | 'owned_vacant',
})

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

const paymentStatusOptions = [
  { value: 'all', label: 'الكل' },
  { value: 'paid', label: 'مدفوعة' },
  { value: 'unpaid', label: 'غير مدفوعة' },
  { value: 'overdue', label: 'متأخرة' },
]
const readingSourceOptions = [
  { value: 'all', label: 'الكل' },
  { value: 'manual', label: 'يدوي (Excel / إدخال)' },
  { value: 'api', label: 'تلقائي (API)' },
]
const unitOccupancyOptions = [
  { value: 'all', label: 'الكل' },
  { value: 'occupied', label: 'مسكونة' },
  { value: 'owned_vacant', label: 'مملوكة غير مسكونة' },
]

const activeFiltersCount = computed(() => {
  let n = 0
  if (filters.buildingId) n++
  if (filters.paymentStatus !== 'all') n++
  if (filters.readingSource !== 'all') n++
  if (filters.unitOccupancy !== 'all') n++
  const curM = now.getMonth() + 1
  const curY = now.getFullYear()
  if (filters.fromMonth !== curM || filters.fromYear !== curY || filters.toMonth !== curM || filters.toYear !== curY)
    n++
  return n
})

const kpis = computed(() => report.value?.kpis)

const buildingChart = computed<ChartData>(() => {
  const items = report.value?.buildingConsumption ?? []
  return {
    labels: items.map((x) => x.buildingName || '—'),
    datasets: [
      {
        label: `الاستهلاك (${unitLabel.value})`,
        data: items.map((x) => x.consumption),
        backgroundColor: '#0ea5e9',
        borderRadius: 8,
      },
    ],
  }
})

const trendChart = computed<ChartData>(() => {
  const items = report.value?.monthlyTrend ?? []
  return {
    labels: items.map((x) => x.label),
    datasets: [
      {
        label: 'الاستهلاك',
        data: items.map((x) => x.consumption),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(14, 165, 233, 0.15)',
        fill: true,
        tension: 0.35,
      },
    ],
  }
})

const paymentChart = computed<ChartData>(() => {
  const share = report.value?.paymentShare
  return {
    labels: ['مدفوعة', 'غير مدفوعة'],
    datasets: [
      {
        data: [share?.paidAmount ?? 0, share?.unpaidAmount ?? 0],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  }
})

const doughnutOptions = {
  plugins: {
    legend: { position: 'bottom' as const },
  },
  cutout: '62%',
}

function buildQuery(): ElectricityReportFilter {
  const q: ElectricityReportFilter = {
    complexId: filters.complexId || undefined,
    buildingId: filters.buildingId || undefined,
    serviceTypeName: serviceTypeName.value,
    fromMonth: filters.fromMonth,
    fromYear: filters.fromYear,
    toMonth: filters.toMonth,
    toYear: filters.toYear,
    search: search.value.trim() || undefined,
  }
  if (filters.paymentStatus === 'paid') q.paid = true
  if (filters.paymentStatus === 'unpaid') q.paid = false
  if (filters.paymentStatus === 'overdue') q.overdueOnly = true
  if (filters.readingSource === 'manual') q.readingSource = MeterReadingSource.Manual
  if (filters.readingSource === 'api') q.readingSource = MeterReadingSource.Api
  if (filters.unitOccupancy !== 'all') q.unitOccupancy = filters.unitOccupancy
  return q
}

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
    report.value = await getElectricityReport(buildQuery())
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
  Object.assign(filters, draft)
  filterDialogVisible.value = false
  if (complexChanged) {
    filters.buildingId = draft.buildingId
    await loadBuildings(filters.complexId)
  }
  await loadReport()
}

async function onDraftComplexChange(complexId: string | null) {
  draft.complexId = complexId
  draft.buildingId = null
  await loadBuildings(complexId)
}

function resetFilters() {
  const n = new Date()
  filters.complexId = auth.scopedComplexId || complexes.value[0]?.id || null
  filters.buildingId = null
  filters.fromMonth = n.getMonth() + 1
  filters.fromYear = n.getFullYear()
  filters.toMonth = n.getMonth() + 1
  filters.toYear = n.getFullYear()
  filters.paymentStatus = 'all'
  filters.readingSource = 'all'
  filters.unitOccupancy = 'all'
  search.value = ''
  Object.assign(draft, filters)
  filterDialogVisible.value = false
  void loadBuildings(filters.complexId).then(() => loadReport())
}

function paymentLabel(row: { paid: boolean; overdue: boolean }) {
  if (row.paid) return 'مدفوعة'
  if (row.overdue) return 'متأخرة'
  return 'غير مدفوعة'
}

function paymentSeverity(row: { paid: boolean; overdue: boolean }) {
  if (row.paid) return 'success'
  if (row.overdue) return 'danger'
  return 'warn'
}

function exportExcel() {
  const rows = report.value?.rows ?? []
  if (!rows.length) {
    notify.warning('لا توجد بيانات للتصدير')
    return
  }
  const header = [
    'رقم الشقة',
    'البناية',
    'اسم الساكن',
    'تاريخ القراءة القديمة',
    'تاريخ القراءة الجديدة',
    'القراءة القديمة',
    'القراءة الجديدة',
    'الاستهلاك',
    unitPriceLabel.value,
    'قيمة الخدمة',
    'مبلغ الخصم',
    'المبلغ بعد الخصم',
    'حالة السداد',
  ]
  const lines = rows.map((r) =>
    [
      r.unitNumber || '',
      r.buildingName || '',
      r.residentName || '',
      r.previousReadingDate || '',
      r.currentReadingDate || '',
      r.previousReading,
      r.reading,
      r.consumption,
      r.unitPrice,
      r.amount,
      r.discount || 0,
      r.netAmount,
      paymentLabel(r),
    ].join(','),
  )
  const csv = '\uFEFF' + [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${reportFilePrefix.value}-${filters.fromMonth}-${filters.fromYear}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function printReport() {
  const rows = report.value?.rows ?? []
  const kpi = kpis.value
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${pageTitle.value}</title>
  <style>
    body{font-family:Tahoma,Arial,sans-serif;padding:24px;color:#0f172a}
    h1{margin:0 0 8px;font-size:20px}
    .meta{color:#64748b;margin-bottom:16px}
    .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
    .kpi{border:1px solid #e2e8f0;border-radius:10px;padding:10px}
    .kpi span{display:block;color:#64748b;font-size:12px}
    .kpi strong{font-size:16px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:right}
    th{background:#f8fafc}
  </style></head><body>
  <h1>${pageTitle.value}</h1>
  <div class="meta">الفترة: ${filters.fromMonth}/${filters.fromYear} — ${filters.toMonth}/${filters.toYear}</div>
  <div class="kpis">
    <div class="kpi"><span>إجمالي الاستهلاك</span><strong>${kpi?.totalConsumption ?? 0} ${unitLabel.value}</strong></div>
    <div class="kpi"><span>إجمالي الفواتير</span><strong>${formatMoney(kpi?.totalBilledAmount ?? 0)}</strong></div>
    <div class="kpi"><span>المحصل</span><strong>${formatMoney(kpi?.totalCollectedAmount ?? 0)}</strong></div>
    <div class="kpi"><span>المتأخرات</span><strong>${formatMoney(kpi?.totalOutstandingAmount ?? 0)}</strong></div>
    <div class="kpi"><span>متوسط الاستهلاك/شقة</span><strong>${kpi?.averageConsumptionPerUnit ?? 0}</strong></div>
  </div>
  <table><thead><tr>
    <th>الشقة</th><th>البناية</th><th>الساكن</th><th>ت.ق.قديمة</th><th>ت.ق.جديدة</th><th>ق.قديمة</th><th>ق.جديدة</th><th>الاستهلاك</th><th>السعر</th><th>قيمة الخدمة</th><th>مبلغ الخصم</th><th>المبلغ بعد الخصم</th><th>الحالة</th>
  </tr></thead><tbody>
  ${rows
    .map(
      (r) => `<tr>
      <td>${r.unitNumber || '—'}</td><td>${r.buildingName || '—'}</td><td>${r.residentName || '—'}</td>
      <td>${r.previousReadingDate || '—'}</td><td>${r.currentReadingDate || '—'}</td>
      <td>${r.previousReading}</td><td>${r.reading}</td><td>${r.consumption}</td>
      <td>${r.unitPrice}</td><td>${formatMoney(r.amount)}</td><td>${formatMoney(r.discount || 0)}</td><td>${formatMoney(r.netAmount)}</td><td>${paymentLabel(r)}</td>
    </tr>`,
    )
    .join('')}
  </tbody></table>
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
      :title="pageTitle"
      :subtitle="pageSubtitle"
    >
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
        placeholder="ابحث باسم الساكن أو رقم الوحدة..."
        @search="loadReport"
      />
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">إجمالي الاستهلاك الكلي</span>
        <strong>{{ kpis?.totalConsumption ?? 0 }} {{ unitLabel }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">إجمالي الفواتير الصادرة</span>
        <strong>{{ formatMoney(kpis?.totalBilledAmount ?? 0) }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">إجمالي المبالغ المحصلة</span>
        <strong>{{ formatMoney(kpis?.totalCollectedAmount ?? 0) }}</strong>
      </div>
      <div class="stat-card is-warn">
        <span class="stat-label">المبالغ المتبقية</span>
        <strong>{{ formatMoney(kpis?.totalOutstandingAmount ?? 0) }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">متوسط استهلاك الشقة</span>
        <strong>{{ kpis?.averageConsumptionPerUnit ?? 0 }} {{ unitLabel }}</strong>
      </div>
    </div>

    <section class="charts-grid">
      <div class="chart-card">
        <h3>استهلاك البنايات</h3>
        <DashboardChart type="bar" :data="buildingChart" :height="280" />
      </div>
      <div class="chart-card">
        <h3>تطور الاستهلاك (12 شهراً)</h3>
        <DashboardChart type="line" :data="trendChart" :height="280" />
      </div>
      <div class="chart-card">
        <h3>نسب السداد</h3>
        <DashboardChart type="doughnut" :data="paymentChart" :options="doughnutOptions" :height="280" />
      </div>
    </section>

    <div class="data-panel">
      <DataTable
        :value="sortedRows"
        :loading="loading"
        data-key="billId"
        paginator
        :rows="20"
        :rows-per-page-options="[10, 20, 50]"
        striped-rows
        size="small"
      >
        <Column header="رقم الشقة" style="width: 100px">
          <template #body="{ data }">{{ data.unitNumber || '—' }}</template>
        </Column>
        <Column header="البناية">
          <template #body="{ data }">{{ data.buildingName || '—' }}</template>
        </Column>
        <Column header="اسم الساكن">
          <template #body="{ data }">{{ data.residentName || '—' }}</template>
        </Column>
        <Column header="تاريخ القراءة القديمة" style="width: 130px">
          <template #body="{ data }">{{ data.previousReadingDate || '—' }}</template>
        </Column>
        <Column header="تاريخ القراءة الجديدة" style="width: 130px">
          <template #body="{ data }">{{ data.currentReadingDate || '—' }}</template>
        </Column>
        <Column header="ق. قديمة" style="width: 90px">
          <template #body="{ data }">{{ data.previousReading }}</template>
        </Column>
        <Column header="ق. جديدة" style="width: 90px">
          <template #body="{ data }">{{ data.reading }}</template>
        </Column>
        <Column header="الاستهلاك" style="width: 100px">
          <template #body="{ data }">{{ data.consumption }}</template>
        </Column>
        <Column :header="unitPriceLabel" style="width: 90px">
          <template #body="{ data }">{{ data.unitPrice }}</template>
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
        <Column header="حالة السداد" style="width: 110px">
          <template #body="{ data }">
            <Tag :value="paymentLabel(data)" :severity="paymentSeverity(data)" />
          </template>
        </Column>
        <template #empty><div class="empty-box">لا توجد بيانات للفترة المحددة</div></template>
      </DataTable>
    </div>

    <Dialog v-model:visible="filterDialogVisible" modal :header="`فلترة ${pageTitle}`" :style="{ width: '420px' }">
      <div class="form-grid single">
        <div v-if="auth.canSelectComplex" class="field">
          <label>المجمع</label>
          <Select
            v-model="draft.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="المجمع"
            show-clear
            append-to="body"
            @update:model-value="(v: string | null) => onDraftComplexChange(v)"
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
            append-to="body"
          />
        </div>
        <div class="field">
          <label>من شهر</label>
          <Select v-model="draft.fromMonth" :options="monthOptions" option-label="label" option-value="value" append-to="body" />
        </div>
        <div class="field">
          <label>من سنة</label>
          <Select v-model="draft.fromYear" :options="yearOptions" option-label="label" option-value="value" append-to="body" />
        </div>
        <div class="field">
          <label>إلى شهر</label>
          <Select v-model="draft.toMonth" :options="monthOptions" option-label="label" option-value="value" append-to="body" />
        </div>
        <div class="field">
          <label>إلى سنة</label>
          <Select v-model="draft.toYear" :options="yearOptions" option-label="label" option-value="value" append-to="body" />
        </div>
        <div class="field">
          <label>حالة السداد</label>
          <Select v-model="draft.paymentStatus" :options="paymentStatusOptions" option-label="label" option-value="value" append-to="body" />
        </div>
        <div class="field">
          <label>طريقة الإدخال</label>
          <Select v-model="draft.readingSource" :options="readingSourceOptions" option-label="label" option-value="value" append-to="body" />
        </div>
        <div class="field">
          <label>حالة الوحدة</label>
          <Select v-model="draft.unitOccupancy" :options="unitOccupancyOptions" option-label="label" option-value="value" append-to="body" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="مسح" severity="secondary" text icon="pi pi-filter-slash" @click="resetFilters" />
          <Button label="إلغاء" severity="secondary" outlined @click="filterDialogVisible = false" />
          <Button label="تطبيق" icon="pi pi-check" :loading="loading" @click="applyFilters" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
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

.stat-card.is-warn {
  background: #fff7ed;
  border-color: #fed7aa;
}

.stat-label {
  color: var(--muted);
  font-size: 0.82rem;
}

.stat-card strong {
  font-size: 1.05rem;
  font-weight: 800;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.chart-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.85rem 1rem 0.5rem;
}

.chart-card h3 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.form-grid.single {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.form-grid .field label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

@media (max-width: 1100px) {
  .stats-grid,
  .charts-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 720px) {
  .stats-grid,
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
