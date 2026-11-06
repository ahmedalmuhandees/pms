<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import RememberedInput from '@/components/RememberedInput.vue'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { CreateVehicleDto, Customer, Resident, Vehicle } from '@/types'
import {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle,
  type VehicleParams,
} from '@/api/vehicles'
import { getResidents } from '@/api/residents'
import { getCustomers } from '@/api/customers'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import TableSortCaption from '@/components/TableSortCaption.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const residents = ref<Resident[]>([])
const residentOptions = ref<{ id: string; label: string }[]>([])
const residentFilter = ref<string | null>(null)

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort,
  sortField,
  sortOrder,
  sortMode, onLazyPage,
} = usePagedList<Vehicle, VehicleParams>(getVehicles)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)

const form = reactive<CreateVehicleDto>({
  plateNumber: '',
  model: '',
  color: '',
  parkingNumber: '',
  residentId: '',
})

async function loadResidents() {
  const [residentResult, customerResult] = await Promise.all([
    getResidents({ Page: 1, PageSize: 500 }),
    getCustomers({ Page: 1, PageSize: 500 }),
  ])
  residents.value = residentResult.items ?? []
  const customers = customerResult.items ?? []
  const customerMap = Object.fromEntries(
    customers.map((c: Customer) => [c.id, [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id]),
  )
  residentOptions.value = residents.value.map((r) => ({
    id: r.id,
    label: `${customerMap[r.customerId] || r.customerId.slice(0, 8)} · ${r.id.slice(0, 8)}`,
  }))
}

function residentLabel(id: string) {
  return residentOptions.value.find((r) => r.id === id)?.label || id.slice(0, 8)
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    plateNumber: '',
    model: '',
    color: '',
    parkingNumber: '',
    residentId: residentFilter.value || residents.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Vehicle) {
  editingId.value = row.id
  Object.assign(form, {
    plateNumber: row.plateNumber,
    model: row.model,
    color: row.color,
    parkingNumber: row.parkingNumber,
    residentId: row.residentId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.residentId) {
    notify.warning('اختر المقيم')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateVehicle(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createVehicle({ ...form })
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

async function remove(row: Vehicle) {
  if (!(await ask(`حذف المركبة "${row.plateNumber || ''}"؟`))) return
  try {
    await deleteVehicle(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

onMounted(async () => {
  try {
    await loadResidents()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="المركبات" subtitle="إدارة مركبات المقيمين ومواقف السيارات">
      <template #actions>
        <Button label="إضافة مركبة" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث برقم اللوحة أو الموديل..." @search="onSearch"
        v-model:sort-mode="sortMode"
        @sort-change="setSortMode">
        <template #filters>
          <Select
            v-model="residentFilter"
            :options="residentOptions"
            option-label="label"
            option-value="id"
            placeholder="كل المقيمين"
            show-clear
            filter
            @update:model-value="(v: string | null) => setFilter('ResidentId', v || undefined)"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="6" />
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
        <Column field="plateNumber" header="رقم اللوحة"  sortable />
        <Column field="model" header="الموديل"  sortable />
        <Column field="color" header="اللون" style="width: 110px"  sortable />
        <Column field="parkingNumber" header="رقم الموقف" style="width: 120px"  sortable />
        <Column header="المقيم" sortable>
          <template #body="{ data }">{{ residentLabel(data.residentId) }}</template>
        </Column>
        <Column header="إجراءات" style="width: 130px">
          <template #body="{ data }">
            <RowActions @edit="openEdit(data)" @remove="remove(data)" />
          </template>
        </Column>
        <template #empty><div class="empty-box">لا توجد بيانات</div></template>
      </DataTable>
      </template>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل مركبة' : 'إضافة مركبة'"
      :style="{ width: '520px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>رقم اللوحة</label>
          <RememberedInput v-model="form.plateNumber" memory-key="vehicle.plateNumber" />
        </div>
        <div class="field">
          <label>الموديل</label>
          <RememberedInput v-model="form.model" memory-key="vehicle.model" />
        </div>
        <div class="field">
          <label>اللون</label>
          <RememberedInput v-model="form.color" memory-key="vehicle.color" />
        </div>
        <div class="field">
          <label>رقم الموقف</label>
          <RememberedInput v-model="form.parkingNumber" memory-key="vehicle.parkingNumber" />
        </div>
        <div class="field full">
          <label>المقيم</label>
          <Select
            v-model="form.residentId"
            :options="residentOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر المقيم"
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
