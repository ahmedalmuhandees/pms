<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, CreateUnitDto, Floor, Unit } from '@/types'
import { UnitStatus, UnitType } from '@/types'
import { createUnit, deleteUnit, getUnits, updateUnit, type UnitParams } from '@/api/units'
import { getComplexes } from '@/api/complexes'
import { getFloors } from '@/api/floors'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatMoney,
  labelOf,
  unitStatusOptions,
  unitTypeOptions,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const router = useRouter()
const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const floors = ref<Floor[]>([])

const statusFilterOptions = unitStatusOptions.map((opt) => ({
  ...opt,
  value: String(opt.value),
}))

const {
  items,
  loading,
  page,
  pageSize,
  total,
  search,
  load,
  onSearch,
  setFilter,
  onLazyPage,
} = usePagedList<Unit, UnitParams>(getUnits)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const statusFilter = ref<string | null>(null)

const emptyForm = (): CreateUnitDto => ({
  unitNumber: '',
  unitType: UnitType.Apartment,
  area: 0,
  bedrooms: 1,
  bathrooms: 1,
  parkingCount: 0,
  gardenArea: 0,
  roofArea: 0,
  direction: '',
  floorLevel: 1,
  status: UnitStatus.Available,
  price: 0,
  cost: 0,
  notes: '',
  floorId: '',
  complexId: '',
})

const form = reactive<CreateUnitDto>(emptyForm())

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)
const floorOptions = computed(() =>
  asSelectOptions(floors.value, (f) => `طابق ${f.floorNumber}`),
)

async function loadLookups() {
  const [complexResult, floorResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getFloors({ Page: 1, PageSize: 200 }),
  ])
  complexes.value = complexResult.items ?? []
  floors.value = floorResult.items ?? []
}

function resetForm() {
  editingId.value = null
  Object.assign(form, emptyForm(), {
    complexId: complexFilter.value || complexes.value[0]?.id || '',
    floorId: floors.value[0]?.id || '',
  })
}

function openCreate() {
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: Unit) {
  editingId.value = row.id
  Object.assign(form, {
    unitNumber: row.unitNumber,
    unitType: row.unitType,
    area: row.area,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parkingCount: row.parkingCount,
    gardenArea: row.gardenArea,
    roofArea: row.roofArea,
    direction: row.direction,
    floorLevel: row.floorLevel,
    status: row.status,
    price: row.price,
    cost: row.cost,
    notes: row.notes,
    floorId: row.floorId,
    complexId: row.complexId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.complexId || !form.floorId) {
    notify.warning('اختر المجمع والطابق')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateUnit(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createUnit({ ...form })
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

async function remove(row: Unit) {
  if (!(await ask(`حذف الوحدة "${row.unitNumber}"؟`))) return
  try {
    await deleteUnit(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

function onComplexFilter(value: string | null) {
  complexFilter.value = value
  setFilter('ComplexId', value || undefined)
}

function onStatusFilter(value: string | null) {
  statusFilter.value = value
  setFilter('Status', value || undefined)
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
    <PageHeader title="الوحدات" subtitle="إدارة وحدات المجمعات وحالاتها وأنواعها">
      <template #actions>
        <Button label="إضافة وحدة" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar
        v-model:search="search"
        placeholder="ابحث برقم الوحدة أو الملاحظات..."
        @search="onSearch"
      >
        <template #filters>
          <Select
            v-model="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="فلتر بالمجمع"
            show-clear
            style="min-width: 190px"
            @update:model-value="onComplexFilter"
          />
          <Select
            v-model="statusFilter"
            :options="statusFilterOptions"
            option-label="label"
            option-value="value"
            placeholder="الحالة"
            show-clear
            style="min-width: 150px"
            @update:model-value="onStatusFilter"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="7" />
      <div v-else class="table-wrap">
        <DataTable
          :value="items"
          :loading="loading"
          lazy
          paginator
          :rows="pageSize"
          :total-records="total"
          :first="(page - 1) * pageSize"
          :rows-per-page-options="[10, 20, 50]"
          paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          current-page-report-template="{first} إلى {last} من {totalRecords}"
          striped-rows
          size="small"
          @page="onLazyPage"
        >
          <Column field="unitNumber" header="رقم الوحدة" style="width: 120px" />
          <Column header="النوع" style="width: 110px">
            <template #body="{ data }">{{ labelOf(unitTypeOptions, data.unitType) }}</template>
          </Column>
          <Column header="الحالة" style="width: 110px">
            <template #body="{ data }">{{ labelOf(unitStatusOptions, data.status) }}</template>
          </Column>
          <Column field="area" header="المساحة" style="width: 100px" />
          <Column field="bedrooms" header="غرف" style="width: 80px" />
          <Column header="السعر" style="width: 120px">
            <template #body="{ data }">{{ formatMoney(data.price) }}</template>
          </Column>
          <Column header="إجراءات" style="width: 150px">
            <template #body="{ data }">
              <RowActions
                show-details
                @details="router.push(`/units/${data.id}`)"
                @edit="openEdit(data)"
                @remove="remove(data)"
              />
            </template>
          </Column>
          <template #empty>
            <div class="empty-box">لا توجد بيانات</div>
          </template>
        </DataTable>
      </div>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل وحدة' : 'إضافة وحدة'"
      :style="{ width: '720px' }"
      :breakpoints="{ '960px': '95vw' }"
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
          />
        </div>
        <div class="field">
          <label>الطابق</label>
          <Select
            v-model="form.floorId"
            :options="floorOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر الطابق"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>رقم الوحدة</label>
          <InputText v-model="form.unitNumber" />
        </div>
        <div class="field">
          <label>النوع</label>
          <Select
            v-model="form.unitType"
            :options="unitTypeOptions"
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
            :options="unitStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الحالة"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>المساحة</label>
          <InputNumber v-model="form.area" :min="0" />
        </div>
        <div class="field">
          <label>غرف النوم</label>
          <InputNumber v-model="form.bedrooms" :min="0" />
        </div>
        <div class="field">
          <label>الحمامات</label>
          <InputNumber v-model="form.bathrooms" :min="0" />
        </div>
        <div class="field">
          <label>مواقف</label>
          <InputNumber v-model="form.parkingCount" :min="0" />
        </div>
        <div class="field">
          <label>حديقة</label>
          <InputNumber v-model="form.gardenArea" :min="0" />
        </div>
        <div class="field">
          <label>سطح</label>
          <InputNumber v-model="form.roofArea" :min="0" />
        </div>
        <div class="field">
          <label>الاتجاه</label>
          <InputText v-model="form.direction" />
        </div>
        <div class="field">
          <label>مستوى الطابق</label>
          <InputNumber v-model="form.floorLevel" />
        </div>
        <div class="field">
          <label>السعر</label>
          <InputNumber v-model="form.price" :min="0" />
        </div>
        <div class="field">
          <label>التكلفة</label>
          <InputNumber v-model="form.cost" :min="0" />
        </div>
        <div class="field full">
          <label>ملاحظات</label>
          <Textarea v-model="form.notes" rows="2" />
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
