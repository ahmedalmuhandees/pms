<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import type {
  Block,
  Building,
  Complex,
  CreateInstallmentDto,
  Customer,
  Floor,
  Installment,
  InstallmentPlan,
  SalesContract,
  Unit,
} from '@/types'
import { InstallmentStatus } from '@/types'
import {
  createInstallment,
  deleteInstallment,
  getInstallments,
  updateInstallment,
} from '@/api/installments'
import { getComplexes } from '@/api/complexes'
import { getBlocks } from '@/api/blocks'
import { getBuildings } from '@/api/buildings'
import { getFloors } from '@/api/floors'
import { getUnits } from '@/api/units'
import { getCustomers } from '@/api/customers'
import { getSalesContracts } from '@/api/salesContracts'
import { getInstallmentPlans } from '@/api/installmentPlans'
import { getErrorMessage } from '@/api/client'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatDate,
  formatMoney,
  installmentStatusLabel,
  installmentStatusOptions,
  isInstallmentDue,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

interface InstallmentRow extends Installment {
  customerName: string
  unitId: string | null
  unitNumber: string
  blockId: string | null
  blockName: string
  contractNumber: string
}

const notify = useNotify()
const { ask } = useConfirmAction()

const loading = ref(true)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)

const complexes = ref<Complex[]>([])
const blocks = ref<Block[]>([])
const buildings = ref<Building[]>([])
const floors = ref<Floor[]>([])
const units = ref<Unit[]>([])
const customers = ref<Customer[]>([])
const contracts = ref<SalesContract[]>([])
const plans = ref<InstallmentPlan[]>([])
const rows = ref<InstallmentRow[]>([])

const search = ref('')
const complexFilter = ref<string | null>(null)
const blockFilter = ref<string | null>(null)
const unitFilter = ref<string | null>(null)
const dueOnly = ref(true)

const dueDateModel = ref<Date | null>(null)
const paidDateModel = ref<Date | null>(null)
const form = reactive<CreateInstallmentDto>({
  dueDate: new Date().toISOString(),
  amount: 0,
  paidAmount: 0,
  penalty: 0,
  status: InstallmentStatus.Pending,
  paidDate: null,
  planID: '',
  complexId: '',
})

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)
const blockOptions = computed(() => {
  const list = complexFilter.value
    ? blocks.value.filter((b) => b.complexId === complexFilter.value)
    : blocks.value
  return asSelectOptions(list, (b) => b.name || b.id.slice(0, 8))
})
const unitOptions = computed(() => {
  let list = units.value
  if (complexFilter.value) list = list.filter((u) => u.complexId === complexFilter.value)
  if (blockFilter.value) {
    const floorToBuilding = Object.fromEntries(floors.value.map((f) => [f.id, f.buildingId]))
    const buildingToBlock = Object.fromEntries(buildings.value.map((b) => [b.id, b.blockId]))
    list = list.filter((u) => {
      const buildingId = floorToBuilding[u.floorId]
      return buildingToBlock[buildingId] === blockFilter.value
    })
  }
  return asSelectOptions(list, (u) => u.unitNumber || u.id.slice(0, 8))
})
const formPlanOptions = computed(() => {
  const list = form.complexId
    ? plans.value.filter((p) => p.complexId === form.complexId)
    : plans.value
  return asSelectOptions(list, (p) => {
    const contract = contracts.value.find((c) => c.id === p.contractId)
    const customer = customers.value.find((c) => c.id === contract?.customerId)
    const name = customer
      ? [customer.firstName, customer.lastName].filter(Boolean).join(' ')
      : p.id.slice(0, 8)
    return `${name} — ${p.totalInstallments} قسط`
  })
})

const displayedRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value
    .filter((row) => {
      if (dueOnly.value && !isInstallmentDue(row.status, row.dueDate)) return false
      if (complexFilter.value && row.complexId !== complexFilter.value) return false
      if (blockFilter.value && row.blockId !== blockFilter.value) return false
      if (unitFilter.value && row.unitId !== unitFilter.value) return false
      if (!q) return true
      return (
        row.customerName.toLowerCase().includes(q) ||
        row.unitNumber.toLowerCase().includes(q) ||
        row.blockName.toLowerCase().includes(q) ||
        row.contractNumber.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
})

const dueCount = computed(() => displayedRows.value.length)
const dueAmount = computed(() =>
  displayedRows.value.reduce((sum, r) => sum + Math.max(0, r.amount - (r.paidAmount || 0)), 0),
)

function remainingOf(row: Installment) {
  return Math.max(0, (row.amount || 0) - (row.paidAmount || 0))
}

function resolveUnitBlock(unitId: string | undefined | null) {
  if (!unitId) return { unitId: null, unitNumber: '—', blockId: null, blockName: '—' }
  const unit = units.value.find((u) => u.id === unitId)
  if (!unit) return { unitId, unitNumber: unitId.slice(0, 8), blockId: null, blockName: '—' }
  const floor = floors.value.find((f) => f.id === unit.floorId)
  const building = floor ? buildings.value.find((b) => b.id === floor.buildingId) : undefined
  const block = building ? blocks.value.find((b) => b.id === building.blockId) : undefined
  return {
    unitId: unit.id,
    unitNumber: unit.unitNumber || unit.id.slice(0, 8),
    blockId: block?.id ?? null,
    blockName: block?.name || '—',
  }
}

function enrich(items: Installment[]): InstallmentRow[] {
  const planById = Object.fromEntries(plans.value.map((p) => [p.id, p]))
  const contractById = Object.fromEntries(contracts.value.map((c) => [c.id, c]))
  const customerById = Object.fromEntries(customers.value.map((c) => [c.id, c]))

  return items.map((item) => {
    const plan = planById[item.planID]
    const contract = plan ? contractById[plan.contractId] : undefined
    const customer = contract ? customerById[contract.customerId] : undefined
    const place = resolveUnitBlock(contract?.unitId)
    return {
      ...item,
      customerName: customer
        ? [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—'
        : '—',
      unitId: place.unitId,
      unitNumber: place.unitNumber,
      blockId: place.blockId,
      blockName: place.blockName,
      contractNumber: contract?.contractNumber || contract?.id.slice(0, 8) || '—',
    }
  })
}

async function loadLookups() {
  const [
    complexResult,
    blockResult,
    buildingResult,
    floorResult,
    unitResult,
    customerResult,
    contractResult,
    planResult,
  ] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getBlocks({ Page: 1, PageSize: 500 }),
    getBuildings({ Page: 1, PageSize: 500 }),
    getFloors({ Page: 1, PageSize: 500 }),
    getUnits({ Page: 1, PageSize: 500 }),
    getCustomers({ Page: 1, PageSize: 500 }),
    getSalesContracts({ Page: 1, PageSize: 500 }),
    getInstallmentPlans({ Page: 1, PageSize: 500 }),
  ])
  complexes.value = complexResult.items ?? []
  blocks.value = blockResult.items ?? []
  buildings.value = buildingResult.items ?? []
  floors.value = floorResult.items ?? []
  units.value = unitResult.items ?? []
  customers.value = customerResult.items ?? []
  contracts.value = contractResult.items ?? []
  plans.value = planResult.items ?? []
}

async function load() {
  loading.value = true
  try {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const result = await getInstallments({
      Page: 1,
      PageSize: 500,
      ComplexId: complexFilter.value || undefined,
      DueTo: dueOnly.value ? end.toISOString() : undefined,
    })
    rows.value = enrich(result.items ?? [])
  } catch (error) {
    notify.error(getErrorMessage(error))
    rows.value = []
  } finally {
    loading.value = false
  }
}

function onComplexFilter(value: string | null) {
  complexFilter.value = value
  blockFilter.value = null
  unitFilter.value = null
  void load()
}

function onBlockFilter(value: string | null) {
  blockFilter.value = value
  unitFilter.value = null
}

watch(dueOnly, () => {
  void load()
})

function openCreate() {
  editingId.value = null
  dueDateModel.value = new Date()
  paidDateModel.value = null
  Object.assign(form, {
    dueDate: new Date().toISOString(),
    amount: 0,
    paidAmount: 0,
    penalty: 0,
    status: InstallmentStatus.Pending,
    paidDate: null,
    planID: '',
    complexId: complexFilter.value || complexes.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: InstallmentRow) {
  editingId.value = row.id
  dueDateModel.value = row.dueDate ? new Date(row.dueDate) : null
  paidDateModel.value = row.paidDate ? new Date(row.paidDate) : null
  Object.assign(form, {
    dueDate: row.dueDate,
    amount: row.amount,
    paidAmount: row.paidAmount,
    penalty: row.penalty,
    status: row.status,
    paidDate: row.paidDate,
    planID: row.planID,
    complexId: row.complexId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.complexId || !form.planID) {
    notify.warning('اختر المجمع وخطة التقسيط')
    return
  }
  if (!dueDateModel.value) {
    notify.warning('حدد تاريخ الاستحقاق')
    return
  }
  form.dueDate = dueDateModel.value.toISOString()
  form.paidDate = paidDateModel.value ? paidDateModel.value.toISOString() : null
  saving.value = true
  try {
    if (editingId.value) {
      await updateInstallment(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createInstallment({ ...form })
      notify.success('تم الإنشاء')
    }
    dialogVisible.value = false
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function remove(row: InstallmentRow) {
  if (!(await ask(`حذف قسط العميل "${row.customerName}"؟`))) return
  try {
    await deleteInstallment(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

onMounted(async () => {
  try {
    await loadLookups()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="الأقساط المستحقة" subtitle="متابعة أقساط العملاء حسب الوحدة والبلوك">
      <template #actions>
        <Button label="إضافة قسط" icon="pi pi-plus" severity="secondary" outlined @click="openCreate" />
      </template>
    </PageHeader>

    <div class="summary-row">
      <div class="summary-card is-due">
        <span>{{ dueOnly ? 'أقساط معروضة (مستحقة)' : 'أقساط معروضة' }}</span>
        <strong>{{ dueCount }}</strong>
      </div>
      <div class="summary-card">
        <span>إجمالي المتبقي</span>
        <strong>{{ formatMoney(dueAmount) }}</strong>
      </div>
    </div>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث بالعميل أو الوحدة أو البلوك أو رقم العقد...">
        <template #filters>
          <Select
            v-model="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="المجمع"
            show-clear
            @update:model-value="onComplexFilter"
          />
          <Select
            v-model="blockFilter"
            :options="blockOptions"
            option-label="label"
            option-value="id"
            placeholder="البلوك"
            show-clear
            @update:model-value="onBlockFilter"
          />
          <Select
            v-model="unitFilter"
            :options="unitOptions"
            option-label="label"
            option-value="id"
            placeholder="الوحدة"
            show-clear
            filter
          />
          <label class="due-toggle">
            <ToggleSwitch v-model="dueOnly" />
            <span>المستحقة فقط</span>
          </label>
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && rows.length === 0" :rows="8" :columns="8" />
      <DataTable
        v-else
        :value="displayedRows"
        :loading="loading"
        paginator
        :rows="20"
        :rows-per-page-options="[10, 20, 50]"
        striped-rows
        size="small"
      >
        <Column header="العميل">
          <template #body="{ data }">
            <div class="primary-cell">{{ data.customerName }}</div>
          </template>
        </Column>
        <Column header="الوحدة" style="width: 110px">
          <template #body="{ data }">{{ data.unitNumber }}</template>
        </Column>
        <Column header="البلوك" style="width: 120px">
          <template #body="{ data }">{{ data.blockName }}</template>
        </Column>
        <Column header="رقم العقد" style="width: 110px">
          <template #body="{ data }">{{ data.contractNumber }}</template>
        </Column>
        <Column header="الاستحقاق" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.dueDate) }}</template>
        </Column>
        <Column header="المبلغ" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
        </Column>
        <Column header="المتبقي" style="width: 120px">
          <template #body="{ data }">
            <strong class="remain">{{ formatMoney(remainingOf(data)) }}</strong>
          </template>
        </Column>
        <Column header="الحالة" style="width: 110px">
          <template #body="{ data }">
            <span class="status-pill" :class="{ due: isInstallmentDue(data.status, data.dueDate) }">
              {{ installmentStatusLabel(data.status, data.dueDate) }}
            </span>
          </template>
        </Column>
        <Column header="إجراءات" style="width: 120px">
          <template #body="{ data }">
            <RowActions @edit="openEdit(data)" @remove="remove(data)" />
          </template>
        </Column>
        <template #empty>
          <div class="empty-box">
            {{ dueOnly ? 'لا توجد أقساط مستحقة حالياً' : 'لا توجد أقساط' }}
          </div>
        </template>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل قسط' : 'إضافة قسط'"
      :style="{ width: '560px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>المجمع</label>
          <Select
            v-model="form.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر المجمع"
            checkmark
            append-to="body"
            @update:model-value="() => { form.planID = '' }"
          />
        </div>
        <div class="field">
          <label>خطة التقسيط / العميل</label>
          <Select
            v-model="form.planID"
            :options="formPlanOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر الخطة"
            checkmark
            append-to="body"
            filter
          />
        </div>
        <div class="field">
          <label>الحالة</label>
          <Select
            v-model="form.status"
            :options="installmentStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الحالة"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>تاريخ الاستحقاق</label>
          <DatePicker v-model="dueDateModel" date-format="yy-mm-dd" show-icon />
        </div>
        <div class="field">
          <label>تاريخ الدفع</label>
          <DatePicker v-model="paidDateModel" date-format="yy-mm-dd" show-icon show-clear />
        </div>
        <div class="field">
          <label>المبلغ</label>
          <InputNumber v-model="form.amount" :min="0" />
        </div>
        <div class="field">
          <label>المبلغ المدفوع</label>
          <InputNumber v-model="form.paidAmount" :min="0" />
        </div>
        <div class="field">
          <label>الغرامة</label>
          <InputNumber v-model="form.penalty" :min="0" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="حفظ" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.summary-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.summary-card span {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.summary-card strong {
  font-size: 1.25rem;
  font-weight: 800;
}

.summary-card.is-due {
  border-color: rgba(192, 57, 43, 0.25);
  background: rgba(192, 57, 43, 0.06);
}

.due-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text);
  cursor: pointer;
}

.primary-cell {
  font-weight: 800;
  color: var(--text);
}

.remain {
  color: #b45309;
}

.status-pill {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  background: rgba(100, 116, 139, 0.12);
  color: #475569;
}

.status-pill.due {
  background: rgba(192, 57, 43, 0.12);
  color: #c0392b;
}

@media (max-width: 720px) {
  .summary-row {
    grid-template-columns: 1fr;
  }
}
</style>
