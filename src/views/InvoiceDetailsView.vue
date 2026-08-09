<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { CreateInvoiceDetailDto, Invoice, InvoiceDetail } from '@/types'
import {
  createInvoiceDetail,
  deleteInvoiceDetail,
  getInvoiceDetails,
  updateInvoiceDetail,
  type InvoiceDetailParams,
} from '@/api/invoiceDetails'
import { getInvoices } from '@/api/invoices'
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
const invoices = ref<Invoice[]>([])
const invoiceMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<InvoiceDetail, InvoiceDetailParams>(getInvoiceDetails)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const invoiceFilter = ref<string | null>(null)

const form = reactive<CreateInvoiceDetailDto>({
  description: null,
  qty: 0,
  price: 0,
  total: 0,
  invoiceId: '',
})

const invoiceOptions = computed(() =>
  asSelectOptions(invoices.value, (inv) =>
    `${inv.id.slice(0, 8)} — ${formatDate(inv.invoiceDate)} — ${formatMoney(inv.total)}`,
  ),
)

watch(
  [() => form.qty, () => form.price],
  () => {
    form.total = (form.qty || 0) * (form.price || 0)
  },
)

async function loadLookups() {
  const result = await getInvoices({ Page: 1, PageSize: 500 })
  invoices.value = result.items ?? []
  invoiceMap.value = Object.fromEntries(
    invoices.value.map((inv) => [
      inv.id,
      `${inv.id.slice(0, 8)} — ${formatDate(inv.invoiceDate)} — ${formatMoney(inv.total)}`,
    ]),
  )
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    description: null,
    qty: 0,
    price: 0,
    total: 0,
    invoiceId: invoiceFilter.value || invoices.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: InvoiceDetail) {
  editingId.value = row.id
  Object.assign(form, {
    description: row.description,
    qty: row.qty,
    price: row.price,
    total: row.total,
    invoiceId: row.invoiceId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.invoiceId) {
    notify.warning('اختر الفاتورة')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateInvoiceDetail(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createInvoiceDetail({ ...form })
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

async function remove(row: InvoiceDetail) {
  if (!(await ask('حذف بند الفاتورة؟'))) return
  try {
    await deleteInvoiceDetail(row.id)
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
    <PageHeader title="تفاصيل الفاتورة" subtitle="بنود ومحتويات الفواتير">
      <template #actions>
        <Button label="إضافة بند" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث بالوصف..." @search="onSearch">
        <template #filters>
          <Select
            v-model="invoiceFilter"
            :options="invoiceOptions"
            option-label="label"
            option-value="id"
            placeholder="كل الفواتير"
            show-clear
            filter
            @update:model-value="(v: string | null) => setFilter('InvoiceId', v || undefined)"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="6" />
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
        <Column field="description" header="الوصف" />
        <Column header="الكمية" style="width: 90px">
          <template #body="{ data }">{{ data.qty }}</template>
        </Column>
        <Column header="السعر" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.price) }}</template>
        </Column>
        <Column header="الإجمالي" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.total) }}</template>
        </Column>
        <Column header="الفاتورة">
          <template #body="{ data }">{{ invoiceMap[data.invoiceId] || data.invoiceId.slice(0, 8) }}</template>
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
      :header="editingId ? 'تعديل بند' : 'إضافة بند'"
      :style="{ width: '520px' }"
    >
      <div class="form-grid">
        <div class="field span-2">
          <label>الفاتورة</label>
          <Select
            v-model="form.invoiceId"
            :options="invoiceOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر الفاتورة"
            checkmark
            append-to="body"
            filter
          />
        </div>
        <div class="field span-2">
          <label>الوصف</label>
          <InputText v-model="form.description" />
        </div>
        <div class="field">
          <label>الكمية</label>
          <InputNumber v-model="form.qty" :min="0" />
        </div>
        <div class="field">
          <label>السعر</label>
          <InputNumber v-model="form.price" :min="0" />
        </div>
        <div class="field">
          <label>الإجمالي</label>
          <InputNumber v-model="form.total" :min="0" />
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

<style scoped>
.span-2 {
  grid-column: span 2;
}
</style>
