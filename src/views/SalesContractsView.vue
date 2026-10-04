<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type {
  Building,
  Complex,
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
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

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

const floorToBuilding = computed(() => {
  const map: Record<string, string> = {}
  for (const floor of floors.value) map[floor.id] = floor.buildingId
  return map
})

const unitById = computed(() => Object.fromEntries(units.value.map((u) => [u.id, u])))

const contractByUnitId = computed(() => {
  const map = new Map<string, SalesContract>()
  const sorted = [...allContracts.value, ...items.value].sort(
    (a, b) => new Date(b.createdAt || b.contractDate).getTime() - new Date(a.createdAt || a.contractDate).getTime(),
  )
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
  items, loading, search, load, onSearch,
} = usePagedList<SalesContract, SalesContractParams>(fetchSalesContracts)

const dialogVisible = ref(false)
const detailVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const statusFilter = ref<number | null>(null)
const unitStatusFilter = ref<number | null>(null)
const paymentTypeFilter = ref<number | null>(null)
const deliveryDateModel = ref<Date | null>(null)
const firstInstallmentDateModel = ref<Date | null>(null)
const detailContract = ref<SalesContract | null>(null)
const unitTablePage = ref(1)
const unitTablePageSize = ref(20)

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
        meta.unitNumber.toLowerCase().includes(q) ||
        meta.buildingName.toLowerCase().includes(q) ||
        meta.complexName.toLowerCase().includes(q) ||
        (contract?.contractNumber || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || '', 'ar', { numeric: true }))
    .map((unit, index) => {
      const meta = unitMeta(unit)
      return {
        key: unit.id,
        sequence: index + 1,
        ...meta,
        unitId: unit.id,
        contract: contractByUnitId.value.get(unit.id) ?? null,
      }
    })

  return rows
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
const suppressScheduleRebuild = ref(false)

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
  if (!usesInstallments.value || !form.years || !form.paymentIntervalMonths) return 0
  const months = form.years * 12
  if (months % form.paymentIntervalMonths !== 0) return 0
  return months / form.paymentIntervalMonths
})

/** الأقساط تُقسَّم على المتبقي وليس مبلغ المصرف */
const computedInstallmentAmount = computed(() => {
  const count = computedInstallmentCount.value
  if (!count || computedRemaining.value <= 0) return 0
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

function addMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function rebuildInstallmentSchedule() {
  const count = computedInstallmentCount.value
  if (
    !isManualPricing.value ||
    !usesInstallments.value ||
    !count ||
    computedRemaining.value < 0 ||
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
  asSelectOptions(filteredUnits.value, (u) => {
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
    return `${u.unitNumber || u.id} (${status})`
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
    contractsResult,
  ] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getCustomers({ Page: 1, PageSize: 500 }),
    getUnits({ Page: 1, PageSize: 1000 }),
    getBuildings({ Page: 1, PageSize: 500 }),
    getFloors({ Page: 1, PageSize: 1000 }),
    getEmployees({ Page: 1, PageSize: 500 }),
    getPricePlans({ Page: 1, PageSize: 500 }).catch(() => ({ items: [] as PricePlan[] })),
    getSalesContracts({ Page: 1, PageSize: 1000 }).catch(() => ({ items: [] as SalesContract[] })),
  ])
  complexes.value = complexResult.items ?? []
  customers.value = customerResult.items ?? []
  units.value = unitResult.items ?? []
  buildings.value = buildingResult.items ?? []
  floors.value = floorResult.items ?? []
  employees.value = employeeResult.items ?? []
  pricePlans.value = planResult.items ?? []
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
  if (!firstInstallmentDateModel.value) {
    firstInstallmentDateModel.value = new Date()
  }
  if (isCashInstallments.value) {
    form.bankName = null
    form.financedAmount = 0
  }
  rebuildInstallmentSchedule()
}

function openCreate(unit?: Unit | SalesTableRow | null) {
  editingId.value = null
  suppressScheduleRebuild.value = true
  deliveryDateModel.value = new Date()
  firstInstallmentDateModel.value = null
  pricingType.value = PricePlanPricingType.Amount
  installmentRows.value = []
  const selectedUnit =
    unit && 'unitId' in unit
      ? unitById.value[unit.unitId]
      : unit && 'id' in unit
        ? (unit as Unit)
        : null
  Object.assign(form, emptyForm(), {
    complexId:
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

function openEdit(row: SalesContract | SalesTableRow) {
  const contract = 'contract' in row ? row.contract : row
  if (!contract) return
  editingId.value = contract.id
  suppressScheduleRebuild.value = true
  deliveryDateModel.value = contract.deliveryDate ? new Date(contract.deliveryDate) : null
  firstInstallmentDateModel.value = contract.firstInstallmentDate
    ? new Date(contract.firstInstallmentDate)
    : null
  pricingType.value = PricePlanPricingType.Amount
  Object.assign(form, {
    contractType: contract.contractType ?? ContractType.Sale,
    contractPaymentType: contract.contractPaymentType ?? ContractPaymentType.Cash,
    pricingMode: contract.pricingMode ?? PricingMode.Manual,
    pricePlanId: contract.pricePlanId,
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
    contractStatus: contract.contractStatus,
    customerId: contract.customerId,
    unitId: contract.unitId,
    salesAgentId: contract.salesAgentId,
    complexId: contract.complexId,
  })
  suppressScheduleRebuild.value = false
  rebuildInstallmentSchedule()
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
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 120_000)
  } catch (error) {
    notify.error(getErrorMessage(error))
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
    firstInstallmentDate: usesInstallments.value
      ? firstInstallmentDateModel.value?.toISOString() ?? null
      : null,
    contractStatus: form.contractStatus,
    customerId: form.customerId,
    unitId: form.unitId,
    salesAgentId: form.salesAgentId,
    complexId: form.complexId,
  }
  return payload
}

function validateForm() {
  if (!form.complexId || !form.customerId || !form.unitId || !form.salesAgentId) {
    notify.warning('أكمل بيانات المجمع والعميل والوحدة ووكيل المبيعات')
    return false
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
  if (isBank.value && (!form.financedAmount || form.financedAmount <= 0)) {
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
  if (computedRemaining.value <= 0) {
    notify.warning('المتبقي يجب أن يكون أكبر من صفر لتقسيم الأقساط')
    return false
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
    if (editingId.value) {
      await updateSalesContract(editingId.value, payload)
      await markUnitSoldAfterContract(payload.unitId)
      notify.success('تم التحديث')
    } else {
      const created = await createSalesContract(payload)
      await markUnitSoldAfterContract(created.unitId || payload.unitId)
      const installmentCount = created.installments?.length ?? 0
      notify.success(
        installmentCount > 0
          ? `تم إنشاء العقد رقم ${created.contractNumber} مع ${installmentCount} قسط — الوحدة أصبحت مباعة`
          : `تم إنشاء العقد رقم ${created.contractNumber} — الوحدة أصبحت مباعة`,
      )
      if (installmentCount > 0) {
        detailContract.value = created
        detailVisible.value = true
      }
    }
    dialogVisible.value = false
    await loadLookups()
    if (buildingIdFilter.value) {
      buildingUnitIds.value = await resolveBuildingUnitIds(buildingIdFilter.value)
      unitTablePage.value = 1
    }
    await load()
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
    if (buildingIdFilter.value) {
      buildingUnitIds.value = await resolveBuildingUnitIds(buildingIdFilter.value)
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
    if (buildingIdFilter.value) {
      buildingUnitIds.value = await resolveBuildingUnitIds(buildingIdFilter.value)
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
        buildingIdFilter
          ? `عقود ومبيعات مبنى: ${buildingNameFilter || buildingIdFilter.slice(0, 8)}`
          : 'بيع وإيجار — كاش أو مصرف عقاري مع أقساط تلقائية'
      "
    >
      <template #actions>
        <Button
          v-if="buildingIdFilter"
          label="كل المباني"
          icon="pi pi-building"
          severity="secondary"
          outlined
          @click="clearBuildingFilter"
        />
        <Button label="إضافة عقد" icon="pi pi-plus" @click="() => openCreate()" />
      </template>
    </PageHeader>

    <div v-if="buildingIdFilter" class="building-filter-banner">
      <div>
        <strong>فلتر المبنى نشط</strong>
        <span>{{ buildingNameFilter || buildingIdFilter.slice(0, 8) }}</span>
      </div>
      <Button label="إزالة الفلتر" size="small" text @click="clearBuildingFilter" />
    </div>

    <div class="data-panel">
      <FilterBar
        v-model:search="search"
        placeholder="ابحث بوحدة أو مجمع أو رقم عقد..."
        @search="onSearchUnits"
      >
        <template #filters>
          <Select
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
      <DataTable
        v-else
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
      >
        <Column header="التسلسل" style="width: 80px">
          <template #body="{ data }: { data: SalesTableRow }">{{ data.sequence }}</template>
        </Column>
        <Column header="المجمع">
          <template #body="{ data }: { data: SalesTableRow }">{{ data.complexName }}</template>
        </Column>
        <Column header="المبنى">
          <template #body="{ data }: { data: SalesTableRow }">{{ data.buildingName }}</template>
        </Column>
        <Column header="الوحدة" style="width: 110px">
          <template #body="{ data }: { data: SalesTableRow }">{{ data.unitNumber }}</template>
        </Column>
        <Column header="الحالة" style="width: 100px">
          <template #body="{ data }: { data: SalesTableRow }">
            <span class="unit-status" :class="`is-${data.unitStatus}`">
              {{ labelOf(unitStatusOptions, data.unitStatus) }}
            </span>
          </template>
        </Column>
        <Column header="رقم العقد" style="width: 100px">
          <template #body="{ data }: { data: SalesTableRow }">
            {{ data.contract?.contractNumber || '—' }}
          </template>
        </Column>
        <Column header="الدفع" style="width: 110px">
          <template #body="{ data }: { data: SalesTableRow }">
            {{ data.contract ? labelOf(contractPaymentTypeOptions, data.contract.contractPaymentType) : '—' }}
          </template>
        </Column>
        <Column header="سعر البيع" style="width: 110px">
          <template #body="{ data }: { data: SalesTableRow }">
            {{ data.contract ? formatMoney(data.contract.sellingPrice) : '—' }}
          </template>
        </Column>
        <Column header="العميل">
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
            <small v-if="usesInstallments">
              مجموع جدول الأقساط أدناه يجب أن يطابق هذا الباقي تماماً.
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
              <label>اسم المصرف</label>
              <InputText v-model="form.bankName" />
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
      </div>
      <p class="auto-hint">رقم العقد وتاريخه يُولَّدان تلقائياً من السيرفر عند الإنشاء.</p>
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
            <Column header="#">
              <template #body="{ index }">{{ index + 1 }}</template>
            </Column>
            <Column header="الاستحقاق">
              <template #body="{ data }: { data: Installment }">{{ formatDate(data.dueDate) }}</template>
            </Column>
            <Column header="المبلغ">
              <template #body="{ data }: { data: Installment }">{{ formatMoney(data.amount) }}</template>
            </Column>
            <Column header="الحالة">
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
