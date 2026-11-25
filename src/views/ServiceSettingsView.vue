<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import MultiSelect from 'primevue/multiselect'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, CreateServiceTypeDto, ServiceType, ServiceTypeName as ServiceTypeNameT } from '@/types'
import { MeterReadingSource, ServiceBillingMode, ServiceTypeName } from '@/types'
import {
  createServiceType,
  deleteServiceType,
  getServiceTypes,
  updateServiceType,
  type ServiceTypeParams,
} from '@/api/serviceTypes'
import { getComplexes } from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatMoney,
  labelOf,
  meterReadingSourceOptions,
  monthOptions,
  serviceBillingModeOptions,
  serviceTypeNameOptions,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import TableSortCaption from '@/components/TableSortCaption.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const complexMap = ref<Record<string, string>>({})

const lockedServiceTypeName = computed(
  () => route.meta.serviceTypeName as ServiceTypeNameT | undefined,
)
const isServiceLocked = computed(() => lockedServiceTypeName.value != null)
const pageTitle = computed(
  () => (route.meta.pageTitle as string | undefined) || 'إعدادات الخدمات',
)
const pageSubtitle = computed(
  () =>
    (route.meta.pageSubtitle as string | undefined) ||
    'تعريف الخدمات الثابتة والمتغيرة للمجمع',
)
const addButtonLabel = computed(
  () => (route.meta.addLabel as string | undefined) || 'إضافة خدمة',
)

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort,
  sortField,
  sortOrder,
  sortMode, onLazyPage,
} = usePagedList<ServiceType, ServiceTypeParams>(getServiceTypes)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(auth.scopedComplexId)
const billingModeFilter = ref<number | null>(null)

const allMonthValues = monthOptions.map((m) => m.value)

const form = reactive<CreateServiceTypeDto>({
  name: ServiceTypeName.Cleaning,
  displayName: 'نظافة',
  billingMode: ServiceBillingMode.Fixed,
  fixedAmount: 0,
  unitPrice: 0,
  unitOfMeasure: null,
  readingSource: MeterReadingSource.Manual,
  isActive: true,
  applicableMonths: [...allMonthValues],
  complexId: '',
})

const selectedMonths = computed({
  get: () => form.applicableMonths ?? [],
  set: (v: number[]) => {
    form.applicableMonths = v
  },
})

const allMonthsSelected = computed(
  () => selectedMonths.value.length >= 12 || selectedMonths.value.length === 0,
)

function selectAllMonths() {
  form.applicableMonths = [...allMonthValues]
}

function clearMonths() {
  form.applicableMonths = []
}

function monthsLabel(row: ServiceType) {
  if (row.appliesToAllMonths || !row.applicableMonths?.length) return 'كل الأشهر'
  return row.applicableMonths
    .map((m) => labelOf(monthOptions, m))
    .filter((x) => x !== '—')
    .join('، ')
}

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

const isMetered = computed(() => form.billingMode === ServiceBillingMode.Metered)

function defaultUnitOfMeasure(name: ServiceTypeNameT) {
  if (name === ServiceTypeName.Electricity) return 'واط'
  if (name === ServiceTypeName.Gas) return 'لتر'
  if (name === ServiceTypeName.Water) return 'م³'
  return 'وحدة'
}

const unitPriceFieldLabel = computed(() => {
  const locked = lockedServiceTypeName.value
  if (locked === ServiceTypeName.Gas) return 'سعر اللتر الواحد'
  if (locked === ServiceTypeName.Water) return 'سعر المتر المكعب الواحد'
  if (locked === ServiceTypeName.Electricity) return 'سعر الواط'
  return 'سعر الوحدة'
})

function applyLockedDefaults() {
  const locked = lockedServiceTypeName.value
  if (locked == null) return
  form.name = locked
  form.displayName = labelOf(serviceTypeNameOptions, locked)
  form.billingMode = ServiceBillingMode.Metered
  form.unitOfMeasure = defaultUnitOfMeasure(locked)
  form.readingSource = MeterReadingSource.Manual
}

watch(
  () => form.name,
  (name) => {
    if (editingId.value || isServiceLocked.value) return
    const label = labelOf(serviceTypeNameOptions, name)
    form.displayName = label === '—' ? form.displayName : label
    if (
      name === ServiceTypeName.Electricity ||
      name === ServiceTypeName.Gas ||
      name === ServiceTypeName.Water
    ) {
      form.billingMode = ServiceBillingMode.Metered
      form.unitOfMeasure = defaultUnitOfMeasure(name)
    } else {
      form.billingMode = ServiceBillingMode.Fixed
      form.unitOfMeasure = null
    }
  },
)

async function loadComplexes() {
  const result = await getComplexes({ Page: 1, PageSize: 200 })
  complexes.value = result.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    name: ServiceTypeName.Cleaning,
    displayName: 'نظافة',
    billingMode: ServiceBillingMode.Fixed,
    fixedAmount: 0,
    unitPrice: 0,
    unitOfMeasure: null,
    readingSource: MeterReadingSource.Manual,
    isActive: true,
    applicableMonths: [...allMonthValues],
    complexId: auth.scopedComplexId || complexFilter.value || complexes.value[0]?.id || '',
  })
  applyLockedDefaults()
  dialogVisible.value = true
}

function openEdit(row: ServiceType) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    displayName: row.displayName,
    billingMode: row.billingMode,
    fixedAmount: row.fixedAmount,
    unitPrice: row.unitPrice,
    unitOfMeasure: row.unitOfMeasure,
    readingSource: row.readingSource,
    isActive: row.isActive,
    applicableMonths:
      row.appliesToAllMonths || !row.applicableMonths?.length
        ? [...allMonthValues]
        : [...row.applicableMonths],
    complexId: row.complexId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.complexId) {
    notify.warning('اختر المجمع')
    return
  }
  if (!form.displayName.trim()) {
    notify.warning('أدخل اسم الخدمة')
    return
  }
  if (!form.applicableMonths?.length) {
    notify.warning('اختر شهراً واحداً على الأقل أو كل الأشهر')
    return
  }
  saving.value = true
  try {
    const payload = { ...form }
    if (payload.billingMode === ServiceBillingMode.Fixed) {
      payload.unitPrice = 0
      payload.unitOfMeasure = null
    } else {
      payload.fixedAmount = 0
    }
    if (payload.applicableMonths && payload.applicableMonths.length >= 12) {
      payload.applicableMonths = null
    }
    if (editingId.value) {
      await updateServiceType(editingId.value, payload)
      notify.success('تم التحديث')
    } else {
      await createServiceType(payload)
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

async function remove(row: ServiceType) {
  if (!(await ask(`حذف الخدمة "${row.displayName}"؟`))) return
  try {
    await deleteServiceType(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

onMounted(async () => {
  try {
    await loadComplexes()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  if (complexFilter.value) setFilter('ComplexId', complexFilter.value)
  if (lockedServiceTypeName.value != null) setFilter('Name', lockedServiceTypeName.value)
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader :title="pageTitle" :subtitle="pageSubtitle">
      <template #actions>
        <Button :label="addButtonLabel" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث باسم الخدمة..." @search="onSearch"
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
          <Select
            v-if="!isServiceLocked"
            v-model="billingModeFilter"
            :options="serviceBillingModeOptions"
            option-label="label"
            option-value="value"
            placeholder="كل الأنواع"
            show-clear
            @update:model-value="(v: number | null) => setFilter('BillingMode', v ?? undefined)"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="7" />
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
        <Column field="displayName" header="اسم الخدمة"  sortable />
        <Column header="التصنيف" style="width: 120px" sortable>
          <template #body="{ data }">{{ labelOf(serviceTypeNameOptions, data.name) }}</template>
        </Column>
        <Column header="نوع الفوترة" style="width: 120px" sortable>
          <template #body="{ data }">{{ labelOf(serviceBillingModeOptions, data.billingMode) }}</template>
        </Column>
        <Column header="المبلغ / السعر" style="width: 140px" sortable>
          <template #body="{ data }">
            <span v-if="data.billingMode === ServiceBillingMode.Fixed">{{ formatMoney(data.fixedAmount) }}</span>
            <span v-else>{{ formatMoney(data.unitPrice) }} / {{ data.unitOfMeasure || 'وحدة' }}</span>
          </template>
        </Column>
        <Column header="الأشهر" style="min-width: 160px">
          <template #body="{ data }">{{ monthsLabel(data) }}</template>
        </Column>
        <Column header="طريقة الحساب" style="width: 140px" sortable>
          <template #body="{ data }">
            {{ data.billingMode === ServiceBillingMode.Metered ? labelOf(meterReadingSourceOptions, data.readingSource) : '—' }}
          </template>
        </Column>
        <Column header="الحالة" style="width: 90px" sortable>
          <template #body="{ data }">{{ data.isActive ? 'نشطة' : 'متوقفة' }}</template>
        </Column>
        <Column header="المجمع" sortable>
          <template #body="{ data }">{{ complexMap[data.complexId] || '—' }}</template>
        </Column>
        <Column header="إجراءات" style="width: 130px">
          <template #body="{ data }">
            <RowActions @edit="openEdit(data)" @remove="remove(data)" />
          </template>
        </Column>
        <template #empty><div class="empty-box">لا توجد خدمات بعد</div></template>
      </DataTable>
      </template>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? `تعديل ${pageTitle}` : addButtonLabel"
      :style="{ width: 'min(640px, 96vw)' }"
    >
      <div class="form-grid">
        <div v-if="!isServiceLocked" class="field">
          <label>التصنيف</label>
          <Select
            v-model="form.name"
            :options="serviceTypeNameOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
          />
        </div>
        <div v-else class="field">
          <label>الخدمة</label>
          <div class="locked-box">{{ labelOf(serviceTypeNameOptions, form.name) }}</div>
        </div>
        <div class="field">
          <label>اسم الخدمة</label>
          <InputText v-model="form.displayName" />
        </div>
        <div v-if="!isServiceLocked" class="field">
          <label>نوع الفوترة</label>
          <Select
            v-model="form.billingMode"
            :options="serviceBillingModeOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
          />
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
          />
        </div>
        <div v-if="!isMetered" class="field">
          <label>المبلغ الثابت</label>
          <InputNumber v-model="form.fixedAmount" :min="0" />
        </div>
        <template v-else>
          <div class="field">
            <label>{{ unitPriceFieldLabel }}</label>
            <InputNumber v-model="form.unitPrice" :min="0" :max-fraction-digits="4" />
          </div>
          <div class="field">
            <label>وحدة القياس</label>
            <InputText v-model="form.unitOfMeasure" placeholder="واط / لتر / م³" />
          </div>
          <div class="field">
            <label>طريقة الحساب</label>
            <Select
              v-model="form.readingSource"
              :options="meterReadingSourceOptions"
              option-label="label"
              option-value="value"
              checkmark
              append-to="body"
            />
          </div>
        </template>
        <div class="field full">
          <label>أشهر تطبيق التسعيرة</label>
          <div class="months-actions">
            <Button
              type="button"
              size="small"
              :outlined="!allMonthsSelected"
              :severity="allMonthsSelected ? undefined : 'secondary'"
              label="كل الأشهر"
              @click="selectAllMonths"
            />
            <Button
              type="button"
              size="small"
              severity="secondary"
              outlined
              label="مسح"
              @click="clearMonths"
            />
          </div>
          <MultiSelect
            v-model="selectedMonths"
            :options="monthOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الأشهر"
            display="chip"
            filter
            append-to="body"
            class="w-full"
          />
          <small class="field-hint">يمكن اختيار شهر واحد أو أكثر، أو «كل الأشهر».</small>
        </div>
        <div class="field checkbox-field">
          <Checkbox v-model="form.isActive" :binary="true" input-id="svc-active" />
          <label for="svc-active">خدمة نشطة</label>
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
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 14px;
}
.field.full {
  grid-column: 1 / -1;
}
.checkbox-field {
  display: flex;
  align-items: center;
  gap: 8px;
}
.months-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.field-hint {
  color: var(--muted, #64748b);
  font-size: 0.82rem;
  margin-top: 4px;
}
.w-full {
  width: 100%;
}
.locked-box {
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #f8fafc;
  font-weight: 700;
}
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
