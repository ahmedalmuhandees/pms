<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Building, CreateFloorDto, Floor } from '@/types'
import { createFloor, deleteFloor, getFloors, updateFloor, type FloorParams } from '@/api/floors'
import { getBuildings } from '@/api/buildings'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const buildings = ref<Building[]>([])
const buildingMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<Floor, FloorParams>(getFloors)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const buildingFilter = ref<string | null>(null)
const form = reactive<CreateFloorDto>({ floorNumber: 1, buildingId: '' })

const buildingOptions = computed(() =>
  asSelectOptions(buildings.value, (b) => b.name || b.id),
)

async function loadBuildings() {
  const result = await getBuildings({ Page: 1, PageSize: 200 })
  buildings.value = result.items ?? []
  buildingMap.value = Object.fromEntries(buildings.value.map((b) => [b.id, b.name || b.id]))
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    floorNumber: 1,
    buildingId: buildingFilter.value || buildings.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Floor) {
  editingId.value = row.id
  Object.assign(form, { floorNumber: row.floorNumber, buildingId: row.buildingId })
  dialogVisible.value = true
}

async function save() {
  if (!form.buildingId) {
    notify.warning('اختر المبنى')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateFloor(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createFloor({ ...form })
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

async function remove(row: Floor) {
  if (!(await ask(`حذف الطابق رقم ${row.floorNumber}؟`))) return
  try {
    await deleteFloor(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

onMounted(async () => {
  try {
    await loadBuildings()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="الطوابق" subtitle="تنظيم طوابق المباني السكنية">
      <template #actions>
        <Button label="إضافة طابق" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث عن طابق..." @search="onSearch">
        <template #filters>
          <Select
            v-model="buildingFilter"
            :options="buildingOptions"
            option-label="label"
            option-value="id"
            placeholder="فلتر بالمبنى"
            show-clear
            style="min-width: 200px"
            @update:model-value="(v: string | null) => setFilter('BuildingId', v || undefined)"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="3" />
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
        <Column field="floorNumber" header="رقم الطابق" style="width: 140px" />
        <Column header="المبنى">
          <template #body="{ data }">{{ buildingMap[data.buildingId] || data.buildingId }}</template>
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
      :header="editingId ? 'تعديل طابق' : 'إضافة طابق'"
      :style="{ width: '420px' }"
    >
      <div class="form-grid" style="grid-template-columns: 1fr">
        <div class="field">
          <label>المبنى</label>
          <Select
            v-model="form.buildingId"
            :options="buildingOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر المبنى"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>رقم الطابق</label>
          <InputNumber v-model="form.floorNumber" :min="0" />
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
