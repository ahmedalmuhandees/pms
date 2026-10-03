<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type {
  Complex,
  CreateSalesContractDto,
  Customer,
  Employee,
  Installment,
  PricePlan,
  SalesContract,
  Unit,
} from '@/types'
import { ContractPaymentType, ContractStatus, ContractType, PricingMode, UnitStatus } from '@/types'
import {
  createSalesContract,
  deleteSalesContract,
  getSalesContract,
  getSalesContracts,
  updateSalesContract,
  type SalesContractParams,
} from '@/api/salesContracts'
import { getPricePlans } from '@/api/pricePlans'
import { getComplexes } from '@/api/complexes'
import { getCustomers } from '@/api/customers'
import { getUnit, getUnits, updateUnit } from '@/api/units'
import { getEmployees } from '@/api/employees'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  contractPaymentTypeOptions,
  contractStatusOptions,
  contractTypeOptions,
  formatDate,
  formatMoney,
  installmentStatusLabel,
  labelOf,
  pricingModeOptions,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const router = useRouter()
const complexes = ref<Complex[]>([])
const customers = ref<Customer[]>([])
const units = ref<Unit[]>([])
const employees = ref<Employee[]>([])
const pricePlans = ref<PricePlan[]>([])
const complexMap = ref<Record<string, string>>({})
const customerMap = ref<Record<string, string>>({})
const unitMap = ref<Record<string, string>>({})
const employeeMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<SalesContract, SalesContractParams>(getSalesContracts)

const dialogVisible = ref(false)
const detailVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const statusFilter = ref<number | null>(null)
const typeFilter = ref<number | null>(null)
const paymentTypeFilter = ref<number | null>(null)
const deliveryDateModel = ref<Date | null>(null)
const firstInstallmentDateModel = ref<Date | null>(null)
const detailContract = ref<SalesContract | null>(null)

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

const isCash = computed(() => form.contractPaymentType === ContractPaymentType.Cash)
const isBank = computed(() => form.contractPaymentType === ContractPaymentType.RealEstateBank)
const isSystemPricing = computed(() => form.pricingMode === PricingMode.System)

/** RemainingAmount = SellingPrice - FinancedAmount - DownPayment - DeliveryAmount */
const computedRemaining = computed(() => {
  const financed = isBank.value ? form.financedAmount || 0 : 0
  return (form.sellingPrice || 0) - financed - (form.downPayment || 0) - (form.deliveryAmount || 0)
})

const computedMonths = computed(() => {
  if (!isBank.value || !form.years) return 0
  return form.years * 12
})

const computedInstallmentCount = computed(() => {
  if (!isBank.value || !form.years || !form.paymentIntervalMonths) return 0
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

const filteredUnits = computed(() =>
  form.complexId ? units.value.filter((u) => u.complexId === form.complexId) : units.value,
)
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
    return `${target} — ${formatMoney(p.sellingPrice)}`
  }),
)

async function loadLookups() {
  const [complexResult, customerResult, unitResult, employeeResult, planResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getCustomers({ Page: 1, PageSize: 500 }),
    getUnits({ Page: 1, PageSize: 500 }),
    getEmployees({ Page: 1, PageSize: 500 }),
    getPricePlans({ Page: 1, PageSize: 500 }).catch(() => ({ items: [] as PricePlan[] })),
  ])
  complexes.value = complexResult.items ?? []
  customers.value = customerResult.items ?? []
  units.value = unitResult.items ?? []
  employees.value = employeeResult.items ?? []
  pricePlans.value = planResult.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
  customerMap.value = Object.fromEntries(
    customers.value.map((c) => [c.id, [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id]),
  )
  unitMap.value = Object.fromEntries(units.value.map((u) => [u.id, u.unitNumber || u.id]))
  employeeMap.value = Object.fromEntries(employees.value.map((e) => [e.id, e.name || e.id]))
}

function applyPricePlan(planId: string | null | undefined) {
  if (!planId) return
  const plan = pricePlans.value.find((p) => p.id === planId)
  if (!plan) return
  form.sellingPrice = plan.sellingPrice
  form.discount = plan.discount
  form.tax = plan.tax
  form.registrationFee = plan.registrationFee
}

function onPricingModeChange() {
  if (isSystemPricing.value) {
    applyPricePlan(form.pricePlanId)
  } else {
    form.pricePlanId = null
  }
}

function onPaymentTypeChange() {
  if (isCash.value) {
    form.bankName = null
    form.years = null
    form.paymentIntervalMonths = null
    form.firstInstallmentDate = null
    form.financedAmount = 0
    firstInstallmentDateModel.value = null
  } else {
    form.years = form.years || 1
    form.paymentIntervalMonths = form.paymentIntervalMonths || 1
    if (!firstInstallmentDateModel.value) {
      firstInstallmentDateModel.value = new Date()
    }
  }
}

function openCreate() {
  editingId.value = null
  deliveryDateModel.value = new Date()
  firstInstallmentDateModel.value = null
  Object.assign(form, emptyForm(), {
    complexId: complexFilter.value || complexes.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: SalesContract) {
  editingId.value = row.id
  deliveryDateModel.value = row.deliveryDate ? new Date(row.deliveryDate) : null
  firstInstallmentDateModel.value = row.firstInstallmentDate
    ? new Date(row.firstInstallmentDate)
    : null
  Object.assign(form, {
    contractType: row.contractType ?? ContractType.Sale,
    contractPaymentType: row.contractPaymentType ?? ContractPaymentType.Cash,
    pricingMode: row.pricingMode ?? PricingMode.Manual,
    pricePlanId: row.pricePlanId,
    sellingPrice: row.sellingPrice,
    discount: row.discount,
    tax: row.tax,
    registrationFee: row.registrationFee,
    downPayment: row.downPayment,
    deliveryAmount: row.deliveryAmount ?? 0,
    deliveryDate: row.deliveryDate,
    financedAmount: row.financedAmount,
    bankName: row.bankName,
    years: row.years,
    paymentIntervalMonths: row.paymentIntervalMonths,
    firstInstallmentDate: row.firstInstallmentDate,
    contractStatus: row.contractStatus,
    customerId: row.customerId,
    unitId: row.unitId,
    salesAgentId: row.salesAgentId,
    complexId: row.complexId,
  })
  dialogVisible.value = true
}

async function openDetails(row: SalesContract) {
  try {
    detailContract.value = await getSalesContract(row.id)
    detailVisible.value = true
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

function printContract(row: SalesContract) {
  const route = router.resolve({ name: 'sales-contract-print', params: { id: row.id } })
  window.open(route.href, '_blank', 'noopener,noreferrer')
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
    downPayment: form.downPayment,
    deliveryAmount: form.deliveryAmount,
    deliveryDate: deliveryDateModel.value?.toISOString() ?? null,
    financedAmount: isBank.value ? form.financedAmount : 0,
    bankName: isBank.value ? form.bankName : null,
    years: isBank.value ? form.years : null,
    paymentIntervalMonths: isBank.value ? form.paymentIntervalMonths : null,
    firstInstallmentDate: isBank.value
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
  if (form.downPayment < 0 || form.deliveryAmount < 0) {
    notify.warning('المقدمة ومبلغ الاستلام يجب ألا تكون سالبة')
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
  if (!form.bankName?.trim()) {
    notify.warning('أدخل اسم المصرف العقاري')
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
  if (form.financedAmount < 0) {
    notify.warning('مبلغ المصرف العقاري غير صالح')
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
  return true
}

async function reserveUnitAfterContract(unitId: string) {
  if (!unitId) return
  try {
    const unit = await getUnit(unitId)
    if (unit.status !== UnitStatus.Available) return
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
      status: UnitStatus.Reserved,
      price: unit.price,
      cost: unit.cost,
      notes: unit.notes,
      unitUi: unit.unitUi,
      floorId: unit.floorId,
      complexId: unit.complexId,
    })
    const local = units.value.find((u) => u.id === unitId)
    if (local) local.status = UnitStatus.Reserved
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
      await reserveUnitAfterContract(payload.unitId)
      notify.success('تم التحديث')
    } else {
      const created = await createSalesContract(payload)
      await reserveUnitAfterContract(created.unitId || payload.unitId)
      const installmentCount = created.installments?.length ?? 0
      notify.success(
        installmentCount > 0
          ? `تم إنشاء العقد رقم ${created.contractNumber} مع ${installmentCount} قسط — الوحدة أصبحت محجوزة`
          : `تم إنشاء العقد رقم ${created.contractNumber} — الوحدة أصبحت محجوزة`,
      )
      if (installmentCount > 0) {
        detailContract.value = created
        detailVisible.value = true
      }
    }
    dialogVisible.value = false
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function remove(row: SalesContract) {
  if (!(await ask(`حذف العقد "${row.contractNumber || row.id.slice(0, 8)}"؟`))) return
  try {
    await deleteSalesContract(row.id)
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
    <PageHeader title="عقود المبيعات" subtitle="بيع وإيجار — كاش أو مصرف عقاري مع أقساط تلقائية">
      <template #actions>
        <Button label="إضافة عقد" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث برقم العقد..." @search="onSearch">
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
            v-model="typeFilter"
            :options="contractTypeOptions"
            option-label="label"
            option-value="value"
            placeholder="نوع العقد"
            show-clear
            @update:model-value="(v: number | null) => setFilter('ContractType', v ?? undefined)"
          />
          <Select
            v-model="paymentTypeFilter"
            :options="contractPaymentTypeOptions"
            option-label="label"
            option-value="value"
            placeholder="طريقة الدفع"
            show-clear
            @update:model-value="(v: number | null) => setFilter('ContractPaymentType', v ?? undefined)"
          />
          <Select
            v-model="statusFilter"
            :options="contractStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="كل الحالات"
            show-clear
            @update:model-value="(v: number | null) => setFilter('ContractStatus', v ?? undefined)"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="9" />
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
        <Column field="contractNumber" header="رقم العقد" style="width: 100px" />
        <Column header="النوع" style="width: 90px">
          <template #body="{ data }">{{ labelOf(contractTypeOptions, data.contractType) }}</template>
        </Column>
        <Column header="الدفع" style="width: 110px">
          <template #body="{ data }">{{ labelOf(contractPaymentTypeOptions, data.contractPaymentType) }}</template>
        </Column>
        <Column header="التاريخ" style="width: 110px">
          <template #body="{ data }">{{ formatDate(data.contractDate) }}</template>
        </Column>
        <Column header="سعر البيع" style="width: 110px">
          <template #body="{ data }">{{ formatMoney(data.sellingPrice) }}</template>
        </Column>
        <Column header="المقدمة" style="width: 100px">
          <template #body="{ data }">{{ formatMoney(data.downPayment) }}</template>
        </Column>
        <Column header="أشهر" style="width: 70px">
          <template #body="{ data }">{{ data.monthsCount || '—' }}</template>
        </Column>
        <Column header="الحالة" style="width: 90px">
          <template #body="{ data }">{{ labelOf(contractStatusOptions, data.contractStatus) }}</template>
        </Column>
        <Column header="العميل">
          <template #body="{ data }">{{ customerMap[data.customerId] || data.customerId.slice(0, 8) }}</template>
        </Column>
        <Column header="إجراءات" style="width: 190px">
          <template #body="{ data }">
            <RowActions
              show-details
              show-print
              @details="openDetails(data)"
              @print="printContract(data)"
              @edit="openEdit(data)"
              @remove="remove(data)"
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
            @update:model-value="() => { form.customerId = ''; form.unitId = ''; form.salesAgentId = '' }"
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
          <label>نوع العقد</label>
          <Select
            v-model="form.contractType"
            :options="contractTypeOptions"
            option-label="label"
            option-value="value"
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
            placeholder="اختر الوحدة"
            checkmark
            append-to="body"
            filter
          />
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
        <div class="field">
          <label>سعر البيع</label>
          <InputNumber v-model="form.sellingPrice" :min="0" :disabled="isSystemPricing" />
        </div>
        <div class="field">
          <label>الخصم</label>
          <InputNumber v-model="form.discount" :min="0" :disabled="isSystemPricing" />
        </div>
        <div class="field">
          <label>الضريبة</label>
          <InputNumber v-model="form.tax" :min="0" :disabled="isSystemPricing" />
        </div>
        <div class="field">
          <label>رسوم التسجيل</label>
          <InputNumber v-model="form.registrationFee" :min="0" :disabled="isSystemPricing" />
        </div>
        <div class="field">
          <label>المقدمة</label>
          <InputNumber v-model="form.downPayment" :min="0" />
        </div>
        <div class="field">
          <label>مبلغ الاستلام</label>
          <InputNumber v-model="form.deliveryAmount" :min="0" />
        </div>
        <div class="field">
          <label>تاريخ الاستلام{{ isCash ? '' : ' (اختياري)' }}</label>
          <DatePicker v-model="deliveryDateModel" date-format="yy-mm-dd" show-icon show-clear />
        </div>
        <div class="field hint-box">
          <span>المتبقي: <strong>{{ formatMoney(computedRemaining) }}</strong></span>
          <small>سعر البيع − المصرف − المقدمة − الاستلام</small>
        </div>

        <template v-if="isBank">
          <div class="field full section-title">بيانات المصرف العقاري</div>
          <div class="field">
            <label>اسم المصرف</label>
            <InputText v-model="form.bankName" />
          </div>
          <div class="field">
            <label>مبلغ المصرف العقاري</label>
            <InputNumber v-model="form.financedAmount" :min="0" />
          </div>
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
          <div class="field hint-box">
            <span>عدد الأشهر: <strong>{{ computedMonths || '—' }}</strong></span>
            <span>عدد الأقساط: <strong>{{ computedInstallmentCount || '—' }}</strong></span>
            <span>قيمة القسط ≈ <strong>{{ formatMoney(computedInstallmentAmount) }}</strong></span>
            <small>الأقساط تُقسَّم على المتبقي</small>
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
          <div><span>النوع</span><strong>{{ labelOf(contractTypeOptions, detailContract.contractType) }}</strong></div>
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
          <template v-if="detailContract.contractPaymentType === ContractPaymentType.RealEstateBank">
            <div><span>المصرف</span><strong>{{ detailContract.bankName || '—' }}</strong></div>
            <div><span>مبلغ المصرف</span><strong>{{ formatMoney(detailContract.financedAmount) }}</strong></div>
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
</style>
