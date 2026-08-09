<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, CreateReservationDto, Customer, Reservation, Unit } from '@/types'
import { ReservationStatus } from '@/types'
import {
  createReservation,
  deleteReservation,
  getReservations,
  updateReservation,
  type ReservationParams,
} from '@/api/reservations'
import { getComplexes } from '@/api/complexes'
import { getCustomers } from '@/api/customers'
import { getUnits } from '@/api/units'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatDate,
  formatMoney,
  labelOf,
  reservationStatusOptions,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'
import TableSkeleton from '@/components/skeletons/TableSkeleton.vue'

const notify = useNotify()
const { ask } = useConfirmAction()
const complexes = ref<Complex[]>([])
const customers = ref<Customer[]>([])
const units = ref<Unit[]>([])
const complexMap = ref<Record<string, string>>({})
const customerMap = ref<Record<string, string>>({})
const unitMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, onLazyPage,
} = usePagedList<Reservation, ReservationParams>(getReservations)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const statusFilter = ref<number | null>(null)
const reservationDateModel = ref<Date | null>(null)
const expireDateModel = ref<Date | null>(null)

const form = reactive<CreateReservationDto>({
  reservationDate: new Date().toISOString(),
  reservationAmount: 0,
  expireDate: new Date().toISOString(),
  status: ReservationStatus.Pending,
  unitId: '',
  customerId: '',
  complexId: '',
})

const filteredUnits = computed(() =>
  form.complexId ? units.value.filter((u) => u.complexId === form.complexId) : units.value,
)
const filteredCustomers = computed(() =>
  form.complexId ? customers.value.filter((c) => c.complexId === form.complexId) : customers.value,
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
  asSelectOptions(filteredUnits.value, (u) => u.unitNumber || u.id),
)

async function loadLookups() {
  const [complexResult, customerResult, unitResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getCustomers({ Page: 1, PageSize: 500 }),
    getUnits({ Page: 1, PageSize: 500 }),
  ])
  complexes.value = complexResult.items ?? []
  customers.value = customerResult.items ?? []
  units.value = unitResult.items ?? []
  complexMap.value = Object.fromEntries(
    complexes.value.map((c) => [c.id, c.nameAr || c.name || c.id]),
  )
  customerMap.value = Object.fromEntries(
    customers.value.map((c) => [c.id, [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id]),
  )
  unitMap.value = Object.fromEntries(units.value.map((u) => [u.id, u.unitNumber || u.id]))
}

function openCreate() {
  editingId.value = null
  reservationDateModel.value = new Date()
  expireDateModel.value = new Date()
  Object.assign(form, {
    reservationDate: new Date().toISOString(),
    reservationAmount: 0,
    expireDate: new Date().toISOString(),
    status: ReservationStatus.Pending,
    unitId: '',
    customerId: '',
    complexId: complexFilter.value || complexes.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Reservation) {
  editingId.value = row.id
  reservationDateModel.value = row.reservationDate ? new Date(row.reservationDate) : null
  expireDateModel.value = row.expireDate ? new Date(row.expireDate) : null
  Object.assign(form, {
    reservationDate: row.reservationDate,
    reservationAmount: row.reservationAmount,
    expireDate: row.expireDate,
    status: row.status,
    unitId: row.unitId,
    customerId: row.customerId,
    complexId: row.complexId,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.complexId || !form.customerId || !form.unitId) {
    notify.warning('أكمل بيانات المجمع والعميل والوحدة')
    return
  }
  if (!reservationDateModel.value || !expireDateModel.value) {
    notify.warning('حدد تواريخ الحجز والانتهاء')
    return
  }
  form.reservationDate = reservationDateModel.value.toISOString()
  form.expireDate = expireDateModel.value.toISOString()
  saving.value = true
  try {
    if (editingId.value) {
      await updateReservation(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createReservation({ ...form })
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

async function remove(row: Reservation) {
  if (!(await ask('حذف الحجز؟'))) return
  try {
    await deleteReservation(row.id)
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
    <PageHeader title="الحجوزات" subtitle="إدارة حجوزات الوحدات">
      <template #actions>
        <Button label="إضافة حجز" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث..." @search="onSearch">
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
            v-model="statusFilter"
            :options="reservationStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="كل الحالات"
            show-clear
            @update:model-value="(v: number | null) => setFilter('Status', v ?? undefined)"
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
        <Column header="تاريخ الحجز" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.reservationDate) }}</template>
        </Column>
        <Column header="المبلغ" style="width: 120px">
          <template #body="{ data }">{{ formatMoney(data.reservationAmount) }}</template>
        </Column>
        <Column header="الانتهاء" style="width: 120px">
          <template #body="{ data }">{{ formatDate(data.expireDate) }}</template>
        </Column>
        <Column header="الحالة" style="width: 110px">
          <template #body="{ data }">{{ labelOf(reservationStatusOptions, data.status) }}</template>
        </Column>
        <Column header="العميل">
          <template #body="{ data }">{{ customerMap[data.customerId] || data.customerId.slice(0, 8) }}</template>
        </Column>
        <Column header="الوحدة" style="width: 100px">
          <template #body="{ data }">{{ unitMap[data.unitId] || data.unitId.slice(0, 8) }}</template>
        </Column>
        <Column header="المجمع">
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
      :header="editingId ? 'تعديل حجز' : 'إضافة حجز'"
      :style="{ width: '560px' }"
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
            @update:model-value="() => { form.customerId = ''; form.unitId = '' }"
          />
        </div>
        <div class="field">
          <label>الحالة</label>
          <Select
            v-model="form.status"
            :options="reservationStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الحالة"
            checkmark
            append-to="body"
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
          <label>تاريخ الحجز</label>
          <DatePicker v-model="reservationDateModel" date-format="yy-mm-dd" show-icon />
        </div>
        <div class="field">
          <label>تاريخ الانتهاء</label>
          <DatePicker v-model="expireDateModel" date-format="yy-mm-dd" show-icon />
        </div>
        <div class="field">
          <label>مبلغ الحجز</label>
          <InputNumber v-model="form.reservationAmount" :min="0" />
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
