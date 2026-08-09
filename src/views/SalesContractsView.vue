<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type {
  Complex,
  CreateSalesContractDto,
  Customer,
  Employee,
  SalesContract,
  Unit,
} from '@/types'
import { ContractStatus } from '@/types'
import {
  createSalesContract,
  deleteSalesContract,
  getSalesContracts,
  updateSalesContract,
  type SalesContractParams,
} from '@/api/salesContracts'
import { getComplexes } from '@/api/complexes'
import { getCustomers } from '@/api/customers'
import { getUnits } from '@/api/units'
import { getEmployees } from '@/api/employees'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  contractStatusOptions,
  formatDate,
  formatMoney,
  labelOf,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const customers = ref<Customer[]>([])
const units = ref<Unit[]>([])
const employees = ref<Employee[]>([])
const complexMap = ref<Record<string, string>>({})
const customerMap = ref<Record<string, string>>({})
const unitMap = ref<Record<string, string>>({})
const employeeMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<SalesContract, SalesContractParams>(getSalesContracts)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const statusFilter = ref<number | null>(null)
const contractDateModel = ref<Date | null>(null)

const form = reactive<CreateSalesContractDto>({
  contractNumber: null,
  contractDate: new Date().toISOString(),
  sellingPrice: 0,
  discount: 0,
  tax: 0,
  registrationFee: 0,
  downPayment: 0,
  financedAmount: 0,
  remainingAmount: 0,
  contractStatus: ContractStatus.Draft,
  customerId: '',
  unitId: '',
  salesAgentId: '',
  complexId: '',
})

const filteredUnits = computed(() =>
  form.complexId ? units.value.filter((u) => u.complexId === form.complexId) : units.value,
)
const filteredCustomers = computed(() =>
  form.complexId ? customers.value.filter((c) => c.complexId === form.complexId) : customers.value,
)
const filteredEmployees = computed(() =>
  form.complexId ? employees.value.filter((e) => e.complexId === form.complexId) : employees.value,
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
const employeeOptions = computed(() =>
  asSelectOptions(filteredEmployees.value, (e) => e.name || e.id),
)

async function loadLookups() {
  const [complexResult, customerResult, unitResult, employeeResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getCustomers({ Page: 1, PageSize: 500 }),
    getUnits({ Page: 1, PageSize: 500 }),
    getEmployees({ Page: 1, PageSize: 500 }),
  ])
  complexes.value = complexResult.items ?? []
  customers.value = customerResult.items ?? []
  units.value = unitResult.items ?? []
  employees.value = employeeResult.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
  customerMap.value = Object.fromEntries(
    customers.value.map((c) => [c.id, [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id]),
  )
  unitMap.value = Object.fromEntries(units.value.map((u) => [u.id, u.unitNumber || u.id]))
  employeeMap.value = Object.fromEntries(employees.value.map((e) => [e.id, e.name || e.id]))
}

function openCreate() {
  editingId.value = null
  contractDateModel.value = new Date()
  Object.assign(form, {
    contractNumber: null,
    contractDate: new Date().toISOString(),
    sellingPrice: 0,
    discount: 0,
    tax: 0,
    registrationFee: 0,
    downPayment: 0,
    financedAmount: 0,
    remainingAmount: 0,
    contractStatus: ContractStatus.Draft,
    customerId: '',
    unitId: '',
    salesAgentId: '',
    complexId: complexFilter.value || complexes.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: SalesContract) {
  editingId.value = row.id
  contractDateModel.value = row.contractDate ? new Date(row.contractDate) : null
  Object.assign(form, {
    contractNumber: row.contractNumber,
    contractDate: row.contractDate,
    sellingPrice: row.sellingPrice,
    discount: row.discount,
    tax: row.tax,
    registrationFee: row.registrationFee,
    downPayment: row.downPayment,
    financedAmount: row.financedAmount,
    remainingAmount: row.remainingAmount,
    contractStatus: row.contractStatus,
    customerId: row.customerId,
    unitId: row.unitId,
    salesAgentId: row.salesAgentId,
    complexId: row.complexId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.complexId || !form.customerId || !form.unitId || !form.salesAgentId) {
    notify.warning('أكمل بيانات المجمع والعميل والوحدة ووكيل المبيعات')
    return
  }
  if (!contractDateModel.value) {
    notify.warning('حدد تاريخ العقد')
    return
  }
  form.contractDate = contractDateModel.value.toISOString()
  saving.value = true
  try {
    if (editingId.value) {
      await updateSalesContract(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createSalesContract({ ...form })
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

async function remove(row: SalesContract) {
  if (!(await ask(`حذف العقد "${row.contractNumber || row.id.slice(0, 8)}"؟`))) return
  try {
    await deleteSalesContract(row.id)
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
    <PageHeader title="عقود المبيعات" subtitle="إدارة عقود بيع الوحدات">
      <template #actions>
        <Button label="إضافة عقد" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث برقم العقد..." @search="onSearch">
        <template #filters>
          <Select
            v-model="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="كل المجمعات"
            show-clear
            @update:model-value="(v: string | null) => setFilter('ComplexId', v || undefined)"
          />
          <Select
            v-model="statusFilter"
            :options="contractStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="كل الحالات"
            show-clear
            @update:model-value="(v: number | null) => setFilter('ContractStatus', v ?? undefined)"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="8" />
      <DataTable
        v-else
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
      >
        <Column field="contractNumber" header="رقم العقد" style="width: 120px" />
        <Column header="التاريخ" style="width: 110px">
          <template #body="{ data }">{{ formatDate(data.contractDate) }}</template>
        </Column>
        <Column header="سعر البيع" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.sellingPrice) }}</template>
        </Column>
        <Column header="الدفعة الأولى" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.downPayment) }}</template>
        </Column>
        <Column header="المتبقي" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.remainingAmount) }}</template>
        </Column>
        <Column header="الحالة" style="width: 100px">
          <template #body="{ data }">{{ labelOf(contractStatusOptions, data.contractStatus) }}</template>
        </Column>
        <Column header="العميل">
          <template #body="{ data }">{{ customerMap[data.customerId] || data.customerId.slice(0, 8) }}</template>
        </Column>
        <Column header="المجمع">
          <template #body="{ data }">{{ complexMap[data.complexId] || '—' }}</template>
        </Column>
        <Column header="إجراءات" style="width: 130px">
          <template #body="{ data }">
            <RowActions @edit="openEdit(data)" @remove="remove(data)" />
          </template>
        </Column>
        <template #empty><div class="empty-box">لا توجد بيانات</div></template>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل عقد' : 'إضافة عقد'"
      :style="{ width: '680px' }"
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
            @update:model-value="() => { form.customerId = ''; form.unitId = ''; form.salesAgentId = '' }"
          />
        </div>
        <div class="field">
          <label>حالة العقد</label>
          <Select
            v-model="form.contractStatus"
            :options="contractStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الحالة"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>رقم العقد</label>
          <InputText v-model="form.contractNumber" />
        </div>
        <div class="field">
          <label>تاريخ العقد</label>
          <DatePicker v-model="contractDateModel" date-format="yy-mm-dd" show-icon />
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
          <label>وكيل المبيعات</label>
          <Select
            v-model="form.salesAgentId"
            :options="employeeOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر الموظف"
            checkmark
            append-to="body"
            filter
          />
        </div>
        <div class="field">
          <label>سعر البيع</label>
          <InputNumber v-model="form.sellingPrice" :min="0" />
        </div>
        <div class="field">
          <label>الخصم</label>
          <InputNumber v-model="form.discount" :min="0" />
        </div>
        <div class="field">
          <label>الضريبة</label>
          <InputNumber v-model="form.tax" :min="0" />
        </div>
        <div class="field">
          <label>رسوم التسجيل</label>
          <InputNumber v-model="form.registrationFee" :min="0" />
        </div>
        <div class="field">
          <label>الدفعة الأولى</label>
          <InputNumber v-model="form.downPayment" :min="0" />
        </div>
        <div class="field">
          <label>المبلغ الممول</label>
          <InputNumber v-model="form.financedAmount" :min="0" />
        </div>
        <div class="field">
          <label>المبلغ المتبقي</label>
          <InputNumber v-model="form.remainingAmount" :min="0" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="حفظ التغييرات" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
