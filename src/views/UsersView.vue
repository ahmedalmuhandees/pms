<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, CreateUserDto, User } from '@/types'
import { createUser, deleteUser, getUsers, updateUser } from '@/api/users'
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

const {
  items, loading, page, pageSize, total, search, load, onSearch, onLazyPage,
} = usePagedList(getUsers)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)

const emptyForm = (): CreateUserDto => ({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  complexId: null,
  rolesId: null,
})

const form = reactive<CreateUserDto>(emptyForm())

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

async function loadComplexes() {
  const result = await getComplexes({ Page: 1, PageSize: 200 })
  complexes.value = result.items ?? []
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

function openEdit(row: User) {
  editingId.value = row.id
  Object.assign(form, {
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    password: '',
    phone: row.phone,
    address: row.address,
    complexId: row.complexId,
    rolesId: row.rolesId,
  })
  dialogVisible.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form }
    if (editingId.value && !payload.password) payload.password = null
    if (editingId.value) {
      await updateUser(editingId.value, payload)
      notify.success('تم التحديث')
    } else {
      await createUser(payload)
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

async function remove(row: User) {
  const name = [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email
  if (!(await ask(`حذف المستخدم "${name}"؟`))) return
  try {
    await deleteUser(row.id)
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
    <PageHeader title="المستخدمون" subtitle="إدارة حسابات وصلاحيات مستخدمي النظام">
      <template #actions>
        <Button label="إضافة مستخدم" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar
        v-model:search="search"
        placeholder="ابحث بالاسم أو البريد أو الهاتف..."
        @search="onSearch"
      />

      <TableSkeleton v-if="loading && items.length === 0" :rows="8" :columns="5" />
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
        <Column header="الاسم">
          <template #body="{ data }">
            {{ [data.firstName, data.lastName].filter(Boolean).join(' ') || '—' }}
          </template>
        </Column>
        <Column field="email" header="البريد" />
        <Column field="phone" header="الهاتف" style="width: 130px" />
        <Column field="roleName" header="الدور" style="width: 120px" />
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
      :header="editingId ? 'تعديل مستخدم' : 'إضافة مستخدم'"
      :style="{ width: '560px' }"
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
          <label>البريد</label>
          <InputText v-model="form.email" />
        </div>
        <div class="field">
          <label>{{ editingId ? 'كلمة المرور (اختياري)' : 'كلمة المرور' }}</label>
          <Password v-model="form.password" :feedback="false" toggle-mask class="w-full" input-class="w-full" />
        </div>
        <div class="field">
          <label>الهاتف</label>
          <InputText v-model="form.phone" />
        </div>
        <div class="field">
          <label>المجمع</label>
          <Select
            v-model="form.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="اختياري"
            show-clear
            checkmark
            append-to="body"
          />
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

<style scoped>
.w-full { width: 100%; }
:deep(.p-password),
:deep(.p-password-input) { width: 100%; }
</style>
