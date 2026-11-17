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
import { PricePlanPricingType, PricePlanScheduleKind, UnitUi } from '@/types'
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
import TableSortCaption from '@/components/TableSortCaption.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

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
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort,
  sortField,
  sortOrder,
  sortMode, onLazyPage,
} = usePagedList<PricePlan, PricePlanParams>(getPricePlans)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(auth.scopedComplexId)
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

const installmentOnlyRows = computed(() =>
  installmentRows.value.filter((r) => (r.kind ?? PricePlanScheduleKind.Installment) === PricePlanScheduleKind.Installment),
)

const scheduleSumAmount = computed(() =>
  Math.round(installmentOnlyRows.value.reduce((s, r) => s + (r.amount || 0), 0)),
)

const scheduleSumPercent = computed(
  () => Math.round(installmentOnlyRows.value.reduce((s, r) => s + (r.percent || 0), 0) * 100) / 100,
)

const scheduleMatchesRemaining = computed(() => {
  if (!installmentCount.value || installmentOnlyRows.value.length !== installmentCount.value) return false
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

function monthsBetween(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
}

function installmentArabicName(n: number) {
  const names = [
    'الدفعة الأولى',
    'الدفعة الثانية',
    'الدفعة الثالثة',
    'الدفعة الرابعة',
    'الدفعة الخامسة',
    'الدفعة السادسة',
    'الدفعة السابعة',
    'الدفعة الثامنة',
    'الدفعة التاسعة',
    'الدفعة العاشرة',
    'الدفعة الحادية عشرة',
    'الدفعة الثانية عشرة',
  ]
  return names[n - 1] || `الدفعة ${n}`
}

function kindLabel(kind?: number | null) {
  if (kind === PricePlanScheduleKind.Delivery) return 'استلام'
  if (kind === PricePlanScheduleKind.DownPayment) return 'مقدمة'
  return 'دفعة'
}

function reindexSchedule() {
  installmentRows.value.forEach((r, i) => {
    r.index = i + 1
  })
}

function syncSpecialAmounts() {
  for (const row of installmentRows.value) {
    if (row.kind === PricePlanScheduleKind.Delivery) {
      row.amount = deliveryAmountValue.value
      row.percent = isPercentage.value
        ? Math.round((form.deliveryAmount || 0) * 100) / 100
        : form.sellingPrice
          ? Math.round((deliveryAmountValue.value / form.sellingPrice) * 10000) / 100
          : 0
      row.name = 'الاستلام'
    } else if (row.kind === PricePlanScheduleKind.DownPayment) {
      row.amount = downPaymentAmount.value
      row.percent = isPercentage.value
        ? Math.round((form.downPayment || 0) * 100) / 100
        : form.sellingPrice
          ? Math.round((downPaymentAmount.value / form.sellingPrice) * 10000) / 100
          : 0
      row.name = 'دفعة المقدمة'
    }
  }
}

/** يبني جدولاً موحداً: استلام → دفعات → مقدمة (قابل لإعادة الترتيب) */
function rebuildInstallmentSchedule() {
  const count = installmentCount.value
  if (!count || remainingAmount.value < 0 || (isPercentage.value && remainingPercent.value < 0)) {
    installmentRows.value = []
    return
  }

  const start = firstInstallmentDateModel.value || new Date()
  const interval = form.paymentIntervalMonths || 1
  const rows: PricePlanInstallmentItem[] = []

  if (deliveryAmountValue.value > 0 || (isPercentage.value && (form.deliveryAmount || 0) > 0)) {
    rows.push({
      index: 1,
      kind: PricePlanScheduleKind.Delivery,
      name: 'الاستلام',
      monthOffset: 0,
      dueDate: addMonths(start, 0).toISOString(),
      amount: deliveryAmountValue.value,
      percent: isPercentage.value
        ? Math.round((form.deliveryAmount || 0) * 100) / 100
        : form.sellingPrice
          ? Math.round((deliveryAmountValue.value / form.sellingPrice) * 10000) / 100
          : 0,
    })
  }

  if (isPercentage.value) {
    const base = Math.floor((remainingPercent.value / count) * 100) / 100
    let allocated = 0
    for (let i = 0; i < count; i++) {
      const percent =
        i === count - 1
          ? Math.round((remainingPercent.value - allocated) * 100) / 100
          : base
      allocated = Math.round((allocated + percent) * 100) / 100
      const amount = Math.round(((form.sellingPrice || 0) * percent) / 100)
      const monthOffset = interval * i
      rows.push({
        index: rows.length + 1,
        kind: PricePlanScheduleKind.Installment,
        name: installmentArabicName(i + 1),
        monthOffset,
        dueDate: addMonths(start, monthOffset).toISOString(),
        amount,
        percent,
      })
    }
  } else {
    const base = Math.round(remainingAmount.value / count)
    let allocated = 0
    for (let i = 0; i < count; i++) {
      const amount = i === count - 1 ? remainingAmount.value - allocated : base
      allocated += amount
      const percent = form.sellingPrice
        ? Math.round((amount / form.sellingPrice) * 10000) / 100
        : 0
      const monthOffset = interval * i
      rows.push({
        index: rows.length + 1,
        kind: PricePlanScheduleKind.Installment,
        name: installmentArabicName(i + 1),
        monthOffset,
        dueDate: addMonths(start, monthOffset).toISOString(),
        amount,
        percent,
      })
    }
  }

  if (downPaymentAmount.value > 0 || (isPercentage.value && (form.downPayment || 0) > 0)) {
    const lastOffset = rows.length
      ? Math.max(...rows.map((r) => r.monthOffset || 0)) + interval
      : 0
    rows.push({
      index: rows.length + 1,
      kind: PricePlanScheduleKind.DownPayment,
      name: 'دفعة المقدمة',
      monthOffset: lastOffset,
      dueDate: addMonths(start, lastOffset).toISOString(),
      amount: downPaymentAmount.value,
      percent: isPercentage.value
        ? Math.round((form.downPayment || 0) * 100) / 100
        : form.sellingPrice
          ? Math.round((downPaymentAmount.value / form.sellingPrice) * 10000) / 100
          : 0,
    })
  }

  installmentRows.value = rows
  reindexSchedule()
}

function moveScheduleRow(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= installmentRows.value.length) return
  const copy = [...installmentRows.value]
  const [item] = copy.splice(index, 1)
  copy.splice(target, 0, item)
  installmentRows.value = copy
  reindexSchedule()
}

function onMonthOffsetEdit(row: PricePlanInstallmentItem) {
  const start = firstInstallmentDateModel.value || new Date()
  const offset = Math.max(0, Math.round(row.monthOffset || 0))
  row.monthOffset = offset
  row.dueDate = addMonths(start, offset).toISOString()
}

function onDueDateEdit(row: PricePlanInstallmentItem, value: Date | null) {
  if (!value) return
  const start = firstInstallmentDateModel.value || new Date()
  row.dueDate = value.toISOString()
  row.monthOffset = Math.max(0, monthsBetween(start, value))
}

function onInstallmentAmountEdit(row: PricePlanInstallmentItem) {
  if (row.kind === PricePlanScheduleKind.Delivery || row.kind === PricePlanScheduleKind.DownPayment) {
    syncSpecialAmounts()
    return
  }
  row.amount = Math.round(row.amount || 0)
  row.percent = form.sellingPrice
    ? Math.round((row.amount / form.sellingPrice) * 10000) / 100
    : 0
}

function onInstallmentPercentEdit(row: PricePlanInstallmentItem) {
  if (row.kind === PricePlanScheduleKind.Delivery || row.kind === PricePlanScheduleKind.DownPayment) {
    syncSpecialAmounts()
    return
  }
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
    complexId: auth.scopedComplexId || complexFilter.value || complexes.value[0]?.id || '',
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
    const hasUnified = row.installments.some(
      (i) =>
        i.kind === PricePlanScheduleKind.Delivery ||
        i.kind === PricePlanScheduleKind.DownPayment,
    )
    if (hasUnified) {
      installmentRows.value = row.installments.map((i, idx) => ({
        ...i,
        index: idx + 1,
        kind: i.kind ?? PricePlanScheduleKind.Installment,
        monthOffset: i.monthOffset ?? 0,
        name: i.name || null,
      }))
      syncSpecialAmounts()
    } else {
      // جدول قديم: دفعات فقط — أعد البناء مع الاستلام/المقدمة واحفظ مبالغ الدفعات
      const legacy = row.installments.map((i) => ({ ...i }))
      rebuildInstallmentSchedule()
      const inst = installmentRows.value.filter(
        (r) => r.kind === PricePlanScheduleKind.Installment,
      )
      legacy.forEach((src, i) => {
        if (!inst[i]) return
        inst[i].amount = Math.round(src.amount || 0)
        inst[i].percent = Math.round((src.percent || 0) * 100) / 100
        if (src.dueDate) {
          inst[i].dueDate = src.dueDate
          const start = firstInstallmentDateModel.value || new Date()
          inst[i].monthOffset = Math.max(0, monthsBetween(start, new Date(src.dueDate)))
        }
      })
    }
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
      kind: r.kind ?? PricePlanScheduleKind.Installment,
      name: r.name || null,
      monthOffset: r.monthOffset ?? 0,
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
  if (installmentOnlyRows.value.length !== installmentCount.value) {
    notify.warning('جدول الدفعات غير مكتمل — اضغط إعادة بناء الجدول')
    return false
  }
  if (!scheduleMatchesRemaining.value) {
    notify.warning(
      isPercentage.value
        ? `مجموع نسب الدفعات (${scheduleSumPercent.value}٪) يجب أن يساوي الباقي (${remainingPercent.value}٪)`
        : `مجموع مبالغ الدفعات (${formatMoney(scheduleSumAmount.value)}) يجب أن يساوي الباقي (${formatMoney(remainingAmount.value)})`,
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
      <FilterBar v-model:search="search" placeholder="ابحث..." @search="onSearch"
        v-model:sort-mode="sortMode"
        @sort-change="setSortMode">
        <template #filters>
          <Select
            v-if="auth.canSelectComplex"
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
        <Column field="name" header="الاسم"  sortable />
        <Column header="الهدف" sortable>
          <template #body="{ data }">{{ targetLabel(data) }}</template>
        </Column>
        <Column header="نوع التسعير" style="width: 100px" sortable>
          <template #body="{ data }">
            {{ labelOf(pricePlanPricingTypeOptions, data.pricingType) || '—' }}
          </template>
        </Column>
        <Column header="سعر البيع" style="width: 120px" sortable>
          <template #body="{ data }">{{ formatMoney(data.sellingPrice) }}</template>
        </Column>
        <Column header="المقدمة" style="width: 100px" sortable>
          <template #body="{ data }">
            {{
              data.pricingType === PricePlanPricingType.Percentage
                ? `${data.downPayment}%`
                : formatMoney(data.downPayment)
            }}
          </template>
        </Column>
        <Column header="الاستلام" style="width: 100px" sortable>
          <template #body="{ data }">
            {{
              data.pricingType === PricePlanPricingType.Percentage
                ? `${data.deliveryAmount}%`
                : formatMoney(data.deliveryAmount)
            }}
          </template>
        </Column>
        <Column header="السنوات" style="width: 80px" sortable>
          <template #body="{ data }">{{ data.years ?? '—' }}</template>
        </Column>
        <Column header="أول استلام" style="width: 110px" sortable>
          <template #body="{ data }">{{ formatDate(data.firstInstallmentDate) }}</template>
        </Column>
        <Column header="المجمع" sortable>
          <template #body="{ data }">{{ complexMap[data.complexId] || '—' }}</template>
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
            :disabled="!auth.canSelectComplex"
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
              <strong>جدول الدفعات المرتّب ({{ installmentRows.length }} صف)</strong>
              <small>
                رتّب الصفوف (استلام / دفعات / مقدمة) وعدّل الأشهر والتواريخ — عند إنشاء عقد تُستدعى بنفس الترتيب
              </small>
            </div>
            <Button
              label="إعادة بناء الجدول"
              size="small"
              severity="secondary"
              outlined
              @click="rebuildInstallmentSchedule"
            />
          </div>

          <DataTable :value="installmentRows" size="small" striped-rows class="schedule-table">
            <Column header="ترتيب" style="width: 92px">
              <template #body="{ index }">
                <div class="order-btns">
                  <Button
                    icon="pi pi-arrow-up"
                    size="small"
                    text
                    rounded
                    :disabled="index === 0"
                    @click="moveScheduleRow(index, -1)"
                  />
                  <Button
                    icon="pi pi-arrow-down"
                    size="small"
                    text
                    rounded
                    :disabled="index === installmentRows.length - 1"
                    @click="moveScheduleRow(index, 1)"
                  />
                </div>
              </template>
            </Column>
            <Column header="#" style="width: 48px">
              <template #body="{ data }">{{ data.index }}</template>
            </Column>
            <Column header="النوع" style="width: 88px">
              <template #body="{ data }">
                <span class="kind-pill" :data-kind="data.kind">{{ kindLabel(data.kind) }}</span>
              </template>
            </Column>
            <Column header="الاسم">
              <template #body="{ data }">
                <InputText v-model="data.name" class="w-full" />
              </template>
            </Column>
            <Column header="الشهر" style="width: 110px">
              <template #body="{ data }">
                <InputNumber
                  v-model="data.monthOffset"
                  :min="0"
                  :max="480"
                  show-buttons
                  @update:model-value="onMonthOffsetEdit(data)"
                />
              </template>
            </Column>
            <Column header="تاريخ الاستحقاق" style="width: 160px">
              <template #body="{ data }">
                <DatePicker
                  :model-value="data.dueDate ? new Date(data.dueDate) : null"
                  date-format="yy-mm-dd"
                  show-icon
                  @update:model-value="(v) => onDueDateEdit(data, Array.isArray(v) ? (v[0] ?? null) : (v ?? null))"
                />
              </template>
            </Column>
            <Column v-if="isPercentage" header="النسبة ٪" style="width: 120px">
              <template #body="{ data }">
                <InputNumber
                  v-model="data.percent"
                  :min="0"
                  :max="100"
                  :min-fraction-digits="0"
                  :max-fraction-digits="2"
                  :disabled="
                    data.kind === PricePlanScheduleKind.Delivery ||
                    data.kind === PricePlanScheduleKind.DownPayment
                  "
                  @update:model-value="onInstallmentPercentEdit(data)"
                />
              </template>
            </Column>
            <Column header="المبلغ" style="width: 140px">
              <template #body="{ data }">
                <InputNumber
                  v-if="
                    !isPercentage &&
                    data.kind !== PricePlanScheduleKind.Delivery &&
                    data.kind !== PricePlanScheduleKind.DownPayment
                  "
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
              مجموع نسب الدفعات: <strong>{{ scheduleSumPercent }}٪</strong>
              / الباقي: <strong>{{ remainingPercent }}٪</strong>
            </span>
            <span v-else>
              مجموع مبالغ الدفعات: <strong>{{ formatMoney(scheduleSumAmount) }}</strong>
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

.order-btns {
  display: inline-flex;
  gap: 2px;
}

.kind-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--brand-soft);
  color: var(--brand);
}

.kind-pill[data-kind='1'] {
  background: #e8f5e9;
  color: #1b5e20;
}

.kind-pill[data-kind='2'] {
  background: #fff3e0;
  color: #e65100;
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
