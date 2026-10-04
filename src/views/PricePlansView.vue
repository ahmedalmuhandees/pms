<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import Checkbox from 'primevue/checkbox'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type {
  Building,
  Complex,
  CreatePricePlanDto,
  Floor,
  PricePlan,
  PricePlanInstallmentItem,
  Unit,
} from '@/types'
import { PricePlanPricingType, UnitUi } from '@/types'
import {
  createPricePlan,
  deletePricePlan,
  getPricePlans,
  updatePricePlan,
  type PricePlanParams,
} from '@/api/pricePlans'
import { getComplexes } from '@/api/complexes'
import { getBuildings } from '@/api/buildings'
import { getFloors } from '@/api/floors'
import { getUnits } from '@/api/units'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatDate,
  formatMoney,
  labelOf,
  pricePlanPricingTypeOptions,
  unitUiOptions,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const buildings = ref<Building[]>([])
const floors = ref<Floor[]>([])
const units = ref<Unit[]>([])
const complexMap = ref<Record<string, string>>({})
const buildingMap = ref<Record<string, string>>({})
const floorMap = ref<Record<string, string>>({})
const unitMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<PricePlan, PricePlanParams>(getPricePlans)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const firstInstallmentDateModel = ref<Date | null>(null)

function emptyForm(): CreatePricePlanDto {
  return {
    name: '',
    complexId: '',
    buildingId: '',
    floorIds: [],
    unitUis: [UnitUi.MiddleFront],
    applyToAllInLocation: true,
    unitIds: [],
    pricingType: PricePlanPricingType.Amount,
    sellingPrice: 0,
    downPayment: 0,
    deliveryAmount: 0,
    discount: 0,
    tax: 0,
    registrationFee: 0,
    years: 1,
    paymentIntervalMonths: 1,
    firstInstallmentDate: null,
    installments: [],
  }
}

const form = reactive<CreatePricePlanDto>(emptyForm())
const installmentRows = ref<PricePlanInstallmentItem[]>([])
const suppressScheduleRebuild = ref(false)

const isPercentage = computed(() => form.pricingType === PricePlanPricingType.Percentage)

const downPaymentAmount = computed(() => {
  if (isPercentage.value) {
    return Math.round(((form.sellingPrice || 0) * (form.downPayment || 0)) / 100)
  }
  return Math.round(form.downPayment || 0)
})

const deliveryAmountValue = computed(() => {
  if (isPercentage.value) {
    return Math.round(((form.sellingPrice || 0) * (form.deliveryAmount || 0)) / 100)
  }
  return Math.round(form.deliveryAmount || 0)
})

const remainingAmount = computed(() =>
  Math.round((form.sellingPrice || 0) - downPaymentAmount.value - deliveryAmountValue.value),
)

const remainingPercent = computed(() => {
  if (!isPercentage.value) {
    if (!form.sellingPrice) return 0
    return Math.round((remainingAmount.value / form.sellingPrice) * 10000) / 100
  }
  return Math.round((100 - (form.downPayment || 0) - (form.deliveryAmount || 0)) * 100) / 100
})

const installmentCount = computed(() => {
  if (!form.years || !form.paymentIntervalMonths) return 0
  const months = form.years * 12
  if (months % form.paymentIntervalMonths !== 0) return 0
  return months / form.paymentIntervalMonths
})

const scheduleSumAmount = computed(() =>
  Math.round(installmentRows.value.reduce((s, r) => s + (r.amount || 0), 0)),
)

const scheduleSumPercent = computed(
  () => Math.round(installmentRows.value.reduce((s, r) => s + (r.percent || 0), 0) * 100) / 100,
)

const scheduleMatchesRemaining = computed(() => {
  if (!installmentCount.value || installmentRows.value.length !== installmentCount.value) return false
  if (isPercentage.value) {
    return Math.abs(scheduleSumPercent.value - remainingPercent.value) <= 0.01
  }
  return scheduleSumAmount.value === remainingAmount.value
})

function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function rebuildInstallmentSchedule() {
  const count = installmentCount.value
  if (!count || remainingAmount.value < 0 || (isPercentage.value && remainingPercent.value < 0)) {
    installmentRows.value = []
    return
  }

  const start = firstInstallmentDateModel.value || new Date()
  const interval = form.paymentIntervalMonths || 1

  if (isPercentage.value) {
    const base = Math.floor((remainingPercent.value / count) * 100) / 100
    let allocated = 0
    installmentRows.value = Array.from({ length: count }, (_, i) => {
      const percent =
        i === count - 1
          ? Math.round((remainingPercent.value - allocated) * 100) / 100
          : base
      allocated = Math.round((allocated + percent) * 100) / 100
      const amount = Math.round(((form.sellingPrice || 0) * percent) / 100)
      return {
        index: i + 1,
        dueDate: addMonths(start, interval * i).toISOString(),
        amount,
        percent,
      }
    })
    return
  }

  const base = Math.round(remainingAmount.value / count)
  let allocated = 0
  installmentRows.value = Array.from({ length: count }, (_, i) => {
    const amount = i === count - 1 ? remainingAmount.value - allocated : base
    allocated += amount
    const percent = form.sellingPrice
      ? Math.round((amount / form.sellingPrice) * 10000) / 100
      : 0
    return {
      index: i + 1,
      dueDate: addMonths(start, interval * i).toISOString(),
      amount,
      percent,
    }
  })
}

function onInstallmentAmountEdit(row: PricePlanInstallmentItem) {
  row.amount = Math.round(row.amount || 0)
  row.percent = form.sellingPrice
    ? Math.round((row.amount / form.sellingPrice) * 10000) / 100
    : 0
}

function onInstallmentPercentEdit(row: PricePlanInstallmentItem) {
  row.percent = Math.round((row.percent || 0) * 100) / 100
  row.amount = Math.round(((form.sellingPrice || 0) * row.percent) / 100)
}

watch(
  () => [
    form.pricingType,
    form.sellingPrice,
    form.downPayment,
    form.deliveryAmount,
    form.years,
    form.paymentIntervalMonths,
    firstInstallmentDateModel.value,
  ],
  () => {
    if (suppressScheduleRebuild.value) return
    rebuildInstallmentSchedule()
  },
)

const buildingOptions = computed(() => {
  if (!form.complexId) return asSelectOptions(buildings.value, (b) => b.name || b.id.slice(0, 8))
  // Prefer buildings that have floors (and optionally units in complex)
  const floorBuildingIds = new Set(floors.value.map((f) => f.buildingId))
  const unitBuildingIds = new Set(
    units.value
      .filter((u) => u.complexId === form.complexId)
      .map((u) => floors.value.find((f) => f.id === u.floorId)?.buildingId)
      .filter(Boolean) as string[],
  )
  const allowed = unitBuildingIds.size
    ? unitBuildingIds
    : floorBuildingIds
  const list = buildings.value.filter((b) => allowed.has(b.id) || allowed.size === 0)
  return asSelectOptions(list.length ? list : buildings.value, (b) => b.name || b.id.slice(0, 8))
})

const floorOptions = computed(() => {
  if (!form.buildingId) return []
  return asSelectOptions(
    floors.value
      .filter((f) => f.buildingId === form.buildingId)
      .sort((a, b) => a.floorNumber - b.floorNumber),
    (f) => `طابق ${f.floorNumber}`,
  )
})

const locationUnits = computed(() => {
  if (!form.floorIds.length || !form.unitUis.length) return []
  const floorSet = new Set(form.floorIds)
  const uiSet = new Set(form.unitUis)
  return units.value.filter(
    (u) =>
      floorSet.has(u.floorId) &&
      u.unitUi != null &&
      uiSet.has(u.unitUi) &&
      (!form.complexId || u.complexId === form.complexId),
  )
})

const unitOptions = computed(() =>
  asSelectOptions(locationUnits.value, (u) => {
    const floor = floorMap.value[u.floorId] || ''
    const place = u.unitUi != null ? labelOf(unitUiOptions, u.unitUi) : ''
    return `${u.unitNumber || u.id.slice(0, 8)} — ${floor} — ${place}`
  }),
)

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

function targetLabel(row: PricePlan) {
  const building = buildingMap.value[row.buildingId || ''] || '—'
  const floorIds = row.floorIds?.length
    ? row.floorIds
    : row.floorId
      ? [row.floorId]
      : []
  const unitUis = row.unitUis?.length
    ? row.unitUis
    : row.unitUi != null
      ? [row.unitUi]
      : []
  const floorsLabel =
    floorIds.length > 1
      ? `${floorIds.length} طوابق`
      : floorIds[0]
        ? floorMap.value[floorIds[0]] || '—'
        : '—'
  const placesLabel =
    unitUis.length > 1
      ? `${unitUis.length} أماكن`
      : unitUis[0] != null
        ? labelOf(unitUiOptions, unitUis[0])
        : '—'
  if (row.applyToAllInLocation) return `${building} / ${floorsLabel} / ${placesLabel} (الكل)`
  return `${building} / ${floorsLabel} / ${unitMap.value[row.unitId || ''] || '—'}`
}

async function loadLookups() {
  const [complexResult, buildingResult, floorResult, unitResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getBuildings({ Page: 1, PageSize: 500 }),
    getFloors({ Page: 1, PageSize: 1000 }),
    getUnits({ Page: 1, PageSize: 1000 }),
  ])
  complexes.value = complexResult.items ?? []
  buildings.value = buildingResult.items ?? []
  floors.value = floorResult.items ?? []
  units.value = unitResult.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
  buildingMap.value = Object.fromEntries(
    buildings.value.map((b) => [b.id, b.name || b.id.slice(0, 8)]),
  )
  floorMap.value = Object.fromEntries(
    floors.value.map((f) => [f.id, `طابق ${f.floorNumber}`]),
  )
  unitMap.value = Object.fromEntries(
    units.value.map((u) => [u.id, u.unitNumber || u.id.slice(0, 8)]),
  )
}

function onComplexChange() {
  form.buildingId = ''
  form.floorIds = []
  form.unitUis = [UnitUi.MiddleFront]
  form.unitIds = []
}

function onBuildingChange() {
  form.floorIds = []
  form.unitIds = []
}

function onFloorOrLocationChange() {
  form.unitIds = form.unitIds.filter((id) => locationUnits.value.some((u) => u.id === id))
}

function openCreate() {
  editingId.value = null
  suppressScheduleRebuild.value = true
  firstInstallmentDateModel.value = new Date()
  Object.assign(form, emptyForm(), {
    complexId: complexFilter.value || complexes.value[0]?.id || '',
  })
  suppressScheduleRebuild.value = false
  rebuildInstallmentSchedule()
  dialogVisible.value = true
}

function openEdit(row: PricePlan) {
  editingId.value = row.id
  suppressScheduleRebuild.value = true
  firstInstallmentDateModel.value = row.firstInstallmentDate
    ? new Date(row.firstInstallmentDate)
    : null
  Object.assign(form, {
    name: row.name ?? '',
    complexId: row.complexId,
    buildingId: row.buildingId || '',
    floorIds: row.floorIds?.length
      ? [...row.floorIds]
      : row.floorId
        ? [row.floorId]
        : [],
    unitUis: row.unitUis?.length
      ? [...row.unitUis]
      : row.unitUi != null
        ? [row.unitUi]
        : [UnitUi.MiddleFront],
    applyToAllInLocation: row.applyToAllInLocation,
    unitIds: row.unitId ? [row.unitId] : row.unitIds ?? [],
    pricingType: row.pricingType ?? PricePlanPricingType.Amount,
    sellingPrice: row.sellingPrice,
    downPayment: row.downPayment ?? 0,
    deliveryAmount: row.deliveryAmount ?? 0,
    discount: row.discount,
    tax: row.tax,
    registrationFee: row.registrationFee,
    years: row.years ?? 1,
    paymentIntervalMonths: row.paymentIntervalMonths ?? 1,
    firstInstallmentDate: row.firstInstallmentDate,
    installments: row.installments ?? [],
  })
  if (row.installments?.length) {
    installmentRows.value = row.installments.map((i) => ({ ...i }))
  } else {
    rebuildInstallmentSchedule()
  }
  suppressScheduleRebuild.value = false
  dialogVisible.value = true
}

function buildPayload(): CreatePricePlanDto {
  return {
    name: form.name.trim(),
    complexId: form.complexId,
    buildingId: form.buildingId,
    floorIds: [...form.floorIds],
    unitUis: [...form.unitUis],
    applyToAllInLocation: form.applyToAllInLocation,
    unitIds: form.applyToAllInLocation ? [] : [...form.unitIds],
    pricingType: form.pricingType,
    sellingPrice: form.sellingPrice,
    downPayment: form.downPayment,
    deliveryAmount: form.deliveryAmount,
    discount: form.discount,
    tax: form.tax,
    registrationFee: form.registrationFee,
    years: form.years,
    paymentIntervalMonths: form.paymentIntervalMonths,
    firstInstallmentDate: firstInstallmentDateModel.value?.toISOString() ?? null,
    installments: installmentRows.value.map((r, i) => ({
      index: i + 1,
      dueDate: r.dueDate,
      amount: Math.round(r.amount || 0),
      percent: Math.round((r.percent || 0) * 100) / 100,
    })),
  }
}

function validate() {
  if (!form.name.trim()) {
    notify.warning('أدخل اسم الخطة')
    return false
  }
  if (!form.complexId) {
    notify.warning('اختر المجمع')
    return false
  }
  if (!form.buildingId) {
    notify.warning('اختر المبنى')
    return false
  }
  if (!form.floorIds.length) {
    notify.warning('اختر طابقاً واحداً على الأقل')
    return false
  }
  if (!form.unitUis.length) {
    notify.warning('اختر مكان طابق واحداً على الأقل')
    return false
  }
  if (!form.applyToAllInLocation && form.unitIds.length === 0) {
    notify.warning('اختر وحدة أو أكثر، أو فعّل كل وحدات الأماكن المختارة')
    return false
  }
  if (!form.years || form.years < 1) {
    notify.warning('عدد السنوات يجب أن يكون 1 على الأقل')
    return false
  }
  if (!form.paymentIntervalMonths || form.paymentIntervalMonths < 1) {
    notify.warning('حدد عدد الأشهر (فترة الدفع)')
    return false
  }
  if ((form.years * 12) % form.paymentIntervalMonths !== 0) {
    notify.warning('عدد الأشهر الكلي يجب أن يقبل القسمة على فترة الدفع')
    return false
  }
  if (!firstInstallmentDateModel.value) {
    notify.warning('حدد تاريخ أول استلام')
    return false
  }
  if (isPercentage.value && (form.downPayment > 100 || form.deliveryAmount > 100)) {
    notify.warning('النسبة لا يمكن أن تتجاوز 100٪')
    return false
  }
  if (remainingAmount.value < 0 || remainingPercent.value < 0) {
    notify.warning('الباقي سالب — راجع سعر الوحدة والمقدمة والاستلام')
    return false
  }
  if (!installmentCount.value) {
    notify.warning('تعذر بناء جدول الأقساط — راجع السنوات وفترة الأشهر')
    return false
  }
  if (installmentRows.value.length !== installmentCount.value) {
    notify.warning('جدول الأقساط غير مكتمل — اضغط إعادة التوزيع')
    return false
  }
  if (!scheduleMatchesRemaining.value) {
    notify.warning(
      isPercentage.value
        ? `مجموع نسب الأقساط (${scheduleSumPercent.value}٪) يجب أن يساوي الباقي (${remainingPercent.value}٪)`
        : `مجموع مبالغ الأقساط (${formatMoney(scheduleSumAmount.value)}) يجب أن يساوي الباقي (${formatMoney(remainingAmount.value)})`,
    )
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
      notify.success(
        payload.applyToAllInLocation || payload.unitIds.length <= 1
          ? 'تم الإنشاء'
          : `تم إنشاء ${payload.unitIds.length} خطط للوحدات المحددة`,
      )
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
  if (!(await ask(`حذف خطة الأسعار "${row.name || 'هذه الخطة'}"؟`))) return
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
    <PageHeader title="خطط الأسعار" subtitle="تسعير حسب المبنى والطابق ومكان الوحدة">
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
        <Column field="name" header="الاسم" />
        <Column header="الهدف">
          <template #body="{ data }">{{ targetLabel(data) }}</template>
        </Column>
        <Column header="نوع التسعير" style="width: 100px">
          <template #body="{ data }">
            {{ labelOf(pricePlanPricingTypeOptions, data.pricingType) || '—' }}
          </template>
        </Column>
        <Column header="سعر البيع" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.sellingPrice) }}</template>
        </Column>
        <Column header="المقدمة" style="width: 100px">
          <template #body="{ data }">
            {{
              data.pricingType === PricePlanPricingType.Percentage
                ? `${data.downPayment}%`
                : formatMoney(data.downPayment)
            }}
          </template>
        </Column>
        <Column header="الاستلام" style="width: 100px">
          <template #body="{ data }">
            {{
              data.pricingType === PricePlanPricingType.Percentage
                ? `${data.deliveryAmount}%`
                : formatMoney(data.deliveryAmount)
            }}
          </template>
        </Column>
        <Column header="السنوات" style="width: 80px">
          <template #body="{ data }">{{ data.years ?? '—' }}</template>
        </Column>
        <Column header="أول استلام" style="width: 110px">
          <template #body="{ data }">{{ formatDate(data.firstInstallmentDate) }}</template>
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
      :style="{ width: '860px' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <div class="form-grid">
        <div class="field full">
          <label>الاسم</label>
          <InputText v-model="form.name" placeholder="اسم خطة الأسعار" />
        </div>
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
            @update:model-value="onComplexChange"
          />
        </div>
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
            filter
            :disabled="!form.complexId"
            @update:model-value="onBuildingChange"
          />
        </div>
        <div v-if="form.buildingId" class="field full">
          <label>الطوابق</label>
          <MultiSelect
            v-model="form.floorIds"
            :options="floorOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر طابقاً أو أكثر"
            display="chip"
            filter
            append-to="body"
            class="w-full"
            @update:model-value="onFloorOrLocationChange"
          />
        </div>
        <div v-if="form.floorIds.length" class="field full">
          <label>أماكن الطابق</label>
          <MultiSelect
            v-model="form.unitUis"
            :options="unitUiOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر مكاناً أو أكثر"
            display="chip"
            append-to="body"
            class="w-full"
            @update:model-value="onFloorOrLocationChange"
          />
        </div>
        <div v-if="form.floorIds.length && form.unitUis.length" class="field full">
          <div class="check-row">
            <Checkbox v-model="form.applyToAllInLocation" binary input-id="apply-all" />
            <label for="apply-all">كل وحدات الأماكن المختارة ({{ locationUnits.length }})</label>
          </div>
        </div>
        <div v-if="form.floorIds.length && form.unitUis.length && !form.applyToAllInLocation" class="field full">
          <label>الوحدات</label>
          <MultiSelect
            v-model="form.unitIds"
            :options="unitOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر وحدة أو أكثر"
            display="chip"
            filter
            append-to="body"
            class="w-full"
          />
        </div>

        <div class="field full section-title">التسعير والدفع</div>
        <div class="field">
          <label>نوع التسعير</label>
          <Select
            v-model="form.pricingType"
            :options="pricePlanPricingTypeOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>مبلغ الوحدة (سعر البيع)</label>
          <InputNumber v-model="form.sellingPrice" :min="0" />
        </div>
        <div class="field">
          <label>{{ isPercentage ? 'المقدمة ٪' : 'المقدمة (مبلغ)' }}</label>
          <InputNumber v-model="form.downPayment" :min="0" :max="isPercentage ? 100 : undefined" />
          <small class="field-hint">
            {{
              isPercentage
                ? `يعني ${formatMoney(downPaymentAmount)} من سعر الوحدة`
                : 'مبلغ نقدي يُخصم من سعر الوحدة'
            }}
          </small>
        </div>
        <div class="field">
          <label>{{ isPercentage ? 'الاستلام ٪' : 'الاستلام (مبلغ)' }}</label>
          <InputNumber v-model="form.deliveryAmount" :min="0" :max="isPercentage ? 100 : undefined" />
          <small class="field-hint">
            {{
              isPercentage
                ? `يعني ${formatMoney(deliveryAmountValue)} من سعر الوحدة`
                : 'مبلغ عند الاستلام يُخصم من سعر الوحدة'
            }}
          </small>
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

        <div class="field full formula-box">
          <strong>معادلة الباقي</strong>
          <p v-if="isPercentage">
            الباقي ٪ = 100 − المقدمة ٪ − الاستلام ٪
            =
            <b>{{ remainingPercent }}٪</b>
            ←
            {{ formatMoney(remainingAmount) }}
          </p>
          <p v-else>
            الباقي = مبلغ الوحدة − المقدمة − الاستلام
            =
            <b>{{ formatMoney(form.sellingPrice || 0) }}</b>
            −
            <b>{{ formatMoney(downPaymentAmount) }}</b>
            −
            <b>{{ formatMoney(deliveryAmountValue) }}</b>
            =
            <b :class="{ 'is-bad': remainingAmount < 0 }">{{ formatMoney(remainingAmount) }}</b>
          </p>
          <small>
            مجموع جدول الأقساط أدناه يجب أن يطابق هذا الباقي تماماً.
          </small>
        </div>

        <div class="field">
          <label>عدد السنوات</label>
          <InputNumber v-model="form.years" :min="1" :max="40" show-buttons />
        </div>
        <div class="field">
          <label>عدد الأشهر (فترة الدفع)</label>
          <InputNumber v-model="form.paymentIntervalMonths" :min="1" :max="12" show-buttons />
        </div>
        <div class="field">
          <label>تاريخ أول استلام / قسط</label>
          <DatePicker v-model="firstInstallmentDateModel" date-format="yy-mm-dd" show-icon />
        </div>

        <div v-if="installmentCount" class="field full schedule-block">
          <div class="schedule-head">
            <div>
              <strong>جدول تسعير الأقساط ({{ installmentCount }})</strong>
              <small>
                {{
                  isPercentage
                    ? 'عدّل النسبة لكل قسط — المجموع = الباقي ٪'
                    : 'عدّل المبلغ لكل قسط — المجموع = الباقي'
                }}
              </small>
            </div>
            <Button
              label="إعادة التوزيع بالتساوي"
              size="small"
              severity="secondary"
              outlined
              @click="rebuildInstallmentSchedule"
            />
          </div>

          <DataTable :value="installmentRows" size="small" striped-rows class="schedule-table">
            <Column header="#" style="width: 56px">
              <template #body="{ data }">{{ data.index }}</template>
            </Column>
            <Column header="الشهر / الاستحقاق">
              <template #body="{ data }">{{ formatDate(data.dueDate) }}</template>
            </Column>
            <Column v-if="isPercentage" header="النسبة ٪">
              <template #body="{ data }">
                <InputNumber
                  v-model="data.percent"
                  :min="0"
                  :max="100"
                  :min-fraction-digits="0"
                  :max-fraction-digits="2"
                  @update:model-value="onInstallmentPercentEdit(data)"
                />
              </template>
            </Column>
            <Column header="السعر">
              <template #body="{ data }">
                <InputNumber
                  v-if="!isPercentage"
                  v-model="data.amount"
                  :min="0"
                  @update:model-value="onInstallmentAmountEdit(data)"
                />
                <span v-else>{{ formatMoney(data.amount) }}</span>
              </template>
            </Column>
          </DataTable>

          <div class="schedule-footer" :class="{ ok: scheduleMatchesRemaining, bad: !scheduleMatchesRemaining }">
            <span v-if="isPercentage">
              مجموع النسب: <strong>{{ scheduleSumPercent }}٪</strong>
              / الباقي: <strong>{{ remainingPercent }}٪</strong>
            </span>
            <span v-else>
              مجموع الأسعار: <strong>{{ formatMoney(scheduleSumAmount) }}</strong>
              / الباقي: <strong>{{ formatMoney(remainingAmount) }}</strong>
            </span>
            <strong>{{ scheduleMatchesRemaining ? 'مطابق ✓' : 'غير مطابق' }}</strong>
          </div>
        </div>
        <div v-else-if="form.years && form.paymentIntervalMonths" class="field full formula-box is-warn">
          الأشهر الكلية لا تقبل القسمة على فترة الدفع — عدّل السنوات أو عدد الأشهر لإظهار الجدول.
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

<style scoped>
.section-title {
  margin-top: 8px;
  font-weight: 800;
  color: var(--brand);
  font-size: 0.92rem;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.check-row label {
  margin: 0;
  cursor: pointer;
  font-weight: 700;
}

.w-full {
  width: 100%;
}

.field-hint {
  display: block;
  margin-top: 4px;
  font-size: 0.78rem;
  color: var(--muted);
}

.formula-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--brand-soft);
  border: 1px solid color-mix(in srgb, var(--brand-mid) 18%, var(--border));
}

.formula-box p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
}

.formula-box .is-bad {
  color: var(--danger);
}

.formula-box.is-warn {
  background: #fff6e5;
  border-color: color-mix(in srgb, var(--warning) 30%, var(--border));
  color: #8a5a00;
}

.schedule-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schedule-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.schedule-head strong {
  display: block;
}

.schedule-head small {
  color: var(--muted);
  font-size: 0.8rem;
}

.schedule-table :deep(.p-inputnumber) {
  width: 100%;
}

.schedule-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.88rem;
}

.schedule-footer.ok {
  background: color-mix(in srgb, #e8f6f0 90%, white);
  color: var(--success);
}

.schedule-footer.bad {
  background: color-mix(in srgb, #fdecea 90%, white);
  color: var(--danger);
}
</style>
