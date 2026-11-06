<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import RememberedInput from '@/components/RememberedInput.vue'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import Textarea from 'primevue/textarea'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, CreateCustomerDto, Customer } from '@/types'
import { EducationLevel, MaritalStatus } from '@/types'
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
  type CustomerParams,
} from '@/api/customers'
import { getComplexes } from '@/api/complexes'
import { sendWhatsAppTemplate, WhatsAppTemplateType, whatsAppTemplateOptions } from '@/api/whatsapp'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions, educationLevelOptions, formatDate, formatMoney, labelOf, maritalStatusOptions } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import TableSortCaption from '@/components/TableSortCaption.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const notify = useNotify()
const { ask } = useConfirmAction()
const router = useRouter()
const complexes = ref<Complex[]>([])

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
  setSortMode,
  onTableSort,
  sortField,
  sortOrder,
    sortMode,
  onLazyPage,
} = usePagedList<Customer, CustomerParams>(getCustomers)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(auth.scopedComplexId)
const hasContractsFilter = ref<boolean | null>(null)
const filterWithContracts = ref(false)
const filterWithoutContracts = ref(false)
const birthDateModel = ref<Date | null>(null)

const testWaVisible = ref(false)
const testWaSending = ref(false)
const testWaCustomer = ref<Customer | null>(null)
const testWaTemplateType = ref<WhatsAppTemplateType>(WhatsAppTemplateType.InstallmentReminder)

const emptyForm = (): CreateCustomerDto => ({
  firstName: '',
  lastName: '',
  nationalID: '',
  passport: '',
  birthDate: null,
  phone: '',
  email: '',
  address: '',
  occupation: '',
  employer: '',
  monthlyIncome: null,
  maritalStatus: MaritalStatus.None,
  educationLevel: EducationLevel.NoCertificate,
  notes: '',
  complexId: '',
})

const form = reactive<CreateCustomerDto>(emptyForm())

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

async function loadComplexes() {
  const result = await getComplexes({ Page: 1, PageSize: 200 })
  complexes.value = result.items ?? []
}

function resetForm() {
  editingId.value = null
  birthDateModel.value = null
  Object.assign(form, emptyForm(), {
    complexId: auth.scopedComplexId || complexFilter.value || complexes.value[0]?.id || '',
  })
}

function openCreate() {
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: Customer) {
  editingId.value = row.id
  Object.assign(form, {
    firstName: row.firstName,
    lastName: row.lastName,
    nationalID: row.nationalID,
    passport: row.passport,
    birthDate: row.birthDate,
    phone: row.phone,
    email: row.email,
    address: row.address,
    occupation: row.occupation,
    employer: row.employer,
    monthlyIncome: row.monthlyIncome,
    maritalStatus: row.maritalStatus,
    educationLevel: row.educationLevel ?? EducationLevel.NoCertificate,
    notes: row.notes ?? '',
    complexId: row.complexId,
  })
  birthDateModel.value = row.birthDate ? new Date(row.birthDate) : null
  dialogVisible.value = true
}

function openProfile(row: Customer) {
  router.push({ name: 'customer-detail', params: { id: row.id } })
}

function openTestWhatsApp(row: Customer) {
  if (!row.phone) {
    notify.warning('لا يوجد رقم هاتف لهذا العميل')
    return
  }
  testWaCustomer.value = row
  testWaTemplateType.value = WhatsAppTemplateType.InstallmentReminder
  testWaVisible.value = true
}

async function sendTestWhatsApp() {
  if (!testWaCustomer.value) return
  testWaSending.value = true
  try {
    await sendWhatsAppTemplate({
      templateType: testWaTemplateType.value,
      customerId: testWaCustomer.value.id,
      complexId: testWaCustomer.value.complexId,
    })
    notify.success('تم إرسال رسالة واتساب')
    testWaVisible.value = false
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    testWaSending.value = false
  }
}

async function save() {
  if (!form.complexId) {
    notify.warning('اختر المجمع')
    return
  }
  form.birthDate = birthDateModel.value ? birthDateModel.value.toISOString() : null
  saving.value = true
  try {
    if (editingId.value) {
      await updateCustomer(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createCustomer({ ...form })
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

async function remove(row: Customer) {
  const name = [row.firstName, row.lastName].filter(Boolean).join(' ')
  const ok = await ask(`حذف العميل "${name}"؟`)
  if (!ok) return
  try {
    await deleteCustomer(row.id)
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

function applyContractsFilter() {
  if (filterWithContracts.value && !filterWithoutContracts.value) {
    hasContractsFilter.value = true
    setFilter('HasContracts', true)
  } else if (!filterWithContracts.value && filterWithoutContracts.value) {
    hasContractsFilter.value = false
    setFilter('HasContracts', false)
  } else {
    hasContractsFilter.value = null
    setFilter('HasContracts', undefined)
  }
}

function onWithContractsChange(value: boolean) {
  filterWithContracts.value = value
  if (value) filterWithoutContracts.value = false
  applyContractsFilter()
}

function onWithoutContractsChange(value: boolean) {
  filterWithoutContracts.value = value
  if (value) filterWithContracts.value = false
  applyContractsFilter()
}

onMounted(async () => {
  try {
    await loadComplexes()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="العملاء" subtitle="إدارة بيانات العملاء والمعلومات الشخصية">
      <template #actions>
        <Button label="إضافة عميل" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar
        v-model:search="search"
        v-model:sort-mode="sortMode"
        @sort-change="setSortMode"
        placeholder="ابحث بالاسم أو الهاتف أو البريد..."
        @search="onSearch"
      >
        <template #filters>
          <Select
            v-if="auth.canSelectComplex"
            v-model="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="فلتر بالمجمع"
            show-clear
            style="min-width: 200px"
            @update:model-value="onComplexFilter"
          />
          <div class="contracts-filter">
            <div class="contracts-filter__item">
              <Checkbox
                :model-value="filterWithContracts"
                binary
                input-id="filterWithContracts"
                @update:model-value="onWithContractsChange"
              />
              <label for="filterWithContracts">عقود</label>
            </div>
            <div class="contracts-filter__item">
              <Checkbox
                :model-value="filterWithoutContracts"
                binary
                input-id="filterWithoutContracts"
                @update:model-value="onWithoutContractsChange"
              />
              <label for="filterWithoutContracts">بدون عقود</label>
            </div>
          </div>
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="7" />
      <div v-else class="table-wrap">
        <TableSortCaption :sort-mode="sortMode" />
        <DataTable
          :value="items"
          :loading="loading"
          :paginator="true"
          lazy
          :rows="pageSize"
          :total-records="total"
          :first="(page - 1) * pageSize"
          :rows-per-page-options="[10, 20, 50]"
          paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          current-page-report-template="{first} إلى {last} من {totalRecords}"
          striped-rows
          size="small"
          @page="onLazyPage"
        
          sort-mode="single"
          :sort-field="sortField"
          :sort-order="sortOrder"
          removable-sort
          @sort="onTableSort">
          <Column header="الاسم" sortable>
            <template #body="{ data }">
              {{ [data.firstName, data.lastName].filter(Boolean).join(' ') || '—' }}
            </template>
          </Column>
          <Column field="phone" header="الهاتف" style="width: 130px"  sortable />
          <Column field="email" header="البريد"  sortable />
          <Column header="الحالة الاجتماعية" style="width: 140px" sortable>
            <template #body="{ data }">
              {{ labelOf(maritalStatusOptions, data.maritalStatus) }}
            </template>
          </Column>
          <Column header="التحصيل الدراسي" style="width: 160px" sortable>
            <template #body="{ data }">
              {{ labelOf(educationLevelOptions, data.educationLevel) }}
            </template>
          </Column>
          <Column header="الدخل" style="width: 120px" sortable>
            <template #body="{ data }">{{ formatMoney(data.monthlyIncome) }}</template>
          </Column>
          <Column header="الميلاد" style="width: 120px" sortable>
            <template #body="{ data }">{{ formatDate(data.birthDate) }}</template>
          </Column>
          <Column header="إجراءات" style="width: 210px">
            <template #body="{ data }">
              <div class="row-actions-wrap">
                <Button
                  icon="pi pi-whatsapp"
                  severity="success"
                  text
                  rounded
                  v-tooltip.top="'إرسال واتساب'"
                  @click="openTestWhatsApp(data)"
                />
                <RowActions
                  show-details
                  @details="openProfile(data)"
                  @edit="openEdit(data)"
                  @remove="remove(data)"
                />
              </div>
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
      :header="editingId ? 'تعديل عميل' : 'إضافة عميل'"
      :style="{ width: '720px' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>الاسم الأول</label>
          <RememberedInput v-model="form.firstName" memory-key="customer.firstName" />
        </div>
        <div class="field">
          <label>اسم العائلة</label>
          <RememberedInput v-model="form.lastName" memory-key="customer.lastName" />
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
        <div class="field">
          <label>الحالة الاجتماعية</label>
          <Select
            v-model="form.maritalStatus"
            :options="maritalStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الحالة"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>الهاتف</label>
          <RememberedInput v-model="form.phone" memory-key="customer.phone" />
        </div>
        <div class="field">
          <label>البريد</label>
          <RememberedInput v-model="form.email" memory-key="customer.email" type="email" />
        </div>
        <div class="field">
          <label>الرقم الوطني</label>
          <RememberedInput v-model="form.nationalID" memory-key="customer.nationalID" />
        </div>
        <div class="field">
          <label>جواز السفر</label>
          <RememberedInput v-model="form.passport" memory-key="customer.passport" />
        </div>
        <div class="field">
          <label>تاريخ الميلاد</label>
          <DatePicker v-model="birthDateModel" date-format="yy/mm/dd" show-icon />
        </div>
        <div class="field">
          <label>الدخل الشهري</label>
          <InputNumber v-model="form.monthlyIncome" :min="0" />
        </div>
        <div class="field">
          <label>المهنة</label>
          <RememberedInput v-model="form.occupation" memory-key="customer.occupation" />
        </div>
        <div class="field">
          <label>جهة العمل</label>
          <RememberedInput v-model="form.employer" memory-key="customer.employer" />
        </div>
        <div class="field full">
          <label>العنوان</label>
          <RememberedInput v-model="form.address" memory-key="customer.address" />
        </div>
        <div class="field full">
          <label>التحصيل الدراسي</label>
          <Select
            v-model="form.educationLevel"
            :options="educationLevelOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر التحصيل الدراسي"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field full">
          <label>الملاحظات</label>
          <Textarea v-model="form.notes" rows="3" auto-resize placeholder="ملاحظات عن العميل (اختياري)" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="حفظ التغييرات" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="testWaVisible"
      modal
      header="إرسال رسالة واتساب"
      :style="{ width: '480px' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <div class="form-grid">
        <div class="field full">
          <label>العميل</label>
          <InputText
            :model-value="[testWaCustomer?.firstName, testWaCustomer?.lastName].filter(Boolean).join(' ')"
            disabled
          />
        </div>
        <div class="field full">
          <label>رقم الهاتف</label>
          <InputText :model-value="testWaCustomer?.phone || ''" disabled dir="ltr" />
        </div>
        <div class="field full">
          <label>نوع الرسالة</label>
          <Select
            v-model="testWaTemplateType"
            :options="whatsAppTemplateOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الإجراء"
            checkmark
            append-to="body"
          />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="testWaVisible = false" />
          <Button
            label="إرسال"
            icon="pi pi-whatsapp"
            severity="success"
            :loading="testWaSending"
            @click="sendTestWhatsApp"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.contracts-filter {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 4px;
}
.contracts-filter__item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--text-strong);
}
.row-actions-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
</style>
