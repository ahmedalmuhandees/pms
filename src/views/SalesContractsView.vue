<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import RememberedInput from '@/components/RememberedInput.vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import ToggleSwitch from 'primevue/toggleswitch'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type {
  Building,
  Complex,
  ContractDesign,
  ContractDownPaymentScheduleItem,
  CreateSalesContractDto,
  Customer,
  Employee,
  Floor,
  Installment,
  PagedResult,
  PricePlan,
  PricePlanInstallmentItem,
  SalesContract,
  Unit,
} from '@/types'
import {
  ContractPaymentType,
  ContractStatus,
  ContractType,
  InstallmentStatus,
  PricePlanPricingType,
  PricingMode,
  UnitStatus,
} from '@/types'
import {
  createSalesContract,
  deleteSalesContract,
  downloadSalesContractPdf,
  getSalesContract,
  getSalesContracts,
  updateSalesContract,
  type SalesContractParams,
} from '@/api/salesContracts'
import { getPricePlans } from '@/api/pricePlans'
import { getContractDesigns } from '@/api/contractDesigns'
import { getComplexes } from '@/api/complexes'
import { getCustomers } from '@/api/customers'
import { getBuildings } from '@/api/buildings'
import { getUnit, getUnits, updateUnit } from '@/api/units'
import { getFloors } from '@/api/floors'
import { getEmployees } from '@/api/employees'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  contractPaymentTypeOptions,
  contractStatusOptions,
  formatDate,
  formatMoney,
  installmentStatusLabel,
  labelOf,
  pricePlanPricingTypeOptions,
  pricingModeOptions,
  unitStatusOptions,
} from '@/utils/enums'
import {
  compareContractNumbers,
  compareUnitNumbers,
  normalizeUnitSearch,
  unitSearchMatches,
} from '@/utils/unitSearch'

interface SalesTableRow {
  key: string
  sequence: number
  complexId: string
  complexName: string
  buildingId: string
  buildingName: string
  unitId: string
  unitNumber: string
  unitStatus: UnitStatus
  contract: SalesContract | null
}
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import TableSortCaption from '@/components/TableSortCaption.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const notify = useNotify()
const { ask } = useConfirmAction()
const route = useRoute()
const router = useRouter()
const complexes = ref<Complex[]>([])
const customers = ref<Customer[]>([])
const units = ref<Unit[]>([])
const buildings = ref<Building[]>([])
const floors = ref<Floor[]>([])
const employees = ref<Employee[]>([])
const pricePlans = ref<PricePlan[]>([])
const contractDesigns = ref<ContractDesign[]>([])
const allContracts = ref<SalesContract[]>([])
const complexMap = ref<Record<string, string>>({})
const customerMap = ref<Record<string, string>>({})
const unitMap = ref<Record<string, string>>({})
const buildingMap = ref<Record<string, string>>({})
const employeeMap = ref<Record<string, string>>({})
const buildingUnitIds = ref<Set<string> | null>(null)

const buildingIdFilter = computed(() => {
  const value = route.query.buildingId
  return typeof value === 'string' && value ? value : null
})
const buildingNameFilter = computed(() => {
  const value = route.query.buildingName
  return typeof value === 'string' && value ? value : null
})
const blockIdFilter = computed(() => {
  const value = route.query.blockId
  return typeof value === 'string' && value ? value : null
})
const blockNameFilter = computed(() => {
  const value = route.query.blockName
  return typeof value === 'string' && value ? value : null
})
const scopeFilterActive = computed(() => !!(buildingIdFilter.value || blockIdFilter.value))
const scopeFilterLabel = computed(() => {
  if (blockIdFilter.value) {
    return blockNameFilter.value || blockIdFilter.value.slice(0, 8)
  }
  if (buildingIdFilter.value) {
    return buildingNameFilter.value || buildingIdFilter.value.slice(0, 8)
  }
  return ''
})
const scopeFilterKindLabel = computed(() => (blockIdFilter.value ? 'البلوك' : 'المبنى'))

const floorToBuilding = computed(() => {
  const map: Record<string, string> = {}
  for (const floor of floors.value) map[floor.id] = floor.buildingId
  return map
})

const unitById = computed(() => Object.fromEntries(units.value.map((u) => [u.id, u])))

const contractByUnitId = computed(() => {
  const map = new Map<string, SalesContract>()
  // items أولاً ثم allContracts — وعند التعارض نفضّل الأحدث بـ updatedAt
  const sorted = [...items.value, ...allContracts.value].sort((a, b) => {
    const tb = new Date(b.updatedAt || b.createdAt || b.contractDate).getTime()
    const ta = new Date(a.updatedAt || a.createdAt || a.contractDate).getTime()
    return tb - ta
  })
  for (const contract of sorted) {
    if (!contract.unitId || map.has(contract.unitId)) continue
    if (
      contract.contractStatus === ContractStatus.Cancelled ||
      contract.contractStatus === ContractStatus.Suspended
    ) {
      continue
    }
    map.set(contract.unitId, contract)
  }
  return map
})

function unitMeta(unit: Unit | undefined) {
  const buildingId = unit ? floorToBuilding.value[unit.floorId] || '' : ''
  return {
    complexId: unit?.complexId || '',
    complexName: unit ? complexMap.value[unit.complexId] || unit.complexId.slice(0, 8) : '—',
    buildingId,
    buildingName: buildingId ? buildingMap.value[buildingId] || buildingId.slice(0, 8) : '—',
    unitNumber: unit?.unitNumber || unit?.id.slice(0, 8) || '—',
    unitStatus: unit?.status ?? UnitStatus.Available,
  }
}

async function resolveBuildingUnitIds(buildingId: string) {
  const floorIds = new Set(
    floors.value.filter((f) => f.buildingId === buildingId).map((f) => f.id),
  )
  if (floorIds.size === 0) {
    const floorsResult = await getFloors({ BuildingId: buildingId, Page: 1, PageSize: 1000 })
    for (const floor of floorsResult.items ?? []) floorIds.add(floor.id)
  }
  return new Set(units.value.filter((u) => floorIds.has(u.floorId)).map((u) => u.id))
}

async function resolveBlockUnitIds(blockId: string) {
  const buildingsResult = await getBuildings({ BlockId: blockId, Page: 1, PageSize: 500 })
  const buildingIds = new Set((buildingsResult.items ?? []).map((b) => b.id))
  if (buildingIds.size === 0) return new Set<string>()

  let floorIds = new Set(
    floors.value.filter((f) => buildingIds.has(f.buildingId)).map((f) => f.id),
  )
  if (floorIds.size === 0) {
    const floorsResult = await getFloors({ Page: 1, PageSize: 2000 })
    floorIds = new Set(
      (floorsResult.items ?? [])
        .filter((f) => buildingIds.has(f.buildingId))
        .map((f) => f.id),
    )
  }
  return new Set(units.value.filter((u) => floorIds.has(u.floorId)).map((u) => u.id))
}

async function resolveScopeUnitIds() {
  if (blockIdFilter.value) return resolveBlockUnitIds(blockIdFilter.value)
  if (buildingIdFilter.value) return resolveBuildingUnitIds(buildingIdFilter.value)
  return null
}

async function fetchSalesContracts(params?: SalesContractParams): Promise<PagedResult<SalesContract>> {
  if (!buildingUnitIds.value) {
    return getSalesContracts(params)
  }

  const page = params?.Page && params.Page > 0 ? params.Page : 1
  const pageSize = params?.PageSize && params.PageSize > 0 ? params.PageSize : 10
  const all = await getSalesContracts({
    ...params,
    Page: 1,
    PageSize: 1000,
  })
  allContracts.value = all.items ?? []
  const filtered = (all.items ?? []).filter((c) => buildingUnitIds.value!.has(c.unitId))
  const start = (page - 1) * pageSize
  const totalCount = filtered.length

  return {
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize) || 1),
  }
}

const {
  items,
  loading,
  search,
  load,
  onSearch,
  setSortMode,
  onTableSort: cyclePagedSort,
  sortField,
  sortOrder,
  sortMode,
} = usePagedList<SalesContract, SalesContractParams>(fetchSalesContracts)

const dialogVisible = ref(false)
const detailVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(auth.scopedComplexId)
const statusFilter = ref<number | null>(null)
const unitStatusFilter = ref<number | null>(null)
const paymentTypeFilter = ref<number | null>(null)
const deliveryDateModel = ref<Date | null>(null)
const firstInstallmentDateModel = ref<Date | null>(null)
const contractDateModel = ref<Date | null>(null)
const detailContract = ref<SalesContract | null>(null)
const unitTablePage = ref(1)
const unitTablePageSize = ref(20)

/** نقر رأس العمود — يبدّل الوضع الثلاثة ويعيد الصفحة الأولى */
function onTableSort() {
  unitTablePage.value = 1
  cyclePagedSort()
}

const unitScopedRows = computed((): SalesTableRow[] => {
  const sourceUnits = buildingUnitIds.value
    ? units.value.filter((u) => buildingUnitIds.value!.has(u.id))
    : units.value

  const q = search.value.trim().toLowerCase()
  const rows = sourceUnits
    .filter((unit) => {
      if (complexFilter.value && unit.complexId !== complexFilter.value) return false
      if (unitStatusFilter.value != null && unit.status !== unitStatusFilter.value) return false

      const contract = contractByUnitId.value.get(unit.id) ?? null
      if (
        paymentTypeFilter.value != null &&
        (!contract || contract.contractPaymentType !== paymentTypeFilter.value)
      ) {
        return false
      }
      if (
        statusFilter.value != null &&
        (!contract || contract.contractStatus !== statusFilter.value)
      ) {
        return false
      }

      if (!q) return true
      const meta = unitMeta(unit)
      return (
        unitSearchMatches(meta.unitNumber, q) ||
        meta.buildingName.toLowerCase().includes(q) ||
        meta.complexName.toLowerCase().includes(q) ||
        unitSearchMatches(contract?.contractNumber, q) ||
        (contract?.contractNumber || '').toLowerCase().includes(q)
      )
    })

  const rowTime = (unit: Unit) => {
    const contract = contractByUnitId.value.get(unit.id)
    const raw =
      contract?.createdAt ||
      contract?.updatedAt ||
      contract?.contractDate ||
      unit.createdAt ||
      ''
    return raw ? new Date(raw).getTime() : 0
  }

  rows.sort((a, b) => {
    const contractA = contractByUnitId.value.get(a.id)
    const contractB = contractByUnitId.value.get(b.id)
    const numA = contractA?.contractNumber
    const numB = contractB?.contractNumber
    const hasA = !!numA?.toString().trim()
    const hasB = !!numB?.toString().trim()

    if (sortMode.value === 'sequential') {
      // رقم العقد 1، 2، 3… ثم الوحدات بلا عقد حسب رقم الوحدة
      if (hasA !== hasB) return hasA ? -1 : 1
      if (hasA && hasB) {
        const byContract = compareContractNumbers(numA, numB)
        if (byContract !== 0) return byContract
      }
      return compareUnitNumbers(a.unitNumber, b.unitNumber)
    }

    if (sortMode.value === 'reverse') {
      if (hasA !== hasB) return hasA ? -1 : 1
      if (hasA && hasB) {
        const byContract = compareContractNumbers(numB, numA)
        if (byContract !== 0) return byContract
      }
      return compareUnitNumbers(b.unitNumber, a.unitNumber)
    }

    // آخر إضافة: الأحدث أولاً، ثم رقم العقد، ثم رقم الوحدة
    const ta = rowTime(a)
    const tb = rowTime(b)
    if (ta !== tb) return tb - ta
    if (hasA && hasB) {
      const byContract = compareContractNumbers(numA, numB)
      if (byContract !== 0) return byContract
    }
    return compareUnitNumbers(a.unitNumber, b.unitNumber)
  })

  return rows.map((unit, index) => {
    const meta = unitMeta(unit)
    return {
      key: unit.id,
      sequence: index + 1,
      ...meta,
      unitId: unit.id,
      contract: contractByUnitId.value.get(unit.id) ?? null,
    }
  })
})

const pagedUnitRows = computed(() => {
  const start = (unitTablePage.value - 1) * unitTablePageSize.value
  return unitScopedRows.value.slice(start, start + unitTablePageSize.value)
})

/** جدول الوحدات دائماً حتى تظهر المتاح/محجوز/مباع… */
const tableRows = computed(() => pagedUnitRows.value)
const tableTotal = computed(() => unitScopedRows.value.length)
const tableFirst = computed(() => (unitTablePage.value - 1) * unitTablePageSize.value)
const tablePageSize = computed(() => unitTablePageSize.value)
const tableLoading = computed(() => loading.value && units.value.length === 0)

function onTablePage(event: { page: number; rows: number }) {
  unitTablePage.value = event.page + 1
  unitTablePageSize.value = event.rows
}

function onComplexFilterChange(value: string | null) {
  complexFilter.value = value
  unitTablePage.value = 1
}

function onSearchUnits() {
  unitTablePage.value = 1
  void onSearch()
}

function emptyForm(): CreateSalesContractDto {
  return {
    contractType: ContractType.Sale,
    contractPaymentType: ContractPaymentType.Cash,
    pricingMode: PricingMode.Manual,
    pricePlanId: null,
    contractDesignId: null,
    sellingPrice: 0,
    discount: 0,
    tax: 0,
    registrationFee: 0,
    downPayment: 0,
    deliveryAmount: 0,
    deliveryDate: null,
    financedAmount: 0,
    bankName: null,
    years: null,
    paymentIntervalMonths: null,
    firstInstallmentDate: null,
    contractDate: null,
    contractNumber: null,
    contractStatus: ContractStatus.Draft,
    customerId: '',
    unitId: '',
    salesAgentId: '',
    complexId: '',
  }
}

const form = reactive<CreateSalesContractDto>(emptyForm())
const pricingType = ref<PricePlanPricingType>(PricePlanPricingType.Amount)
const installmentRows = ref<PricePlanInstallmentItem[]>([])
const downPaymentScheduleEnabled = ref(false)
const downPaymentRows = ref<ContractDownPaymentScheduleItem[]>([])
const suppressScheduleRebuild = ref(false)

const activeContractDesign = computed(() => {
  if (form.contractDesignId) {
    return contractDesigns.value.find((d) => d.id === form.contractDesignId) ?? null
  }
  if (!form.complexId) return null
  const inComplex = contractDesigns.value.filter((d) => d.complexId === form.complexId)
  return inComplex[0] ?? null
})
const contractNumberSequence = computed(() => {
  const seq = activeContractDesign.value?.contractNumberSequence
  return seq && seq > 0 ? seq : 1
})

const isCash = computed(() => form.contractPaymentType === ContractPaymentType.Cash)
const isBank = computed(() => form.contractPaymentType === ContractPaymentType.RealEstateBank)
const isCashInstallments = computed(
  () => form.contractPaymentType === ContractPaymentType.CashInstallments,
)
const usesInstallments = computed(() => isBank.value || isCashInstallments.value)
const isSystemPricing = computed(() => form.pricingMode === PricingMode.System)
const isManualPricing = computed(() => form.pricingMode === PricingMode.Manual)
const isPercentage = computed(() => pricingType.value === PricePlanPricingType.Percentage)

const selectedPricePlan = computed(
  () => pricePlans.value.find((p) => p.id === form.pricePlanId) ?? null,
)

function resolvePlanUnitIds(plan: PricePlan): Set<string> {
  if (plan.unitIds?.length) return new Set(plan.unitIds)
  if (plan.unitId) return new Set([plan.unitId])

  const floorIds = plan.floorIds?.length
    ? plan.floorIds
    : plan.floorId
      ? [plan.floorId]
      : []
  const unitUis = plan.unitUis?.length
    ? plan.unitUis
    : plan.unitUi != null
      ? [plan.unitUi]
      : []

  if (floorIds.length && unitUis.length) {
    const floorSet = new Set(floorIds)
    const uiSet = new Set(unitUis)
    return new Set(
      units.value
        .filter(
          (u) =>
            floorSet.has(u.floorId) &&
            u.unitUi != null &&
            uiSet.has(u.unitUi) &&
            (!plan.complexId || u.complexId === plan.complexId),
        )
        .map((u) => u.id),
    )
  }

  if (plan.buildingId) {
    const buildingFloorIds = new Set(
      floors.value.filter((f) => f.buildingId === plan.buildingId).map((f) => f.id),
    )
    return new Set(
      units.value
        .filter(
          (u) =>
            buildingFloorIds.has(u.floorId) &&
            (!plan.complexId || u.complexId === plan.complexId),
        )
        .map((u) => u.id),
    )
  }

  return new Set()
}

const downPaymentAmount = computed(() => {
  if (isManualPricing.value && isPercentage.value) {
    return Math.round(((form.sellingPrice || 0) * (form.downPayment || 0)) / 100)
  }
  return Math.round(form.downPayment || 0)
})

const deliveryAmountValue = computed(() => {
  if (isManualPricing.value && isPercentage.value) {
    return Math.round(((form.sellingPrice || 0) * (form.deliveryAmount || 0)) / 100)
  }
  return Math.round(form.deliveryAmount || 0)
})

/** RemainingAmount = SellingPrice - FinancedAmount - DownPayment - DeliveryAmount */
const computedRemaining = computed(() => {
  const financed = isBank.value ? form.financedAmount || 0 : 0
  return (form.sellingPrice || 0) - financed - downPaymentAmount.value - deliveryAmountValue.value
})

/** المتبقي > 0 فقط يحتاج سنوات/فترة/جدول أقساط */
const needsInstallmentSchedule = computed(
  () => usesInstallments.value && Math.round(computedRemaining.value) > 0,
)
const remainingIsZero = computed(() => Math.round(computedRemaining.value) === 0)

const bankNameOptions = computed(() => {
  const cid = form.complexId
  if (!cid) return [] as { label: string; value: string; designId: string }[]
  const seen = new Set<string>()
  const options: { label: string; value: string; designId: string }[] = []
  for (const d of contractDesigns.value) {
    if (d.complexId !== cid) continue
    const name = d.realEstateBankName?.trim()
    if (!name || seen.has(name)) continue
    seen.add(name)
    options.push({ label: name, value: name, designId: d.id })
  }
  return options
})

function onBankNamePicked(value: string | null) {
  form.bankName = value
  const match = bankNameOptions.value.find((o) => o.value === value)
  form.contractDesignId = match?.designId ?? form.contractDesignId ?? null
}

function applyDefaultBankFromDesign() {
  if (!isBank.value) return
  if (form.bankName?.trim()) return
  const first = bankNameOptions.value[0]
  if (!first) return
  form.bankName = first.value
  form.contractDesignId = first.designId
}

const remainingPercent = computed(() => {
  if (isManualPricing.value && isPercentage.value) {
    return Math.round((100 - (form.downPayment || 0) - (form.deliveryAmount || 0)) * 100) / 100
  }
  if (!form.sellingPrice) return 0
  return Math.round((computedRemaining.value / form.sellingPrice) * 10000) / 100
})

const computedMonths = computed(() => {
  if (!usesInstallments.value || !form.years) return 0
  return form.years * 12
})

const computedInstallmentCount = computed(() => {
  if (!needsInstallmentSchedule.value || !form.years || !form.paymentIntervalMonths) return 0
  const months = form.years * 12
  if (months % form.paymentIntervalMonths !== 0) return 0
  return months / form.paymentIntervalMonths
})

/** الأقساط تُقسَّم على المتبقي وليس مبلغ المصرف */
const computedInstallmentAmount = computed(() => {
  const count = computedInstallmentCount.value
  if (!count || Math.round(computedRemaining.value) <= 0) return 0
  return computedRemaining.value / count
})

const scheduleSumAmount = computed(() =>
  Math.round(installmentRows.value.reduce((s, r) => s + (r.amount || 0), 0)),
)

const scheduleSumPercent = computed(
  () => Math.round(installmentRows.value.reduce((s, r) => s + (r.percent || 0), 0) * 100) / 100,
)

const scheduleMatchesRemaining = computed(() => {
  if (
    !computedInstallmentCount.value ||
    installmentRows.value.length !== computedInstallmentCount.value
  ) {
    return false
  }
  if (isPercentage.value) {
    return Math.abs(scheduleSumPercent.value - remainingPercent.value) <= 0.01
  }
  return scheduleSumAmount.value === Math.round(computedRemaining.value)
})

const downPaymentScheduleSum = computed(() =>
  Math.round(downPaymentRows.value.reduce((s, r) => s + (r.amount || 0), 0)),
)

const downPaymentScheduleMatches = computed(
  () =>
    downPaymentScheduleEnabled.value &&
    downPaymentRows.value.length > 0 &&
    downPaymentScheduleSum.value === Math.round(downPaymentAmount.value),
)

function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function rebuildDownPaymentSchedule(count = Math.max(downPaymentRows.value.length, 2)) {
  const total = Math.round(downPaymentAmount.value)
  if (!downPaymentScheduleEnabled.value || total <= 0) {
    downPaymentRows.value = []
    return
  }
  const n = Math.max(2, Math.min(24, count))
  const base = Math.round(total / n)
  let allocated = 0
  const start = contractDateModel.value || new Date()
  downPaymentRows.value = Array.from({ length: n }, (_, i) => {
    const amount = i === n - 1 ? total - allocated : base
    allocated += amount
    return {
      name: `دفعة مقدمة ${i + 1}`,
      dueDate: addMonths(start, i).toISOString(),
      amount,
    }
  })
}

function addDownPaymentRow() {
  const start = contractDateModel.value || new Date()
  downPaymentRows.value.push({
    name: `دفعة مقدمة ${downPaymentRows.value.length + 1}`,
    dueDate: addMonths(start, downPaymentRows.value.length).toISOString(),
    amount: 0,
  })
}

function removeDownPaymentRow(index: number) {
  downPaymentRows.value.splice(index, 1)
}

function onDownScheduleToggle(enabled: boolean) {
  if (enabled) rebuildDownPaymentSchedule()
  else downPaymentRows.value = []
}

function rebuildInstallmentSchedule() {
  const count = computedInstallmentCount.value
  if (
    !isManualPricing.value ||
    !needsInstallmentSchedule.value ||
    !count ||
    Math.round(computedRemaining.value) <= 0 ||
    (isPercentage.value && remainingPercent.value < 0)
  ) {
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

  const remaining = Math.round(computedRemaining.value)
  const base = Math.round(remaining / count)
  let allocated = 0
  installmentRows.value = Array.from({ length: count }, (_, i) => {
    const amount = i === count - 1 ? remaining - allocated : base
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
    isManualPricing.value,
    usesInstallments.value,
    needsInstallmentSchedule.value,
    pricingType.value,
    form.sellingPrice,
    form.downPayment,
    form.deliveryAmount,
    form.financedAmount,
    form.years,
    form.paymentIntervalMonths,
    firstInstallmentDateModel.value,
  ],
  () => {
    if (suppressScheduleRebuild.value) return
    rebuildInstallmentSchedule()
  },
)

watch(
  () => form.complexId,
  () => {
    if (isBank.value) applyDefaultBankFromDesign()
  },
)

const filteredUnits = computed(() => {
  const inComplex = form.complexId
    ? units.value.filter((u) => u.complexId === form.complexId)
    : units.value

  if (!isSystemPricing.value) return inComplex
  if (!selectedPricePlan.value) return []

  const allowed = resolvePlanUnitIds(selectedPricePlan.value)
  return inComplex.filter((u) => allowed.has(u.id))
})
const filteredCustomers = computed(() =>
  form.complexId ? customers.value.filter((c) => c.complexId === form.complexId) : customers.value,
)
const filteredEmployees = computed(() =>
  form.complexId ? employees.value.filter((e) => e.complexId === form.complexId) : employees.value,
)
const filteredPricePlans = computed(() =>
  form.complexId ? pricePlans.value.filter((p) => p.complexId === form.complexId) : pricePlans.value,
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
  filteredUnits.value.map((u) => {
    const status =
      u.status === UnitStatus.Available
        ? 'متاح'
        : u.status === UnitStatus.Reserved
          ? 'محجوز'
          : u.status === UnitStatus.Sold
            ? 'مباع'
            : u.status === UnitStatus.Rented
              ? 'مؤجر'
              : 'صيانة'
    const label = `${u.unitNumber || u.id} (${status})`
    return {
      id: u.id,
      label,
      searchKey: normalizeUnitSearch(u.unitNumber || u.id),
    }
  }),
)
const employeeOptions = computed(() =>
  asSelectOptions(filteredEmployees.value, (e) => e.name || e.id),
)
const pricePlanOptions = computed(() =>
  asSelectOptions(filteredPricePlans.value, (p) => {
    const target =
      unitMap.value[p.unitId || ''] ||
      p.buildingId?.slice(0, 8) ||
      p.blockId?.slice(0, 8) ||
      p.id.slice(0, 8)
    const name = p.name?.trim() || target
    return `${name} — ${formatMoney(p.sellingPrice)}`
  }),
)

async function loadLookups() {
  const [
    complexResult,
    customerResult,
    unitResult,
    buildingResult,
    floorResult,
    employeeResult,
    planResult,
    designsResult,
    contractsResult,
  ] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getCustomers({ Page: 1, PageSize: 500 }),
    getUnits({ Page: 1, PageSize: 1000 }),
    getBuildings({ Page: 1, PageSize: 500 }),
    getFloors({ Page: 1, PageSize: 1000 }),
    getEmployees({ Page: 1, PageSize: 500 }),
    getPricePlans({ Page: 1, PageSize: 500 }).catch(() => ({ items: [] as PricePlan[] })),
    getContractDesigns({ Page: 1, PageSize: 200 }).catch(() => ({ items: [] as ContractDesign[] })),
    getSalesContracts({ Page: 1, PageSize: 1000 }).catch(() => ({ items: [] as SalesContract[] })),
  ])
  complexes.value = complexResult.items ?? []
  customers.value = customerResult.items ?? []
  units.value = unitResult.items ?? []
  buildings.value = buildingResult.items ?? []
  floors.value = floorResult.items ?? []
  employees.value = employeeResult.items ?? []
  pricePlans.value = planResult.items ?? []
  contractDesigns.value = designsResult.items ?? []
  allContracts.value = contractsResult.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
  customerMap.value = Object.fromEntries(
    customers.value.map((c) => [c.id, [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id]),
  )
  unitMap.value = Object.fromEntries(units.value.map((u) => [u.id, u.unitNumber || u.id]))
  buildingMap.value = Object.fromEntries(buildings.value.map((b) => [b.id, b.name || b.id]))
  employeeMap.value = Object.fromEntries(employees.value.map((e) => [e.id, e.name || e.id]))
}

function syncUnitWithPricePlan() {
  if (!form.unitId) return
  if (!filteredUnits.value.some((u) => u.id === form.unitId)) {
    form.unitId = ''
  }
}

function applyPricePlan(planId: string | null | undefined) {
  if (!planId) {
    syncUnitWithPricePlan()
    return
  }
  const plan = pricePlans.value.find((p) => p.id === planId)
  if (!plan) return
  form.sellingPrice = plan.sellingPrice
  form.discount = plan.discount
  form.tax = plan.tax
  form.registrationFee = plan.registrationFee
  pricingType.value = plan.pricingType ?? PricePlanPricingType.Amount
  if (plan.pricingType === PricePlanPricingType.Percentage) {
    form.downPayment = Math.round((plan.sellingPrice * (plan.downPayment || 0)) / 100)
    form.deliveryAmount = Math.round((plan.sellingPrice * (plan.deliveryAmount || 0)) / 100)
  } else {
    form.downPayment = plan.downPayment || 0
    form.deliveryAmount = plan.deliveryAmount || 0
  }
  if (plan.years) form.years = plan.years
  if (plan.paymentIntervalMonths) form.paymentIntervalMonths = plan.paymentIntervalMonths
  if (plan.firstInstallmentDate) {
    firstInstallmentDateModel.value = new Date(plan.firstInstallmentDate)
    if (!deliveryDateModel.value) deliveryDateModel.value = new Date(plan.firstInstallmentDate)
  }

  // تطبيق ترتيب جدول الخطة (استلام / دفعات / مقدمة)
  const schedule = [...(plan.installments ?? [])].sort((a, b) => (a.index || 0) - (b.index || 0))
  if (schedule.length) {
    const delivery = schedule.find((r) => r.kind === 1)
    if (delivery?.dueDate) deliveryDateModel.value = new Date(delivery.dueDate)

    const installments = schedule.filter((r) => !r.kind || r.kind === 0)
    if (installments.length) {
      installmentRows.value = installments.map((r, i) => ({
        index: i + 1,
        kind: 0,
        name: r.name || null,
        monthOffset: r.monthOffset ?? 0,
        dueDate: r.dueDate || null,
        amount: Math.round(r.amount || 0),
        percent: r.percent || 0,
      }))
      if (installments[0]?.dueDate) {
        firstInstallmentDateModel.value = new Date(installments[0].dueDate)
      }
    }

    const down = schedule.find((r) => r.kind === 2)
    if (down && form.downPayment > 0) {
      downPaymentScheduleEnabled.value = true
      downPaymentRows.value = [
        {
          name: down.name || 'دفعة المقدمة',
          dueDate: down.dueDate || new Date().toISOString(),
          amount: Math.round(form.downPayment || 0),
        },
      ]
    }
  }

  syncUnitWithPricePlan()
}

function onPricingModeChange() {
  if (isSystemPricing.value) {
    applyPricePlan(form.pricePlanId)
    return
  }
  form.pricePlanId = null
  pricingType.value = PricePlanPricingType.Amount
  if (usesInstallments.value) {
    form.years = form.years || 1
    form.paymentIntervalMonths = form.paymentIntervalMonths || 1
    if (!firstInstallmentDateModel.value) firstInstallmentDateModel.value = new Date()
  }
  rebuildInstallmentSchedule()
}

function onPaymentTypeChange() {
  if (isCash.value) {
    form.bankName = null
    form.contractDesignId = null
    form.years = null
    form.paymentIntervalMonths = null
    form.firstInstallmentDate = null
    form.financedAmount = 0
    firstInstallmentDateModel.value = null
    installmentRows.value = []
    return
  }

  form.years = form.years || 1
  form.paymentIntervalMonths = form.paymentIntervalMonths || 1
  if (needsInstallmentSchedule.value && !firstInstallmentDateModel.value) {
    firstInstallmentDateModel.value = new Date()
  }
  if (isCashInstallments.value) {
    form.bankName = null
    form.financedAmount = 0
  }
  if (isBank.value) {
    applyDefaultBankFromDesign()
  }
  rebuildInstallmentSchedule()
}

function openCreate(unit?: Unit | SalesTableRow | null) {
  editingId.value = null
  suppressScheduleRebuild.value = true
  deliveryDateModel.value = new Date()
  firstInstallmentDateModel.value = null
  contractDateModel.value = null
  pricingType.value = PricePlanPricingType.Amount
  installmentRows.value = []
  downPaymentScheduleEnabled.value = false
  downPaymentRows.value = []
  const selectedUnit =
    unit && 'unitId' in unit
      ? unitById.value[unit.unitId]
      : unit && 'id' in unit
        ? (unit as Unit)
        : null
  Object.assign(form, emptyForm(), {
    complexId:
      auth.scopedComplexId ||
      selectedUnit?.complexId ||
      complexFilter.value ||
      complexes.value[0]?.id ||
      '',
    unitId: selectedUnit?.id || '',
  })
  suppressScheduleRebuild.value = false
  rebuildInstallmentSchedule()
  dialogVisible.value = true
}

async function openEdit(row: SalesContract | SalesTableRow) {
  const contract = 'contract' in row ? row.contract : row
  if (!contract) return
  editingId.value = contract.id
  suppressScheduleRebuild.value = true
  deliveryDateModel.value = contract.deliveryDate ? new Date(contract.deliveryDate) : null
  firstInstallmentDateModel.value = parseContractDate(contract.firstInstallmentDate)
  contractDateModel.value = parseContractDate(contract.contractDate)
  pricingType.value = PricePlanPricingType.Amount
  Object.assign(form, {
    contractType: contract.contractType ?? ContractType.Sale,
    contractPaymentType: contract.contractPaymentType ?? ContractPaymentType.Cash,
    pricingMode: contract.pricingMode ?? PricingMode.Manual,
    pricePlanId: contract.pricePlanId,
    contractDesignId: contract.contractDesignId ?? null,
    sellingPrice: contract.sellingPrice,
    discount: contract.discount,
    tax: contract.tax,
    registrationFee: contract.registrationFee,
    downPayment: contract.downPayment,
    deliveryAmount: contract.deliveryAmount ?? 0,
    deliveryDate: contract.deliveryDate,
    financedAmount: contract.financedAmount,
    bankName: contract.bankName,
    years: contract.years,
    paymentIntervalMonths: contract.paymentIntervalMonths,
    firstInstallmentDate: contract.firstInstallmentDate,
    contractDate: contract.contractDate,
    contractNumber: contract.contractNumber || null,
    contractStatus: contract.contractStatus,
    customerId: contract.customerId,
    unitId: contract.unitId,
    salesAgentId: contract.salesAgentId,
    complexId: contract.complexId,
  })

  let existingInstallments = contract.installments ?? []
  let existingDown = contract.downPaymentInstallments ?? contract.downPaymentSchedule ?? []
  try {
    const full = await getSalesContract(contract.id)
    if (full.installments?.length) existingInstallments = full.installments
    if (full.downPaymentInstallments?.length) existingDown = full.downPaymentInstallments
    else if (full.downPaymentSchedule?.length) existingDown = full.downPaymentSchedule
  } catch {
    /* استخدم الأقساط من الصف إن وُجدت */
  }

  const activeInstallments = (existingInstallments || []).filter(
    (i) => !('status' in i) || i.status !== InstallmentStatus.Cancelled,
  )
  if (activeInstallments.length > 0) {
    installmentRows.value = activeInstallments
      .slice()
      .sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')))
      .map((i, idx) => {
        const amount = Math.round(i.amount || 0)
        const percent = form.sellingPrice
          ? Math.round((amount / form.sellingPrice) * 10000) / 100
          : 0
        return {
          index: idx + 1,
          dueDate: i.dueDate || undefined,
          amount,
          percent,
        }
      })
  } else {
    rebuildInstallmentSchedule()
  }

  const downItems = (existingDown || []).filter(
    (i) => !('status' in i) || (i as Installment).status !== InstallmentStatus.Cancelled,
  )
  if (downItems.length > 0) {
    downPaymentScheduleEnabled.value = true
    downPaymentRows.value = downItems.map((i, idx) => ({
      name: ('name' in i && i.name) || `دفعة مقدمة ${idx + 1}`,
      dueDate: i.dueDate || new Date().toISOString(),
      amount: Math.round(i.amount || 0),
    }))
  } else {
    downPaymentScheduleEnabled.value = false
    downPaymentRows.value = []
  }

  suppressScheduleRebuild.value = false
  dialogVisible.value = true
}

async function openDetails(row: SalesContract | SalesTableRow) {
  const contract = 'contract' in row ? row.contract : row
  if (!contract) return
  try {
    detailContract.value = await getSalesContract(contract.id)
    detailVisible.value = true
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

function printContract(row: SalesContract | SalesTableRow) {
  const contract = 'contract' in row ? row.contract : row
  if (!contract) return
  const resolved = router.resolve({ name: 'sales-contract-print', params: { id: contract.id } })
  window.open(resolved.href, '_blank', 'noopener,noreferrer')
}

async function downloadPdf(row: SalesContract | SalesTableRow) {
  const contract = 'contract' in row ? row.contract : row
  if (!contract) return
  try {
    const blob = await downloadSalesContractPdf(contract.id)
    if (blob.type && blob.type.includes('json')) {
      const text = await blob.text()
      const parsed = JSON.parse(text)
      throw new Error(parsed.message || 'فشل توليد ملف PDF')
    }
    const pdfBlob = new Blob([blob], { type: 'application/pdf' })
    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `عقد-${contract.contractNumber || contract.id.slice(0, 8)}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 120_000)
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}


/** يوم تقويمي من قيمة API دون انزياح المنطقة الزمنية */
function parseContractDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** إرسال تاريخ العقد كـ yyyy-MM-dd لتجنّب انزياح toISOString */
function toContractDatePayload(value: Date | null): string | null {
  if (!value) return null
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function patchContractLocal(updated: SalesContract) {
  const apply = (list: SalesContract[]) => {
    const idx = list.findIndex((c) => c.id === updated.id)
    if (idx >= 0) list[idx] = { ...list[idx], ...updated }
    else list.push(updated)
    return [...list]
  }
  allContracts.value = apply(allContracts.value)
  items.value = apply(items.value)
  if (detailContract.value?.id === updated.id) {
    detailContract.value = { ...detailContract.value, ...updated }
  }
}

function buildPayload(): CreateSalesContractDto {
  const payload: CreateSalesContractDto = {
    contractType: form.contractType,
    contractPaymentType: form.contractPaymentType,
    pricingMode: form.pricingMode,
    pricePlanId: isSystemPricing.value ? form.pricePlanId : null,
    sellingPrice: form.sellingPrice,
    discount: form.discount,
    tax: form.tax,
    registrationFee: form.registrationFee,
    downPayment: downPaymentAmount.value,
    deliveryAmount: deliveryAmountValue.value,
    deliveryDate: deliveryDateModel.value?.toISOString() ?? null,
    financedAmount: isBank.value ? form.financedAmount : 0,
    bankName: isBank.value ? form.bankName : null,
    years: usesInstallments.value ? form.years : null,
    paymentIntervalMonths: usesInstallments.value ? form.paymentIntervalMonths : null,
    firstInstallmentDate: needsInstallmentSchedule.value
      ? toContractDatePayload(firstInstallmentDateModel.value)
      : null,
    contractDate: toContractDatePayload(contractDateModel.value),
    contractNumber: editingId.value ? (form.contractNumber?.toString().trim() || null) : null,
    contractDesignId: form.contractDesignId || null,
    contractStatus: form.contractStatus,
    customerId: form.customerId,
    unitId: form.unitId,
    salesAgentId: form.salesAgentId,
    complexId: form.complexId,
    installmentSchedule:
      needsInstallmentSchedule.value && installmentRows.value.length
        ? installmentRows.value.map((r, i) => ({
            index: r.index || i + 1,
            dueDate: r.dueDate || firstInstallmentDateModel.value?.toISOString() || new Date().toISOString(),
            amount: Math.round(r.amount || 0),
            percent: r.percent ?? null,
          }))
        : null,
    downPaymentSchedule:
      downPaymentScheduleEnabled.value && downPaymentRows.value.length
        ? downPaymentRows.value.map((r) => ({
            name: r.name?.trim() || null,
            dueDate: r.dueDate || new Date().toISOString(),
            amount: Math.round(r.amount || 0),
          }))
        : null,
  }
  return payload
}

function validateForm() {
  if (!form.complexId || !form.customerId || !form.unitId || !form.salesAgentId) {
    notify.warning('أكمل بيانات المجمع والعميل والوحدة ووكيل المبيعات')
    return false
  }
  if (editingId.value) {
    const raw = (form.contractNumber || '').toString().trim()
    if (!raw) {
      notify.warning('أدخل رقم العقد')
      return false
    }
    const num = Number(raw)
    if (!Number.isInteger(num) || num < 1) {
      notify.warning('رقم العقد يجب أن يكون رقماً صحيحاً موجباً')
      return false
    }
    if (num < contractNumberSequence.value) {
      notify.warning(`رقم العقد يجب ألا يقل عن تسلسل التصميم (${contractNumberSequence.value})`)
      return false
    }
  }
  if (isSystemPricing.value && !form.pricePlanId) {
    notify.warning('اختر خطة الأسعار')
    return false
  }
  if (isSystemPricing.value && !filteredUnits.value.some((u) => u.id === form.unitId)) {
    notify.warning('اختر وحدة مرتبطة بخطة الأسعار')
    return false
  }
  if (form.downPayment < 0 || form.deliveryAmount < 0) {
    notify.warning('المقدمة ومبلغ الاستلام يجب ألا تكون سالبة')
    return false
  }
  if (isManualPricing.value && isPercentage.value && (form.downPayment || 0) + (form.deliveryAmount || 0) > 100) {
    notify.warning('النسبة لا يمكن أن تتجاوز 100٪')
    return false
  }
  if (computedRemaining.value < 0) {
    notify.warning('المتبقي سالب — راجع السعر والمقدمة ومبلغ الاستلام والمصرف')
    return false
  }
  if (downPaymentScheduleEnabled.value) {
    if (!downPaymentRows.value.length) {
      notify.warning('أضف بنود تقسيط المقدمة أو عطّل الخيار')
      return false
    }
    if (!downPaymentScheduleMatches.value) {
      notify.warning(
        `مجموع تقسيط المقدمة (${downPaymentScheduleSum.value}) يجب أن يساوي المقدمة (${Math.round(downPaymentAmount.value)})`,
      )
      return false
    }
  }
  if (isCash.value) {
    if (!deliveryDateModel.value) {
      notify.warning('حدد تاريخ الاستلام للكاش')
      return false
    }
    return true
  }
  if (isBank.value && !form.bankName?.trim()) {
    notify.warning('أدخل اسم المصرف العقاري')
    return false
  }
  if (isBank.value && (!form.financedAmount || form.financedAmount <= 0) && !remainingIsZero.value) {
    notify.warning('مبلغ المصرف العقاري يجب أن يكون أكبر من صفر')
    return false
  }
  if (!form.years || form.years < 1) {
    notify.warning('عدد السنوات يجب أن يكون 1 على الأقل')
    return false
  }
  if (!form.paymentIntervalMonths || form.paymentIntervalMonths < 1) {
    notify.warning('حدد فترة الدفع بالأشهر')
    return false
  }
  if ((form.years * 12) % form.paymentIntervalMonths !== 0) {
    notify.warning('عدد الأشهر يجب أن يقبل القسمة على فترة الدفع بدون باقٍ')
    return false
  }
  // المتبقي صفر → حفظ السنوات/الأشهر بدون جدول أقساط
  if (remainingIsZero.value) {
    return true
  }
  if (!firstInstallmentDateModel.value) {
    notify.warning('حدد تاريخ أول قسط')
    return false
  }
  if (
    isManualPricing.value &&
    (!installmentRows.value.length || !scheduleMatchesRemaining.value)
  ) {
    notify.warning('جدول الأقساط غير مكتمل — اضغط إعادة التوزيع')
    return false
  }
  return true
}

async function markUnitSoldAfterContract(unitId: string) {
  if (!unitId) return
  try {
    const unit = await getUnit(unitId)
    if (unit.status === UnitStatus.Sold) return
    await updateUnit(unitId, {
      unitNumber: unit.unitNumber,
      unitType: unit.unitType,
      area: unit.area,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      parkingCount: unit.parkingCount,
      gardenArea: unit.gardenArea,
      roofArea: unit.roofArea,
      direction: unit.direction,
      floorLevel: unit.floorLevel,
      status: UnitStatus.Sold,
      price: unit.price,
      cost: unit.cost,
      notes: unit.notes,
      unitUi: unit.unitUi,
      floorId: unit.floorId,
      complexId: unit.complexId,
    })
    const local = units.value.find((u) => u.id === unitId)
    if (local) local.status = UnitStatus.Sold
  } catch (error) {
    notify.warning(`تم حفظ العقد لكن تعذر تحديث حالة الوحدة: ${getErrorMessage(error)}`)
  }
}

async function save() {
  if (!validateForm()) return
  saving.value = true
  try {
    const payload = buildPayload()
    let savedContract: SalesContract | null = null
    if (editingId.value) {
      savedContract = await updateSalesContract(editingId.value, payload)
      await markUnitSoldAfterContract(payload.unitId)
      notify.success('تم التحديث')
    } else {
      savedContract = await createSalesContract(payload)
      await markUnitSoldAfterContract(savedContract.unitId || payload.unitId)
      const installmentCount = savedContract.installments?.length ?? 0
      notify.success(
        installmentCount > 0
          ? `تم إنشاء العقد رقم ${savedContract.contractNumber} مع ${installmentCount} قسط — الوحدة أصبحت مباعة`
          : `تم إنشاء العقد رقم ${savedContract.contractNumber} — الوحدة أصبحت مباعة`,
      )
      if (installmentCount > 0) {
        detailContract.value = savedContract
        detailVisible.value = true
      }
    }
    dialogVisible.value = false
    await loadLookups()
    if (scopeFilterActive.value) {
      buildingUnitIds.value = await resolveScopeUnitIds()
      unitTablePage.value = 1
    }
    await load()
    // أعِد تطبيق رد الحفظ بعد الـ GET حتى لا تُستبدل بتاريخ قديم من الكاش
    if (savedContract?.id) patchContractLocal(savedContract)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function remove(row: SalesContract | SalesTableRow) {
  const contract = 'contract' in row ? row.contract : row
  if (!contract) return
  if (!(await ask(`حذف العقد "${contract.contractNumber || contract.id.slice(0, 8)}"؟`))) return
  try {
    await deleteSalesContract(contract.id)
    notify.success('تم الحذف')
    await loadLookups()
    if (scopeFilterActive.value) {
      buildingUnitIds.value = await resolveScopeUnitIds()
    }
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

async function clearBuildingFilter() {
  const query = { ...route.query }
  delete query.buildingId
  delete query.buildingName
  delete query.blockId
  delete query.blockName
  buildingUnitIds.value = null
  unitStatusFilter.value = null
  unitTablePage.value = 1
  await router.replace({ name: 'sales-contracts', query })
  await load()
}

function onUnitStatusFilterChange(value: number | null) {
  unitStatusFilter.value = value
  unitTablePage.value = 1
}

onMounted(async () => {
  try {
    await loadLookups()
    if (scopeFilterActive.value) {
      buildingUnitIds.value = await resolveScopeUnitIds()
    }
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader
      title="عقود المبيعات"
      :subtitle="
        scopeFilterActive
          ? `عقود ومبيعات ${scopeFilterKindLabel}: ${scopeFilterLabel}`
          : 'بيع وإيجار — كاش أو مصرف عقاري مع أقساط تلقائية'
      "
    >
      <template #actions>
        <Button
          v-if="scopeFilterActive"
          :label="blockIdFilter ? 'كل البلوكات' : 'كل المباني'"
          :icon="blockIdFilter ? 'pi pi-th-large' : 'pi pi-building'"
          severity="secondary"
          outlined
          @click="clearBuildingFilter"
        />
        <Button label="إضافة عقد" icon="pi pi-plus" @click="() => openCreate()" />
      </template>
    </PageHeader>

    <div v-if="scopeFilterActive" class="building-filter-banner">
      <div>
        <strong>فلتر {{ scopeFilterKindLabel }} نشط</strong>
        <span>{{ scopeFilterLabel }}</span>
      </div>
      <Button label="إزالة الفلتر" size="small" text @click="clearBuildingFilter" />
    </div>

    <div class="data-panel">
      <FilterBar
        v-model:search="search"
        v-model:sort-mode="sortMode"
        @sort-change="setSortMode"
        placeholder="ابحث بوحدة أو مجمع أو رقم عقد..."
        @search="onSearchUnits"
      >
        <template #filters>
          <Select
            v-if="auth.canSelectComplex"
            v-model="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="كل المجمعات"
            show-clear
            @update:model-value="onComplexFilterChange"
          />
          <Select
            v-model="unitStatusFilter"
            :options="unitStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="حالة الوحدة"
            show-clear
            @update:model-value="onUnitStatusFilterChange"
          />
          <Select
            v-model="paymentTypeFilter"
            :options="contractPaymentTypeOptions"
            option-label="label"
            option-value="value"
            placeholder="طريقة الدفع"
            show-clear
            @update:model-value="() => { unitTablePage = 1 }"
          />
          <Select
            v-model="statusFilter"
            :options="contractStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="حالة العقد"
            show-clear
            @update:model-value="() => { unitTablePage = 1 }"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="tableLoading && tableRows.length === 0" :rows="8" :columns="10" />
      <template v-else>
        <TableSortCaption :sort-mode="sortMode" />
        <DataTable
        :value="tableRows"
        :loading="tableLoading"
        lazy
        paginator
        :rows="tablePageSize"
        :total-records="tableTotal"
        :first="tableFirst"
        :rows-per-page-options="[10, 20, 50]"
        striped-rows
        size="small"
        @page="onTablePage"
      
          sort-mode="single"
          :sort-field="sortField"
          :sort-order="sortOrder"
          removable-sort
          @sort="onTableSort">
        <Column header="التسلسل" style="width: 80px" sortable>
          <template #body="{ data }: { data: SalesTableRow }">{{ data.sequence }}</template>
        </Column>
        <Column header="المجمع" sortable>
          <template #body="{ data }: { data: SalesTableRow }">{{ data.complexName }}</template>
        </Column>
        <Column header="المبنى" sortable>
          <template #body="{ data }: { data: SalesTableRow }">{{ data.buildingName }}</template>
        </Column>
        <Column header="الوحدة" style="width: 110px" sortable>
          <template #body="{ data }: { data: SalesTableRow }">{{ data.unitNumber }}</template>
        </Column>
        <Column header="الحالة" style="width: 100px" sortable>
          <template #body="{ data }: { data: SalesTableRow }">
            <span class="unit-status" :class="`is-${data.unitStatus}`">
              {{ labelOf(unitStatusOptions, data.unitStatus) }}
            </span>
          </template>
        </Column>
        <Column header="رقم العقد" style="width: 100px" sortable>
          <template #body="{ data }: { data: SalesTableRow }">
            {{ data.contract?.contractNumber || '—' }}
          </template>
        </Column>
        <Column header="الدفع" style="width: 110px" sortable>
          <template #body="{ data }: { data: SalesTableRow }">
            {{ data.contract ? labelOf(contractPaymentTypeOptions, data.contract.contractPaymentType) : '—' }}
          </template>
        </Column>
        <Column header="سعر البيع" style="width: 110px" sortable>
          <template #body="{ data }: { data: SalesTableRow }">
            {{ data.contract ? formatMoney(data.contract.sellingPrice) : '—' }}
          </template>
        </Column>
        <Column header="العميل" sortable>
          <template #body="{ data }: { data: SalesTableRow }">
            {{
              data.contract
                ? customerMap[data.contract.customerId] || data.contract.customerId.slice(0, 8)
                : '—'
            }}
          </template>
        </Column>
        <Column header="إجراءات" style="width: 210px">
          <template #body="{ data }: { data: SalesTableRow }">
            <div v-if="data.contract" class="row-actions-wrap">
              <RowActions
                show-details
                show-pdf
                show-print
                @details="openDetails(data)"
                @pdf="downloadPdf(data)"
                @print="printContract(data)"
                @edit="openEdit(data)"
                @remove="remove(data)"
              />
            </div>
            <Button
              v-else
              label="إنشاء عقد"
              icon="pi pi-plus"
              size="small"
              outlined
              @click="openCreate(data)"
            />
          </template>
        </Column>
        <template #empty><div class="empty-box">لا توجد بيانات</div></template>
      </DataTable>
      </template>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل عقد' : 'إضافة عقد'"
      :style="{ width: '760px' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <div class="form-grid">
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
            @update:model-value="() => { form.customerId = ''; form.unitId = ''; form.salesAgentId = ''; form.pricePlanId = null }"
          />
        </div>
        <div class="field">
          <label>حالة العقد</label>
          <Select
            v-model="form.contractStatus"
            :options="contractStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الحالة"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>تاريخ العقد (اختياري)</label>
          <DatePicker
            v-model="contractDateModel"
            date-format="yy-mm-dd"
            show-icon
            show-clear
            placeholder="اليوم إن تُرك فارغاً"
          />
        </div>
        <div v-if="editingId" class="field">
          <label>رقم العقد</label>
          <InputText
            v-model="form.contractNumber"
            inputmode="numeric"
            placeholder="مثال: 10"
          />
          <small class="field-hint">
            حسب تسلسل تصميم العقد — الحد الأدنى: {{ contractNumberSequence }}
          </small>
        </div>
        <div class="field">
          <label>طريقة الدفع</label>
          <Select
            v-model="form.contractPaymentType"
            :options="contractPaymentTypeOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
            @update:model-value="onPaymentTypeChange"
          />
        </div>
        <div class="field">
          <label>مصدر التسعير</label>
          <Select
            v-model="form.pricingMode"
            :options="pricingModeOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
            @update:model-value="onPricingModeChange"
          />
        </div>
        <div v-if="isSystemPricing" class="field">
          <label>خطة الأسعار</label>
          <Select
            v-model="form.pricePlanId"
            :options="pricePlanOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر الخطة"
            checkmark
            append-to="body"
            filter
            @update:model-value="applyPricePlan"
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
            :placeholder="
              isSystemPricing && !form.pricePlanId
                ? 'اختر خطة الأسعار أولاً'
                : isSystemPricing
                  ? 'وحدات الخطة فقط'
                  : 'اختر الوحدة'
            "
            :disabled="isSystemPricing && !form.pricePlanId"
            checkmark
            append-to="body"
            filter
            :filter-fields="['label', 'searchKey']"
          />
          <small v-if="isSystemPricing && form.pricePlanId && !unitOptions.length" class="field-hint">
            لا توجد وحدات مرتبطة بهذه الخطة
          </small>
        </div>
        <div class="field">
          <label>وكيل المبيعات</label>
          <Select
            v-model="form.salesAgentId"
            :options="employeeOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر الموظف"
            checkmark
            append-to="body"
            filter
          />
        </div>

        <template v-if="isManualPricing">
          <div class="field full section-title">التسعير اليدوي</div>
          <div class="field">
            <label>نوع التسعير</label>
            <Select
              v-model="pricingType"
              :options="pricePlanPricingTypeOptions"
              option-label="label"
              option-value="value"
              checkmark
              append-to="body"
            />
          </div>
          <div class="field">
            <label>سعر البيع</label>
            <InputNumber v-model="form.sellingPrice" :min="0" />
          </div>
          <div class="field">
            <label>{{ isPercentage ? 'المقدمة ٪' : 'المقدمة (مبلغ)' }}</label>
            <InputNumber
              v-model="form.downPayment"
              :min="0"
              :max="isPercentage ? 100 : undefined"
            />
            <small class="field-hint">
              {{
                isPercentage
                  ? `يعني ${formatMoney(downPaymentAmount)} من سعر الوحدة`
                  : 'مبلغ نقدي يُخصم من سعر الوحدة'
              }}
            </small>
          </div>
          <div class="field full down-schedule-toggle">
            <label>تقسيط المقدمة</label>
            <div class="toggle-row">
              <ToggleSwitch
                v-model="downPaymentScheduleEnabled"
                @update:model-value="onDownScheduleToggle"
              />
              <small>جدول دفعات محفوظ يُسدَّد لاحقاً مثل الأقساط</small>
            </div>
          </div>
          <div v-if="downPaymentScheduleEnabled" class="field full schedule-block">
            <div class="schedule-head">
              <div>
                <strong>جدول تقسيط المقدمة</strong>
                <small>المجموع يجب أن يساوي مبلغ المقدمة ({{ formatMoney(downPaymentAmount) }})</small>
              </div>
              <div class="schedule-head-actions">
                <Button
                  label="إضافة دفعة"
                  size="small"
                  severity="secondary"
                  outlined
                  @click="addDownPaymentRow"
                />
                <Button
                  label="إعادة التوزيع بالتساوي"
                  size="small"
                  severity="secondary"
                  outlined
                  @click="rebuildDownPaymentSchedule(downPaymentRows.length || 2)"
                />
              </div>
            </div>
            <DataTable :value="downPaymentRows" size="small" striped-rows class="schedule-table">
              <Column header="الاسم" sortable>
                <template #body="{ data }">
                  <InputText v-model="data.name" placeholder="اسم الدفعة" />
                </template>
              </Column>
              <Column header="التاريخ" sortable>
                <template #body="{ data }">
                  <DatePicker
                    :model-value="data.dueDate ? new Date(data.dueDate) : null"
                    date-format="yy-mm-dd"
                    show-icon
                    @update:model-value="
                      (d) => {
                        const value = Array.isArray(d) ? d[0] : d
                        if (value instanceof Date) data.dueDate = value.toISOString()
                      }
                    "
                  />
                </template>
              </Column>
              <Column header="المبلغ" sortable>
                <template #body="{ data }">
                  <InputNumber v-model="data.amount" :min="0" />
                </template>
              </Column>
              <Column header="" style="width: 56px">
                <template #body="{ index }">
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    :disabled="downPaymentRows.length <= 1"
                    @click="removeDownPaymentRow(index)"
                  />
                </template>
              </Column>
            </DataTable>
            <div
              class="schedule-footer"
              :class="{ ok: downPaymentScheduleMatches, bad: !downPaymentScheduleMatches }"
            >
              المجموع: <strong>{{ formatMoney(downPaymentScheduleSum) }}</strong>
              / المقدمة: <strong>{{ formatMoney(downPaymentAmount) }}</strong>
            </div>
          </div>
          <div class="field">
            <label>{{ isPercentage ? 'الاستلام ٪' : 'الاستلام (مبلغ)' }}</label>
            <InputNumber
              v-model="form.deliveryAmount"
              :min="0"
              :max="isPercentage ? 100 : undefined"
            />
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
          <div class="field">
            <label>تاريخ الاستلام{{ isCash ? '' : ' (اختياري)' }}</label>
            <DatePicker v-model="deliveryDateModel" date-format="yy-mm-dd" show-icon show-clear />
          </div>
          <div class="field full formula-box">
            <strong>معادلة الباقي</strong>
            <p v-if="isPercentage">
              الباقي ٪ = 100 − المقدمة ٪ − الاستلام ٪
              =
              <b>{{ remainingPercent }}٪</b>
              ←
              {{ formatMoney(computedRemaining) }}
            </p>
            <p v-else>
              الباقي = سعر البيع − المصرف − المقدمة − الاستلام
              =
              <b>{{ formatMoney(form.sellingPrice || 0) }}</b>
              −
              <b>{{ formatMoney(isBank ? form.financedAmount || 0 : 0) }}</b>
              −
              <b>{{ formatMoney(downPaymentAmount) }}</b>
              −
              <b>{{ formatMoney(deliveryAmountValue) }}</b>
              =
              <b :class="{ 'is-bad': computedRemaining < 0 }">{{ formatMoney(computedRemaining) }}</b>
            </p>
            <small v-if="needsInstallmentSchedule">
              مجموع جدول الأقساط أدناه يجب أن يطابق هذا الباقي تماماً.
            </small>
            <small v-else-if="usesInstallments && remainingIsZero" class="ok-hint">
              المتبقي صفر — السنوات والأشهر تُحفظ، ولن يُنشأ/يُطبع جدول الأقساط.
            </small>
          </div>
        </template>

        <template v-else>
          <div class="field">
            <label>سعر البيع</label>
            <InputNumber v-model="form.sellingPrice" :min="0" disabled />
          </div>
          <div class="field">
            <label>الخصم</label>
            <InputNumber v-model="form.discount" :min="0" disabled />
          </div>
          <div class="field">
            <label>الضريبة</label>
            <InputNumber v-model="form.tax" :min="0" disabled />
          </div>
          <div class="field">
            <label>رسوم التسجيل</label>
            <InputNumber v-model="form.registrationFee" :min="0" disabled />
          </div>
          <div class="field">
            <label>المقدمة</label>
            <InputNumber v-model="form.downPayment" :min="0" disabled />
          </div>
          <div class="field">
            <label>مبلغ الاستلام</label>
            <InputNumber v-model="form.deliveryAmount" :min="0" disabled />
          </div>
          <div class="field">
            <label>تاريخ الاستلام{{ isCash ? '' : ' (اختياري)' }}</label>
            <DatePicker v-model="deliveryDateModel" date-format="yy-mm-dd" show-icon show-clear />
          </div>
          <div class="field hint-box">
            <span>المتبقي: <strong>{{ formatMoney(computedRemaining) }}</strong></span>
            <small>من خطة الأسعار — سعر البيع − المصرف − المقدمة − الاستلام</small>
          </div>
        </template>

        <template v-if="usesInstallments">
          <div class="field full section-title">
            {{ isBank ? 'بيانات المصرف العقاري' : 'بيانات كاش الأقساط' }}
          </div>
          <template v-if="isBank">
            <div class="field">
              <label>اسم المصرف العقاري</label>
              <Select
                v-if="bankNameOptions.length"
                v-model="form.bankName"
                :options="bankNameOptions"
                option-label="label"
                option-value="value"
                editable
                placeholder="اختر من تصميم العقد"
                checkmark
                append-to="body"
                @update:model-value="onBankNamePicked"
              />
              <RememberedInput
                v-else
                v-model="form.bankName"
                memory-key="contract.bankName"
                placeholder="أدخل اسم المصرف"
              />
              <small v-if="bankNameOptions.length" class="field-hint">
                الأسماء من تصاميم العقود — يمكن الكتابة يدوياً أيضاً
              </small>
            </div>
            <div class="field">
              <label>مبلغ المصرف العقاري</label>
              <InputNumber v-model="form.financedAmount" :min="0" />
            </div>
          </template>

          <div class="field">
            <label>عدد السنوات</label>
            <InputNumber v-model="form.years" :min="1" :max="40" show-buttons />
          </div>
          <div class="field">
            <label>فترة الدفع (أشهر)</label>
            <InputNumber v-model="form.paymentIntervalMonths" :min="1" :max="12" show-buttons />
          </div>

          <div v-if="remainingIsZero" class="field full formula-box">
            المتبقي صفر — تُحفظ السنوات والأشهر للعرض/الطباعة، ولن يُنشأ جدول أقساط ولن يظهر في الطباعة.
          </div>

          <template v-else-if="needsInstallmentSchedule">
            <div class="field">
              <label>تاريخ أول قسط</label>
              <DatePicker v-model="firstInstallmentDateModel" date-format="yy-mm-dd" show-icon />
            </div>

            <template v-if="isManualPricing">
              <div v-if="computedInstallmentCount" class="field full schedule-block">
                <div class="schedule-head">
                  <div>
                    <strong>جدول تسعير الأقساط ({{ computedInstallmentCount }})</strong>
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
                  <Column header="#" style="width: 56px" sortable>
                    <template #body="{ data }">{{ data.index }}</template>
                  </Column>
                  <Column header="الشهر / الاستحقاق" sortable>
                    <template #body="{ data }">{{ formatDate(data.dueDate) }}</template>
                  </Column>
                  <Column v-if="isPercentage" header="النسبة ٪" sortable>
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
                  <Column header="السعر" sortable>
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

                <div
                  class="schedule-footer"
                  :class="{ ok: scheduleMatchesRemaining, bad: !scheduleMatchesRemaining }"
                >
                  <span v-if="isPercentage">
                    مجموع النسب: <strong>{{ scheduleSumPercent }}٪</strong>
                    / الباقي: <strong>{{ remainingPercent }}٪</strong>
                  </span>
                  <span v-else>
                    مجموع الأسعار: <strong>{{ formatMoney(scheduleSumAmount) }}</strong>
                    / الباقي: <strong>{{ formatMoney(computedRemaining) }}</strong>
                  </span>
                  <strong>{{ scheduleMatchesRemaining ? 'مطابق ✓' : 'غير مطابق' }}</strong>
                </div>
              </div>
              <div
                v-else-if="form.years && form.paymentIntervalMonths"
                class="field full formula-box is-warn"
              >
                الأشهر الكلية لا تقبل القسمة على فترة الدفع — عدّل السنوات أو عدد الأشهر لإظهار الجدول.
              </div>
            </template>

            <div v-else class="field hint-box">
              <span>عدد الأشهر: <strong>{{ computedMonths || '—' }}</strong></span>
              <span>عدد الأقساط: <strong>{{ computedInstallmentCount || '—' }}</strong></span>
              <span>قيمة القسط ≈ <strong>{{ formatMoney(computedInstallmentAmount) }}</strong></span>
              <small>الأقساط تُقسَّم على المتبقي من الخطة</small>
              <small v-if="form.years && form.paymentIntervalMonths && !computedInstallmentCount">
                الأشهر لا تقبل القسمة على فترة الدفع
              </small>
            </div>
          </template>
        </template>
      </div>
      <p class="auto-hint">
        عند الإنشاء يُولَّد رقم العقد تلقائياً حسب تسلسل تصميم العقود.
        عند التعديل يمكن تغيير رقم العقد بشرط ألا يقل عن بداية التسلسل وألا يكون مستخدماً.
      </p>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="حفظ" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="detailVisible"
      modal
      header="تفاصيل العقد"
      :style="{ width: '720px' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <template v-if="detailContract">
        <div class="detail-grid">
          <div><span>رقم العقد</span><strong>{{ detailContract.contractNumber || '—' }}</strong></div>
          <div><span>التاريخ</span><strong>{{ formatDate(detailContract.contractDate) }}</strong></div>
          <div><span>الدفع</span><strong>{{ labelOf(contractPaymentTypeOptions, detailContract.contractPaymentType) }}</strong></div>
          <div><span>الحالة</span><strong>{{ labelOf(contractStatusOptions, detailContract.contractStatus) }}</strong></div>
          <div><span>الوحدة</span><strong>{{ unitMap[detailContract.unitId] || detailContract.unitId.slice(0, 8) }}</strong></div>
          <div><span>العميل</span><strong>{{ customerMap[detailContract.customerId] || '—' }}</strong></div>
          <div><span>الوكيل</span><strong>{{ employeeMap[detailContract.salesAgentId] || '—' }}</strong></div>
          <div><span>سعر البيع</span><strong>{{ formatMoney(detailContract.sellingPrice) }}</strong></div>
          <div><span>الخصم</span><strong>{{ formatMoney(detailContract.discount) }}</strong></div>
          <div><span>الضريبة</span><strong>{{ formatMoney(detailContract.tax) }}</strong></div>
          <div><span>رسوم التسجيل</span><strong>{{ formatMoney(detailContract.registrationFee) }}</strong></div>
          <div><span>المقدمة</span><strong>{{ formatMoney(detailContract.downPayment) }}</strong></div>
          <div><span>مبلغ الاستلام</span><strong>{{ formatMoney(detailContract.deliveryAmount) }}</strong></div>
          <div><span>تاريخ الاستلام</span><strong>{{ formatDate(detailContract.deliveryDate) }}</strong></div>
          <div><span>المتبقي</span><strong>{{ formatMoney(detailContract.remainingAmount) }}</strong></div>
          <div>
            <span>التسعير</span>
            <strong>{{ labelOf(pricingModeOptions, detailContract.pricingMode) }}</strong>
          </div>
          <template
            v-if="
              detailContract.contractPaymentType === ContractPaymentType.RealEstateBank ||
              detailContract.contractPaymentType === ContractPaymentType.CashInstallments
            "
          >
            <template v-if="detailContract.contractPaymentType === ContractPaymentType.RealEstateBank">
              <div><span>المصرف</span><strong>{{ detailContract.bankName || '—' }}</strong></div>
              <div><span>مبلغ المصرف</span><strong>{{ formatMoney(detailContract.financedAmount) }}</strong></div>
            </template>
            <div><span>السنوات</span><strong>{{ detailContract.years ?? '—' }}</strong></div>
            <div><span>فترة الدفع</span><strong>{{ detailContract.paymentIntervalMonths ? `${detailContract.paymentIntervalMonths} شهر` : '—' }}</strong></div>
            <div><span>أول قسط</span><strong>{{ formatDate(detailContract.firstInstallmentDate) }}</strong></div>
            <div><span>عدد الأشهر</span><strong>{{ detailContract.monthsCount || '—' }}</strong></div>
          </template>
        </div>

        <div v-if="detailContract.installments?.length" class="installments-block">
          <h4>الأقساط على المتبقي ({{ detailContract.installments.length }})</h4>
          <DataTable :value="detailContract.installments" size="small" striped-rows>
            <Column header="#" sortable>
              <template #body="{ index }">{{ index + 1 }}</template>
            </Column>
            <Column header="الاستحقاق" sortable>
              <template #body="{ data }: { data: Installment }">{{ formatDate(data.dueDate) }}</template>
            </Column>
            <Column header="المبلغ" sortable>
              <template #body="{ data }: { data: Installment }">{{ formatMoney(data.amount) }}</template>
            </Column>
            <Column header="الحالة" sortable>
              <template #body="{ data }: { data: Installment }">
                {{ installmentStatusLabel(data.status, data.dueDate) }}
              </template>
            </Column>
          </DataTable>
        </div>
        <p v-else class="auto-hint">لا توجد أقساط (عقد كاش أو لم تُحمَّل بعد).</p>
      </template>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إغلاق" severity="secondary" outlined @click="detailVisible = false" />
          <Button
            v-if="detailContract"
            label="تحميل PDF"
            icon="pi pi-file-pdf"
            severity="success"
            outlined
            @click="downloadPdf(detailContract)"
          />
          <Button
            v-if="detailContract"
            label="طباعة العقد"
            icon="pi pi-print"
            @click="printContract(detailContract)"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.building-filter-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--brand-mid) 22%, var(--border));
  background: linear-gradient(135deg, var(--brand-soft), #fff);
}

.building-filter-banner div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.building-filter-banner strong {
  font-size: 0.86rem;
  color: var(--brand);
}

.building-filter-banner span {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-strong);
}

.field.full {
  grid-column: 1 / -1;
}

.section-title {
  margin: 8px 0 0;
  font-weight: 800;
  color: var(--brand);
  font-size: 0.92rem;
}

.hint-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--brand-soft);
  border: 1px solid color-mix(in srgb, var(--brand-mid) 20%, var(--border));
  font-size: 0.88rem;
}

.hint-box small {
  color: var(--danger);
  font-weight: 700;
}

.field-hint {
  display: block;
  margin-top: 4px;
  font-size: 0.78rem;
  color: var(--muted);
}

.ok-hint {
  display: block;
  margin-top: 4px;
  font-size: 0.82rem;
  color: #166534;
  font-weight: 600;
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

.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.schedule-head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.auto-hint {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 0.82rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
  margin-bottom: 16px;
}

.detail-grid div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.detail-grid span {
  font-size: 0.75rem;
  color: var(--muted);
  font-weight: 600;
}

.detail-grid strong {
  font-size: 0.92rem;
}

.installments-block h4 {
  margin: 0 0 10px;
  font-size: 0.95rem;
}

.unit-status {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  background: var(--surface-2);
  color: var(--muted);
}

.unit-status.is-1 {
  color: var(--success);
  background: color-mix(in srgb, #e8f6f0 90%, white);
}

.unit-status.is-2 {
  color: var(--warning);
  background: color-mix(in srgb, #fff6e5 90%, white);
}

.unit-status.is-3 {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent-soft) 90%, white);
}

.unit-status.is-4 {
  color: var(--info);
  background: color-mix(in srgb, #e8f1fb 90%, white);
}

.unit-status.is-5 {
  color: var(--danger);
  background: color-mix(in srgb, #fdecea 90%, white);
}

.row-actions-wrap {
  display: inline-flex;
}
</style>
