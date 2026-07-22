<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, CreateEmployeeDto, Employee } from '@/types'
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
  type EmployeeParams,
} from '@/api/employees'
import { getComplexes } from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const complexMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<Employee, EmployeeParams>(getEmployees)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)

const emptyForm = (): CreateEmployeeDto => ({
  name: '',
  department: '',
  position: '',
  phone: '',
  email: '',
  username: '',
  password: '',
  complexId: '',
})

const form = reactive<CreateEmployeeDto>(emptyForm())

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
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
  Object.assign(form, emptyForm(), {
    complexId: complexFilter.value || complexes.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Employee) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    department: row.department,
    position: row.position,
    phone: row.phone,
    email: row.email,
    username: row.username,
    password: '',
    complexId: row.complexId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.complexId) {
    notify.warning('اختر المجمع')
    return
  }
  saving.value = true
  try {
    const payload = { ...form }
    if (editingId.value && !payload.password) payload.password = null
    if (editingId.value) {
      await updateEmployee(editingId.value, payload)
      notify.success('تم التحديث')
    } else {
      await createEmployee(payload)
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

async function remove(row: Employee) {
  if (!(await ask(`حذف الموظف "${row.name || ''}"؟`))) return
  try {
    await deleteEmployee(row.id)
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
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="الموظفون" subtitle="إدارة موظفي التشغيل والإدارة">
      <template #actions>
        <Button label="إضافة موظف" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث بالاسم أو الهاتف أو البريد..." @search="onSearch">
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

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="7" />
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
        <Column field="department" header="القسم" />
        <Column field="position" header="المنصب" />
        <Column field="phone" header="الهاتف" style="width: 130px" />
        <Column field="email" header="البريد" />
        <Column header="المجمع" style="width: 160px">
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
      :header="editingId ? 'تعديل موظف' : 'إضافة موظف'"
      :style="{ width: '560px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>الاسم</label>
          <InputText v-model="form.name" />
        </div>
        <div class="field">
          <label>القسم</label>
          <InputText v-model="form.department" />
        </div>
        <div class="field">
          <label>المنصب</label>
          <InputText v-model="form.position" />
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
          <label>اسم المستخدم</label>
          <InputText v-model="form.username" />
        </div>
        <div class="field">
          <label>{{ editingId ? 'كلمة المرور (اختياري)' : 'كلمة المرور' }}</label>
          <Password v-model="form.password" :feedback="false" toggle-mask class="w-full" input-class="w-full" />
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

<style scoped>
.w-full { width: 100%; }
:deep(.p-password),
:deep(.p-password-input) { width: 100%; }
</style>
