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
import type { CreateReceiptDto, Payment, Receipt } from '@/types'
import {
  createReceipt,
  deleteReceipt,
  getReceipts,
  updateReceipt,
  type ReceiptParams,
} from '@/api/receipts'
import { getPayments } from '@/api/payments'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions, formatDate, formatMoney } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const payments = ref<Payment[]>([])
const paymentMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<Receipt, ReceiptParams>(getReceipts)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const paymentFilter = ref<string | null>(null)
const dateModel = ref<Date | null>(null)

const form = reactive<CreateReceiptDto>({
  receiptNumber: null,
  date: new Date().toISOString(),
  amount: 0,
  paymentId: '',
})

const paymentOptions = computed(() =>
  asSelectOptions(payments.value, (p) =>
    p.referenceNumber
      ? `${p.referenceNumber} — ${formatMoney(p.amount)} — ${formatDate(p.paymentDate)}`
      : `${formatMoney(p.amount)} — ${formatDate(p.paymentDate)}`,
  ),
)

async function loadLookups() {
  const result = await getPayments({ Page: 1, PageSize: 500 })
  payments.value = result.items ?? []
  paymentMap.value = Object.fromEntries(
    payments.value.map((p) => [
      p.id,
      p.referenceNumber
        ? `${p.referenceNumber} — ${formatMoney(p.amount)} — ${formatDate(p.paymentDate)}`
        : `${formatMoney(p.amount)} — ${formatDate(p.paymentDate)}`,
    ]),
  )
}

function openCreate() {
  editingId.value = null
  dateModel.value = new Date()
  Object.assign(form, {
    receiptNumber: null,
    date: new Date().toISOString(),
    amount: 0,
    paymentId: paymentFilter.value || payments.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Receipt) {
  editingId.value = row.id
  dateModel.value = row.date ? new Date(row.date) : null
  Object.assign(form, {
    receiptNumber: row.receiptNumber,
    date: row.date,
    amount: row.amount,
    paymentId: row.paymentId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.paymentId) {
    notify.warning('اختر الدفعة')
    return
  }
  if (!dateModel.value) {
    notify.warning('حدد تاريخ الوصل')
    return
  }
  form.date = dateModel.value.toISOString()
  saving.value = true
  try {
    if (editingId.value) {
      await updateReceipt(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createReceipt({ ...form })
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

async function remove(row: Receipt) {
  if (!(await ask(`حذف الوصل "${row.receiptNumber || row.id.slice(0, 8)}"؟`))) return
  try {
    await deleteReceipt(row.id)
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
    <PageHeader title="الوصولات" subtitle="إيصالات استلام المدفوعات">
      <template #actions>
        <Button label="إضافة وصل" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث برقم الوصل..." @search="onSearch">
        <template #filters>
          <Select
            v-model="paymentFilter"
            :options="paymentOptions"
            option-label="label"
            option-value="id"
            placeholder="كل المدفوعات"
            show-clear
            filter
            @update:model-value="(v: string | null) => setFilter('PaymentId', v || undefined)"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="5" />
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
        <Column field="receiptNumber" header="رقم الوصل" style="width: 140px" />
        <Column header="التاريخ" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.date) }}</template>
        </Column>
        <Column header="المبلغ" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
        </Column>
        <Column header="الدفعة">
          <template #body="{ data }">{{ paymentMap[data.paymentId] || data.paymentId.slice(0, 8) }}</template>
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
      :header="editingId ? 'تعديل وصل' : 'إضافة وصل'"
      :style="{ width: '520px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>رقم الوصل</label>
          <InputText v-model="form.receiptNumber" />
        </div>
        <div class="field">
          <label>التاريخ</label>
          <DatePicker v-model="dateModel" date-format="yy-mm-dd" show-icon />
        </div>
        <div class="field">
          <label>المبلغ</label>
          <InputNumber v-model="form.amount" :min="0" />
        </div>
        <div class="field">
          <label>الدفعة</label>
          <Select
            v-model="form.paymentId"
            :options="paymentOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر الدفعة"
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
