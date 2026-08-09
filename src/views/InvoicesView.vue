<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, CreateInvoiceDto, Customer, Invoice, SalesContract } from '@/types'
import { InvoiceStatus, InvoiceType } from '@/types'
import {
  createInvoice,
  deleteInvoice,
  getInvoices,
  updateInvoice,
  type InvoiceParams,
} from '@/api/invoices'
import { getComplexes } from '@/api/complexes'
import { getCustomers } from '@/api/customers'
import { getSalesContracts } from '@/api/salesContracts'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatDate,
  formatMoney,
  invoiceStatusOptions,
  invoiceTypeOptions,
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
const contracts = ref<SalesContract[]>([])
const complexMap = ref<Record<string, string>>({})
const customerMap = ref<Record<string, string>>({})
const contractMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<Invoice, InvoiceParams>(getInvoices)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const statusFilter = ref<number | null>(null)
const typeFilter = ref<number | null>(null)
const invoiceDateModel = ref<Date | null>(null)

const form = reactive<CreateInvoiceDto>({
  invoiceType: InvoiceType.Sales,
  invoiceDate: new Date().toISOString(),
  total: 0,
  tax: 0,
  status: InvoiceStatus.Draft,
  customerId: '',
  contractId: null,
  complexId: '',
})

const filteredCustomers = computed(() =>
  form.complexId ? customers.value.filter((c) => c.complexId === form.complexId) : customers.value,
)
const filteredContracts = computed(() =>
  form.complexId ? contracts.value.filter((c) => c.complexId === form.complexId) : contracts.value,
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

async function loadLookups() {
  const [complexResult, customerResult, contractResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getCustomers({ Page: 1, PageSize: 500 }),
    getSalesContracts({ Page: 1, PageSize: 500 }),
  ])
  complexes.value = complexResult.items ?? []
  customers.value = customerResult.items ?? []
  contracts.value = contractResult.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
  customerMap.value = Object.fromEntries(
    customers.value.map((c) => [c.id, [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id]),
  )
  contractMap.value = Object.fromEntries(
    contracts.value.map((c) => [c.id, c.contractNumber || c.id.slice(0, 8)]),
  )
}

function openCreate() {
  editingId.value = null
  invoiceDateModel.value = new Date()
  Object.assign(form, {
    invoiceType: InvoiceType.Sales,
    invoiceDate: new Date().toISOString(),
    total: 0,
    tax: 0,
    status: InvoiceStatus.Draft,
    customerId: '',
    contractId: null,
    complexId: complexFilter.value || complexes.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Invoice) {
  editingId.value = row.id
  invoiceDateModel.value = row.invoiceDate ? new Date(row.invoiceDate) : null
  Object.assign(form, {
    invoiceType: row.invoiceType,
    invoiceDate: row.invoiceDate,
    total: row.total,
    tax: row.tax,
    status: row.status,
    customerId: row.customerId,
    contractId: row.contractId,
    complexId: row.complexId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.complexId || !form.customerId) {
    notify.warning('اختر المجمع والعميل')
    return
  }
  if (!invoiceDateModel.value) {
    notify.warning('حدد تاريخ الفاتورة')
    return
  }
  form.invoiceDate = invoiceDateModel.value.toISOString()
  saving.value = true
  try {
    if (editingId.value) {
      await updateInvoice(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createInvoice({ ...form })
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

async function remove(row: Invoice) {
  if (!(await ask('حذف الفاتورة؟'))) return
  try {
    await deleteInvoice(row.id)
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
    <PageHeader title="الفواتير" subtitle="إصدار ومتابعة الفواتير">
      <template #actions>
        <Button label="إضافة فاتورة" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث..." @search="onSearch">
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
            :options="invoiceStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="كل الحالات"
            show-clear
            @update:model-value="(v: number | null) => setFilter('Status', v ?? undefined)"
          />
          <Select
            v-model="typeFilter"
            :options="invoiceTypeOptions"
            option-label="label"
            option-value="value"
            placeholder="كل الأنواع"
            show-clear
            @update:model-value="(v: number | null) => setFilter('InvoiceType', v ?? undefined)"
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
        <Column header="النوع" style="width: 100px">
          <template #body="{ data }">{{ labelOf(invoiceTypeOptions, data.invoiceType) }}</template>
        </Column>
        <Column header="التاريخ" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.invoiceDate) }}</template>
        </Column>
        <Column header="الإجمالي" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.total) }}</template>
        </Column>
        <Column header="الضريبة" style="width: 110px">
          <template #body="{ data }">{{ formatMoney(data.tax) }}</template>
        </Column>
        <Column header="الحالة" style="width: 100px">
          <template #body="{ data }">{{ labelOf(invoiceStatusOptions, data.status) }}</template>
        </Column>
        <Column header="العميل">
          <template #body="{ data }">{{ customerMap[data.customerId] || data.customerId.slice(0, 8) }}</template>
        </Column>
        <Column header="العقد">
          <template #body="{ data }">
            {{ data.contractId ? (contractMap[data.contractId] || data.contractId.slice(0, 8)) : '—' }}
          </template>
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
      :header="editingId ? 'تعديل فاتورة' : 'إضافة فاتورة'"
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
            @update:model-value="() => { form.customerId = ''; form.contractId = null }"
          />
        </div>
        <div class="field">
          <label>نوع الفاتورة</label>
          <Select
            v-model="form.invoiceType"
            :options="invoiceTypeOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر النوع"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>الحالة</label>
          <Select
            v-model="form.status"
            :options="invoiceStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الحالة"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>تاريخ الفاتورة</label>
          <DatePicker v-model="invoiceDateModel" date-format="yy-mm-dd" show-icon />
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
          <label>العقد (اختياري)</label>
          <Select
            v-model="form.contractId"
            :options="contractOptions"
            option-label="label"
            option-value="id"
            placeholder="بدون عقد"
            show-clear
            checkmark
            append-to="body"
            filter
          />
        </div>
        <div class="field">
          <label>الإجمالي</label>
          <InputNumber v-model="form.total" :min="0" />
        </div>
        <div class="field">
          <label>الضريبة</label>
          <InputNumber v-model="form.tax" :min="0" />
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
