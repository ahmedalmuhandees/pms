<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import Password from 'primevue/password'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import type {
  Complex,
  CreateResidentDto,
  Customer,
  Resident,
  ResidentStats,
  Unit,
} from '@/types'
import { OccupancyType, ResidentStatus } from '@/types'
import {
  createResident,
  deleteResident,
  getResidentStats,
  getResidents,
  getResidentsExport,
  regenerateResidentLoginCode,
  revealResidentLoginCode,
  updateResident,
  type ResidentParams,
} from '@/api/residents'
import { getComplexes } from '@/api/complexes'
import { getCustomers } from '@/api/customers'
import { getUnits } from '@/api/units'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatDate,
  labelOf,
  occupancyTypeOptions,
  residentStatusOptions,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import TableSortCaption from '@/components/TableSortCaption.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const customers = ref<Customer[]>([])
const units = ref<Unit[]>([])
const complexMap = ref<Record<string, string>>({})
const customerMap = ref<Record<string, string>>({})
const unitMap = ref<Record<string, string>>({})
const stats = ref<ResidentStats>({ total: 0, owners: 0, tenants: 0, movedOut: 0, evicted: 0 })
const statsLoading = ref(false)

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort,
  sortField,
  sortOrder,
  sortMode, onLazyPage, filters,
} = usePagedList<Resident, ResidentParams>(getResidents)

const dialogVisible = ref(false)
const saving = ref(false)
const exporting = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(auth.scopedComplexId)
const statusFilter = ref<number | null>(null)
const moveInModel = ref<Date | null>(null)
const moveOutModel = ref<Date | null>(null)

const form = reactive<CreateResidentDto>({
  moveInDate: new Date().toISOString(),
  moveOutDate: null,
  status: ResidentStatus.Active,
  occupancyType: OccupancyType.Owner,
  customerId: '',
  unitId: '',
  complexId: '',
})

const filteredUnits = computed(() =>
  form.complexId ? units.value.filter((u) => u.complexId === form.complexId) : units.value,
)

const filteredCustomers = computed(() =>
  form.complexId ? customers.value.filter((c) => c.complexId === form.complexId) : customers.value,
)

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)
const customerOptions = computed(() =>
  asSelectOptions(filteredCustomers.value, (c) =>
    [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id,
  ),
)
const unitOptions = computed(() =>
  asSelectOptions(filteredUnits.value, (u) => u.unitNumber || u.id),
)

async function loadLookups() {
  const [complexResult, customerResult, unitResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getCustomers({ Page: 1, PageSize: 500 }),
    getUnits({ Page: 1, PageSize: 500 }),
  ])
  complexes.value = complexResult.items ?? []
  customers.value = customerResult.items ?? []
  units.value = unitResult.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
  customerMap.value = Object.fromEntries(
    customers.value.map((c) => [c.id, [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id]),
  )
  unitMap.value = Object.fromEntries(
    units.value.map((u) => [u.id, u.unitNumber || u.id]),
  )
}

async function refreshStats() {
  statsLoading.value = true
  try {
    const complexId = (filters.value.ComplexId as string | undefined) || complexFilter.value || undefined
    stats.value = await getResidentStats(complexId)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    statsLoading.value = false
  }
}

function openCreate() {
  editingId.value = null
  moveInModel.value = new Date()
  moveOutModel.value = null
  Object.assign(form, {
    moveInDate: new Date().toISOString(),
    moveOutDate: null,
    status: ResidentStatus.Active,
    occupancyType: OccupancyType.Owner,
    customerId: '',
    unitId: '',
    complexId: auth.scopedComplexId || complexFilter.value || complexes.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Resident) {
  editingId.value = row.id
  moveInModel.value = row.moveInDate ? new Date(row.moveInDate) : null
  moveOutModel.value = row.moveOutDate ? new Date(row.moveOutDate) : null
  Object.assign(form, {
    moveInDate: row.moveInDate,
    moveOutDate: row.moveOutDate,
    status: row.status,
    occupancyType: row.occupancyType ?? OccupancyType.Owner,
    customerId: row.customerId,
    unitId: row.unitId,
    complexId: row.complexId,
  })
  dialogVisible.value = true
}

function openProfile(row: Resident) {
  void router.push({ name: 'resident-detail', params: { id: row.id } })
}

const codeDialogVisible = ref(false)
const codeLoading = ref(false)
const codeTarget = ref<Resident | null>(null)
const managerPassword = ref('')
const revealedCode = ref<string | null>(null)

function openLoginCode(row: Resident) {
  codeTarget.value = row
  managerPassword.value = ''
  revealedCode.value = null
  codeDialogVisible.value = true
}

async function submitRevealCode(regenerate = false) {
  if (!codeTarget.value) return
  if (!managerPassword.value.trim()) {
    notify.warning('أدخل كلمة مرور حسابك لإظهار الرمز')
    return
  }
  codeLoading.value = true
  try {
    const result = regenerate
      ? await regenerateResidentLoginCode(codeTarget.value.id, managerPassword.value)
      : await revealResidentLoginCode(codeTarget.value.id, managerPassword.value)
    revealedCode.value = result.code
    codeTarget.value.hasLoginCode = true
    notify.success(regenerate ? 'تم توليد رمز جديد' : 'تم إظهار رمز الدخول')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    codeLoading.value = false
  }
}

async function copyRevealedCode() {
  if (!revealedCode.value) return
  try {
    await navigator.clipboard.writeText(revealedCode.value)
    notify.success('تم نسخ الرمز')
  } catch {
    notify.warning('تعذر النسخ تلقائياً')
  }
}

async function save() {
  if (!form.complexId || !form.customerId || !form.unitId) {
    notify.warning('أكمل بيانات المجمع والعميل والوحدة')
    return
  }
  if (!moveInModel.value) {
    notify.warning('حدد تاريخ الدخول')
    return
  }
  form.moveInDate = moveInModel.value.toISOString()
  form.moveOutDate = moveOutModel.value ? moveOutModel.value.toISOString() : null
  saving.value = true
  try {
    if (editingId.value) {
      await updateResident(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createResident({ ...form })
      notify.success('تم الإنشاء')
    }
    dialogVisible.value = false
    await Promise.all([load(), refreshStats()])
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function remove(row: Resident) {
  if (!(await ask('حذف سجل المقيم؟'))) return
  try {
    await deleteResident(row.id)
    notify.success('تم الحذف')
    await Promise.all([load(), refreshStats()])
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

function csvCell(value: string | number | null | undefined) {
  const raw = value == null ? '' : String(value)
  return `"${raw.replace(/"/g, '""')}"`
}

async function exportExcel() {
  exporting.value = true
  try {
    const rows = await getResidentsExport({
      ComplexId: (filters.value.ComplexId as string | undefined) || complexFilter.value || undefined,
      Status: statusFilter.value ?? undefined,
      Search: search.value?.trim() || undefined,
      Page: 1,
      PageSize: 100000,
    })
    if (!rows.length) {
      notify.warning('لا توجد بيانات للتصدير')
      return
    }
    const header = [
      '#',
      'رمز البناية',
      'رقم الشقة',
      'اسم الساكن الرئيسي',
      'حالة الإشغال',
      'رقم الهوية / الجواز',
      'رقم الهاتف',
      'البريد الإلكتروني',
      'إجمالي القاطنين',
      'عدد الذكور',
      'عدد الإناث',
      'تاريخ التسكين',
      'اسم شخص الطوارئ',
      'رقم هاتف الطوارئ',
      'حالة الوحدة',
    ]
    const lines = rows.map((r) =>
      [
        r.rowNumber,
        r.buildingCode || '',
        r.unitNumber || '',
        r.primaryResidentName || '',
        r.occupancyTypeLabel || '',
        r.nationalIdOrPassport || '',
        r.phone || '',
        r.email || '',
        r.totalOccupants,
        r.maleCount,
        r.femaleCount,
        r.occupancyDate ? formatDate(r.occupancyDate) : '',
        r.emergencyContactName || '',
        r.emergencyPhone || '',
        r.unitStatusLabel || '',
      ]
        .map(csvCell)
        .join(','),
    )
    const csv = '\uFEFF' + [header.map(csvCell).join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `residents-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    notify.success(`تم تصدير ${rows.length} سجل`)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    exporting.value = false
  }
}

watch(complexFilter, (v) => {
  setFilter('ComplexId', v || undefined)
  void refreshStats()
})

onMounted(async () => {
  try {
    await loadLookups()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  if (complexFilter.value) setFilter('ComplexId', complexFilter.value)
  await Promise.all([load(), refreshStats()])
})
</script>

<template>
  <div class="page">
    <PageHeader title="السكان" subtitle="ربط العملاء بالوحدات وتواريخ الإقامة">
      <template #actions>
        <Button
          label="تصدير Excel"
          icon="pi pi-file-excel"
          severity="help"
          outlined
          :loading="exporting"
          @click="exportExcel"
        />
        <Button label="إضافة مقيم" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="stat-grid" style="margin-bottom: 1rem">
      <div class="stat-card">
        <div class="label">عدد الساكنين الكلي</div>
        <div class="value">{{ statsLoading ? '…' : stats.total }}</div>
      </div>
      <div class="stat-card">
        <div class="label">عدد الملاك</div>
        <div class="value">{{ statsLoading ? '…' : stats.owners }}</div>
      </div>
      <div class="stat-card">
        <div class="label">عدد المستأجرين</div>
        <div class="value">{{ statsLoading ? '…' : stats.tenants }}</div>
      </div>
      <div class="stat-card">
        <div class="label">عدد المغادرين</div>
        <div class="value">{{ statsLoading ? '…' : stats.movedOut }}</div>
      </div>
      <div class="stat-card">
        <div class="label">عدد الإخلاء</div>
        <div class="value">{{ statsLoading ? '…' : stats.evicted }}</div>
      </div>
    </div>

    <div class="data-panel">
      <FilterBar v-model:search="search"
        v-model:sort-mode="sortMode"
        @sort-change="setSortMode" placeholder="ابحث..." @search="onSearch">
        <template #filters>
          <Select
            v-if="auth.canSelectComplex"
            v-model="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="كل المجمعات"
            show-clear
          />
          <Select
            v-model="statusFilter"
            :options="residentStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="كل الحالات"
            show-clear
            @update:model-value="(v: number | null) => setFilter('Status', v ?? undefined)"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="8" />
      <template v-else>
        <TableSortCaption :sort-mode="sortMode" />
        <DataTable
        :value="items"
        :loading="loading"
        lazy
        paginator
        :rows="pageSize"
        :total-records="total"
        :first="(page - 1) * pageSize"
        :rows-per-page-options="[10, 20, 50]"
        striped-rows
        size="small"
        @page="onLazyPage"
      
          sort-mode="single"
          :sort-field="sortField"
          :sort-order="sortOrder"
          removable-sort
          @sort="onTableSort">
        <Column header="العميل" sortable>
          <template #body="{ data }">
            {{ data.customerName || customerMap[data.customerId] || data.customerId.slice(0, 8) }}
          </template>
        </Column>
        <Column header="الوحدة" style="width: 120px" sortable>
          <template #body="{ data }">
            {{ data.unitNumber || unitMap[data.unitId] || data.unitId.slice(0, 8) }}
          </template>
        </Column>
        <Column header="نوع السكن" style="width: 110px" sortable>
          <template #body="{ data }">{{ labelOf(occupancyTypeOptions, data.occupancyType) }}</template>
        </Column>
        <Column header="المجمع" sortable>
          <template #body="{ data }">{{ complexMap[data.complexId] || '—' }}</template>
        </Column>
        <Column header="الدخول" style="width: 120px" sortable>
          <template #body="{ data }">{{ formatDate(data.moveInDate) }}</template>
        </Column>
        <Column header="المغادرة" style="width: 120px" sortable>
          <template #body="{ data }">{{ formatDate(data.moveOutDate) }}</template>
        </Column>
        <Column header="الحالة" style="width: 110px" sortable>
          <template #body="{ data }">{{ labelOf(residentStatusOptions, data.status) }}</template>
        </Column>
        <Column header="رمز الدخول" style="width: 110px">
          <template #body="{ data }">
            <span class="code-badge" :class="{ 'is-on': data.hasLoginCode }">
              {{ data.hasLoginCode ? 'مفعّل' : 'غير مفعّل' }}
            </span>
          </template>
        </Column>
        <Column header="إجراءات" style="width: 200px">
          <template #body="{ data }">
            <RowActions
              show-profile
              show-login-code
              @profile="openProfile(data)"
              @login-code="openLoginCode(data)"
              @edit="openEdit(data)"
              @remove="remove(data)"
            />
          </template>
        </Column>
        <template #empty><div class="empty-box">لا توجد بيانات</div></template>
      </DataTable>
      </template>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل مقيم' : 'إضافة مقيم'"
      :style="{ width: '560px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>المجمع</label>
          <Select
            :disabled="!auth.canSelectComplex"
            v-model="form.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر المجمع"
            checkmark
            append-to="body"
            @update:model-value="() => { form.customerId = ''; form.unitId = '' }"
          />
        </div>
        <div class="field">
          <label>نوع السكن</label>
          <Select
            v-model="form.occupancyType"
            :options="occupancyTypeOptions"
            option-label="label"
            option-value="value"
            placeholder="مالك / مستأجر"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>الحالة</label>
          <Select
            v-model="form.status"
            :options="residentStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الحالة"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>العميل</label>
          <Select
            v-model="form.customerId"
            :options="customerOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر العميل"
            checkmark
            append-to="body"
            filter
          />
        </div>
        <div class="field">
          <label>الوحدة</label>
          <Select
            v-model="form.unitId"
            :options="unitOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر الوحدة"
            checkmark
            append-to="body"
            filter
          />
        </div>
        <div class="field">
          <label>تاريخ الدخول</label>
          <DatePicker v-model="moveInModel" date-format="yy-mm-dd" show-icon />
        </div>
        <div class="field">
          <label>تاريخ المغادرة</label>
          <DatePicker v-model="moveOutModel" date-format="yy-mm-dd" show-icon show-clear />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="حفظ التغييرات" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="codeDialogVisible"
      modal
      header="رمز دخول الساكن"
      :style="{ width: '420px' }"
    >
      <div class="code-dialog">
        <p class="code-hint">
          لإظهار رمز الدخول لـ
          <strong>{{ codeTarget?.customerName || 'الساكن' }}</strong>
          أدخل كلمة مرور حسابك.
        </p>
        <div v-if="!revealedCode" class="field">
          <label>كلمة مرور المدير</label>
          <Password
            v-model="managerPassword"
            :feedback="false"
            toggle-mask
            placeholder="كلمة المرور"
            input-class="w-full"
            class="w-full"
            @keyup.enter="submitRevealCode(false)"
          />
        </div>
        <div v-else class="revealed">
          <label>الرمز</label>
          <div class="revealed-row">
            <InputText :model-value="revealedCode" readonly class="code-value" />
            <Button icon="pi pi-copy" severity="secondary" outlined @click="copyRevealedCode" />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إغلاق" severity="secondary" outlined @click="codeDialogVisible = false" />
          <template v-if="!revealedCode">
            <Button
              label="إظهار الرمز"
              :loading="codeLoading"
              @click="submitRevealCode(false)"
            />
          </template>
          <template v-else>
            <Button
              label="توليد رمز جديد"
              severity="warn"
              :loading="codeLoading"
              @click="submitRevealCode(true)"
            />
          </template>
        </div>
      </template>
    </Dialog>

  </div>
</template>

<style scoped>
.code-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #6b665c;
  background: rgba(107, 102, 92, 0.1);
}

.code-badge.is-on {
  color: #2f6b45;
  background: rgba(47, 107, 69, 0.12);
}

.code-dialog {
  display: grid;
  gap: 14px;
}

.code-hint {
  margin: 0;
  color: var(--muted, #667069);
  line-height: 1.6;
}

.revealed-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.code-value {
  flex: 1;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-align: center;
  text-transform: uppercase;
}

.w-full {
  width: 100%;
}
</style>
