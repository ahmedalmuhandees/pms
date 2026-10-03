<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type {
  Block,
  Building,
  Complex,
  CreatePricePlanDto,
  PricePlan,
  Unit,
} from '@/types'
import { PricePlanScope } from '@/types'
import {
  createPricePlan,
  deletePricePlan,
  getPricePlans,
  updatePricePlan,
  type PricePlanParams,
} from '@/api/pricePlans'
import { getComplexes } from '@/api/complexes'
import { getBlocks } from '@/api/blocks'
import { getBuildings } from '@/api/buildings'
import { getUnits } from '@/api/units'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatMoney,
  labelOf,
  pricePlanScopeOptions,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const blocks = ref<Block[]>([])
const buildings = ref<Building[]>([])
const units = ref<Unit[]>([])
const complexMap = ref<Record<string, string>>({})
const blockMap = ref<Record<string, string>>({})
const buildingMap = ref<Record<string, string>>({})
const unitMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<PricePlan, PricePlanParams>(getPricePlans)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const scopeFilter = ref<number | null>(null)

const form = reactive<CreatePricePlanDto>({
  scope: PricePlanScope.Unit,
  sellingPrice: 0,
  discount: 0,
  tax: 0,
  registrationFee: 0,
  complexId: '',
  blockId: null,
  buildingId: null,
  unitId: null,
})

const isBlockScope = computed(() => form.scope === PricePlanScope.Block)
const isBuildingScope = computed(() => form.scope === PricePlanScope.Building)
const isUnitScope = computed(() => form.scope === PricePlanScope.Unit)

const filteredBlocks = computed(() =>
  form.complexId ? blocks.value.filter((b) => b.complexId === form.complexId) : blocks.value,
)
const filteredBuildings = computed(() => {
  if (!form.complexId) return buildings.value
  const blockIds = new Set(filteredBlocks.value.map((b) => b.id))
  return buildings.value.filter((b) => blockIds.has(b.blockId))
})
const filteredUnits = computed(() =>
  form.complexId ? units.value.filter((u) => u.complexId === form.complexId) : units.value,
)

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)
const blockOptions = computed(() =>
  asSelectOptions(filteredBlocks.value, (b) => b.name || b.id.slice(0, 8)),
)
const buildingOptions = computed(() =>
  asSelectOptions(filteredBuildings.value, (b) => b.name || b.id.slice(0, 8)),
)
const unitOptions = computed(() =>
  asSelectOptions(filteredUnits.value, (u) => u.unitNumber || u.id.slice(0, 8)),
)

function targetLabel(row: PricePlan) {
  if (row.scope === PricePlanScope.Block) {
    return blockMap.value[row.blockId || ''] || row.blockId?.slice(0, 8) || '—'
  }
  if (row.scope === PricePlanScope.Building) {
    return buildingMap.value[row.buildingId || ''] || row.buildingId?.slice(0, 8) || '—'
  }
  return unitMap.value[row.unitId || ''] || row.unitId?.slice(0, 8) || '—'
}

async function loadLookups() {
  const [complexResult, blockResult, buildingResult, unitResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getBlocks({ Page: 1, PageSize: 500 }),
    getBuildings({ Page: 1, PageSize: 500 }),
    getUnits({ Page: 1, PageSize: 500 }),
  ])
  complexes.value = complexResult.items ?? []
  blocks.value = blockResult.items ?? []
  buildings.value = buildingResult.items ?? []
  units.value = unitResult.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
  blockMap.value = Object.fromEntries(
    blocks.value.map((b) => [b.id, b.name || b.id.slice(0, 8)]),
  )
  buildingMap.value = Object.fromEntries(
    buildings.value.map((b) => [b.id, b.name || b.id.slice(0, 8)]),
  )
  unitMap.value = Object.fromEntries(
    units.value.map((u) => [u.id, u.unitNumber || u.id.slice(0, 8)]),
  )
}

function onScopeChange() {
  form.blockId = null
  form.buildingId = null
  form.unitId = null
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    scope: PricePlanScope.Unit,
    sellingPrice: 0,
    discount: 0,
    tax: 0,
    registrationFee: 0,
    complexId: complexFilter.value || complexes.value[0]?.id || '',
    blockId: null,
    buildingId: null,
    unitId: null,
  })
  dialogVisible.value = true
}

function openEdit(row: PricePlan) {
  editingId.value = row.id
  Object.assign(form, {
    scope: row.scope,
    sellingPrice: row.sellingPrice,
    discount: row.discount,
    tax: row.tax,
    registrationFee: row.registrationFee,
    complexId: row.complexId,
    blockId: row.blockId,
    buildingId: row.buildingId,
    unitId: row.unitId,
  })
  dialogVisible.value = true
}

function buildPayload(): CreatePricePlanDto {
  return {
    scope: form.scope,
    sellingPrice: form.sellingPrice,
    discount: form.discount,
    tax: form.tax,
    registrationFee: form.registrationFee,
    complexId: form.complexId,
    blockId: isBlockScope.value ? form.blockId : null,
    buildingId: isBuildingScope.value ? form.buildingId : null,
    unitId: isUnitScope.value ? form.unitId : null,
  }
}

function validate() {
  if (!form.complexId) {
    notify.warning('اختر المجمع')
    return false
  }
  if (isBlockScope.value && !form.blockId) {
    notify.warning('اختر البلوك')
    return false
  }
  if (isBuildingScope.value && !form.buildingId) {
    notify.warning('اختر البناية')
    return false
  }
  if (isUnitScope.value && !form.unitId) {
    notify.warning('اختر الوحدة')
    return false
  }
  return true
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = buildPayload()
    if (editingId.value) {
      await updatePricePlan(editingId.value, payload)
      notify.success('تم التحديث')
    } else {
      await createPricePlan(payload)
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

async function remove(row: PricePlan) {
  if (!(await ask('حذف خطة الأسعار؟'))) return
  try {
    await deletePricePlan(row.id)
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
    <PageHeader title="خطط الأسعار" subtitle="تسعير حسب البلوك أو البناية أو الوحدة">
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
          <Select
            v-model="scopeFilter"
            :options="pricePlanScopeOptions"
            option-label="label"
            option-value="value"
            placeholder="النطاق"
            show-clear
            @update:model-value="(v: number | null) => setFilter('Scope', v ?? undefined)"
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
        <Column header="النطاق" style="width: 90px">
          <template #body="{ data }">{{ labelOf(pricePlanScopeOptions, data.scope) }}</template>
        </Column>
        <Column header="الهدف">
          <template #body="{ data }">{{ targetLabel(data) }}</template>
        </Column>
        <Column header="سعر البيع" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.sellingPrice) }}</template>
        </Column>
        <Column header="الخصم" style="width: 100px">
          <template #body="{ data }">{{ formatMoney(data.discount) }}</template>
        </Column>
        <Column header="الضريبة" style="width: 100px">
          <template #body="{ data }">{{ formatMoney(data.tax) }}</template>
        </Column>
        <Column header="رسوم التسجيل" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.registrationFee) }}</template>
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
      :header="editingId ? 'تعديل خطة أسعار' : 'إضافة خطة أسعار'"
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
            @update:model-value="onScopeChange"
          />
        </div>
        <div class="field">
          <label>النطاق</label>
          <Select
            v-model="form.scope"
            :options="pricePlanScopeOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
            @update:model-value="onScopeChange"
          />
        </div>
        <div v-if="isBlockScope" class="field">
          <label>البلوك</label>
          <Select
            v-model="form.blockId"
            :options="blockOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر البلوك"
            checkmark
            append-to="body"
            filter
          />
        </div>
        <div v-if="isBuildingScope" class="field">
          <label>البناية</label>
          <Select
            v-model="form.buildingId"
            :options="buildingOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر البناية"
            checkmark
            append-to="body"
            filter
          />
        </div>
        <div v-if="isUnitScope" class="field">
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
          <label>سعر البيع</label>
          <InputNumber v-model="form.sellingPrice" :min="0" />
        </div>
        <div class="field">
          <label>الخصم</label>
          <InputNumber v-model="form.discount" :min="0" />
        </div>
        <div class="field">
          <label>الضريبة</label>
          <InputNumber v-model="form.tax" :min="0" />
        </div>
        <div class="field">
          <label>رسوم التسجيل</label>
          <InputNumber v-model="form.registrationFee" :min="0" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="حفظ" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
