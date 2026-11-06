<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import {
  getAuditLogById,
  getAuditLogKpis,
  getAuditLogs,
  getAuditLogUsers,
  type AuditLogItem,
  type AuditLogKpis,
  type AuditLogParams,
  type AuditLogUserOption,
} from '@/api/auditLogs'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify } from '@/composables/useNotify'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import TableSortCaption from '@/components/TableSortCaption.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()

const actionFilter = ref<number | null>(null)
const moduleFilter = ref<number | null>(null)
const userFilter = ref<string | null>(null)
const fromDate = ref<Date | null>(null)
const toDate = ref<Date | null>(null)
const users = ref<AuditLogUserOption[]>([])
const kpis = ref<AuditLogKpis | null>(null)

const {
  items,
  loading,
  page,
  pageSize,
  total,
  search,
  filters,
  load,
  onSearch,
  setSortMode,
  onTableSort,
  sortField,
  sortOrder,
    sortMode,
  onLazyPage,
} = usePagedList<AuditLogItem, AuditLogParams>(getAuditLogs)

const actionOptions = [
  { label: 'الكل', value: null },
  { label: 'إضافة', value: 1 },
  { label: 'تعديل', value: 2 },
  { label: 'حذف', value: 3 },
  { label: 'طباعة/تصدير', value: 4 },
]

const moduleOptions = [
  { label: 'الكل', value: null },
  { label: 'العقود ومحاضر التسليم', value: 1 },
  { label: 'الساكنين', value: 2 },
  { label: 'الفواتير والخدمات', value: 3 },
  { label: 'المصاريف', value: 4 },
]

const userOptions = computed(() => [
  { label: 'الكل', value: null as string | null },
  ...users.value.map((u) => ({ label: u.name, value: u.id })),
])

function toDateParam(d: Date | null, endOfDay = false): string | undefined {
  if (!d) return undefined
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  if (endOfDay) return `${y}-${m}-${day}T23:59:59`
  return `${y}-${m}-${day}`
}

function buildFilter(): AuditLogParams {
  return {
    FromDate: toDateParam(fromDate.value),
    ToDate: toDateParam(toDate.value),
    ActionType: actionFilter.value ?? undefined,
    Module: moduleFilter.value ?? undefined,
    UserId: userFilter.value ?? undefined,
  }
}

async function refreshKpis() {
  try {
    kpis.value = await getAuditLogKpis({
      ...buildFilter(),
      Search: search.value || undefined,
    })
  } catch {
    kpis.value = null
  }
}

async function applyFilters() {
  const next = buildFilter()
  const scoped = filters.value.ComplexId
  filters.value = {
    ...(scoped ? { ComplexId: scoped } : {}),
    ...next,
  }
  page.value = 1
  await load()
  await refreshKpis()
}

function resetFilters() {
  actionFilter.value = null
  moduleFilter.value = null
  userFilter.value = null
  fromDate.value = null
  toDate.value = null
  search.value = ''
  void applyFilters()
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('ar-IQ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function actionSeverity(type: number): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
  if (type === 1) return 'success'
  if (type === 2) return 'warn'
  if (type === 3) return 'danger'
  if (type === 4) return 'info'
  return 'secondary'
}

const diffVisible = ref(false)
const diffLoading = ref(false)
const selected = ref<AuditLogItem | null>(null)
const diffRows = ref<{ field: string; oldValue: string; newValue: string }[]>([])

function parseJsonObject(raw?: string | null): Record<string, unknown> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function stringifyVal(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

async function openDiff(row: AuditLogItem) {
  selected.value = row
  diffVisible.value = true
  diffLoading.value = true
  diffRows.value = []
  try {
    const full = row.oldValuesJson || row.newValuesJson ? row : await getAuditLogById(row.id)
    selected.value = full
    const oldObj = parseJsonObject(full.oldValuesJson)
    const newObj = parseJsonObject(full.newValuesJson)
    const keys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))
    diffRows.value = keys.map((field) => ({
      field,
      oldValue: stringifyVal(oldObj[field]),
      newValue: stringifyVal(newObj[field]),
    }))
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    diffLoading.value = false
  }
}

watch([actionFilter, moduleFilter, userFilter, fromDate, toDate], () => {
  void applyFilters()
})

onMounted(async () => {
  try {
    users.value = await getAuditLogUsers()
  } catch {
    users.value = []
  }
  await applyFilters()
})
</script>

<template>
  <div class="page">
    <PageHeader
      title="سجل الحركات والأحداث"
      subtitle="تتبع عمليات الإضافة والتعديل والحذف والتصدير — سجل للقراءة فقط"
    >
      <template #actions>
        <Button label="إعادة ضبط" icon="pi pi-refresh" severity="secondary" text @click="resetFilters" />
      </template>
    </PageHeader>

    <div class="data-panel" style="margin-bottom: 1rem">
      <FilterBar
        v-model:search="search"
        v-model:sort-mode="sortMode"
        @sort-change="setSortMode"
        placeholder="بحث برقم العقد أو الشقة أو اسم الساكن/الموظف..."
        @search="
          async () => {
            await onSearch()
            await refreshKpis()
          }
        "
      >
        <DatePicker
          v-model="fromDate"
          date-format="yy-mm-dd"
          placeholder="من تاريخ"
          show-icon
          show-button-bar
          class="filter-date"
        />
        <DatePicker
          v-model="toDate"
          date-format="yy-mm-dd"
          placeholder="إلى تاريخ"
          show-icon
          show-button-bar
          class="filter-date"
        />
        <Select
          v-model="actionFilter"
          :options="actionOptions"
          option-label="label"
          option-value="value"
          placeholder="نوع العملية"
          class="filter-select"
        />
        <Select
          v-model="moduleFilter"
          :options="moduleOptions"
          option-label="label"
          option-value="value"
          placeholder="القسم"
          class="filter-select"
        />
        <Select
          v-model="userFilter"
          :options="userOptions"
          option-label="label"
          option-value="value"
          placeholder="المستخدم"
          class="filter-select"
          filter
          show-clear
        />
      </FilterBar>
    </div>

    <section class="section-block">
      <div class="stats-grid cols-4">
        <div class="stat-card">
          <span class="stat-label">إجمالي الحركات المسجلة</span>
          <strong>{{ kpis?.totalCount ?? 0 }}</strong>
        </div>
        <div class="stat-card is-danger">
          <span class="stat-label">حركات الحذف</span>
          <strong>{{ kpis?.deleteCount ?? 0 }}</strong>
        </div>
        <div class="stat-card is-warn">
          <span class="stat-label">حركات التعديل</span>
          <strong>{{ kpis?.updateCount ?? 0 }}</strong>
        </div>
        <div class="stat-card is-ok">
          <span class="stat-label">أكثر المستخدمين نشاطاً</span>
          <strong class="top-user">
            {{ kpis?.topUserName || '—' }}
            <small v-if="kpis?.topUserCount"> ({{ kpis.topUserCount }})</small>
          </strong>
        </div>
      </div>
    </section>

    <div class="data-panel">
      <TableSkeleton v-if="loading && !items.length" :rows="8" />
      <template v-else>
      <TableSortCaption :sort-mode="sortMode" />
      <DataTable
        :value="items"
        :lazy="true"
        :paginator="true"
        :rows="pageSize"
        :total-records="total"
        :first="(page - 1) * pageSize"
        data-key="id"
        striped-rows
        row-hover
        class="audit-table"
        sort-mode="single"
        :sort-field="sortField"
        :sort-order="sortOrder"
        removable-sort
        @sort="onTableSort"
        @page="onLazyPage"
        @row-click="(e: { data: AuditLogItem }) => openDiff(e.data)"
      >
        <Column field="id" header="#" style="width: 4.5rem"  sortable />
        <Column header="التاريخ والوقت" style="min-width: 9rem" sortable>
          <template #body="{ data }">{{ formatDateTime(data.occurredAt) }}</template>
        </Column>
        <Column field="userName" header="المستخدم" style="min-width: 9rem"  sortable />
        <Column header="نوع العملية" style="min-width: 7rem" sortable>
          <template #body="{ data }">
            <Tag :value="data.actionTypeLabel" :severity="actionSeverity(data.actionType)" />
          </template>
        </Column>
        <Column field="moduleLabel" header="القسم / الكيان" style="min-width: 9rem"  sortable />
        <Column header="رقم المرجع" style="min-width: 7rem" sortable>
          <template #body="{ data }">{{ data.referenceNumber || '—' }}</template>
        </Column>
        <Column field="description" header="تفاصيل الحركة" style="min-width: 12rem"  sortable />
        <Column header="التغييرات" style="min-width: 10rem" sortable>
          <template #body="{ data }">
            <Button
              v-if="data.hasChanges"
              :label="data.changesSummary?.includes('⬅️') ? data.changesSummary : 'معاينة'"
              icon="pi pi-eye"
              text
              size="small"
              @click.stop="openDiff(data)"
            />
            <span v-else>{{ data.changesSummary || '—' }}</span>
          </template>
        </Column>
        <Column header="IP / الجهاز" style="min-width: 8rem" sortable>
          <template #body="{ data }">
            <div class="ip-cell">
              <span>{{ data.ipAddress || '—' }}</span>
              <small v-if="data.userAgent" :title="data.userAgent">{{ data.userAgent }}</small>
            </div>
          </template>
        </Column>
      </DataTable>
      </template>
    </div>

    <Dialog
      v-model:visible="diffVisible"
      modal
      :header="selected ? selected.description : 'تفاصيل التغيير'"
      :style="{ width: 'min(720px, 96vw)' }"
      dismissable-mask
    >
      <div v-if="selected" class="diff-meta">
        <p><strong>تاريخ التعديل:</strong> {{ formatDateTime(selected.occurredAt) }}</p>
        <p><strong>الموظف:</strong> {{ selected.userName }}</p>
        <p><strong>القسم:</strong> {{ selected.moduleLabel }} · <strong>المرجع:</strong> {{ selected.referenceNumber || '—' }}</p>
      </div>

      <TableSkeleton v-if="diffLoading" :rows="4" />
      <DataTable v-else-if="diffRows.length" :value="diffRows" size="small" striped-rows>
        <Column field="field" header="الحقل المعدل" style="min-width: 8rem"  sortable />
        <Column field="oldValue" header="القيمة القديمة" style="min-width: 10rem"  sortable />
        <Column field="newValue" header="القيمة الجديدة" style="min-width: 10rem"  sortable />
      </DataTable>
      <p v-else class="empty-diff">لا توجد تفاصيل مقارنة لهذا السجل.</p>
    </Dialog>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  gap: 0.85rem;
  margin-bottom: 1rem;
}
.stats-grid.cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
@media (max-width: 1100px) {
  .stats-grid.cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .stats-grid.cols-4 {
    grid-template-columns: 1fr;
  }
}
.stat-card {
  background: var(--p-surface-card, #fff);
  border: 1px solid var(--p-surface-border, #e5e7eb);
  border-radius: 10px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.stat-label {
  color: var(--p-text-muted-color, #6b7280);
  font-size: 0.85rem;
}
.stat-card strong {
  font-size: 1.35rem;
}
.stat-card.is-danger strong {
  color: #b91c1c;
}
.stat-card.is-warn strong {
  color: #b45309;
}
.stat-card.is-ok strong {
  color: #047857;
}
.top-user {
  font-size: 1.05rem !important;
  line-height: 1.35;
}
.top-user small {
  font-weight: 500;
  opacity: 0.75;
}
.filter-date,
.filter-select {
  min-width: 10rem;
}
.ip-cell {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-width: 12rem;
}
.ip-cell small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--p-text-muted-color, #6b7280);
  font-size: 0.72rem;
}
.audit-table :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}
.diff-meta {
  margin-bottom: 1rem;
  line-height: 1.7;
}
.empty-diff {
  color: var(--p-text-muted-color, #6b7280);
  text-align: center;
  padding: 1.5rem 0;
}
</style>
