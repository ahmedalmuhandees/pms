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
import Tag from 'primevue/tag'
import type { Complex, Customer, Unit } from '@/types'
import { TransferStatus, UnitStatus } from '@/types'
import {
  createDeposit,
  deleteDeposit,
  getDeposits,
  lookupDepositCustomerReservations,
  updateDeposit,
  updateDepositTransferStatus,
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
import { asSelectOptions, formatDate, formatMoney, labelOf, transferStatusOptions } from '@/utils/enums'
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
const complexFilter = ref<string | null>(auth.scopedComplexId)
const transferStatusFilter = ref<number | null>(null)
const statusUpdatingId = ref<string | null>(null)
const customerReservations = ref<DepositReservationLookup[]>([])
const loadingReservations = ref(false)
const suppressCustomerWatch = ref(false)

const transferStatusFilterOptions = [
  { id: null as number | null, label: 'كل حالات الترحيل' },
  ...transferStatusOptions.map((o) => ({ id: o.value, label: o.label })),
]

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

watch(transferStatusFilter, (status) => {
  setFilter('TransferStatus', status ?? undefined)
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
    const isNew = !editingId.value
    const saved = isNew
      ? await createDeposit(payload)
      : await updateDeposit(editingId.value!, payload)
    notify.success(isNew ? 'تم إضافة العربون' : 'تم تحديث العربون')
    dialogVisible.value = false
    await load()
    if (isNew) printDepositReceipt(saved)
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

async function setTransferStatus(row: Deposit, status: number) {
  if (row.transferStatus === status) return
  statusUpdatingId.value = row.id
  try {
    await updateDepositTransferStatus(row.id, status)
    notify.success(
      status === TransferStatus.TransferredToContract
        ? 'تم ترحيل العربون الى العقد'
        : 'تم تعيين الحالة: غير مرحل',
    )
    await load()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    statusUpdatingId.value = null
  }
}

function transferSeverity(status: number) {
  return status === TransferStatus.TransferredToContract ? 'success' : 'warn'
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
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function numberToArabicWords(n: number): string {
  const num = Math.round(Math.abs(n || 0))
  if (num === 0) return 'صفر دينار'
  const ones = [
    '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
    'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر',
  ]
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة']

  function underThousand(v: number): string {
    if (v === 0) return ''
    if (v < 20) return ones[v]
    if (v < 100) {
      const t = Math.floor(v / 10)
      const o = v % 10
      return o ? `${ones[o]} و${tens[t]}` : tens[t]
    }
    const h = Math.floor(v / 100)
    const rest = v % 100
    return rest ? `${hundreds[h]} و${underThousand(rest)}` : hundreds[h]
  }

  const parts: string[] = []
  const millions = Math.floor(num / 1_000_000)
  const thousands = Math.floor((num % 1_000_000) / 1000)
  const rem = num % 1000

  if (millions) {
    if (millions === 1) parts.push('مليون')
    else if (millions === 2) parts.push('مليونان')
    else if (millions >= 3 && millions <= 10) parts.push(`${underThousand(millions)} ملايين`)
    else parts.push(`${underThousand(millions)} مليون`)
  }
  if (thousands) {
    if (thousands === 1) parts.push('ألف')
    else if (thousands === 2) parts.push('ألفان')
    else if (thousands >= 3 && thousands <= 10) parts.push(`${underThousand(thousands)} آلاف`)
    else parts.push(`${underThousand(thousands)} ألف`)
  }
  if (rem) parts.push(underThousand(rem))

  return `${parts.join(' و')} دينار`
}

function printDepositReceipt(row: Deposit) {
  const complex = complexOf(row.complexId)
  const logoUrl = isSamaComplex(complex)
    ? '/brands/samalogo.png'
    : complex?.logoUrl
      ? resolveMediaUrl(complex.logoUrl)
      : ''
  const brandTitle = isSamaComplex(complex)
    ? 'أبراج سما'
    : (complex?.nameAr || complex?.name || row.complexName || 'المجمع')
  const address =
    [complex?.address, complex?.city].filter(Boolean).join(' - ')
    || 'بغداد - حي الجهاد الاطباء - سريع مطار بغداد الدولي'
  const phones = '+(964) 77 5000 9181 - 78 5000 9181'
  const dateStr = formatPrintDate(row.depositDate)
  const receiptNo = row.receiptNumber || '—'
  const amountStr = `${formatMoney(row.amount)}IQD`
  const words = numberToArabicWords(row.amount)
  const phone = row.customerPhone?.trim() || '/'
  const unit = row.unitNumber?.trim() || '—'
  const desc = `عربون للوحدة رقم ${unit}`
  const warn = 'يرجى جلب هذا الوصل عند استلام العقد'

  const sheetInner = `
    <div class="brand-header">
      <div class="brand-title">${escapeHtml(brandTitle)}</div>
      <div class="brand-logo">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="logo"/>` : ''}
      </div>
    </div>
    <hr class="rule"/>
    <div class="title-row"><h1>وصل استلام عربون</h1></div>
    <div class="meta">
      <div><strong>تاريخ :</strong> ${escapeHtml(dateStr)}</div>
      <div><strong>رقم :</strong> ${escapeHtml(receiptNo)}</div>
    </div>
    <div class="field">
      <span class="label">استلمت من السيد/ة :</span>
      <span class="line">${escapeHtml(row.customerName || '—')}</span>
    </div>
    <div class="field">
      <span class="label">رقم الموبايل :</span>
      <span class="line">${escapeHtml(phone)}</span>
    </div>
    <div class="amount-row">
      <span class="label">مبلغا و قدره :</span>
      <span class="amount-box">${escapeHtml(amountStr)}</span>
      <span class="amount-words">${escapeHtml(words)}</span>
    </div>
    <div class="field">
      <span class="label">و ذلك عن :</span>
      <span class="line">${escapeHtml(desc)}</span>
    </div>
    ${row.unitPrice != null ? `<div class="field"><span class="label">سعر الوحدة :</span><span class="line">${escapeHtml(formatMoney(row.unitPrice))} IQD</span></div>` : ''}
    <div class="field">
      <span class="label">مستشار العقاري :</span>
      <span class="line">${escapeHtml(row.consultantName || '—')}</span>
    </div>
    <div class="warn">${escapeHtml(warn)}</div>
    <div class="signs">
      <div class="sign">
        <div class="role">زبون</div>
        <div class="name">${escapeHtml(row.customerName || '—')}</div>
      </div>
      <div class="sign">
        <div class="role">محاسب</div>
      </div>
    </div>
    <hr class="rule"/>
    <div class="footer">
      <div class="addr">${escapeHtml(address)}</div>
      <div class="tel">${escapeHtml(phones)}</div>
    </div>
    <div class="sheet-bottom"></div>`

  const html = wrapDualA5ReceiptDocument({
    title: `وصل عربون — ${escapeHtml(receiptNo)}`,
    sheetInnerHtml: sheetInner,
  })
  if (!openReceiptPrintWindow(html)) {
    notify.warning('اسمح بالنوافذ المنبثقة لطباعة الوصل')
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
        <Select
          v-model="transferStatusFilter"
          :options="transferStatusFilterOptions"
          option-label="label"
          option-value="id"
          placeholder="حالة الترحيل"
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
          <Column header="حالة الترحيل" style="width: 130px">
            <template #body="{ data }">
              <Tag
                :value="labelOf(transferStatusOptions, data.transferStatus ?? TransferStatus.NotTransferred)"
                :severity="transferSeverity(data.transferStatus ?? TransferStatus.NotTransferred)"
              />
            </template>
          </Column>
          <Column header="إجراءات" style="width: 220px">
            <template #body="{ data }">
              <div class="row-actions-wrap">
                <Button
                  v-if="(data.transferStatus ?? TransferStatus.NotTransferred) !== TransferStatus.TransferredToContract"
                  icon="pi pi-arrow-right"
                  size="small"
                  text
                  rounded
                  severity="success"
                  :loading="statusUpdatingId === data.id"
                  v-tooltip.top="'ترحيل العربون'"
                  @click="setTransferStatus(data, TransferStatus.TransferredToContract)"
                />
                <Button
                  v-if="(data.transferStatus ?? TransferStatus.NotTransferred) !== TransferStatus.NotTransferred"
                  icon="pi pi-replay"
                  size="small"
                  text
                  rounded
                  severity="warn"
                  :loading="statusUpdatingId === data.id"
                  v-tooltip.top="'غير مرحل'"
                  @click="setTransferStatus(data, TransferStatus.NotTransferred)"
                />
                <RowActions
                  show-print
                  @print="printDepositReceipt(data)"
                  @edit="openEdit(data)"
                  @remove="remove(data)"
                />
              </div>
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
          <Button
            :label="editingId ? 'حفظ التغييرات' : 'حفظ وطباعة الوصل'"
            :loading="saving"
            @click="save"
          />
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
.row-actions-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}
@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
