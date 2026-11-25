<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import MultiSelect from 'primevue/multiselect'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'
import type {
  Building,
  Complex,
  CreateServiceBillDto,
  Resident,
  ServiceBill,
  ServiceType,
  ServiceTypeName,
} from '@/types'
import { MeterReadingSource, PaymentMethod, ServiceBillingMode, ServiceTypeName as ServiceTypeNameEnum } from '@/types'
import {
  createServiceBill,
  deleteServiceBill,
  getServiceBills,
  getServiceBillsStats,
  payServiceBills,
  type ServiceBillParams,
  type ServiceBillsStats,
} from '@/api/serviceBills'
import {
  getDirectMeterDraft,
  getLastUnitReading,
  importBuildingMeterExcel,
  issueDirectBuildingMeter,
  type DirectMeterDraft,
} from '@/api/buildingMeterBilling'
import { getServiceTypes } from '@/api/serviceTypes'
import { getResidents } from '@/api/residents'
import { getComplexes } from '@/api/complexes'
import { getBlocks } from '@/api/blocks'
import { getBuildings } from '@/api/buildings'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatMoney,
  labelOf,
  monthOptions,
  serviceBillPaymentOptions,
} from '@/utils/enums'
import { resolveMediaUrl } from '@/utils/media'
import { printServiceInvoice } from '@/utils/serviceInvoicePrint'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import TableSortCaption from '@/components/TableSortCaption.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const notify = useNotify()
const { ask } = useConfirmAction()

const lockedServiceTypeName = computed(
  () => route.meta.serviceTypeName as ServiceTypeName | undefined,
)
const pageTitle = computed(
  () => (route.meta.pageTitle as string | undefined) || 'فواتير الخدمة الشهرية',
)
const pageSubtitle = computed(
  () =>
    (route.meta.pageSubtitle as string | undefined) ||
    'إدارة فواتير الخدمات — إضافة وتسديد وطباعة حسب الساكن والشهر',
)
const addButtonLabel = computed(
  () => (route.meta.addLabel as string | undefined) || 'إضافة فاتورة',
)
const isServiceLocked = computed(() => lockedServiceTypeName.value != null)
const isAbsoluteUtility = computed(
  () =>
    lockedServiceTypeName.value === ServiceTypeNameEnum.Gas ||
    lockedServiceTypeName.value === ServiceTypeNameEnum.Water,
)
const utilityUnitLabel = computed(() => {
  if (lockedServiceTypeName.value === ServiceTypeNameEnum.Gas) return 'لتر'
  if (lockedServiceTypeName.value === ServiceTypeNameEnum.Water) return 'م³'
  return 'واط'
})
const unitPriceLabel = computed(() => {
  if (lockedServiceTypeName.value === ServiceTypeNameEnum.Gas) return 'سعر اللتر الواحد'
  if (lockedServiceTypeName.value === ServiceTypeNameEnum.Water) return 'سعر المتر المكعب الواحد'
  return 'تسعير الواط'
})
const consumptionFieldLabel = computed(() => {
  if (lockedServiceTypeName.value === ServiceTypeNameEnum.Gas) return 'اللتر المصروف'
  if (lockedServiceTypeName.value === ServiceTypeNameEnum.Water) return 'المتر المكعب المصروف'
  return 'القراءة الجديدة'
})
const excelColumnsHint = computed(() => {
  if (lockedServiceTypeName.value === ServiceTypeNameEnum.Gas) {
    return 'اسم الساكن · رقم الوحدة · الشهر والسنة (MM/YYYY) · اللتر المصروف · سعر اللتر الواحد · المبلغ المراد دفعه'
  }
  if (lockedServiceTypeName.value === ServiceTypeNameEnum.Water) {
    return 'اسم الساكن · رقم الوحدة · الشهر والسنة (MM/YYYY) · المتر المكعب المصروف · سعر المتر المكعب الواحد · المبلغ المراد دفعه'
  }
  return 'اسم الساكن · رقم الوحدة · تاريخ قديم (MM/YYYY) · تاريخ جديد (MM/YYYY) · قراءة قديمة · قراءة جديدة · تسعير الواط'
})
const excelDialogHeader = computed(() =>
  isAbsoluteUtility.value ? 'استيراد فواتير من Excel' : 'استيراد قراءات العداد من Excel',
)

const complexes = ref<Complex[]>([])
const residents = ref<Resident[]>([])
const serviceTypes = ref<ServiceType[]>([])
const buildings = ref<Building[]>([])
const selectedRows = ref<ServiceBill[]>([])
const stats = ref<ServiceBillsStats>({
  totalAmount: 0,
  currentMonthTotal: 0,
  unpaidTotal: 0,
  currentMonthUnpaid: 0,
})

const meterDirectVisible = ref(false)
const meterExcelVisible = ref(false)
const meterSaving = ref(false)
const meterImporting = ref(false)
const meterLoadingDraft = ref(false)
const meterDraft = ref<DirectMeterDraft | null>(null)
const meterExcelFile = ref<File | null>(null)
const meterExcelInput = ref<HTMLInputElement | null>(null)
const meterForm = reactive({
  complexId: '' as string,
  buildingId: '' as string,
  unitPrice: 0,
})
const meterLineReadings = ref<Record<string, number | null>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort,
  sortField,
  sortOrder,
  sortMode, onLazyPage,
} = usePagedList<ServiceBill, ServiceBillParams>(getServiceBills)

const complexFilter = ref<string | null>(auth.scopedComplexId)
const filterDialogVisible = ref(false)
const draftMonth = ref<number | null>(null)
const draftYear = ref<number | null>(null)
const draftPaid = ref<boolean | null>(null)
const draftPayment = ref<PaymentMethod | null>(null)
const monthFilter = ref<number | null>(null)
const yearFilter = ref<number | null>(null)
const paidFilter = ref<boolean | null>(null)
const paymentFilter = ref<PaymentMethod | null>(null)

const addVisible = ref(false)
const payVisible = ref(false)
const saving = ref(false)
const paying = ref(false)
const deletingId = ref<string | null>(null)
const payTargetIds = ref<string[]>([])
const payMethod = ref<PaymentMethod>(PaymentMethod.Cash)
const payDate = ref<Date | null>(null)
const payDiscount = ref(0)

const now = new Date()
const billForm = reactive({
  complexId: '' as string,
  residentId: '' as string,
  serviceTypeId: '' as string,
  year: now.getFullYear(),
  months: [now.getMonth() + 1] as number[],
  amount: 0,
  discount: 0,
  previousReading: 0,
  reading: 0,
  unitPrice: 0,
  paymentMethod: PaymentMethod.Cash as PaymentMethod,
})

const paidFilterOptions = [
  { value: true, label: 'مسدد' },
  { value: false, label: 'غير مسدد' },
]

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => ({ value: y - i, label: String(y - i) }))
})

const activeFiltersCount = computed(() =>
  [monthFilter.value, yearFilter.value, paidFilter.value, paymentFilter.value].filter(
    (v) => v !== null && v !== undefined,
  ).length,
)

const selectedUnpaid = computed(() => selectedRows.value.filter((b) => !b.paid))
const selectedPayTotal = computed(() =>
  selectedUnpaid.value.reduce((s, b) => s + netOf(b), 0),
)
const payTargetGross = computed(() => {
  const ids = new Set(payTargetIds.value)
  return items.value.filter((b) => ids.has(b.id) && !b.paid).reduce((s, b) => s + Number(b.amount || 0), 0)
})
const payTargetTotal = computed(() =>
  Math.max(0, payTargetGross.value - Number(payDiscount.value || 0)),
)

const formResidentOptions = computed(() => {
  const list = billForm.complexId
    ? residents.value.filter((r) => r.complexId === billForm.complexId)
    : residents.value
  return asSelectOptions(list, (r) => {
    const name = r.customerName || r.id.slice(0, 8)
    return r.unitNumber ? `${name} — وحدة ${r.unitNumber}` : name
  })
})

const buildingOptions = computed(() =>
  asSelectOptions(buildings.value, (b) => b.name || b.description || b.id.slice(0, 8)),
)

const periodMmYyyy = (month: number, year: number) =>
  `${String(month).padStart(2, '0')}/${year}`

const meterDirectTotalPreview = computed(() => {
  if (!meterDraft.value) return 0
  const price = Number(meterForm.unitPrice || 0)
  return meterDraft.value.lines.reduce((sum, line) => {
    const curr = Number(meterLineReadings.value[line.residentId] ?? 0)
    const prev = Number(line.previousReading || 0)
    const consumption = isAbsoluteUtility.value
      ? Math.max(0, curr)
      : Math.max(0, curr - prev)
    return sum + Math.round(consumption * price * 100) / 100
  }, 0)
})

const formServiceOptions = computed(() => {
  const list = serviceTypes.value.filter(
    (s) =>
      s.isActive &&
      (!billForm.complexId || s.complexId === billForm.complexId) &&
      (lockedServiceTypeName.value == null || s.name === lockedServiceTypeName.value),
  )
  return asSelectOptions(list, (s) => s.displayName || s.id)
})

const selectedService = computed(() =>
  serviceTypes.value.find((s) => s.id === billForm.serviceTypeId) ?? null,
)

const isMeteredAdd = computed(
  () =>
    isServiceLocked.value ||
    selectedService.value?.billingMode === ServiceBillingMode.Metered,
)

const meterAddConsumption = computed(() =>
  Math.max(0, Number(billForm.reading || 0) - Number(billForm.previousReading || 0)),
)

const meterAddAmount = computed(() =>
  Math.round(meterAddConsumption.value * Number(billForm.unitPrice || 0) * 100) / 100,
)

function resolveLockedServiceTypeId(complexId: string): string {
  if (lockedServiceTypeName.value == null) return ''
  const match = serviceTypes.value.find(
    (s) =>
      s.isActive &&
      s.complexId === complexId &&
      s.name === lockedServiceTypeName.value,
  )
  return match?.id || ''
}

function applyLockedServiceFilter() {
  if (lockedServiceTypeName.value != null) {
    setFilter('ServiceTypeName', lockedServiceTypeName.value)
  } else {
    setFilter('ServiceTypeName', undefined)
  }
}

const billNetPreview = computed(() => {
  const amount = isMeteredAdd.value ? meterAddAmount.value : Number(billForm.amount || 0)
  return Math.max(0, amount - Number(billForm.discount || 0))
})

function netOf(b: ServiceBill) {
  return Number(b.netAmount ?? b.amount - (b.discount || 0))
}

function periodLabel(row: ServiceBill) {
  return `${labelOf(monthOptions, row.month)} ${row.year}`
}

function paymentLabel(method?: PaymentMethod | null) {
  if (method == null) return '—'
  return labelOf(serviceBillPaymentOptions, method) || '—'
}

function complexName(complexId: string) {
  const c = complexes.value.find((x) => x.id === complexId)
  return c?.nameAr || c?.name || '—'
}

watch(
  () => billForm.serviceTypeId,
  (id) => {
    const service = serviceTypes.value.find((s) => s.id === id)
    if (!service) return
    if (service.billingMode === ServiceBillingMode.Metered || isServiceLocked.value) {
      billForm.unitPrice = Number(service.unitPrice || 0)
    } else {
      billForm.amount = Number(service.fixedAmount || 0)
    }
  },
)

watch(
  () => billForm.complexId,
  () => {
    billForm.residentId = ''
    billForm.serviceTypeId = isServiceLocked.value
      ? resolveLockedServiceTypeId(billForm.complexId)
      : ''
  },
)

watch(
  () => route.fullPath,
  () => {
    selectedRows.value = []
    applyLockedServiceFilter()
    void reloadAll()
  },
)

async function refreshStats() {
  try {
    stats.value = await getServiceBillsStats(
      complexFilter.value || auth.scopedComplexId,
      lockedServiceTypeName.value ?? null,
    )
  } catch {
    // ignore stats errors
  }
}

async function reloadAll() {
  await Promise.all([load(), refreshStats()])
}

function openFilters() {
  draftMonth.value = monthFilter.value
  draftYear.value = yearFilter.value
  draftPaid.value = paidFilter.value
  draftPayment.value = paymentFilter.value
  filterDialogVisible.value = true
}

function applyFilters() {
  monthFilter.value = draftMonth.value
  yearFilter.value = draftYear.value
  paidFilter.value = draftPaid.value
  paymentFilter.value = draftPayment.value
  setFilter('Month', monthFilter.value ?? undefined)
  setFilter('Year', yearFilter.value ?? undefined)
  setFilter('Paid', paidFilter.value ?? undefined)
  setFilter('PaymentMethod', paymentFilter.value ?? undefined)
  filterDialogVisible.value = false
  void refreshStats()
}

function clearFilters() {
  draftMonth.value = null
  draftYear.value = null
  draftPaid.value = null
  draftPayment.value = null
  monthFilter.value = null
  yearFilter.value = null
  paidFilter.value = null
  paymentFilter.value = null
  setFilter('Month', undefined)
  setFilter('Year', undefined)
  setFilter('Paid', undefined)
  setFilter('PaymentMethod', undefined)
  filterDialogVisible.value = false
  void refreshStats()
}

async function openAdd() {
  billForm.complexId = complexFilter.value || auth.scopedComplexId || complexes.value[0]?.id || ''
  billForm.residentId = ''
  billForm.serviceTypeId = ''
  billForm.year = new Date().getFullYear()
  billForm.months = [new Date().getMonth() + 1]
  billForm.amount = 0
  billForm.discount = 0
  billForm.previousReading = 0
  billForm.reading = 0
  billForm.unitPrice = 0
  billForm.paymentMethod = PaymentMethod.Cash
  if (billForm.complexId) {
    await Promise.all([
      loadResidents(billForm.complexId),
      loadServiceTypes(billForm.complexId),
    ])
  }
  if (isServiceLocked.value) {
    billForm.serviceTypeId = resolveLockedServiceTypeId(billForm.complexId)
    if (!billForm.serviceTypeId) {
      notify.warning(`لا توجد خدمة «${pageTitle.value}» مفعّلة في إعدادات الخدمات لهذا المجمع`)
      return
    }
    const service = serviceTypes.value.find((s) => s.id === billForm.serviceTypeId)
    billForm.unitPrice = Number(service?.unitPrice || 0)
    billForm.amount = 0
  }
  addVisible.value = true
}

async function onAddComplexChange(complexId: string) {
  billForm.complexId = complexId
  billForm.residentId = ''
  billForm.previousReading = 0
  billForm.reading = 0
  await Promise.all([loadResidents(complexId), loadServiceTypes(complexId)])
  if (isServiceLocked.value) {
    billForm.serviceTypeId = resolveLockedServiceTypeId(complexId)
    const service = serviceTypes.value.find((s) => s.id === billForm.serviceTypeId)
    billForm.unitPrice = Number(service?.unitPrice || 0)
  }
}

async function onAddResidentChange(residentId: string) {
  billForm.residentId = residentId
  if (!isMeteredAdd.value || !residentId || !billForm.complexId) return
  const resident = residents.value.find((r) => r.id === residentId)
  if (!resident?.unitId) {
    billForm.previousReading = 0
    return
  }
  const serviceTypeName = lockedServiceTypeName.value ?? selectedService.value?.name
  if (serviceTypeName == null) return
  try {
    const last = await getLastUnitReading({
      complexId: billForm.complexId,
      unitId: resident.unitId,
      serviceTypeName,
    })
    billForm.previousReading = last.hasHistory ? Number(last.currentReading) : 0
    if (last.hasHistory && last.unitPrice > 0) {
      billForm.unitPrice = Number(last.unitPrice)
    }
  } catch {
    billForm.previousReading = 0
  }
}

async function loadResidents(complexId: string) {
  const result = await getResidents({ ComplexId: complexId, Page: 1, PageSize: 500 })
  residents.value = result.items ?? []
}

async function loadServiceTypes(complexId: string) {
  const result = await getServiceTypes({
    ComplexId: complexId,
    IsActive: true,
    Page: 1,
    PageSize: 200,
  })
  serviceTypes.value = result.items ?? []
}

async function loadBuildings(complexId: string) {
  const blocks = await getBlocks({ ComplexId: complexId, Page: 1, PageSize: 500 })
  const blockIds = new Set((blocks.items ?? []).map((b) => b.id))
  const result = await getBuildings({ Page: 1, PageSize: 1000 })
  buildings.value = (result.items ?? []).filter((b) => blockIds.has(b.blockId))
}

async function ensureMeterServiceReady(complexId: string) {
  if (lockedServiceTypeName.value == null) return false
  await loadServiceTypes(complexId)
  const serviceId = resolveLockedServiceTypeId(complexId)
  if (!serviceId) {
    notify.warning(`لا توجد خدمة «${pageTitle.value}» مفعّلة في إعدادات الخدمات لهذا المجمع`)
    return false
  }
  const service = serviceTypes.value.find((s) => s.id === serviceId)
  if (service?.readingSource === MeterReadingSource.Api) {
    notify.warning('طريقة الحساب مضبوطة على تلقائي (API) — الإدخال اليدوي غير متاح حالياً')
    return false
  }
  return true
}

async function openMeterDirect() {
  const complexId = complexFilter.value || auth.scopedComplexId || complexes.value[0]?.id || ''
  if (!complexId) {
    notify.warning('اختر المجمع أولاً')
    return
  }
  meterForm.complexId = complexId
  meterForm.buildingId = ''
  meterForm.unitPrice = 0
  meterDraft.value = null
  meterLineReadings.value = {}
  await Promise.all([loadBuildings(complexId), loadServiceTypes(complexId)])
  if (!(await ensureMeterServiceReady(complexId))) return
  const service = serviceTypes.value.find((s) => s.id === resolveLockedServiceTypeId(complexId))
  meterForm.unitPrice = Number(service?.unitPrice || 0)
  meterDirectVisible.value = true
}

async function openMeterExcel() {
  const complexId = complexFilter.value || auth.scopedComplexId || complexes.value[0]?.id || ''
  if (!complexId) {
    notify.warning('اختر المجمع أولاً')
    return
  }
  await loadBuildings(complexId)
  if (!(await ensureMeterServiceReady(complexId))) return
  meterForm.complexId = complexId
  meterForm.buildingId = ''
  meterExcelFile.value = null
  if (meterExcelInput.value) meterExcelInput.value.value = ''
  meterExcelVisible.value = true
}

async function onMeterComplexChange(complexId: string) {
  meterForm.complexId = complexId
  meterForm.buildingId = ''
  meterDraft.value = null
  meterLineReadings.value = {}
  if (!complexId) {
    buildings.value = []
    return
  }
  await loadBuildings(complexId)
}

async function onMeterBuildingChange(buildingId: string) {
  meterForm.buildingId = buildingId
  meterDraft.value = null
  meterLineReadings.value = {}
  if (!buildingId || !meterForm.complexId || lockedServiceTypeName.value == null) return
  meterLoadingDraft.value = true
  try {
    meterDraft.value = await getDirectMeterDraft({
      complexId: meterForm.complexId,
      buildingId,
      serviceTypeName: lockedServiceTypeName.value,
    })
    if (meterDraft.value.lastUnitPrice > 0) {
      meterForm.unitPrice = Number(meterDraft.value.lastUnitPrice)
    }
    meterLineReadings.value = Object.fromEntries(
      meterDraft.value.lines.map((line) => [line.residentId, null]),
    )
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    meterLoadingDraft.value = false
  }
}

async function saveMeterDirect() {
  if (!meterForm.complexId || !meterForm.buildingId) {
    notify.warning('اختر المجمع والبناية')
    return
  }
  if (!meterDraft.value?.lines.length) {
    notify.warning('لا توجد وحدات للفوترة في هذه البناية')
    return
  }
  if (lockedServiceTypeName.value == null) return
  if (Number(meterForm.unitPrice) < 0) {
    notify.warning(`${unitPriceLabel.value} غير صالح`)
    return
  }

  const lines = []
  for (const line of meterDraft.value.lines) {
    const raw = meterLineReadings.value[line.residentId]
    if (raw === null || raw === undefined || Number.isNaN(Number(raw))) {
      notify.warning(`أدخل ${consumptionFieldLabel.value} للوحدة ${line.unitNumber || ''}`)
      return
    }
    const currentReading = Number(raw)
    if (!isAbsoluteUtility.value && currentReading < Number(line.previousReading || 0)) {
      notify.warning(
        `القراءة الجديدة لا يمكن أن تكون أقل من القراءة القديمة — وحدة ${line.unitNumber || ''}`,
      )
      return
    }
    if (isAbsoluteUtility.value && currentReading < 0) {
      notify.warning(`${consumptionFieldLabel.value} غير صالح — وحدة ${line.unitNumber || ''}`)
      return
    }
    lines.push({
      residentId: line.residentId,
      unitId: line.unitId,
      currentReading,
      previousReading: isAbsoluteUtility.value ? 0 : line.previousReading,
    })
  }

  meterSaving.value = true
  try {
    const result = await issueDirectBuildingMeter({
      complexId: meterForm.complexId,
      buildingId: meterForm.buildingId,
      serviceTypeName: lockedServiceTypeName.value,
      unitPrice: Number(meterForm.unitPrice),
      currentPeriodMonth: meterDraft.value.suggestedCurrentPeriodMonth,
      currentPeriodYear: meterDraft.value.suggestedCurrentPeriodYear,
      lines,
    })
    notify.success(result.message || `تم إنشاء ${result.billsCreated} فاتورة`)
    meterDirectVisible.value = false
    await reloadAll()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    meterSaving.value = false
  }
}

function onMeterExcelSelected(event: Event) {
  const input = event.target as HTMLInputElement
  meterExcelFile.value = input.files?.[0] ?? null
}

async function saveMeterExcel() {
  if (!meterForm.complexId) {
    notify.warning('اختر المجمع أولاً')
    return
  }
  if (!meterForm.buildingId) {
    notify.warning('اختر البناية أولاً ثم ارفع ملف Excel')
    return
  }
  if (!meterExcelFile.value) {
    notify.warning('ارفع ملف Excel')
    return
  }
  if (lockedServiceTypeName.value == null) return

  meterImporting.value = true
  try {
    const result = await importBuildingMeterExcel({
      complexId: meterForm.complexId,
      buildingId: meterForm.buildingId,
      serviceTypeName: lockedServiceTypeName.value,
      file: meterExcelFile.value,
    })
    const errCount = result.errors?.length ?? 0
    if (result.billsCreated > 0) {
      notify.success(
        `تم معالجة ${result.rowsProcessed} صف — فواتير: ${result.billsCreated}` +
          (errCount ? ` — أخطاء: ${errCount}` : ''),
      )
    }
    if (errCount) {
      notify.warning(result.errors.slice(0, 3).join(' | '))
    }
    if (result.billsCreated === 0 && errCount === 0) {
      notify.warning('لم يتم إنشاء أي فواتير من الملف')
    }
    meterExcelVisible.value = false
    await reloadAll()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    meterImporting.value = false
  }
}

async function saveBill() {
  if (!billForm.complexId || !billForm.residentId || !billForm.serviceTypeId) {
    notify.warning('اختر المجمع والساكن والخدمة')
    return
  }
  if (!billForm.months.length) {
    notify.warning('اختر شهراً واحداً على الأقل')
    return
  }

  const previousReading = Number(billForm.previousReading || 0)
  const reading = Number(billForm.reading || 0)
  const unitPrice = Number(billForm.unitPrice || 0)

  if (isMeteredAdd.value) {
    if (reading < previousReading) {
      notify.warning('القراءة الجديدة لا يمكن أن تكون أقل من القراءة القديمة')
      return
    }
    if (unitPrice < 0) {
      notify.warning(`${unitPriceLabel.value} غير صالح`)
      return
    }
  } else if (billForm.discount < 0 || billForm.discount > billForm.amount) {
    notify.warning('الخصم غير صالح')
    return
  }

  const amount = isMeteredAdd.value ? meterAddAmount.value : Number(billForm.amount || 0)
  if (billForm.discount < 0 || billForm.discount > amount) {
    notify.warning('الخصم غير صالح')
    return
  }

  const resident = residents.value.find((r) => r.id === billForm.residentId)
  const payload: CreateServiceBillDto = {
    months: [...billForm.months].sort((a, b) => a - b),
    year: billForm.year,
    previousReading: isMeteredAdd.value ? previousReading : 0,
    reading: isMeteredAdd.value ? reading : 0,
    unitPrice: isMeteredAdd.value ? unitPrice : undefined,
    amount: isMeteredAdd.value ? amount : billForm.amount,
    discount: billForm.discount,
    paid: false,
    paymentMethod: billForm.paymentMethod,
    readingSource: selectedService.value?.readingSource ?? MeterReadingSource.Manual,
    residentId: billForm.residentId,
    serviceTypeId: billForm.serviceTypeId,
    unitId: resident?.unitId || null,
    complexId: billForm.complexId,
  }

  saving.value = true
  try {
    const created = await createServiceBill(payload)
    notify.success(
      created.length > 1
        ? `تمت إضافة ${created.length} فواتير للأشهر المحددة`
        : 'تمت إضافة الفاتورة للشهر المحدد',
    )
    addVisible.value = false
    await reloadAll()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

function openPaySingle(row: ServiceBill) {
  if (row.paid) {
    printBills([row])
    return
  }
  payTargetIds.value = [row.id]
  payMethod.value = row.paymentMethod || PaymentMethod.Cash
  payDate.value = null
  payDiscount.value = Number(row.discount || 0)
  payVisible.value = true
}

function openPaySelected() {
  if (selectedUnpaid.value.length === 0) {
    notify.warning('حدد فواتير غير مسددة أولاً')
    return
  }
  payTargetIds.value = selectedUnpaid.value.map((b) => b.id)
  payMethod.value = PaymentMethod.Cash
  payDate.value = null
  payDiscount.value = selectedUnpaid.value.reduce((s, b) => s + Number(b.discount || 0), 0)
  payVisible.value = true
}

async function confirmPay() {
  if (payTargetIds.value.length === 0) return
  const discount = Math.max(0, Number(payDiscount.value || 0))
  if (discount > payTargetGross.value) {
    notify.warning('مبلغ الخصم أكبر من إجمالي الفواتير')
    return
  }
  const ok = await ask(
    `تأكيد تسديد ${payTargetIds.value.length} فاتورة بإجمالي ${formatMoney(payTargetTotal.value)}؟`,
    'تسديد الفواتير',
  )
  if (!ok) return

  paying.value = true
  try {
    const paid = await payServiceBills({
      serviceBillIds: payTargetIds.value,
      paymentMethod: payMethod.value,
      paidAt: payDate.value ? payDate.value.toISOString() : null,
      discount,
    })
    notify.success('تم التسديد — الحالة: مسدد')
    payVisible.value = false
    selectedRows.value = []
    await reloadAll()
    printBills(paid)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    paying.value = false
  }
}

async function removeBill(row: ServiceBill) {
  const ok = await ask(
    row.paid
      ? 'الفاتورة مسددة — سيتم إرجاعها إلى حالة غير مسددة دون حذفها. هل تريد المتابعة؟'
      : 'الفاتورة غير مسددة — سيتم حذفها بالكامل. هل تريد المتابعة؟',
    row.paid ? 'إلغاء التسديد' : 'حذف الفاتورة',
  )
  if (!ok) return

  deletingId.value = row.id
  try {
    await deleteServiceBill(row.id)
    notify.success(row.paid ? 'تم إرجاع الفاتورة إلى غير مسدد' : 'تم حذف الفاتورة')
    await reloadAll()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    deletingId.value = null
  }
}

function printBills(rows: ServiceBill[]) {
  if (rows.length === 0) return
  const complexId = rows[0]?.complexId
  const complex = complexes.value.find((c) => c.id === complexId)
  const logoUrl = complex?.logoUrl ? resolveMediaUrl(complex.logoUrl) : null
  if (!printServiceInvoice({ rows, logoUrl })) {
    notify.warning('اسمح بالنوافذ المنبثقة للطباعة')
  }
}

onMounted(async () => {
  try {
    const result = await getComplexes({ Page: 1, PageSize: 200 })
    complexes.value = result.items ?? []
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  if (complexFilter.value) setFilter('ComplexId', complexFilter.value)
  applyLockedServiceFilter()
  await reloadAll()
})
</script>

<template>
  <div class="page">
    <PageHeader :title="pageTitle" :subtitle="pageSubtitle">
      <template #actions>
        <Button
          :label="activeFiltersCount ? `فلترة (${activeFiltersCount})` : 'فلترة'"
          icon="pi pi-filter"
          severity="secondary"
          outlined
          @click="openFilters"
        />
        <Button
          label="تسديد المحدد"
          icon="pi pi-wallet"
          severity="success"
          outlined
          :disabled="selectedUnpaid.length === 0"
          @click="openPaySelected"
        />
        <Button
          label="طباعة المحدد"
          icon="pi pi-print"
          severity="secondary"
          outlined
          :disabled="selectedRows.length === 0"
          @click="printBills(selectedRows)"
        />
        <template v-if="isServiceLocked">
          <Button
            label="رفع Excel"
            icon="pi pi-file-excel"
            severity="help"
            outlined
            @click="openMeterExcel"
          />
          <Button
            label="إدخال مباشر"
            icon="pi pi-bolt"
            severity="info"
            outlined
            @click="openMeterDirect"
          />
        </template>
        <Button :label="addButtonLabel" icon="pi pi-plus" @click="openAdd" />
      </template>
    </PageHeader>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">المجموع الكلي للمبالغ</span>
        <strong>{{ formatMoney(stats.totalAmount) }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">مجموع هذا الشهر</span>
        <strong>{{ formatMoney(stats.currentMonthTotal) }}</strong>
      </div>
      <div class="stat-card is-warn">
        <span class="stat-label">المجموع الغير مسدد</span>
        <strong>{{ formatMoney(stats.unpaidTotal) }}</strong>
      </div>
      <div class="stat-card is-warn">
        <span class="stat-label">غير مسدد لهذا الشهر</span>
        <strong>{{ formatMoney(stats.currentMonthUnpaid) }}</strong>
      </div>
    </div>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث بالساكن أو رقم الوحدة أو الخدمة..." @search="onSearch"
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
            @update:model-value="(v: string | null) => { setFilter('ComplexId', v || undefined); void refreshStats() }"
          />
        </template>
      </FilterBar>

      <div v-if="selectedUnpaid.length" class="selection-bar">
        محدد غير مسدد: <b>{{ selectedUnpaid.length }}</b>
        — الإجمالي: <b>{{ formatMoney(selectedPayTotal) }}</b>
      </div>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="9" />
      <template v-else>
        <TableSortCaption :sort-mode="sortMode" />
        <DataTable
        v-model:selection="selectedRows"
        :value="items"
        :loading="loading"
        data-key="id"
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
        <Column selection-mode="multiple" header-style="width: 3rem" />
        <Column header="الخدمة" sortable>
          <template #body="{ data }">{{ data.serviceDisplayName || '—' }}</template>
        </Column>
        <Column header="الساكن" sortable>
          <template #body="{ data }">{{ data.residentName || '—' }}</template>
        </Column>
        <Column header="الوحدة" style="width: 100px" sortable>
          <template #body="{ data }">{{ data.unitNumber || '—' }}</template>
        </Column>
        <Column header="المجمع" sortable>
          <template #body="{ data }">{{ complexName(data.complexId) }}</template>
        </Column>
        <Column header="الفترة" style="width: 120px" sortable>
          <template #body="{ data }">{{ periodLabel(data) }}</template>
        </Column>
        <Column header="الصافي" style="width: 110px" sortable>
          <template #body="{ data }">{{ formatMoney(netOf(data)) }}</template>
        </Column>
        <Column header="الحالة" style="width: 110px" sortable>
          <template #body="{ data }">
            <Tag :value="data.paid ? 'مسدد' : 'غير مسدد'" :severity="data.paid ? 'success' : 'warn'" />
          </template>
        </Column>
        <Column header="السداد" style="width: 90px" sortable>
          <template #body="{ data }">{{ paymentLabel(data.paymentMethod) }}</template>
        </Column>
        <Column header="إجراءات" style="width: 15rem">
          <template #body="{ data }">
            <div class="row-actions">
              <Button
                :label="data.paid ? 'طباعة' : 'تسديد'"
                :icon="data.paid ? 'pi pi-print' : 'pi pi-check'"
                size="small"
                :severity="data.paid ? 'secondary' : 'success'"
                outlined
                @click="openPaySingle(data)"
              />
              <Button
                :label="data.paid ? 'إلغاء سداد' : 'حذف'"
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                :loading="deletingId === data.id"
                @click="removeBill(data)"
              />
            </div>
          </template>
        </Column>
        <template #empty><div class="empty-box">لا توجد فواتير</div></template>
      </DataTable>
      </template>
    </div>

    <Dialog v-model:visible="filterDialogVisible" modal header="فلترة الفواتير" :style="{ width: '360px' }">
      <div class="form-grid single">
        <div class="field">
          <label>السنة</label>
          <Select
            v-model="draftYear"
            :options="yearOptions"
            option-label="label"
            option-value="value"
            placeholder="الكل"
            show-clear
            append-to="body"
          />
        </div>
        <div class="field">
          <label>الشهر</label>
          <Select
            v-model="draftMonth"
            :options="monthOptions"
            option-label="label"
            option-value="value"
            placeholder="الكل"
            show-clear
            append-to="body"
          />
        </div>
        <div class="field">
          <label>حالة السداد</label>
          <Select
            v-model="draftPaid"
            :options="paidFilterOptions"
            option-label="label"
            option-value="value"
            placeholder="الكل"
            show-clear
            append-to="body"
          />
        </div>
        <div class="field">
          <label>طريقة السداد</label>
          <Select
            v-model="draftPayment"
            :options="serviceBillPaymentOptions"
            option-label="label"
            option-value="value"
            placeholder="كاش / ماستر"
            show-clear
            append-to="body"
          />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="مسح" severity="secondary" text icon="pi pi-filter-slash" @click="clearFilters" />
          <Button label="إلغاء" severity="secondary" outlined @click="filterDialogVisible = false" />
          <Button label="تطبيق" icon="pi pi-check" @click="applyFilters" />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="addVisible" modal :header="addButtonLabel" :style="{ width: '560px' }">
      <div class="form-grid">
        <div v-if="auth.canSelectComplex" class="field">
          <label>المجمع</label>
          <Select
            v-model="billForm.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            filter
            append-to="body"
            @update:model-value="(v: string) => onAddComplexChange(v)"
          />
        </div>
        <div class="field full">
          <label>الساكن (بحث بالاسم أو الوحدة)</label>
          <Select
            v-model="billForm.residentId"
            :options="formResidentOptions"
            option-label="label"
            option-value="id"
            filter
            placeholder="اختر الساكن"
            append-to="body"
            @update:model-value="(v: string) => onAddResidentChange(v)"
          />
        </div>
        <div v-if="!isServiceLocked" class="field">
          <label>الخدمة</label>
          <Select
            v-model="billForm.serviceTypeId"
            :options="formServiceOptions"
            option-label="label"
            option-value="id"
            filter
            append-to="body"
          />
        </div>
        <div v-else class="field">
          <label>الخدمة</label>
          <div class="net-box">{{ selectedService?.displayName || pageTitle }}</div>
        </div>
        <div class="field">
          <label>السنة</label>
          <Select
            v-model="billForm.year"
            :options="yearOptions"
            option-label="label"
            option-value="value"
            append-to="body"
          />
        </div>
        <div class="field full">
          <label>الأشهر (واحد أو أكثر)</label>
          <MultiSelect
            v-model="billForm.months"
            :options="monthOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الأشهر"
            display="chip"
            filter
            append-to="body"
            class="w-full"
          />
        </div>
        <template v-if="isMeteredAdd">
          <div class="field">
            <label>القراءة القديمة (يمكن 0)</label>
            <InputNumber
              v-model="billForm.previousReading"
              :min="0"
              :min-fraction-digits="0"
              :max-fraction-digits="2"
            />
          </div>
          <div class="field">
            <label>القراءة الجديدة</label>
            <InputNumber
              v-model="billForm.reading"
              :min="0"
              :min-fraction-digits="0"
              :max-fraction-digits="2"
            />
          </div>
          <div class="field">
            <label>{{ unitPriceLabel }}</label>
            <InputNumber
              v-model="billForm.unitPrice"
              :min="0"
              :min-fraction-digits="0"
              :max-fraction-digits="4"
            />
          </div>
          <div class="field">
            <label>الاستهلاك</label>
            <div class="net-box">{{ meterAddConsumption }} {{ utilityUnitLabel }}</div>
          </div>
          <div class="field">
            <label>المبلغ لكل شهر</label>
            <div class="net-box">{{ formatMoney(meterAddAmount) }}</div>
          </div>
        </template>
        <template v-else>
          <div class="field">
            <label>المبلغ لكل شهر (تلقائي)</label>
            <InputNumber v-model="billForm.amount" :min="0" :min-fraction-digits="0" :max-fraction-digits="2" />
          </div>
        </template>
        <div class="field">
          <label>الخصم</label>
          <InputNumber v-model="billForm.discount" :min="0" :min-fraction-digits="0" :max-fraction-digits="2" />
        </div>
        <div class="field">
          <label>الصافي</label>
          <div class="net-box">{{ formatMoney(billNetPreview) }}</div>
        </div>
        <div class="field">
          <label>طريقة السداد</label>
          <Select
            v-model="billForm.paymentMethod"
            :options="serviceBillPaymentOptions"
            option-label="label"
            option-value="value"
            append-to="body"
          />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="addVisible = false" />
          <Button label="إضافة" :loading="saving" @click="saveBill" />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="payVisible" modal header="تسديد الفواتير" :style="{ width: '420px' }">
      <div class="form-grid single">
        <div class="field">
          <label>عدد الفواتير</label>
          <div class="net-box">{{ payTargetIds.length }}</div>
        </div>
        <div class="field">
          <label>إجمالي قيمة الخدمة</label>
          <div class="net-box">{{ formatMoney(payTargetGross) }}</div>
        </div>
        <div class="field">
          <label>مقدار الخصم (مبلغ)</label>
          <InputNumber
            v-model="payDiscount"
            :min="0"
            :max="payTargetGross"
            :min-fraction-digits="0"
            :max-fraction-digits="2"
            class="w-full"
          />
          <small class="field-hint">أدخل مبلغاً وليس نسبة مئوية</small>
        </div>
        <div class="field">
          <label>المبلغ بعد الخصم</label>
          <div class="net-box">{{ formatMoney(payTargetTotal) }}</div>
        </div>
        <div class="field">
          <label>طريقة السداد</label>
          <Select
            v-model="payMethod"
            :options="serviceBillPaymentOptions"
            option-label="label"
            option-value="value"
            append-to="body"
          />
        </div>
        <div class="field">
          <label>تاريخ التسديد</label>
          <DatePicker
            v-model="payDate"
            date-format="yy-mm-dd"
            show-icon
            show-clear
            placeholder="اليوم تلقائياً إن تُرك فارغاً"
            append-to="body"
            class="w-full"
          />
          <small class="field-hint">اتركه فارغاً لاستخدام تاريخ ووقت اليوم تلقائياً</small>
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="payVisible = false" />
          <Button label="تأكيد التسديد وطباعة" :loading="paying" @click="confirmPay" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="meterDirectVisible"
      modal
      header="تسعير مباشر وإصدار الفواتير"
      :style="{ width: '920px' }"
    >
      <div class="form-grid">
        <div v-if="auth.canSelectComplex" class="field">
          <label>المجمع</label>
          <Select
            v-model="meterForm.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            filter
            append-to="body"
            @update:model-value="(v: string) => onMeterComplexChange(v)"
          />
        </div>
        <div class="field">
          <label>البناية</label>
          <Select
            v-model="meterForm.buildingId"
            :options="buildingOptions"
            option-label="label"
            option-value="id"
            filter
            placeholder="اختر البناية"
            append-to="body"
            @update:model-value="(v: string) => onMeterBuildingChange(v)"
          />
        </div>
        <div v-if="!isAbsoluteUtility" class="field">
          <label>تاريخ القراءة القديمة</label>
          <div class="net-box">
            {{
              meterDraft
                ? periodMmYyyy(meterDraft.previousPeriodMonth, meterDraft.previousPeriodYear)
                : '—'
            }}
          </div>
        </div>
        <div class="field">
          <label>{{ isAbsoluteUtility ? 'الشهر والسنة' : 'تاريخ القراءة الجديدة' }}</label>
          <div class="net-box">
            {{
              meterDraft
                ? periodMmYyyy(
                    meterDraft.suggestedCurrentPeriodMonth,
                    meterDraft.suggestedCurrentPeriodYear,
                  )
                : '—'
            }}
          </div>
        </div>
        <div class="field">
          <label>{{ unitPriceLabel }}</label>
          <InputNumber
            v-model="meterForm.unitPrice"
            :min="0"
            :min-fraction-digits="0"
            :max-fraction-digits="4"
          />
        </div>
        <div class="field">
          <label>إجمالي تقديري</label>
          <div class="net-box">{{ formatMoney(meterDirectTotalPreview) }}</div>
        </div>
        <p v-if="meterDraft" class="meter-hint full">
          <template v-if="isAbsoluteUtility">
            أدخل {{ consumptionFieldLabel }} لكل وحدة لهذا الشهر.
          </template>
          <template v-else>
            يعتمد على آخر Excel/قراءات مسجّلة. الوحدات المسكونة حديثاً تظهر بقراءة قديمة = 0.
          </template>
          <span v-if="meterDraft.newOccupancyCount">
            (وحدات جديدة: {{ meterDraft.newOccupancyCount }})
          </span>
        </p>
      </div>

      <div v-if="meterLoadingDraft" class="meter-hint" style="margin-top: 0.75rem">
        جاري تحميل الوحدات...
      </div>
      <DataTable
        v-else-if="meterDraft?.lines?.length"
        :value="meterDraft.lines"
        data-key="residentId"
        size="small"
        striped-rows
        class="meter-lines-table"
      >
        <Column header="الساكن" sortable>
          <template #body="{ data }">{{ data.residentName || '—' }}</template>
        </Column>
        <Column header="الوحدة" style="width: 90px" sortable>
          <template #body="{ data }">{{ data.unitNumber || '—' }}</template>
        </Column>
        <Column v-if="!isAbsoluteUtility" header="قراءة قديمة" style="width: 110px" sortable>
          <template #body="{ data }">{{ data.previousReading }}</template>
        </Column>
        <Column :header="consumptionFieldLabel" style="width: 150px" sortable>
          <template #body="{ data }">
            <InputNumber
              v-model="meterLineReadings[data.residentId]"
              :min="0"
              :min-fraction-digits="0"
              :max-fraction-digits="2"
              class="w-full"
            />
          </template>
        </Column>
        <Column header="حالة" style="width: 110px" sortable>
          <template #body="{ data }">
            <Tag
              :value="data.isNewOccupancy ? 'تسكين جديد' : 'من آخر Excel'"
              :severity="data.isNewOccupancy ? 'warn' : 'success'"
            />
          </template>
        </Column>
      </DataTable>
      <div v-else-if="meterForm.buildingId" class="empty-box" style="margin-top: 0.75rem">
        لا توجد وحدات فعّالة للفوترة في هذه البناية
      </div>

      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="meterDirectVisible = false" />
          <Button label="حفظ وإصدار الفواتير" :loading="meterSaving" @click="saveMeterDirect" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="meterExcelVisible"
      modal
      :header="excelDialogHeader"
      :style="{ width: '560px' }"
    >
      <div class="form-grid single">
        <div v-if="auth.canSelectComplex" class="field">
          <label>المجمع</label>
          <Select
            v-model="meterForm.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            filter
            append-to="body"
            @update:model-value="(v: string) => onMeterComplexChange(v)"
          />
        </div>
        <div class="field">
          <label>البناية</label>
          <Select
            v-model="meterForm.buildingId"
            :options="buildingOptions"
            option-label="label"
            option-value="id"
            filter
            placeholder="اختر البناية أولاً"
            append-to="body"
          />
        </div>
        <div class="field">
          <label>ملف Excel</label>
          <input
            ref="meterExcelInput"
            type="file"
            accept=".xlsx,.xls"
            class="file-input"
            :disabled="!meterForm.buildingId"
            @change="onMeterExcelSelected"
          />
          <small v-if="meterExcelFile">{{ meterExcelFile.name }}</small>
        </div>
        <div class="meter-hint">
          اختر البناية ثم ارفع الملف. الأعمدة بالترتيب:
          {{ excelColumnsHint }}
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="meterExcelVisible = false" />
          <Button
            label="استيراد وإصدار الفواتير"
            :loading="meterImporting"
            :disabled="!meterForm.buildingId"
            @click="saveMeterExcel"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.stat-card.is-warn {
  background: #fff7ed;
  border-color: #fed7aa;
}

.stat-label {
  color: var(--muted);
  font-size: 0.82rem;
}

.stat-card strong {
  font-size: 1.15rem;
  font-weight: 800;
}

.selection-bar {
  margin-bottom: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  background: #ecfdf5;
  color: #065f46;
  font-size: 0.9rem;
}

.row-actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.form-grid.single {
  grid-template-columns: 1fr;
}

.form-grid .field.full {
  grid-column: 1 / -1;
}

.form-grid .field label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.net-box {
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #f8fafc;
  font-weight: 700;
}

.meter-hint {
  grid-column: 1 / -1;
  margin: 0;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 0.82rem;
  line-height: 1.5;
}

.field-hint {
  display: block;
  margin-top: 0.35rem;
  color: var(--muted);
  font-size: 0.78rem;
}

.file-input {
  width: 100%;
  font-size: 0.9rem;
}

.meter-lines-table {
  margin-top: 0.85rem;
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
