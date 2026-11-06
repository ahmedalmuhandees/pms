<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import RememberedInput from '@/components/RememberedInput.vue'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { CreateVisitorDto, Customer, Resident, Visitor } from '@/types'
import {
  createVisitor,
  deleteVisitor,
  getVisitors,
  updateVisitor,
  type VisitorParams,
} from '@/api/visitors'
import { getResidents } from '@/api/residents'
import { getCustomers } from '@/api/customers'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { formatDate } from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import TableSortCaption from '@/components/TableSortCaption.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const residents = ref<Resident[]>([])
const residentOptions = ref<{ id: string; label: string }[]>([])
const residentFilter = ref<string | null>(null)
const visitDateModel = ref<Date | null>(null)

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort,
  sortField,
  sortOrder,
  sortMode, onLazyPage,
} = usePagedList<Visitor, VisitorParams>(getVisitors)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)

const form = reactive<CreateVisitorDto>({
  visitorName: '',
  phone: '',
  visitDate: new Date().toISOString(),
  entryTime: '09:00:00',
  exitTime: null,
  residentId: '',
})

async function loadResidents() {
  const [residentResult, customerResult] = await Promise.all([
    getResidents({ Page: 1, PageSize: 500 }),
    getCustomers({ Page: 1, PageSize: 500 }),
  ])
  residents.value = residentResult.items ?? []
  const customers = customerResult.items ?? []
  const customerMap = Object.fromEntries(
    customers.map((c: Customer) => [c.id, [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id]),
  )
  residentOptions.value = residents.value.map((r) => ({
    id: r.id,
    label: `${customerMap[r.customerId] || r.customerId.slice(0, 8)} · ${r.id.slice(0, 8)}`,
  }))
}

function residentLabel(id: string) {
  return residentOptions.value.find((r) => r.id === id)?.label || id.slice(0, 8)
}

function openCreate() {
  editingId.value = null
  visitDateModel.value = new Date()
  Object.assign(form, {
    visitorName: '',
    phone: '',
    visitDate: new Date().toISOString(),
    entryTime: '09:00:00',
    exitTime: null,
    residentId: residentFilter.value || residents.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Visitor) {
  editingId.value = row.id
  visitDateModel.value = row.visitDate ? new Date(row.visitDate) : null
  Object.assign(form, {
    visitorName: row.visitorName,
    phone: row.phone,
    visitDate: row.visitDate,
    entryTime: row.entryTime,
    exitTime: row.exitTime,
    residentId: row.residentId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.residentId) {
    notify.warning('اختر المقيم')
    return
  }
  if (!visitDateModel.value) {
    notify.warning('حدد تاريخ الزيارة')
    return
  }
  form.visitDate = visitDateModel.value.toISOString()
  saving.value = true
  try {
    if (editingId.value) {
      await updateVisitor(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createVisitor({ ...form })
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

async function remove(row: Visitor) {
  if (!(await ask(`حذف الزائر "${row.visitorName || ''}"؟`))) return
  try {
    await deleteVisitor(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

onMounted(async () => {
  try {
    await loadResidents()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="الزوار" subtitle="تسجيل زيارات المقيمين وأوقات الدخول والخروج">
      <template #actions>
        <Button
          label="مسح التصاريح"
          icon="pi pi-qrcode"
          severity="secondary"
          outlined
          @click="$router.push('/visitor-scan')"
        />
        <Button label="إضافة زائر" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث باسم الزائر أو الهاتف..." @search="onSearch"
        v-model:sort-mode="sortMode"
        @sort-change="setSortMode">
        <template #filters>
          <Select
            v-model="residentFilter"
            :options="residentOptions"
            option-label="label"
            option-value="id"
            placeholder="كل المقيمين"
            show-clear
            filter
            @update:model-value="(v: string | null) => setFilter('ResidentId', v || undefined)"
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
        <Column field="visitorName" header="اسم الزائر"  sortable />
        <Column field="phone" header="الهاتف" style="width: 130px"  sortable />
        <Column field="visitReason" header="السبب" style="width: 140px" />
        <Column header="الصلاحية" style="width: 130px">
          <template #body="{ data }">{{ data.validUntil ? formatDate(data.validUntil) : '—' }}</template>
        </Column>
        <Column header="الحالة" style="width: 110px">
          <template #body="{ data }">
            {{ data.isUsed ? 'مستخدم' : 'ساري' }}
          </template>
        </Column>
        <Column header="تاريخ الزيارة" style="width: 130px" sortable>
          <template #body="{ data }">{{ formatDate(data.visitDate) }}</template>
        </Column>
        <Column field="entryTime" header="دخول" style="width: 110px"  sortable />
        <Column header="المقيم" sortable>
          <template #body="{ data }">{{ residentLabel(data.residentId) }}</template>
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
      :header="editingId ? 'تعديل زائر' : 'إضافة زائر'"
      :style="{ width: '560px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>اسم الزائر</label>
          <RememberedInput v-model="form.visitorName" memory-key="visitor.name" />
        </div>
        <div class="field">
          <label>الهاتف</label>
          <RememberedInput v-model="form.phone" memory-key="visitor.phone" />
        </div>
        <div class="field">
          <label>تاريخ الزيارة</label>
          <DatePicker v-model="visitDateModel" date-format="yy-mm-dd" show-icon />
        </div>
        <div class="field">
          <label>وقت الدخول</label>
          <RememberedInput v-model="form.entryTime" memory-key="visitor.entryTime" placeholder="09:00:00" />
        </div>
        <div class="field">
          <label>وقت الخروج</label>
          <RememberedInput
            v-model="form.exitTime"
            memory-key="visitor.exitTime"
            placeholder="اختياري مثل 11:30:00"
          />
        </div>
        <div class="field">
          <label>المقيم</label>
          <Select
            v-model="form.residentId"
            :options="residentOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر المقيم"
            checkmark
            append-to="body"
            filter
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
