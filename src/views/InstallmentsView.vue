<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, CreateInstallmentDto, Installment, InstallmentPlan } from '@/types'
import { InstallmentStatus } from '@/types'
import {
  createInstallment,
  deleteInstallment,
  getInstallments,
  updateInstallment,
  type InstallmentParams,
} from '@/api/installments'
import { getComplexes } from '@/api/complexes'
import { getInstallmentPlans } from '@/api/installmentPlans'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatDate,
  formatMoney,
  installmentStatusOptions,
  labelOf,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const plans = ref<InstallmentPlan[]>([])
const complexMap = ref<Record<string, string>>({})
const planMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<Installment, InstallmentParams>(getInstallments)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const statusFilter = ref<number | null>(null)
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

const filteredPlans = computed(() =>
  form.complexId ? plans.value.filter((p) => p.complexId === form.complexId) : plans.value,
)
const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)
const planOptions = computed(() =>
  asSelectOptions(filteredPlans.value, (p) =>
    `${p.totalInstallments} قسط — ${p.id.slice(0, 8)}`,
  ),
)

async function loadLookups() {
  const [complexResult, planResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getInstallmentPlans({ Page: 1, PageSize: 500 }),
  ])
  complexes.value = complexResult.items ?? []
  plans.value = planResult.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
  planMap.value = Object.fromEntries(
    plans.value.map((p) => [p.id, `${p.totalInstallments} قسط — ${p.id.slice(0, 8)}`]),
  )
}

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

function openEdit(row: Installment) {
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

async function remove(row: Installment) {
  if (!(await ask('حذف القسط؟'))) return
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
    <PageHeader title="الأقساط" subtitle="متابعة أقساط خطط التقسيط">
      <template #actions>
        <Button label="إضافة قسط" icon="pi pi-plus" @click="openCreate" />
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
            :options="installmentStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="كل الحالات"
            show-clear
            @update:model-value="(v: number | null) => setFilter('Status', v ?? undefined)"
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
        <Column header="الاستحقاق" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.dueDate) }}</template>
        </Column>
        <Column header="المبلغ" style="width: 110px">
          <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
        </Column>
        <Column header="المدفوع" style="width: 110px">
          <template #body="{ data }">{{ formatMoney(data.paidAmount) }}</template>
        </Column>
        <Column header="الغرامة" style="width: 100px">
          <template #body="{ data }">{{ formatMoney(data.penalty) }}</template>
        </Column>
        <Column header="الحالة" style="width: 110px">
          <template #body="{ data }">{{ labelOf(installmentStatusOptions, data.status) }}</template>
        </Column>
        <Column header="تاريخ الدفع" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.paidDate) }}</template>
        </Column>
        <Column header="الخطة">
          <template #body="{ data }">{{ planMap[data.planID] || data.planID.slice(0, 8) }}</template>
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
          <label>خطة التقسيط</label>
          <Select
            v-model="form.planID"
            :options="planOptions"
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
          <Button label="حفظ التغييرات" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
