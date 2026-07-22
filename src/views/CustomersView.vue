<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, CreateCustomerDto, Customer } from '@/types'
import { MaritalStatus } from '@/types'
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
  type CustomerParams,
} from '@/api/customers'
import { getComplexes } from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions, formatDate, formatMoney, labelOf, maritalStatusOptions } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
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
  onLazyPage,
} = usePagedList<Customer, CustomerParams>(getCustomers)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const birthDateModel = ref<Date | null>(null)

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
  maritalStatus: MaritalStatus.Single,
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
    complexId: complexFilter.value || complexes.value[0]?.id || '',
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
    complexId: row.complexId,
  })
  birthDateModel.value = row.birthDate ? new Date(row.birthDate) : null
  dialogVisible.value = true
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
        placeholder="ابحث بالاسم أو الهاتف أو البريد..."
        @search="onSearch"
      >
        <template #filters>
          <Select
            v-model="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="فلتر بالمجمع"
            show-clear
            style="min-width: 200px"
            @update:model-value="onComplexFilter"
          />
        </template>
      </FilterBar>

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="7" />
      <div v-else class="table-wrap">
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
        >
          <Column header="الاسم">
            <template #body="{ data }">
              {{ [data.firstName, data.lastName].filter(Boolean).join(' ') || '—' }}
            </template>
          </Column>
          <Column field="phone" header="الهاتف" style="width: 130px" />
          <Column field="email" header="البريد" />
          <Column header="الحالة الاجتماعية" style="width: 140px">
            <template #body="{ data }">
              {{ labelOf(maritalStatusOptions, data.maritalStatus) }}
            </template>
          </Column>
          <Column header="الدخل" style="width: 120px">
            <template #body="{ data }">{{ formatMoney(data.monthlyIncome) }}</template>
          </Column>
          <Column header="الميلاد" style="width: 120px">
            <template #body="{ data }">{{ formatDate(data.birthDate) }}</template>
          </Column>
          <Column header="إجراءات" style="width: 130px">
            <template #body="{ data }">
              <RowActions @edit="openEdit(data)" @remove="remove(data)" />
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
          <InputText v-model="form.firstName" />
        </div>
        <div class="field">
          <label>اسم العائلة</label>
          <InputText v-model="form.lastName" />
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
          <InputText v-model="form.phone" />
        </div>
        <div class="field">
          <label>البريد</label>
          <InputText v-model="form.email" />
        </div>
        <div class="field">
          <label>الرقم الوطني</label>
          <InputText v-model="form.nationalID" />
        </div>
        <div class="field">
          <label>جواز السفر</label>
          <InputText v-model="form.passport" />
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
          <InputText v-model="form.occupation" />
        </div>
        <div class="field">
          <label>جهة العمل</label>
          <InputText v-model="form.employer" />
        </div>
        <div class="field full">
          <label>العنوان</label>
          <InputText v-model="form.address" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="حفظ التغييرات" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
