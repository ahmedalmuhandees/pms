<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex, Customer, Unit } from '@/types'
import { UnitStatus } from '@/types'
import {
  createDeposit,
  deleteDeposit,
  getDeposits,
  lookupDepositCustomerReservations,
  updateDeposit,
  type CreateDepositPayload,
  type Deposit,
  type DepositParams,
  type DepositReservationLookup,
} from '@/api/deposits'
import { getComplexes } from '@/api/complexes'
import { getCustomers } from '@/api/customers'
import { getUnits } from '@/api/units'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions, formatDate, formatMoney } from '@/utils/enums'
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
const customers = ref<Customer[]>([])
const units = ref<Unit[]>([])
const complexFilter = ref<string | null>(auth.scopedComplexId)
const customerReservations = ref<DepositReservationLookup[]>([])
const loadingReservations = ref(false)
const suppressCustomerWatch = ref(false)

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort, sortField, sortOrder, sortMode, onLazyPage,
} = usePagedList<Deposit, DepositParams>(getDeposits)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const depositDateModel = ref<Date | null>(new Date())

const form = reactive({
  complexId: '' as string,
  customerId: null as string | null,
  customerName: '' as string,
  customerPhone: '' as string,
  reservationId: null as string | null,
  unitId: null as string | null,
  unitNumber: '' as string,
  unitPrice: null as number | null,
  pricePerMeter: null as number | null,
  reservationPercent: null as number | null,
  reservationAmount: null as number | null,
  reservationDate: null as string | null,
  reservationExpireDate: null as string | null,
  amount: 0 as number,
  consultantName: '' as string,
  notes: '' as string,
})

const hasLinkedReservation = computed(() => Boolean(form.reservationId))
const isManualEntry = computed(() => !form.customerId || !hasLinkedReservation.value)

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

const filteredCustomers = computed(() =>
  form.complexId
    ? customers.value.filter((c) => c.complexId === form.complexId)
    : customers.value,
)

const customerOptions = computed(() =>
  asSelectOptions(filteredCustomers.value, (c) =>
    [[c.firstName, c.lastName].filter(Boolean).join(' '), c.phone].filter(Boolean).join(' — ') || c.id,
  ),
)

const filteredUnits = computed(() => {
  const inComplex = form.complexId
    ? units.value.filter((u) => u.complexId === form.complexId)
    : units.value
  return inComplex.filter(
    (u) => u.status === UnitStatus.Available || u.id === form.unitId,
  )
})

const unitOptions = computed(() =>
  asSelectOptions(filteredUnits.value, (u) =>
    [u.unitNumber, u.price ? formatMoney(u.price) : null].filter(Boolean).join(' — ') || u.id,
  ),
)

const reservationOptions = computed(() =>
  customerReservations.value.map((r) => ({
    id: r.id,
    label: [
      r.unitNumber ? `وحدة ${r.unitNumber}` : null,
      formatDate(r.reservationDate),
      r.reservationAmount ? formatMoney(r.reservationAmount) : null,
    ]
      .filter(Boolean)
      .join(' — '),
  })),
)

watch(complexFilter, (id) => {
  setFilter('ComplexId', id || undefined)
})

watch(
  () => form.customerId,
  async (customerId) => {
    if (suppressCustomerWatch.value) return
    customerReservations.value = []
    form.reservationId = null
    if (!customerId || !form.complexId) {
      if (!editingId.value) clearReservationFields(false)
      return
    }
    const customer = customers.value.find((c) => c.id === customerId)
    if (customer) {
      form.customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ')
      form.customerPhone = customer.phone || ''
    }
    loadingReservations.value = true
    try {
      customerReservations.value = await lookupDepositCustomerReservations(form.complexId, customerId)
      if (customerReservations.value.length === 1) {
        form.reservationId = customerReservations.value[0].id
        applyReservation(customerReservations.value[0])
      } else if (!customerReservations.value.length) {
        clearReservationFields(false)
        notify.warning('لا يوجد حجز لهذا العميل — أكمل البيانات يدوياً')
      }
    } catch (error) {
      notify.error(getErrorMessage(error))
    } finally {
      loadingReservations.value = false
    }
  },
)

watch(
  () => form.reservationId,
  (reservationId) => {
    if (!reservationId) {
      clearReservationFields(false)
      return
    }
    const reservation = customerReservations.value.find((r) => r.id === reservationId)
    if (reservation) applyReservation(reservation)
  },
)

watch(
  () => form.unitId,
  (unitId) => {
    if (!unitId || hasLinkedReservation.value) return
    const unit = units.value.find((u) => u.id === unitId)
    if (!unit) return
    form.unitNumber = unit.unitNumber || ''
    if (unit.price != null) form.unitPrice = unit.price
  },
)

function onComplexChanged() {
  form.customerId = null
  form.reservationId = null
  form.unitId = null
  customerReservations.value = []
  clearReservationFields(true)
}

function clearReservationFields(clearCustomerName: boolean) {
  form.reservationId = null
  form.unitId = null
  form.unitNumber = ''
  form.unitPrice = null
  form.pricePerMeter = null
  form.reservationPercent = null
  form.reservationAmount = null
  form.reservationDate = null
  form.reservationExpireDate = null
  if (clearCustomerName) {
    form.customerName = ''
    form.customerPhone = ''
  }
}

function applyReservation(reservation: DepositReservationLookup) {
  form.reservationId = reservation.id
  form.customerId = reservation.customerId
  form.customerName = reservation.customerName
  form.customerPhone = reservation.customerPhone || ''
  form.unitId = reservation.unitId
  form.unitNumber = reservation.unitNumber || ''
  form.unitPrice = reservation.unitPrice ?? null
  form.pricePerMeter = reservation.pricePerMeter ?? null
  form.reservationPercent = reservation.reservationPercent ?? null
  form.reservationAmount = reservation.reservationAmount
  form.reservationDate = reservation.reservationDate
  form.reservationExpireDate = reservation.expireDate
  form.consultantName = reservation.consultantName || form.consultantName
  if (!form.notes && reservation.notes) form.notes = reservation.notes
}

function syncReservationAmountFromPercent() {
  if (hasLinkedReservation.value) return
  const price = Number(form.unitPrice || 0)
  const percent = Number(form.reservationPercent || 0)
  if (price > 0 && percent > 0) {
    form.reservationAmount = Math.round((price * percent) / 100)
  }
}

async function loadLookups() {
  const [complexResult, customerResult, unitResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getCustomers({ Page: 1, PageSize: 500 }),
    getUnits({ Page: 1, PageSize: 500 }),
  ])
  complexes.value = complexResult.items ?? []
  customers.value = customerResult.items ?? []
  units.value = unitResult.items ?? []
}

function openCreate() {
  editingId.value = null
  depositDateModel.value = new Date()
  customerReservations.value = []
  Object.assign(form, {
    complexId: complexFilter.value || auth.scopedComplexId || '',
    customerId: null,
    customerName: '',
    customerPhone: '',
    reservationId: null,
    unitId: null,
    unitNumber: '',
    unitPrice: null,
    pricePerMeter: null,
    reservationPercent: null,
    reservationAmount: null,
    reservationDate: null,
    reservationExpireDate: null,
    amount: 0,
    consultantName: '',
    notes: '',
  })
  dialogVisible.value = true
}

async function openEdit(row: Deposit) {
  editingId.value = row.id
  depositDateModel.value = row.depositDate ? new Date(row.depositDate) : new Date()
  suppressCustomerWatch.value = true
  Object.assign(form, {
    complexId: row.complexId,
    customerId: row.customerId || null,
    customerName: row.customerName || '',
    customerPhone: row.customerPhone || '',
    reservationId: row.reservationId || null,
    unitId: row.unitId || null,
    unitNumber: row.unitNumber || '',
    unitPrice: row.unitPrice ?? null,
    pricePerMeter: row.pricePerMeter ?? null,
    reservationPercent: row.reservationPercent ?? null,
    reservationAmount: row.reservationAmount ?? null,
    reservationDate: row.reservationDate || null,
    reservationExpireDate: row.reservationExpireDate || null,
    amount: row.amount,
    consultantName: row.consultantName || '',
    notes: row.notes || '',
  })
  if (row.customerId && row.complexId) {
    try {
      customerReservations.value = await lookupDepositCustomerReservations(row.complexId, row.customerId)
    } catch {
      customerReservations.value = []
    }
  } else {
    customerReservations.value = []
  }
  suppressCustomerWatch.value = false
  dialogVisible.value = true
}

function buildPayload(): CreateDepositPayload {
  return {
    complexId: form.complexId,
    depositDate: depositDateModel.value
      ? new Date(
          depositDateModel.value.getFullYear(),
          depositDateModel.value.getMonth(),
          depositDateModel.value.getDate(),
        ).toISOString()
      : null,
    amount: form.amount,
    customerId: form.customerId || null,
    customerName: form.customerName || null,
    customerPhone: form.customerPhone || null,
    reservationId: form.reservationId || null,
    unitId: form.unitId || null,
    unitNumber: form.unitNumber || null,
    unitPrice: form.unitPrice,
    pricePerMeter: form.pricePerMeter,
    reservationPercent: form.reservationPercent,
    reservationAmount: form.reservationAmount,
    reservationDate: form.reservationDate,
    reservationExpireDate: form.reservationExpireDate,
    consultantName: form.consultantName || null,
    notes: form.notes || null,
  }
}

async function save() {
  if (!form.complexId) {
    notify.warning('اختر المجمع')
    return
  }
  if (!form.amount || form.amount <= 0) {
    notify.warning('أدخل مبلغ العربون')
    return
  }
  if (!form.customerId && !form.customerName.trim()) {
    notify.warning('اختر عميلاً أو أدخل اسم العميل')
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    if (editingId.value) await updateDeposit(editingId.value, payload)
    else await createDeposit(payload)
    notify.success(editingId.value ? 'تم تحديث العربون' : 'تم إضافة العربون')
    dialogVisible.value = false
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function remove(row: Deposit) {
  if (!(await ask(`حذف عربون رقم ${row.receiptNumber}؟`))) return
  try {
    await deleteDeposit(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

onMounted(async () => {
  try {
    await loadLookups()
    if (!complexFilter.value) {
      complexFilter.value = auth.scopedComplexId || complexes.value[0]?.id || null
    }
    if (complexFilter.value) setFilter('ComplexId', complexFilter.value)
    else await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
})
</script>

<template>
  <div class="page">
    <PageHeader title="العربون" subtitle="تسجيل عربون العملاء مرتبطاً بالحجز أو يدوياً">
      <template #actions>
        <Button label="إضافة عربون" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar
        v-model:search="search"
        placeholder="بحث برقم الوصل / العميل / الوحدة"
        @search="onSearch"
        v-model:sort-mode="sortMode"
        @sort-change="setSortMode"
      >
        <Select
          v-if="auth.canSelectComplex"
          v-model="complexFilter"
          :options="complexOptions"
          option-label="label"
          option-value="id"
          placeholder="المجمع"
          show-clear
          append-to="body"
        />
      </FilterBar>

      <TableSkeleton v-if="loading && !items.length" />
      <template v-else>
        <TableSortCaption :sort-mode="sortMode" />
        <DataTable
          :value="items"
          :lazy="true"
          :paginator="true"
          :rows="pageSize"
          :total-records="total"
          :first="(page - 1) * pageSize"
          data-key="id"
          striped-rows
          @page="onLazyPage"
          sort-mode="single"
          :sort-field="sortField"
          :sort-order="sortOrder"
          removable-sort
          @sort="onTableSort"
        >
          <Column field="receiptNumber" header="رقم الوصل" sortable />
          <Column field="depositDate" header="التاريخ" sortable>
            <template #body="{ data }">{{ formatDate(data.depositDate) }}</template>
          </Column>
          <Column field="customerName" header="العميل" sortable />
          <Column field="unitNumber" header="الوحدة" sortable>
            <template #body="{ data }">{{ data.unitNumber || '—' }}</template>
          </Column>
          <Column field="unitPrice" header="سعر الوحدة" sortable>
            <template #body="{ data }">
              {{ data.unitPrice != null ? formatMoney(data.unitPrice) : '—' }}
            </template>
          </Column>
          <Column field="amount" header="مبلغ العربون" sortable>
            <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
          </Column>
          <Column header="المصدر">
            <template #body="{ data }">
              {{ data.reservationId ? 'من حجز' : 'يدوي' }}
            </template>
          </Column>
          <Column header="" style="width: 120px">
            <template #body="{ data }">
              <RowActions @edit="openEdit(data)" @delete="remove(data)" />
            </template>
          </Column>
          <template #empty>
            <div class="empty-box">لا توجد عربونات</div>
          </template>
        </DataTable>
      </template>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل العربون' : 'إضافة عربون'"
      :style="{ width: '720px' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <div class="form-grid">
        <div v-if="auth.canSelectComplex" class="field">
          <label>المجمع</label>
          <Select
            v-model="form.complexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر المجمع"
            checkmark
            append-to="body"
            @update:model-value="onComplexChanged"
          />
        </div>

        <div class="field">
          <label>تاريخ العربون</label>
          <DatePicker v-model="depositDateModel" date-format="yy-mm-dd" show-icon />
        </div>

        <div class="field">
          <label>مبلغ العربون</label>
          <InputNumber v-model="form.amount" :min="0" />
        </div>

        <div class="field">
          <label>العميل (اختياري)</label>
          <Select
            v-model="form.customerId"
            :options="customerOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر عميلاً أو اتركه فارغاً للإدخال اليدوي"
            show-clear
            filter
            checkmark
            append-to="body"
          />
          <small class="field-hint">
            عند اختيار عميل لديه حجز تُملأ الوحدة وتفاصيل الحجز تلقائياً
          </small>
        </div>

        <div v-if="form.customerId" class="field">
          <label>حجز العميل</label>
          <Select
            v-model="form.reservationId"
            :options="reservationOptions"
            option-label="label"
            option-value="id"
            :placeholder="loadingReservations ? 'جاري التحميل...' : 'اختر الحجز إن وُجد'"
            :loading="loadingReservations"
            show-clear
            checkmark
            append-to="body"
          />
          <small v-if="!loadingReservations && !reservationOptions.length" class="field-hint">
            لا يوجد حجز نشط — أكمل الحقول يدوياً أدناه
          </small>
        </div>

        <div class="field">
          <label>اسم العميل</label>
          <InputText v-model="form.customerName" :disabled="!!form.customerId" />
        </div>

        <div class="field">
          <label>هاتف العميل</label>
          <InputText v-model="form.customerPhone" dir="ltr" :disabled="!!form.customerId && !!form.customerPhone" />
        </div>

        <div class="field">
          <label>الوحدة</label>
          <Select
            v-if="isManualEntry"
            v-model="form.unitId"
            :options="unitOptions"
            option-label="label"
            option-value="id"
            placeholder="وحدات متاحة فقط"
            show-clear
            filter
            checkmark
            append-to="body"
          />
          <InputText v-else :model-value="form.unitNumber || '—'" disabled />
          <small v-if="isManualEntry" class="field-hint">تظهر الوحدات المتاحة فقط</small>
        </div>

        <div class="field">
          <label>رقم الوحدة</label>
          <InputText v-model="form.unitNumber" :disabled="hasLinkedReservation" />
        </div>

        <div class="field">
          <label>سعر الوحدة</label>
          <InputNumber
            v-model="form.unitPrice"
            :min="0"
            :disabled="hasLinkedReservation"
            @update:model-value="syncReservationAmountFromPercent"
          />
        </div>

        <div class="field">
          <label>سعر المتر</label>
          <InputNumber v-model="form.pricePerMeter" :min="0" :disabled="hasLinkedReservation" />
        </div>

        <div class="field">
          <label>نسبة الحجز ٪</label>
          <InputNumber
            v-model="form.reservationPercent"
            :min="0"
            :max="100"
            :min-fraction-digits="0"
            :max-fraction-digits="2"
            :disabled="hasLinkedReservation"
            @update:model-value="syncReservationAmountFromPercent"
          />
        </div>

        <div class="field">
          <label>مبلغ الحجز</label>
          <InputNumber v-model="form.reservationAmount" :min="0" :disabled="hasLinkedReservation" />
        </div>

        <div class="field">
          <label>تاريخ الحجز</label>
          <InputText
            :model-value="form.reservationDate ? formatDate(form.reservationDate) : ''"
            disabled
            placeholder="—"
          />
        </div>

        <div class="field">
          <label>انتهاء الحجز</label>
          <InputText
            :model-value="form.reservationExpireDate ? formatDate(form.reservationExpireDate) : ''"
            disabled
            placeholder="—"
          />
        </div>

        <div class="field">
          <label>المستشار العقاري</label>
          <InputText v-model="form.consultantName" />
        </div>

        <div class="field full">
          <label>ملاحظات</label>
          <Textarea v-model="form.notes" rows="3" auto-resize />
        </div>

        <div v-if="hasLinkedReservation" class="field full hint-box">
          تم ربط العربون بحجز العميل — الوحدة ومبلغ الوحدة وتفاصيل الحجز مأخوذة من الحجز.
        </div>
        <div v-else class="field full hint-box">
          وضع الإدخال اليدوي — لا يوجد حجز مرتبط، أكمل بيانات العميل والوحدة يدوياً.
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
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field.full {
  grid-column: 1 / -1;
}
.field label {
  font-weight: 600;
  font-size: 0.9rem;
}
.field-hint {
  color: var(--muted);
  font-size: 0.82rem;
}
.hint-box {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--surface-2, #f7fafb);
  border: 1px dashed var(--border);
  color: var(--muted);
  font-size: 0.9rem;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.empty-box {
  padding: 24px;
  text-align: center;
  color: var(--muted);
}
@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
