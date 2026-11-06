<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type {
  Complex,
  CreateServiceBillDto,
  Resident,
  ServiceBill,
  ServiceType,
} from '@/types'
import { MeterReadingSource, ServiceBillingMode } from '@/types'
import {
  createServiceBill,
  deleteServiceBill,
  generateFixedServiceBills,
  getServiceBills,
  updateServiceBill,
  type ServiceBillParams,
} from '@/api/serviceBills'
import { getServiceTypes } from '@/api/serviceTypes'
import { getResidents } from '@/api/residents'
import { getComplexes } from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatDate,
  formatMoney,
  labelOf,
  meterReadingSourceOptions,
  monthOptions,
  serviceBillingModeOptions,
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
const complexMap = ref<Record<string, string>>({})
const residents = ref<Resident[]>([])
const serviceTypes = ref<ServiceType[]>([])

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort,
  sortField,
  sortOrder,
  sortMode, onLazyPage,
} = usePagedList<ServiceBill, ServiceBillParams>(getServiceBills)

const dialogVisible = ref(false)
const generateVisible = ref(false)
const saving = ref(false)
const generating = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(auth.scopedComplexId)
const monthFilter = ref<number | null>(new Date().getMonth() + 1)
const yearFilter = ref<number>(new Date().getFullYear())
const paidFilter = ref<boolean | null>(null)

const now = new Date()
const formMonths = ref<number[]>([now.getMonth() + 1])
const form = reactive<CreateServiceBillDto>({
  month: now.getMonth() + 1,
  months: [now.getMonth() + 1],
  year: now.getFullYear(),
  previousReading: 0,
  reading: 0,
  unitPrice: null,
  amount: null,
  dueDate: null,
  paid: false,
  readingSource: MeterReadingSource.Manual,
  residentId: '',
  serviceTypeId: '',
  unitId: null,
  complexId: '',
})

const generateForm = reactive({
  complexId: '',
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  serviceTypeId: null as string | null,
})

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)
const residentOptions = computed(() =>
  asSelectOptions(residents.value, (r) =>
    [r.customerName, r.unitNumber ? `وحدة ${r.unitNumber}` : null].filter(Boolean).join(' — ') || r.id,
  ),
)
const serviceOptions = computed(() =>
  asSelectOptions(serviceTypes.value, (s) => s.displayName || s.id),
)
const fixedServiceOptions = computed(() =>
  asSelectOptions(
    serviceTypes.value.filter((s) => s.billingMode === ServiceBillingMode.Fixed),
    (s) => s.displayName || s.id,
  ),
)

const selectedService = computed(
  () => serviceTypes.value.find((s) => s.id === form.serviceTypeId) || null,
)
const isMetered = computed(() => selectedService.value?.billingMode === ServiceBillingMode.Metered)

const computedConsumption = computed(() =>
  Math.max(0, Number(form.reading || 0) - Number(form.previousReading || 0)),
)
const computedAmount = computed(() => {
  if (!selectedService.value) return 0
  if (selectedService.value.billingMode === ServiceBillingMode.Fixed) {
    return form.amount ?? selectedService.value.fixedAmount
  }
  const price = form.unitPrice ?? selectedService.value.unitPrice
  return Math.round(computedConsumption.value * Number(price || 0) * 100) / 100
})

const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => ({ value: y - i, label: String(y - i) }))
})

watch(
  () => form.serviceTypeId,
  (id) => {
    const svc = serviceTypes.value.find((s) => s.id === id)
    if (!svc) return
    form.readingSource = svc.readingSource
    if (svc.billingMode === ServiceBillingMode.Fixed) {
      form.previousReading = 0
      form.reading = 0
      form.unitPrice = null
      form.amount = svc.fixedAmount
    } else {
      form.unitPrice = svc.unitPrice
      form.amount = null
    }
  },
)

watch(
  () => form.residentId,
  (id) => {
    const resident = residents.value.find((r) => r.id === id)
    form.unitId = resident?.unitId || null
  },
)

async function loadComplexes() {
  const result = await getComplexes({ Page: 1, PageSize: 200 })
  complexes.value = result.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
}

async function loadLookups(complexId: string) {
  const [resResult, svcResult] = await Promise.all([
    getResidents({ ComplexId: complexId, Page: 1, PageSize: 500, Status: 1 }),
    getServiceTypes({ ComplexId: complexId, Page: 1, PageSize: 200, IsActive: true }),
  ])
  residents.value = resResult.items ?? []
  serviceTypes.value = svcResult.items ?? []
}

function openCreate() {
  editingId.value = null
  const complexId = auth.scopedComplexId || complexFilter.value || complexes.value[0]?.id || ''
  const defaultMonth = monthFilter.value || now.getMonth() + 1
  formMonths.value = [defaultMonth]
  Object.assign(form, {
    month: defaultMonth,
    months: [defaultMonth],
    year: yearFilter.value || now.getFullYear(),
    previousReading: 0,
    reading: 0,
    unitPrice: null,
    amount: null,
    dueDate: null,
    paid: false,
    readingSource: MeterReadingSource.Manual,
    residentId: '',
    serviceTypeId: '',
    unitId: null,
    complexId,
  })
  dialogVisible.value = true
  if (complexId) void loadLookups(complexId)
}

function openEdit(row: ServiceBill) {
  editingId.value = row.id
  formMonths.value = [row.month]
  Object.assign(form, {
    month: row.month,
    months: [row.month],
    year: row.year,
    previousReading: row.previousReading,
    reading: row.reading,
    unitPrice: row.unitPrice,
    amount: row.amount,
    dueDate: row.dueDate,
    paid: row.paid,
    readingSource: row.readingSource,
    residentId: row.residentId,
    serviceTypeId: row.serviceTypeId,
    unitId: row.unitId,
    complexId: row.complexId,
  })
  dialogVisible.value = true
  void loadLookups(row.complexId)
}

function openGenerate() {
  Object.assign(generateForm, {
    complexId: auth.scopedComplexId || complexFilter.value || complexes.value[0]?.id || '',
    month: monthFilter.value || now.getMonth() + 1,
    year: yearFilter.value || now.getFullYear(),
    serviceTypeId: null,
  })
  generateVisible.value = true
  if (generateForm.complexId) void loadLookups(generateForm.complexId)
}

async function save() {
  if (!form.complexId || !form.residentId || !form.serviceTypeId) {
    notify.warning('أكمل بيانات المجمع والساكن والخدمة')
    return
  }
  if (!editingId.value && formMonths.value.length === 0) {
    notify.warning('اختر شهراً واحداً على الأقل')
    return
  }
  if (isMetered.value && Number(form.reading) < Number(form.previousReading)) {
    notify.warning('القراءة الحالية يجب أن تكون أكبر من أو تساوي القراءة السابقة')
    return
  }
  saving.value = true
  try {
    const payload: CreateServiceBillDto = {
      ...form,
      months: editingId.value ? undefined : [...formMonths.value].sort((a, b) => a - b),
      month: editingId.value ? form.month : formMonths.value[0],
      amount: computedAmount.value,
      unitPrice: isMetered.value ? (form.unitPrice ?? selectedService.value?.unitPrice ?? 0) : 0,
      previousReading: isMetered.value ? form.previousReading : 0,
      reading: isMetered.value ? form.reading : 0,
    }
    if (editingId.value) {
      await updateServiceBill(editingId.value, payload)
      notify.success('تم التحديث')
    } else {
      const created = await createServiceBill(payload)
      notify.success(
        created.length > 1
          ? `تم إنشاء ${created.length} فواتير للأشهر المحددة`
          : 'تم إنشاء فاتورة الخدمة',
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

async function generateFixed() {
  if (!generateForm.complexId) {
    notify.warning('اختر المجمع')
    return
  }
  generating.value = true
  try {
    const count = await generateFixedServiceBills({
      complexId: generateForm.complexId,
      month: generateForm.month,
      year: generateForm.year,
      serviceTypeId: generateForm.serviceTypeId,
    })
    notify.success(`تم توليد ${count} فاتورة ثابتة`)
    generateVisible.value = false
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    generating.value = false
  }
}

async function remove(row: ServiceBill) {
  if (!(await ask('حذف فاتورة الخدمة؟'))) return
  try {
    await deleteServiceBill(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

function applyPeriodFilters() {
  setFilter('Month', monthFilter.value ?? undefined)
  setFilter('Year', yearFilter.value || undefined)
}

onMounted(async () => {
  try {
    await loadComplexes()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  if (complexFilter.value) {
    setFilter('ComplexId', complexFilter.value)
    await loadLookups(complexFilter.value)
  }
  applyPeriodFilters()
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="الخدمات الشهرية" subtitle="إصدار فواتير الخدمات الثابتة والعدادات يدوياً أو عبر API">
      <template #actions>
        <Button label="توليد الثابتة" icon="pi pi-bolt" severity="secondary" outlined @click="openGenerate" />
        <Button label="إضافة فاتورة خدمة" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث بالساكن أو الوحدة أو الخدمة..." @search="onSearch"
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
            @update:model-value="async (v: string | null) => {
              setFilter('ComplexId', v || undefined)
              if (v) await loadLookups(v)
            }"
          />
          <Select
            v-model="monthFilter"
            :options="monthOptions"
            option-label="label"
            option-value="value"
            placeholder="الشهر"
            show-clear
            @update:model-value="applyPeriodFilters"
          />
          <Select
            v-model="yearFilter"
            :options="yearOptions"
            option-label="label"
            option-value="value"
            placeholder="السنة"
            @update:model-value="applyPeriodFilters"
          />
          <Select
            v-model="paidFilter"
            :options="[{ value: true, label: 'مدفوعة' }, { value: false, label: 'غير مدفوعة' }]"
            option-label="label"
            option-value="value"
            placeholder="حالة الدفع"
            show-clear
            @update:model-value="(v: boolean | null) => setFilter('Paid', v ?? undefined)"
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
        <Column header="الفترة" style="width: 110px" sortable>
          <template #body="{ data }">{{ labelOf(monthOptions, data.month) }} {{ data.year }}</template>
        </Column>
        <Column field="unitNumber" header="الوحدة" style="width: 100px"  sortable />
        <Column field="residentName" header="الساكن"  sortable />
        <Column field="serviceDisplayName" header="الخدمة"  sortable />
        <Column header="النوع" style="width: 110px" sortable>
          <template #body="{ data }">{{ labelOf(serviceBillingModeOptions, data.billingMode) }}</template>
        </Column>
        <Column header="الاستهلاك" style="width: 150px" sortable>
          <template #body="{ data }">
            <span v-if="data.billingMode === ServiceBillingMode.Metered">
              {{ data.previousReading }} → {{ data.reading }} = {{ data.consumption }}
              {{ data.unitOfMeasure || '' }}
            </span>
            <span v-else>—</span>
          </template>
        </Column>
        <Column header="المبلغ" style="width: 110px" sortable>
          <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
        </Column>
        <Column header="الاستحقاق" style="width: 110px" sortable>
          <template #body="{ data }">{{ formatDate(data.dueDate) }}</template>
        </Column>
        <Column header="الحالة" style="width: 100px" sortable>
          <template #body="{ data }">
            <span :class="data.paid ? 'badge-paid' : 'badge-unpaid'">
              {{ data.paid ? 'مدفوعة' : 'غير مدفوعة' }}
            </span>
          </template>
        </Column>
        <Column header="إجراءات" style="width: 130px">
          <template #body="{ data }">
            <RowActions @edit="openEdit(data)" @remove="remove(data)" />
          </template>
        </Column>
        <template #empty><div class="empty-box">لا توجد فواتير خدمات</div></template>
      </DataTable>
      </template>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل فاتورة خدمة' : 'إصدار فاتورة خدمة'"
      :style="{ width: '640px' }"
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
            @update:model-value="(v: string) => loadLookups(v)"
          />
        </div>
        <div class="field">
          <label>الساكن</label>
          <Select
            v-model="form.residentId"
            :options="residentOptions"
            option-label="label"
            option-value="id"
            filter
            placeholder="اختر الساكن"
          />
        </div>
        <div class="field">
          <label>الخدمة</label>
          <Select
            v-model="form.serviceTypeId"
            :options="serviceOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر الخدمة"
          />
        </div>
        <div v-if="editingId" class="field">
          <label>الشهر</label>
          <Select v-model="form.month" :options="monthOptions" option-label="label" option-value="value" />
        </div>
        <div v-else class="field">
          <label>الأشهر (واحد أو أكثر)</label>
          <MultiSelect
            v-model="formMonths"
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
        <div class="field">
          <label>السنة</label>
          <Select v-model="form.year" :options="yearOptions" option-label="label" option-value="value" />
        </div>

        <template v-if="isMetered">
          <div class="field">
            <label>مصدر القراءة</label>
            <Select
              v-model="form.readingSource"
              :options="meterReadingSourceOptions"
              option-label="label"
              option-value="value"
            />
          </div>
          <div class="field">
            <label>القراءة السابقة</label>
            <InputNumber v-model="form.previousReading" :min="0" :max-fraction-digits="3" />
          </div>
          <div class="field">
            <label>القراءة الحالية</label>
            <InputNumber v-model="form.reading" :min="0" :max-fraction-digits="3" />
          </div>
          <div class="field">
            <label>الاستهلاك (محسوب)</label>
            <InputNumber :model-value="computedConsumption" disabled />
          </div>
          <div class="field">
            <label>سعر الوحدة</label>
            <InputNumber v-model="form.unitPrice" :min="0" :max-fraction-digits="4" />
          </div>
        </template>

        <div class="field">
          <label>مبلغ الفاتورة</label>
          <InputNumber :model-value="computedAmount" disabled />
        </div>
        <div class="field checkbox-field">
          <Checkbox v-model="form.paid" :binary="true" input-id="bill-paid" />
          <label for="bill-paid">مدفوعة</label>
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="حفظ" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="generateVisible" modal header="توليد الخدمات الثابتة" :style="{ width: '480px' }">
      <div class="form-grid">
        <div class="field">
          <label>المجمع</label>
          <Select
            :disabled="!auth.canSelectComplex"
            v-model="generateForm.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            @update:model-value="(v: string) => loadLookups(v)"
          />
        </div>
        <div class="field">
          <label>الشهر</label>
          <Select v-model="generateForm.month" :options="monthOptions" option-label="label" option-value="value" />
        </div>
        <div class="field">
          <label>السنة</label>
          <Select v-model="generateForm.year" :options="yearOptions" option-label="label" option-value="value" />
        </div>
        <div class="field">
          <label>خدمة محددة (اختياري)</label>
          <Select
            v-model="generateForm.serviceTypeId"
            :options="fixedServiceOptions"
            option-label="label"
            option-value="id"
            placeholder="كل الخدمات الثابتة"
            show-clear
          />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="generateVisible = false" />
          <Button label="توليد" icon="pi pi-bolt" :loading="generating" @click="generateFixed" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.checkbox-field {
  display: flex;
  align-items: center;
  gap: 8px;
}
.badge-paid {
  color: #1f7a5c;
  font-weight: 700;
}
.badge-unpaid {
  color: #b04a4a;
  font-weight: 700;
}
</style>
