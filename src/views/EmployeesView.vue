<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import RememberedInput from '@/components/RememberedInput.vue'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
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
import { useAuthStore } from '@/stores/auth'
import { asSelectOptions } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import TableSortCaption from '@/components/TableSortCaption.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'
import PagePermissionsPicker from '@/components/PagePermissionsPicker.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const auth = useAuthStore()
const complexes = ref<Complex[]>([])
const complexMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort,
  sortField,
  sortOrder,
  sortMode, onLazyPage,
} = usePagedList<Employee, EmployeeParams>(getEmployees)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(auth.scopedComplexId)
const enableLogin = ref(false)

const emptyForm = (): CreateEmployeeDto => ({
  name: '',
  department: '',
  position: '',
  phone: '',
  email: '',
  username: '',
  password: '',
  complexId: '',
  roleName: '',
  pageKeys: [],
})

const form = reactive<CreateEmployeeDto>(emptyForm())

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

const managerPages = computed(() => auth.pages)

const showPermissions = computed(() => enableLogin.value)

async function loadComplexes() {
  const result = await getComplexes({ Page: 1, PageSize: 200 })
  complexes.value = result.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
}

function openCreate() {
  editingId.value = null
  enableLogin.value = false
  Object.assign(form, emptyForm(), {
    complexId: auth.scopedComplexId || complexFilter.value || complexes.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Employee) {
  editingId.value = row.id
  enableLogin.value = Boolean(row.hasLogin || row.userId)
  Object.assign(form, {
    name: row.name,
    department: row.department,
    position: row.position,
    phone: row.phone,
    email: row.email,
    username: row.username,
    password: '',
    complexId: row.complexId,
    roleName: row.roleName || '',
    pageKeys: [...(row.pageKeys || [])],
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.complexId) {
    notify.warning('اختر المجمع')
    return
  }

  if (enableLogin.value) {
    if (!form.username?.trim()) {
      notify.warning('أدخل اسم المستخدم للدخول')
      return
    }
    if (!editingId.value && !form.password) {
      notify.warning('أدخل كلمة المرور للدخول')
      return
    }
    if (!form.roleName?.trim()) {
      notify.warning('أدخل اسم الصلاحية')
      return
    }
    if (!form.pageKeys?.length) {
      notify.warning('اختر صفحة واحدةحدة على الأقل من صفحاتك')
      return
    }
    const illegal = (form.pageKeys || []).filter((p) => !managerPages.value.includes(p))
    if (illegal.length && !auth.isSuperAdmin) {
      notify.warning('لا يمكن منح صفحات خارج صلاحياتك')
      return
    }
  }

  saving.value = true
  try {
    const payload: CreateEmployeeDto = {
      ...form,
      roleName: enableLogin.value ? form.roleName : null,
      pageKeys: enableLogin.value ? form.pageKeys : null,
      username: enableLogin.value ? form.username : form.username || null,
    }
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
    await auth.refreshMe()
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
      <FilterBar v-model:search="search" placeholder="ابحث بالاسم أو الهاتف أو البريد..." @search="onSearch"
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
        <Column field="department" header="القسم"  sortable />
        <Column field="position" header="المنصب"  sortable />
        <Column field="phone" header="الهاتف" style="width: 130px"  sortable />
        <Column field="email" header="البريد"  sortable />
        <Column header="الدخول" style="width: 100px" sortable>
          <template #body="{ data }">
            <Tag
              :value="data.hasLogin ? 'نعم' : 'لا'"
              :severity="data.hasLogin ? 'success' : 'secondary'"
            />
          </template>
        </Column>
        <Column header="الصلاحية" style="width: 140px" sortable>
          <template #body="{ data }">
            {{ data.roleName || '—' }}
            <small v-if="data.pageKeys?.length" class="pages-count">({{ data.pageKeys.length }})</small>
          </template>
        </Column>
        <Column header="المجمع" style="width: 160px" sortable>
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
      :header="editingId ? 'تعديل موظف' : 'إضافة موظف'"
      :style="{ width: '720px' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>الاسم</label>
          <RememberedInput v-model="form.name" memory-key="employee.name" />
        </div>
        <div class="field">
          <label>القسم</label>
          <RememberedInput v-model="form.department" memory-key="employee.department" />
        </div>
        <div class="field">
          <label>المنصب</label>
          <RememberedInput v-model="form.position" memory-key="employee.position" />
        </div>
        <div class="field">
          <label>الهاتف</label>
          <RememberedInput v-model="form.phone" memory-key="employee.phone" />
        </div>
        <div class="field">
          <label>البريد</label>
          <RememberedInput v-model="form.email" memory-key="employee.email" type="email" />
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

        <div class="field full login-toggle">
          <label class="toggle-row">
            <input v-model="enableLogin" type="checkbox" />
            منح دخول للنظام (اسم مستخدم + صلاحيات صفحات)
          </label>
        </div>

        <template v-if="enableLogin || showPermissions">
          <div class="field">
            <label>اسم المستخدم</label>
            <RememberedInput v-model="form.username" memory-key="employee.username" />
          </div>
          <div class="field">
            <label>{{ editingId ? 'كلمة المرور (اختياري)' : 'كلمة المرور' }}</label>
            <Password v-model="form.password" :feedback="false" toggle-mask class="w-full" input-class="w-full" />
          </div>
          <div class="field full">
            <PagePermissionsPicker
              v-model:role-name="form.roleName"
              v-model:page-keys="form.pageKeys"
              :allowed-keys="managerPages"
              :show-all-when-empty="auth.isSuperAdmin"
            />
          </div>
        </template>
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
.pages-count {
  display: block;
  color: var(--muted, #6b7280);
  font-size: 0.75rem;
}
.login-toggle {
  padding-top: 4px;
}
.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  cursor: pointer;
}
:deep(.p-password),
:deep(.p-password-input) { width: 100%; }
</style>
