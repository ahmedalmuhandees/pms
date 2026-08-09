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
  CreatePaymentDto,
  Customer,
  Employee,
  Installment,
  Payment,
  SalesContract,
} from '@/types'
import { PaymentMethod } from '@/types'
import {
  createPayment,
  deletePayment,
  getPayments,
  updatePayment,
  type PaymentParams,
} from '@/api/payments'
import { getComplexes } from '@/api/complexes'
import { getCustomers } from '@/api/customers'
import { getSalesContracts } from '@/api/salesContracts'
import { getInstallments } from '@/api/installments'
import { getEmployees } from '@/api/employees'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatDate,
  formatMoney,
  labelOf,
  paymentMethodOptions,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const customers = ref<Customer[]>([])
const contracts = ref<SalesContract[]>([])
const installments = ref<Installment[]>([])
const employees = ref<Employee[]>([])
const complexMap = ref<Record<string, string>>({})
const customerMap = ref<Record<string, string>>({})
const contractMap = ref<Record<string, string>>({})
const employeeMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<Payment, PaymentParams>(getPayments)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const methodFilter = ref<number | null>(null)
const paymentDateModel = ref<Date | null>(null)

const form = reactive<CreatePaymentDto>({
  paymentMethod: PaymentMethod.Cash,
  referenceNumber: null,
  amount: 0,
  paymentDate: new Date().toISOString(),
  installmentId: null,
  contractId: '',
  customerId: '',
  receivedById: '',
  complexId: '',
})

const filteredCustomers = computed(() =>
  form.complexId ? customers.value.filter((c) => c.complexId === form.complexId) : customers.value,
)
const filteredContracts = computed(() =>
  form.complexId ? contracts.value.filter((c) => c.complexId === form.complexId) : contracts.value,
)
const filteredInstallments = computed(() =>
  form.complexId ? installments.value.filter((i) => i.complexId === form.complexId) : installments.value,
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
const contractOptions = computed(() =>
  asSelectOptions(filteredContracts.value, (c) => c.contractNumber || c.id.slice(0, 8)),
)
const installmentOptions = computed(() =>
  asSelectOptions(filteredInstallments.value, (i) =>
    `${formatDate(i.dueDate)} — ${formatMoney(i.amount)}`,
  ),
)
const employeeOptions = computed(() =>
  asSelectOptions(filteredEmployees.value, (e) => e.name || e.id),
)

async function loadLookups() {
  const [complexResult, customerResult, contractResult, installmentResult, employeeResult] =
    await Promise.all([
      getComplexes({ Page: 1, PageSize: 200 }),
      getCustomers({ Page: 1, PageSize: 500 }),
      getSalesContracts({ Page: 1, PageSize: 500 }),
      getInstallments({ Page: 1, PageSize: 500 }),
      getEmployees({ Page: 1, PageSize: 500 }),
    ])
  complexes.value = complexResult.items ?? []
  customers.value = customerResult.items ?? []
  contracts.value = contractResult.items ?? []
  installments.value = installmentResult.items ?? []
  employees.value = employeeResult.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
  customerMap.value = Object.fromEntries(
    customers.value.map((c) => [c.id, [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id]),
  )
  contractMap.value = Object.fromEntries(
    contracts.value.map((c) => [c.id, c.contractNumber || c.id.slice(0, 8)]),
  )
  employeeMap.value = Object.fromEntries(employees.value.map((e) => [e.id, e.name || e.id]))
}

function openCreate() {
  editingId.value = null
  paymentDateModel.value = new Date()
  Object.assign(form, {
    paymentMethod: PaymentMethod.Cash,
    referenceNumber: null,
    amount: 0,
    paymentDate: new Date().toISOString(),
    installmentId: null,
    contractId: '',
    customerId: '',
    receivedById: '',
    complexId: complexFilter.value || complexes.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Payment) {
  editingId.value = row.id
  paymentDateModel.value = row.paymentDate ? new Date(row.paymentDate) : null
  Object.assign(form, {
    paymentMethod: row.paymentMethod,
    referenceNumber: row.referenceNumber,
    amount: row.amount,
    paymentDate: row.paymentDate,
    installmentId: row.installmentId,
    contractId: row.contractId,
    customerId: row.customerId,
    receivedById: row.receivedById,
    complexId: row.complexId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.complexId || !form.contractId || !form.customerId || !form.receivedById) {
    notify.warning('أكمل بيانات المجمع والعقد والعميل والمستلم')
    return
  }
  if (!paymentDateModel.value) {
    notify.warning('حدد تاريخ الدفع')
    return
  }
  form.paymentDate = paymentDateModel.value.toISOString()
  saving.value = true
  try {
    if (editingId.value) {
      await updatePayment(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createPayment({ ...form })
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

async function remove(row: Payment) {
  if (!(await ask('حذف الدفعة؟'))) return
  try {
    await deletePayment(row.id)
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
    <PageHeader title="المدفوعات" subtitle="تسجيل ومتابعة المدفوعات">
      <template #actions>
        <Button label="إضافة دفعة" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث بالمرجع..." @search="onSearch">
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
            v-model="methodFilter"
            :options="paymentMethodOptions"
            option-label="label"
            option-value="value"
            placeholder="كل الطرق"
            show-clear
            @update:model-value="(v: number | null) => setFilter('PaymentMethod', v ?? undefined)"
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
        <Column header="الطريقة" style="width: 110px">
          <template #body="{ data }">{{ labelOf(paymentMethodOptions, data.paymentMethod) }}</template>
        </Column>
        <Column field="referenceNumber" header="المرجع" style="width: 120px" />
        <Column header="المبلغ" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
        </Column>
        <Column header="التاريخ" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.paymentDate) }}</template>
        </Column>
        <Column header="العميل">
          <template #body="{ data }">{{ customerMap[data.customerId] || data.customerId.slice(0, 8) }}</template>
        </Column>
        <Column header="العقد">
          <template #body="{ data }">{{ contractMap[data.contractId] || data.contractId.slice(0, 8) }}</template>
        </Column>
        <Column header="المستلم">
          <template #body="{ data }">{{ employeeMap[data.receivedById] || data.receivedById.slice(0, 8) }}</template>
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
      :header="editingId ? 'تعديل دفعة' : 'إضافة دفعة'"
      :style="{ width: '620px' }"
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
            @update:model-value="() => {
              form.customerId = ''
              form.contractId = ''
              form.installmentId = null
              form.receivedById = ''
            }"
          />
        </div>
        <div class="field">
          <label>طريقة الدفع</label>
          <Select
            v-model="form.paymentMethod"
            :options="paymentMethodOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الطريقة"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>رقم المرجع</label>
          <InputText v-model="form.referenceNumber" />
        </div>
        <div class="field">
          <label>تاريخ الدفع</label>
          <DatePicker v-model="paymentDateModel" date-format="yy-mm-dd" show-icon />
        </div>
        <div class="field">
          <label>المبلغ</label>
          <InputNumber v-model="form.amount" :min="0" />
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
          <label>العقد</label>
          <Select
            v-model="form.contractId"
            :options="contractOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر العقد"
            checkmark
            append-to="body"
            filter
          />
        </div>
        <div class="field">
          <label>القسط (اختياري)</label>
          <Select
            v-model="form.installmentId"
            :options="installmentOptions"
            option-label="label"
            option-value="id"
            placeholder="بدون قسط"
            show-clear
            checkmark
            append-to="body"
            filter
          />
        </div>
        <div class="field">
          <label>استلمها</label>
          <Select
            v-model="form.receivedById"
            :options="employeeOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر الموظف"
            checkmark
            append-to="body"
            filter
          />
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
