<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type { Agent, Complex, CreateAgentDto } from '@/types'
import {
  createAgent,
  deleteAgent,
  getAgents,
  updateAgent,
  type AgentParams,
} from '@/api/agents'
import { getComplexes } from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions, formatDate } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<Agent, AgentParams>(getAgents)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const activeFilter = ref<boolean | null>(null)
const startDateModel = ref<Date | null>(null)
const endDateModel = ref<Date | null>(null)

const emptyForm = (): CreateAgentDto => ({
  name: '',
  complexId: '',
  subscriptionStartDate: new Date().toISOString(),
  subscriptionEndDate: new Date().toISOString(),
  email: '',
  password: '',
  phone: '',
  address: '',
  notes: '',
})

const form = reactive<CreateAgentDto>(emptyForm())

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

const activeOptions = [
  { id: true, label: 'نشط' },
  { id: false, label: 'منتهٍ / غير نشط' },
]

function isValidPassword(password: string) {
  return password.length >= 8 && /[A-Za-z\u0600-\u06FF]/.test(password) && /\d/.test(password)
}

async function loadComplexes() {
  const result = await getComplexes({ Page: 1, PageSize: 200 })
  complexes.value = result.items ?? []
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm(), {
    complexId: complexFilter.value || complexes.value[0]?.id || '',
  })
  startDateModel.value = new Date()
  const end = new Date()
  end.setFullYear(end.getFullYear() + 1)
  endDateModel.value = end
  dialogVisible.value = true
}

function openEdit(row: Agent) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    complexId: row.complexId,
    subscriptionStartDate: row.subscriptionStartDate,
    subscriptionEndDate: row.subscriptionEndDate,
    email: row.email,
    password: '',
    phone: row.phone,
    address: row.address,
    notes: row.notes,
  })
  startDateModel.value = row.subscriptionStartDate ? new Date(row.subscriptionStartDate) : null
  endDateModel.value = row.subscriptionEndDate ? new Date(row.subscriptionEndDate) : null
  dialogVisible.value = true
}

async function save() {
  if (!form.name.trim()) {
    notify.warning('أدخل اسم مدير المجمع')
    return
  }
  if (!form.complexId) {
    notify.warning('اختر المجمع')
    return
  }
  if (!form.email.trim()) {
    notify.warning('أدخل البريد الإلكتروني')
    return
  }
  if (!startDateModel.value || !endDateModel.value) {
    notify.warning('حدد تاريخ بداية ونهاية الاشتراك')
    return
  }
  if (endDateModel.value < startDateModel.value) {
    notify.warning('تاريخ انتهاء الاشتراك يجب أن يكون بعد تاريخ البداية')
    return
  }
  if (!editingId.value && !isValidPassword(form.password)) {
    notify.warning('كلمة السر يجب أن تكون 8 أحرف على الأقل وتحتوي حروفاً وأرقاماً')
    return
  }
  if (editingId.value && form.password && !isValidPassword(form.password)) {
    notify.warning('كلمة السر يجب أن تكون 8 أحرف على الأقل وتحتوي حروفاً وأرقاماً')
    return
  }

  form.subscriptionStartDate = startDateModel.value.toISOString()
  form.subscriptionEndDate = endDateModel.value.toISOString()

  saving.value = true
  try {
    if (editingId.value) {
      const payload = {
        name: form.name,
        complexId: form.complexId,
        subscriptionStartDate: form.subscriptionStartDate,
        subscriptionEndDate: form.subscriptionEndDate,
        email: form.email,
        phone: form.phone,
        address: form.address,
        notes: form.notes,
        password: form.password || null,
      }
      await updateAgent(editingId.value, payload)
      notify.success('تم التحديث')
    } else {
      await createAgent({ ...form })
      notify.success('تم إنشاء مدير المجمع')
    }
    dialogVisible.value = false
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function remove(row: Agent) {
  if (!(await ask(`حذف مدير المجمع "${row.name}"؟`))) return
  try {
    await deleteAgent(row.id)
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

function onActiveFilter(value: boolean | null) {
  activeFilter.value = value
  setFilter('IsActive', value === null ? undefined : value)
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
    <PageHeader title="مدراء المجمعات" subtitle="إدارة حسابات مدراء المجمعات والاشتراكات">
      <template #actions>
        <Button label="إضافة مدير مجمع" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar
        v-model:search="search"
        placeholder="ابحث بالاسم أو البريد أو الهاتف..."
        @search="onSearch"
      >
        <template #filters>
          <Select
            :model-value="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="المجمع"
            show-clear
            checkmark
            append-to="body"
            class="filter-select"
            @update:model-value="onComplexFilter"
          />
          <Select
            :model-value="activeFilter"
            :options="activeOptions"
            option-label="label"
            option-value="id"
            placeholder="حالة الاشتراك"
            show-clear
            checkmark
            append-to="body"
            class="filter-select"
            @update:model-value="onActiveFilter"
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
        <Column field="name" header="مدير المجمع" />
        <Column header="المجمع">
          <template #body="{ data }">{{ data.complexName || '—' }}</template>
        </Column>
        <Column field="email" header="البريد" />
        <Column field="phone" header="الهاتف" style="width: 120px" />
        <Column header="بداية الاشتراك" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.subscriptionStartDate) }}</template>
        </Column>
        <Column header="نهاية الاشتراك" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.subscriptionEndDate) }}</template>
        </Column>
        <Column header="الحالة" style="width: 100px">
          <template #body="{ data }">
            <Tag
              :value="data.isSubscriptionActive ? 'نشط' : 'منتهٍ'"
              :severity="data.isSubscriptionActive ? 'success' : 'danger'"
            />
          </template>
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
      :header="editingId ? 'تعديل مدير مجمع' : 'إضافة مدير مجمع'"
      :style="{ width: '640px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>اسم مدير المجمع</label>
          <InputText v-model="form.name" />
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
          <label>تاريخ بداية الاشتراك</label>
          <DatePicker v-model="startDateModel" date-format="yy-mm-dd" show-icon class="w-full" />
        </div>
        <div class="field">
          <label>تاريخ انتهاء الاشتراك</label>
          <DatePicker v-model="endDateModel" date-format="yy-mm-dd" show-icon class="w-full" />
        </div>
        <div class="field">
          <label>البريد الإلكتروني</label>
          <InputText v-model="form.email" type="email" />
        </div>
        <div class="field">
          <label>{{ editingId ? 'كلمة السر (اختياري)' : 'كلمة السر' }}</label>
          <Password
            v-model="form.password"
            :feedback="false"
            toggle-mask
            class="w-full"
            input-class="w-full"
            :placeholder="editingId ? 'اتركها فارغة للإبقاء على الحالية' : '8 أحرف وأرقام على الأقل'"
          />
        </div>
        <div class="field">
          <label>رقم الهاتف</label>
          <InputText v-model="form.phone" />
        </div>
        <div class="field">
          <label>العنوان</label>
          <InputText v-model="form.address" />
        </div>
        <div class="field full">
          <label>ملاحظات</label>
          <Textarea v-model="form.notes" rows="3" auto-resize class="w-full" />
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
.w-full { width: 100%; }
.filter-select { min-width: 160px; }
:deep(.p-password),
:deep(.p-password-input),
:deep(.p-datepicker) { width: 100%; }
</style>
