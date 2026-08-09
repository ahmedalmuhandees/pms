<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, CreateInstallmentPlanDto, InstallmentPlan, SalesContract } from '@/types'
import {
  createInstallmentPlan,
  deleteInstallmentPlan,
  getInstallmentPlans,
  updateInstallmentPlan,
  type InstallmentPlanParams,
} from '@/api/installmentPlans'
import { getComplexes } from '@/api/complexes'
import { getSalesContracts } from '@/api/salesContracts'
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
const complexes = ref<Complex[]>([])
const contracts = ref<SalesContract[]>([])
const complexMap = ref<Record<string, string>>({})
const contractMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<InstallmentPlan, InstallmentPlanParams>(getInstallmentPlans)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const firstDueDateModel = ref<Date | null>(null)
const lastDueDateModel = ref<Date | null>(null)

const form = reactive<CreateInstallmentPlanDto>({
  totalInstallments: 0,
  installmentAmount: 0,
  interestRate: 0,
  firstDueDate: new Date().toISOString(),
  lastDueDate: new Date().toISOString(),
  contractId: '',
  complexId: '',
})

const filteredContracts = computed(() =>
  form.complexId ? contracts.value.filter((c) => c.complexId === form.complexId) : contracts.value,
)
const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)
const contractOptions = computed(() =>
  asSelectOptions(filteredContracts.value, (c) => c.contractNumber || c.id.slice(0, 8)),
)

async function loadLookups() {
  const [complexResult, contractResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getSalesContracts({ Page: 1, PageSize: 500 }),
  ])
  complexes.value = complexResult.items ?? []
  contracts.value = contractResult.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
  contractMap.value = Object.fromEntries(
    contracts.value.map((c) => [c.id, c.contractNumber || c.id.slice(0, 8)]),
  )
}

function openCreate() {
  editingId.value = null
  firstDueDateModel.value = new Date()
  lastDueDateModel.value = new Date()
  Object.assign(form, {
    totalInstallments: 0,
    installmentAmount: 0,
    interestRate: 0,
    firstDueDate: new Date().toISOString(),
    lastDueDate: new Date().toISOString(),
    contractId: '',
    complexId: complexFilter.value || complexes.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: InstallmentPlan) {
  editingId.value = row.id
  firstDueDateModel.value = row.firstDueDate ? new Date(row.firstDueDate) : null
  lastDueDateModel.value = row.lastDueDate ? new Date(row.lastDueDate) : null
  Object.assign(form, {
    totalInstallments: row.totalInstallments,
    installmentAmount: row.installmentAmount,
    interestRate: row.interestRate,
    firstDueDate: row.firstDueDate,
    lastDueDate: row.lastDueDate,
    contractId: row.contractId,
    complexId: row.complexId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.complexId || !form.contractId) {
    notify.warning('اختر المجمع والعقد')
    return
  }
  if (!firstDueDateModel.value || !lastDueDateModel.value) {
    notify.warning('حدد تواريخ الاستحقاق')
    return
  }
  form.firstDueDate = firstDueDateModel.value.toISOString()
  form.lastDueDate = lastDueDateModel.value.toISOString()
  saving.value = true
  try {
    if (editingId.value) {
      await updateInstallmentPlan(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createInstallmentPlan({ ...form })
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

async function remove(row: InstallmentPlan) {
  if (!(await ask('حذف خطة التقسيط؟'))) return
  try {
    await deleteInstallmentPlan(row.id)
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
    <PageHeader title="خطط التقسيط" subtitle="إدارة خطط أقساط عقود المبيعات">
      <template #actions>
        <Button label="إضافة خطة" icon="pi pi-plus" @click="openCreate" />
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
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="7" />
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
        <Column header="عدد الأقساط" style="width: 110px">
          <template #body="{ data }">{{ data.totalInstallments }}</template>
        </Column>
        <Column header="قيمة القسط" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.installmentAmount) }}</template>
        </Column>
        <Column header="الفائدة %" style="width: 100px">
          <template #body="{ data }">{{ data.interestRate }}</template>
        </Column>
        <Column header="أول استحقاق" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.firstDueDate) }}</template>
        </Column>
        <Column header="آخر استحقاق" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.lastDueDate) }}</template>
        </Column>
        <Column header="العقد">
          <template #body="{ data }">{{ contractMap[data.contractId] || data.contractId.slice(0, 8) }}</template>
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
      :header="editingId ? 'تعديل خطة' : 'إضافة خطة'"
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
            @update:model-value="() => { form.contractId = '' }"
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
          <label>عدد الأقساط</label>
          <InputNumber v-model="form.totalInstallments" :min="0" />
        </div>
        <div class="field">
          <label>قيمة القسط</label>
          <InputNumber v-model="form.installmentAmount" :min="0" />
        </div>
        <div class="field">
          <label>نسبة الفائدة</label>
          <InputNumber v-model="form.interestRate" :min="0" :max-fraction-digits="2" />
        </div>
        <div class="field">
          <label>أول استحقاق</label>
          <DatePicker v-model="firstDueDateModel" date-format="yy-mm-dd" show-icon />
        </div>
        <div class="field">
          <label>آخر استحقاق</label>
          <DatePicker v-model="lastDueDateModel" date-format="yy-mm-dd" show-icon />
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
