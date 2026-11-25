<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
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
import { resolveMediaUrl } from '@/utils/media'
import { openReceiptPrintWindow, wrapDualA5ReceiptDocument } from '@/utils/receiptPrintLayout'
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
const complexMap = ref<Record<string, string>>({})
const customerMap = ref<Record<string, string>>({})
const unitMap = ref<Record<string, string>>({})

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort, sortField, sortOrder, sortMode, onLazyPage,
} = usePagedList<Reservation, ReservationParams>(getReservations)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(auth.scopedComplexId)
const statusFilter = ref<number | null>(null)
const reservationDateModel = ref<Date | null>(null)
const expireDateModel = ref<Date | null>(null)

const emptyForm = (): CreateReservationDto => ({
  reservationDate: new Date().toISOString(),
  reservationAmount: 0,
  expireDate: new Date().toISOString(),
  status: ReservationStatus.Pending,
  unitId: '',
  customerId: '',
  complexId: '',
  notes: '',
  unitPrice: null,
  pricePerMeter: null,
  reservationPercent: null,
  consultantName: null,
})

const form = reactive<CreateReservationDto>(emptyForm())

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
  asSelectOptions(filteredUnits.value, (u) => {
    const status = labelOf(
      [
        { value: 1, label: 'متاحة' },
        { value: 2, label: 'محجوزة' },
        { value: 3, label: 'مباعة' },
        { value: 4, label: 'مؤجرة' },
        { value: 5, label: 'صيانة' },
      ],
      u.status,
    )
    return `${u.unitNumber || u.id.slice(0, 8)} — ${status}`
  }),
)

const selectedUnit = computed(() => units.value.find((u) => u.id === form.unitId) ?? null)

watch(
  () => [form.unitPrice, form.reservationPercent] as const,
  ([price, pct]) => {
    if (price && price > 0 && pct && pct > 0) {
      form.reservationAmount = Math.round((price * pct) / 100)
    }
  },
)

watch(
  () => form.unitId,
  (id) => {
    if (!id || editingId.value) return
    const unit = units.value.find((u) => u.id === id)
    if (!unit) return
    if (!form.unitPrice) form.unitPrice = unit.price || null
    if (!form.pricePerMeter && unit.area && unit.price) {
      form.pricePerMeter = Math.round((unit.price / unit.area) * 100) / 100
    }
  },
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
  Object.assign(form, emptyForm(), {
    complexId: auth.scopedComplexId || complexFilter.value || complexes.value[0]?.id || '',
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
    notes: row.notes ?? '',
    unitPrice: row.unitPrice ?? null,
    pricePerMeter: row.pricePerMeter ?? null,
    reservationPercent: row.reservationPercent ?? null,
    consultantName: row.consultantName ?? null,
  })
  dialogVisible.value = true
}

function customerNameOf(row: Reservation) {
  return row.customerName || customerMap.value[row.customerId] || row.customerId.slice(0, 8)
}

function unitNumberOf(row: Reservation) {
  return row.unitNumber || unitMap.value[row.unitId] || row.unitId.slice(0, 8)
}

function statusSeverity(status: number) {
  if (status === ReservationStatus.Confirmed) return 'success'
  if (status === ReservationStatus.Cancelled) return 'danger'
  if (status === ReservationStatus.Expired) return 'warn'
  if (status === ReservationStatus.Converted) return 'info'
  return 'secondary'
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
    const payload = { ...form }
    const saved = editingId.value
      ? await updateReservation(editingId.value, payload)
      : await createReservation(payload)
    notify.success(editingId.value ? 'تم التحديث' : 'تم إنشاء الحجز')
    dialogVisible.value = false
    await Promise.all([load(), loadLookups()])
    if (!editingId.value) {
      printReservationReceipt(saved, false)
    }
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function confirmReservation(row: Reservation) {
  if (row.status === ReservationStatus.Confirmed) {
    notify.info('الحجز مؤكد مسبقاً')
    return
  }
  if (!(await ask('تأكيد هذا الحجز؟'))) return
  try {
    const saved = await updateReservation(row.id, {
      reservationDate: row.reservationDate,
      reservationAmount: row.reservationAmount,
      expireDate: row.expireDate,
      status: ReservationStatus.Confirmed,
      unitId: row.unitId,
      customerId: row.customerId,
      complexId: row.complexId,
      notes: row.notes ?? null,
      unitPrice: row.unitPrice ?? null,
      pricePerMeter: row.pricePerMeter ?? null,
      reservationPercent: row.reservationPercent ?? null,
      consultantName: row.consultantName ?? null,
    })
    notify.success('تم تأكيد الحجز')
    await Promise.all([load(), loadLookups()])
    printReservationReceipt(saved, false)
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

async function cancelReservation(row: Reservation) {
  if (row.status === ReservationStatus.Cancelled) {
    notify.info('الحجز ملغى مسبقاً')
    return
  }
  if (!(await ask('إلغاء الحجز وإرجاع المبلغ للعميل؟'))) return
  try {
    const saved = await updateReservation(row.id, {
      reservationDate: row.reservationDate,
      reservationAmount: row.reservationAmount,
      expireDate: row.expireDate,
      status: ReservationStatus.Cancelled,
      unitId: row.unitId,
      customerId: row.customerId,
      complexId: row.complexId,
      notes: row.notes ?? null,
      unitPrice: row.unitPrice ?? null,
      pricePerMeter: row.pricePerMeter ?? null,
      reservationPercent: row.reservationPercent ?? null,
      consultantName: row.consultantName ?? null,
    })
    notify.success('تم إلغاء الحجز')
    await Promise.all([load(), loadLookups()])
    printReservationReceipt(saved, true)
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

async function remove(row: Reservation) {
  if (!(await ask('حذف الحجز؟'))) return
  try {
    await deleteReservation(row.id)
    notify.success('تم الحذف')
    await Promise.all([load(), loadLookups()])
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

function complexOf(id: string) {
  return complexes.value.find((c) => c.id === id)
}

function isSamaComplex(c?: Complex | null) {
  if (!c) return false
  const ar = (c.nameAr || '').toLowerCase()
  const en = (c.name || '').toLowerCase()
  const slug = (c.portalSlug || '').toLowerCase()
  return ar.includes('سما') || en.includes('sama') || slug.includes('sama')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function formatPrintDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function printReservationReceipt(row: Reservation, cancelled: boolean) {
  const complex = complexOf(row.complexId)
  const logoUrl = isSamaComplex(complex)
    ? '/brands/samalogo.png'
    : complex?.logoUrl
      ? resolveMediaUrl(complex.logoUrl)
      : ''
  const address =
    [complex?.address, complex?.city].filter(Boolean).join(' - ')
    || 'بغداد - حي الجهاد الاطباء - سريع مطار بغداد الدولي'
  const phones = '+(964) 77 5000 9181 - 78 5000 9181'
  const customer = customerNameOf(row)
  const phone =
    row.customerPhone
    || customers.value.find((c) => c.id === row.customerId)?.phone
    || '/'
  const unit = unitNumberOf(row)
  const amountStr = `${formatMoney(row.reservationAmount)} IQD`
  const title = cancelled ? 'وصل إلغاء حجز' : 'وصل استلام حجز'
  const banner = cancelled
    ? 'تم إلغاء الحجز وإرجاع الأموال إلى العميل'
    : 'وصل استلام مبلغ حجز وحدة عقارية'
  const desc = cancelled
    ? `إلغاء حجز الوحدة رقم ${unit} وإرجاع مبلغ ${amountStr} إلى العميل`
    : `استلام مبلغ حجز للوحدة رقم ${unit}${
        row.reservationPercent ? ` بنسبة ${row.reservationPercent}%` : ''
      }`

  const sheetInner = `
    <div class="brand-header">
      <div class="brand-title">${escapeHtml(complex?.nameAr || complex?.name || 'المجمع')}</div>
      <div class="brand-logo">${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="logo"/>` : ''}</div>
    </div>
    <hr class="rule"/>
    <div class="title-row"><h1>${escapeHtml(title)}</h1></div>
    <div class="banner" style="${cancelled ? 'color:#b91c1c' : 'color:#0f766e'}">${escapeHtml(banner)}</div>
    <div class="meta">
      <div><strong>العنوان:</strong> ${escapeHtml(address)}</div>
      <div><strong>الهواتف:</strong> ${escapeHtml(phones)}</div>
      <div><strong>التاريخ:</strong> ${escapeHtml(formatPrintDate(row.reservationDate))}</div>
    </div>
    <div class="field"><span class="label">استلمنا من السيد:</span><span class="line">${escapeHtml(customer)}</span></div>
    <div class="field"><span class="label">رقم الهاتف:</span><span class="line">${escapeHtml(phone)}</span></div>
    <div class="field"><span class="label">رقم الوحدة:</span><span class="line">${escapeHtml(unit)}</span></div>
    <div class="field"><span class="label">وذلك عن:</span><span class="line">${escapeHtml(desc)}</span></div>
    ${row.unitPrice ? `<div class="field"><span class="label">سعر الوحدة:</span><span class="line">${escapeHtml(formatMoney(row.unitPrice))} IQD</span></div>` : ''}
    ${row.pricePerMeter ? `<div class="field"><span class="label">سعر المتر:</span><span class="line">${escapeHtml(formatMoney(row.pricePerMeter))} IQD</span></div>` : ''}
    ${row.consultantName ? `<div class="field"><span class="label">المستشار العقاري:</span><span class="line">${escapeHtml(row.consultantName)}</span></div>` : ''}
    <div class="amount-row">
      <span class="label">المبلغ:</span>
      <span class="amount-box">${escapeHtml(amountStr)}</span>
    </div>
    <div class="signs">
      <div class="sign"><div class="role">توقيع المستلم</div></div>
      <div class="sign"><div class="role">المستشار العقاري</div></div>
    </div>`

  const html = wrapDualA5ReceiptDocument({
    title,
    sheetInnerHtml: sheetInner,
  })
  if (!openReceiptPrintWindow(html)) {
    notify.warning('اسمح بالنوافذ المنبثقة لطباعة الوصل')
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
    <PageHeader title="الحجوزات" subtitle="إدارة حجوزات الوحدات — يتحدّث لون الوحدة في الخريطة تلقائياً">
      <template #actions>
        <Button label="إضافة حجز" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar
        v-model:search="search"
        placeholder="ابحث..."
        @search="onSearch"
        v-model:sort-mode="sortMode"
        @sort-change="setSortMode"
      >
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
          @sort="onTableSort"
        >
          <Column header="تاريخ الحجز" style="width: 110px" sortable>
            <template #body="{ data }">{{ formatDate(data.reservationDate) }}</template>
          </Column>
          <Column header="المبلغ" style="width: 110px" sortable>
            <template #body="{ data }">{{ formatMoney(data.reservationAmount) }}</template>
          </Column>
          <Column header="الانتهاء" style="width: 110px" sortable>
            <template #body="{ data }">{{ formatDate(data.expireDate) }}</template>
          </Column>
          <Column header="حالة الحجز" style="width: 120px" sortable>
            <template #body="{ data }">
              <Tag
                :value="labelOf(reservationStatusOptions, data.status)"
                :severity="statusSeverity(data.status)"
              />
            </template>
          </Column>
          <Column header="العميل" sortable>
            <template #body="{ data }">{{ customerNameOf(data) }}</template>
          </Column>
          <Column header="الوحدة" style="width: 90px" sortable>
            <template #body="{ data }">{{ unitNumberOf(data) }}</template>
          </Column>
          <Column header="المستشار" style="width: 120px">
            <template #body="{ data }">{{ data.consultantName || '—' }}</template>
          </Column>
          <Column header="المجمع" sortable>
            <template #body="{ data }">{{ complexMap[data.complexId] || '—' }}</template>
          </Column>
          <Column header="إجراءات" style="width: 220px">
            <template #body="{ data }">
              <div class="row-actions-wrap">
                <Button
                  v-if="data.status !== ReservationStatus.Confirmed && data.status !== ReservationStatus.Cancelled"
                  icon="pi pi-check"
                  size="small"
                  text
                  rounded
                  severity="success"
                  v-tooltip.top="'تأكيد الحجز'"
                  @click="confirmReservation(data)"
                />
                <Button
                  v-if="data.status !== ReservationStatus.Cancelled"
                  icon="pi pi-times"
                  size="small"
                  text
                  rounded
                  severity="danger"
                  v-tooltip.top="'إلغاء الحجز'"
                  @click="cancelReservation(data)"
                />
                <Button
                  icon="pi pi-print"
                  size="small"
                  text
                  rounded
                  v-tooltip.top="'طباعة الوصل'"
                  @click="printReservationReceipt(data, data.status === ReservationStatus.Cancelled)"
                />
                <RowActions @edit="openEdit(data)" @remove="remove(data)" />
              </div>
            </template>
          </Column>
          <template #empty><div class="empty-box">لا توجد بيانات</div></template>
        </DataTable>
      </template>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل حجز' : 'إضافة حجز'"
      :style="{ width: 'min(720px, 96vw)' }"
    >
      <div class="form-grid">
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
            @update:model-value="() => { form.customerId = ''; form.unitId = '' }"
          />
        </div>
        <div class="field">
          <label>حالة الحجز</label>
          <Select
            v-model="form.status"
            :options="reservationStatusOptions"
            option-label="label"
            option-value="value"
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
          <small v-if="selectedUnit" class="field-hint">
            سعر الوحدة الحالي: {{ formatMoney(selectedUnit.price || 0) }}
          </small>
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
          <label>سعر الوحدة (اختياري)</label>
          <InputNumber v-model="form.unitPrice" :min="0" />
        </div>
        <div class="field">
          <label>سعر المتر (اختياري)</label>
          <InputNumber v-model="form.pricePerMeter" :min="0" :max-fraction-digits="2" />
        </div>
        <div class="field">
          <label>نسبة مبلغ الحجز ٪ (اختياري)</label>
          <InputNumber v-model="form.reservationPercent" :min="0" :max="100" :max-fraction-digits="2" />
          <small class="field-hint">إن وُجدت مع سعر الوحدة يُحسب مبلغ الحجز تلقائياً</small>
        </div>
        <div class="field">
          <label>مبلغ الحجز</label>
          <InputNumber v-model="form.reservationAmount" :min="0" />
        </div>
        <div class="field">
          <label>اسم المستشار العقاري (اختياري)</label>
          <InputText v-model="form.consultantName" placeholder="اسم المستشار" class="w-full" />
        </div>
        <div class="field full">
          <label>الملاحظات</label>
          <Textarea v-model="form.notes" rows="3" placeholder="أضف ملاحظات الحجز (اختياري)" auto-resize />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="dialogVisible = false" />
          <Button :label="editingId ? 'حفظ التغييرات' : 'حفظ وطباعة الوصل'" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.row-actions-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}
.field-hint {
  display: block;
  margin-top: 4px;
  color: var(--muted, #64748b);
  font-size: 0.8rem;
}
</style>
