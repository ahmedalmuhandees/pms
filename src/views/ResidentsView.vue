<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, CreateResidentDto, Customer, Resident, Unit } from '@/types'
import { ResidentStatus } from '@/types'
import {
  createResident,
  deleteResident,
  getResidents,
  updateResident,
  type ResidentParams,
} from '@/api/residents'
import { getComplexes } from '@/api/complexes'
import { getCustomers } from '@/api/customers'
import { getUnits } from '@/api/units'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions, formatDate, labelOf, residentStatusOptions } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const customers = ref<Customer[]>([])
const units = ref<Unit[]>([])
const complexMap = ref<Record<string, string>>({})
const customerMap = ref<Record<string, string>>({})
const unitMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<Resident, ResidentParams>(getResidents)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const statusFilter = ref<number | null>(null)
const moveInModel = ref<Date | null>(null)
const moveOutModel = ref<Date | null>(null)

const form = reactive<CreateResidentDto>({
  moveInDate: new Date().toISOString(),
  moveOutDate: null,
  status: ResidentStatus.Active,
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

function openCreate() {
  editingId.value = null
  moveInModel.value = new Date()
  moveOutModel.value = null
  Object.assign(form, {
    moveInDate: new Date().toISOString(),
    moveOutDate: null,
    status: ResidentStatus.Active,
    customerId: '',
    unitId: '',
    complexId: complexFilter.value || complexes.value[0]?.id || '',
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
    customerId: row.customerId,
    unitId: row.unitId,
    complexId: row.complexId,
  })
  dialogVisible.value = true
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
    await load()
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
    <PageHeader title="السكان" subtitle="ربط العملاء بالوحدات وتواريخ الإقامة">
      <template #actions>
        <Button label="إضافة مقيم" icon="pi pi-plus" @click="openCreate" />
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
            :options="residentStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="كل الحالات"
            show-clear
            @update:model-value="(v: number | null) => setFilter('Status', v ?? undefined)"
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
        <Column header="العميل">
          <template #body="{ data }">{{ customerMap[data.customerId] || data.customerId.slice(0, 8) }}</template>
        </Column>
        <Column header="الوحدة" style="width: 120px">
          <template #body="{ data }">{{ unitMap[data.unitId] || data.unitId.slice(0, 8) }}</template>
        </Column>
        <Column header="المجمع">
          <template #body="{ data }">{{ complexMap[data.complexId] || '—' }}</template>
        </Column>
        <Column header="الدخول" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.moveInDate) }}</template>
        </Column>
        <Column header="المغادرة" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.moveOutDate) }}</template>
        </Column>
        <Column header="الحالة" style="width: 110px">
          <template #body="{ data }">{{ labelOf(residentStatusOptions, data.status) }}</template>
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
      :header="editingId ? 'تعديل مقيم' : 'إضافة مقيم'"
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
            @update:model-value="() => { form.customerId = ''; form.unitId = '' }"
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
  </div>
</template>
