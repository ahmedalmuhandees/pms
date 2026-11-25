<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import RadioButton from 'primevue/radiobutton'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type { Building, Complex, Customer, Floor, Unit } from '@/types'
import { PurchaseFormPaymentMethod, TransferStatus, UnitStatus } from '@/types'
import {
  createPurchaseForm,
  deletePurchaseForm,
  getPurchaseForms,
  updatePurchaseForm,
  updatePurchaseFormTransferStatus,
  type CreatePurchaseFormPayload,
  type PurchaseForm,
  type PurchaseFormParams,
} from '@/api/purchaseForms'
import { getComplexes } from '@/api/complexes'
import { getCustomers } from '@/api/customers'
import { getUnits } from '@/api/units'
import { getBuildings } from '@/api/buildings'
import { getFloors } from '@/api/floors'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import {
  asSelectOptions,
  formatDate,
  formatMoney,
  labelOf,
  purchaseFormPaymentMethodOptions,
  transferStatusOptions,
} from '@/utils/enums'
import { openReceiptPrintWindow } from '@/utils/receiptPrintLayout'
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
const buildings = ref<Building[]>([])
const floors = ref<Floor[]>([])
const complexFilter = ref<string | null>(auth.scopedComplexId)
const transferStatusFilter = ref<number | null>(null)
const statusUpdatingId = ref<string | null>(null)

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort, sortField, sortOrder, sortMode, onLazyPage,
} = usePagedList<PurchaseForm, PurchaseFormParams>(getPurchaseForms)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  complexId: '' as string,
  customerId: null as string | null,
  unitId: null as string | null,
  customerName: '',
  phone: '',
  address: '',
  nationalId: '',
  unitNumber: '',
  unitArea: null as number | null,
  buildingNumber: '',
  unitPrice: null as number | null,
  floor: '',
  pricePerMeter: null as number | null,
  paymentMethod: PurchaseFormPaymentMethod.Cash as number,
  notes: '',
})

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

const filteredCustomers = computed(() =>
  form.complexId ? customers.value.filter((c) => c.complexId === form.complexId) : customers.value,
)

const customerOptions = computed(() =>
  asSelectOptions(filteredCustomers.value, (c) =>
    [[c.firstName, c.lastName].filter(Boolean).join(' '), c.phone].filter(Boolean).join(' — ') || c.id,
  ),
)

const availableUnits = computed(() => {
  const list = form.complexId
    ? units.value.filter((u) => u.complexId === form.complexId)
    : units.value
  return list.filter((u) => u.status === UnitStatus.Available || u.id === form.unitId)
})

const unitOptions = computed(() =>
  asSelectOptions(availableUnits.value, (u) =>
    [u.unitNumber, u.price ? formatMoney(u.price) : null].filter(Boolean).join(' — ') || u.id,
  ),
)

const transferStatusFilterOptions = [
  { id: null as number | null, label: 'كل الحالات' },
  ...transferStatusOptions.map((o) => ({ id: o.value, label: o.label })),
]

watch(complexFilter, (id) => {
  setFilter('ComplexId', id || undefined)
})

watch(transferStatusFilter, (status) => {
  setFilter('TransferStatus', status ?? undefined)
})

watch(
  () => form.customerId,
  (id) => {
    if (!id) return
    const c = customers.value.find((x) => x.id === id)
    if (!c) return
    form.customerName = [c.firstName, c.lastName].filter(Boolean).join(' ')
    form.phone = c.phone || ''
    form.address = c.address || form.address
    if (c.nationalID) form.nationalId = c.nationalID
  },
)

watch(
  () => form.unitId,
  (id) => {
    if (!id) return
    const u = units.value.find((x) => x.id === id)
    if (!u) return
    form.unitNumber = u.unitNumber || ''
    form.unitArea = u.area ?? null
    form.unitPrice = u.price ?? null
    form.floor = u.floorLevel != null ? String(u.floorLevel) : form.floor
    const floor = floors.value.find((f) => f.id === u.floorId)
    if (floor) {
      const building = buildings.value.find((b) => b.id === floor.buildingId)
      if (building?.name) form.buildingNumber = building.name
    }
    if (u.area > 0 && u.price > 0) {
      form.pricePerMeter = Math.round((u.price / u.area) * 100) / 100
    }
  },
)

async function loadLookups() {
  const [cRes, custRes, uRes, bRes, fRes] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getCustomers({ Page: 1, PageSize: 500 }),
    getUnits({ Page: 1, PageSize: 500 }),
    getBuildings({ Page: 1, PageSize: 500 }),
    getFloors({ Page: 1, PageSize: 500 }),
  ])
  complexes.value = cRes.items ?? []
  customers.value = custRes.items ?? []
  units.value = uRes.items ?? []
  buildings.value = bRes.items ?? []
  floors.value = fRes.items ?? []
}

function resetFormFields() {
  Object.assign(form, {
    customerId: null,
    unitId: null,
    customerName: '',
    phone: '',
    address: '',
    nationalId: '',
    unitNumber: '',
    unitArea: null,
    buildingNumber: '',
    unitPrice: null,
    floor: '',
    pricePerMeter: null,
    paymentMethod: PurchaseFormPaymentMethod.Cash,
    notes: '',
  })
}

function openCreate() {
  editingId.value = null
  resetFormFields()
  form.complexId = complexFilter.value || auth.scopedComplexId || complexes.value[0]?.id || ''
  dialogVisible.value = true
}

function openEdit(row: PurchaseForm) {
  editingId.value = row.id
  Object.assign(form, {
    complexId: row.complexId,
    customerId: row.customerId || null,
    unitId: row.unitId || null,
    customerName: row.customerName || '',
    phone: row.customerPhone || '',
    address: row.address || '',
    nationalId: row.nationalId || '',
    unitNumber: row.unitNumber || '',
    unitArea: row.unitArea ?? null,
    buildingNumber: row.buildingNumber || '',
    unitPrice: row.unitPrice ?? null,
    floor: row.floor || '',
    pricePerMeter: row.pricePerMeter ?? null,
    paymentMethod: row.paymentMethod || PurchaseFormPaymentMethod.Cash,
    notes: row.notes || '',
  })
  dialogVisible.value = true
}

function buildPayload(): CreatePurchaseFormPayload {
  return {
    complexId: form.complexId,
    formDate: new Date().toISOString().slice(0, 10),
    customerId: form.customerId,
    customerName: form.customerName.trim() || null,
    customerPhone: form.phone.trim() || null,
    address: form.address.trim() || null,
    nationalId: form.nationalId.trim() || null,
    unitId: form.unitId,
    unitNumber: form.unitNumber.trim() || null,
    unitArea: form.unitArea,
    buildingNumber: form.buildingNumber.trim() || null,
    unitPrice: form.unitPrice,
    floor: form.floor.trim() || null,
    pricePerMeter: form.pricePerMeter,
    paymentMethod: form.paymentMethod,
    notes: form.notes.trim() || null,
  }
}

async function save() {
  if (!form.complexId) {
    notify.warning('اختر المجمع')
    return
  }
  if (!form.customerName.trim()) {
    notify.warning('أدخل اسم الزبون')
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    if (editingId.value) {
      await updatePurchaseForm(editingId.value, payload)
      notify.success('تم تحديث الاستمارة')
    } else {
      await createPurchaseForm(payload)
      notify.success('تم حفظ الاستمارة')
    }
    dialogVisible.value = false
    await load()
  } catch (e) {
    notify.error(getErrorMessage(e))
  } finally {
    saving.value = false
  }
}

async function remove(row: PurchaseForm) {
  const ok = await ask(`حذف استمارة ${row.formNumber}؟`, 'تأكيد الحذف')
  if (!ok) return
  try {
    await deletePurchaseForm(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (e) {
    notify.error(getErrorMessage(e))
  }
}

async function setTransferStatus(row: PurchaseForm, status: number) {
  if (row.transferStatus === status) return
  statusUpdatingId.value = row.id
  try {
    await updatePurchaseFormTransferStatus(row.id, status)
    notify.success(
      status === TransferStatus.TransferredToContract
        ? 'تم ترحيل الاستمارة الى العقد'
        : 'تم تعيين الحالة: غير مرحل',
    )
    await load()
  } catch (e) {
    notify.error(getErrorMessage(e))
  } finally {
    statusUpdatingId.value = null
  }
}

function transferSeverity(status: number) {
  return status === TransferStatus.TransferredToContract ? 'success' : 'warn'
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function moneyOrDash(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '....................'
  return formatMoney(value)
}

function textOrLine(value: string | null | undefined) {
  const v = (value || '').trim()
  return v ? escapeHtml(v) : '........................................'
}

function printPdf(row: PurchaseForm) {
  const logo = `${window.location.origin}/brands/sama-purchase-header.jpg`
  const method = row.paymentMethod
  const mark = (m: number) => (method === m ? '☑' : '☐')

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>استمارة شراء وحدة سكنية</title>
<style>
  @page { size: A4 portrait; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; background: #fff; color: #111;
    direction: rtl;
    font-family: "Arial", "Tahoma", "Segoe UI", sans-serif;
    font-size: 14px;
  }
  .sheet { width: 100%; max-width: 180mm; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 10px; }
  .header img { width: 100%; max-height: 48mm; object-fit: contain; }
  .title { text-align: center; font-size: 22px; font-weight: 800; margin: 8px 0 16px; }
  .row { display: flex; gap: 10px; align-items: baseline; margin: 10px 0; flex-wrap: wrap; }
  .label { font-weight: 700; white-space: nowrap; }
  .value { flex: 1; border-bottom: 1px dotted #444; min-height: 1.2em; padding: 0 6px 2px; }
  .section-title { margin: 18px 0 10px; font-size: 16px; font-weight: 800; border-bottom: 2px solid #111; padding-bottom: 4px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
  .pay-row { display: flex; justify-content: center; gap: 36px; margin: 14px 0 8px; font-size: 16px; font-weight: 700; }
  .warn { margin-top: 16px; font-size: 13px; line-height: 1.7; font-weight: 600; }
  .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 36px; text-align: center; }
  .sign-title { font-weight: 800; margin-bottom: 4px; }
  .sign-role { color: #333; margin-bottom: 28px; }
  .sign-line { border-top: 1px solid #111; width: 70%; margin: 0 auto; padding-top: 6px; font-size: 12px; color: #555; }
  .meta { text-align: center; color: #555; margin-bottom: 8px; font-size: 12px; }
  .no-print { position: sticky; top: 0; z-index: 10; display: flex; gap: 8px; justify-content: center; padding: 10px; background: #f3f6f8; border-bottom: 1px solid #ccd; }
  .no-print button { border: 1px solid #111; background: #0f6b8d; color: #fff; font-weight: 700; padding: 8px 18px; border-radius: 6px; cursor: pointer; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="no-print">
    <button type="button" onclick="window.print()">طباعة / PDF</button>
    <button type="button" onclick="window.close()">إغلاق</button>
  </div>
  <div class="sheet">
    <div class="header"><img src="${logo}" alt="أبراج سما"/></div>
    <div class="title">استمارة شراء وحدة سكنية</div>
    <div class="meta">${escapeHtml(row.formNumber)} — ${escapeHtml(formatDate(row.formDate))}</div>
    <div class="row"><span class="label">اسم الزبون الرباعي:-</span><span class="value">${textOrLine(row.customerName)}</span></div>
    <div class="row"><span class="label">رقم الهاتف:-</span><span class="value">${textOrLine(row.customerPhone)}</span></div>
    <div class="row"><span class="label">عنوان السكن:-</span><span class="value">${textOrLine(row.address)}</span></div>
    <div class="row"><span class="label">رقم وتاريخ اصدار البطاقة الموحدة:-</span><span class="value">${textOrLine(row.nationalId)}</span></div>
    <div class="section-title">تفاصيل الوحدة السكنية</div>
    <div class="grid-2">
      <div class="row"><span class="label">رقم الوحدة :</span><span class="value">${textOrLine(row.unitNumber)}</span></div>
      <div class="row"><span class="label">مساحة الوحدة السكنية:</span><span class="value">${row.unitArea != null ? escapeHtml(String(row.unitArea)) : '....................'}</span></div>
      <div class="row"><span class="label">رقم البناية :</span><span class="value">${textOrLine(row.buildingNumber)}</span></div>
      <div class="row"><span class="label">سعر الوحدة السكنية:</span><span class="value">${moneyOrDash(row.unitPrice)}</span></div>
      <div class="row"><span class="label">الطابق:</span><span class="value">${textOrLine(row.floor)}</span></div>
      <div class="row"><span class="label">سعر المتر الواحد:</span><span class="value">${moneyOrDash(row.pricePerMeter)}</span></div>
    </div>
    <div class="section-title">طريقة الدفع</div>
    <div class="pay-row">
      <span>${mark(PurchaseFormPaymentMethod.Installments)} اقساط</span>
      <span>${mark(PurchaseFormPaymentMethod.Cash)} نقد</span>
      <span>${mark(PurchaseFormPaymentMethod.HalfCash)} نصف نقد</span>
    </div>
    <div class="warn">* في حال التراجع عن الاستمارة يعتبر الحجز ملغي مع خصم 15% من قيمة المبلغ المدفوع وتعتبر الاستمارة غير نافذة .</div>
    <div class="signs">
      <div><div class="sign-title">الطرف الاول</div><div class="sign-role">الادارة</div><div class="sign-line">التوقيع</div></div>
      <div><div class="sign-title">الطرف الثاني</div><div class="sign-role">الزبون</div><div class="sign-line">التوقيع</div></div>
    </div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}<\\/script>
</body>
</html>`

  if (!openReceiptPrintWindow(html)) {
    notify.warning('اسمح بالنوافذ المنبثقة للطباعة')
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
  } catch (e) {
    notify.error(getErrorMessage(e))
  }
})
</script>

<template>
  <div class="page">
    <PageHeader title="استمارة شراء" subtitle="تسجيل استمارات الشراء وطباعتها ومتابعة حالة الترحيل للعقد">
      <template #actions>
        <Button label="استمارة جديدة" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar
        v-model:search="search"
        placeholder="بحث برقم الاستمارة / الزبون / الوحدة"
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
          <Column field="formNumber" header="رقم الاستمارة" sortable />
          <Column field="formDate" header="التاريخ" sortable>
            <template #body="{ data }">{{ formatDate(data.formDate) }}</template>
          </Column>
          <Column field="customerName" header="الزبون" sortable />
          <Column field="unitNumber" header="الوحدة" sortable>
            <template #body="{ data }">{{ data.unitNumber || '—' }}</template>
          </Column>
          <Column field="unitPrice" header="السعر" sortable>
            <template #body="{ data }">
              {{ data.unitPrice != null ? formatMoney(data.unitPrice) : '—' }}
            </template>
          </Column>
          <Column header="الدفع">
            <template #body="{ data }">
              {{ labelOf(purchaseFormPaymentMethodOptions, data.paymentMethod) }}
            </template>
          </Column>
          <Column header="حالة الترحيل">
            <template #body="{ data }">
              <Tag
                :value="labelOf(transferStatusOptions, data.transferStatus)"
                :severity="transferSeverity(data.transferStatus)"
              />
            </template>
          </Column>
          <Column header="إجراءات" style="width: 240px">
            <template #body="{ data }">
              <div class="row-actions-wrap">
                <Button
                  v-if="data.transferStatus !== TransferStatus.TransferredToContract"
                  icon="pi pi-arrow-right"
                  size="small"
                  text
                  rounded
                  severity="success"
                  :loading="statusUpdatingId === data.id"
                  v-tooltip.top="'ترحيل الى العقد'"
                  @click="setTransferStatus(data, TransferStatus.TransferredToContract)"
                />
                <Button
                  v-if="data.transferStatus !== TransferStatus.NotTransferred"
                  icon="pi pi-replay"
                  size="small"
                  text
                  rounded
                  severity="warn"
                  :loading="statusUpdatingId === data.id"
                  v-tooltip.top="'غير مرحل'"
                  @click="setTransferStatus(data, TransferStatus.NotTransferred)"
                />
                <Button
                  icon="pi pi-print"
                  size="small"
                  text
                  rounded
                  v-tooltip.top="'طباعة PDF'"
                  @click="printPdf(data)"
                />
                <RowActions @edit="openEdit(data)" @remove="remove(data)" />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="empty-box">لا توجد استمارات شراء</div>
          </template>
        </DataTable>
      </template>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل استمارة شراء' : 'استمارة شراء جديدة'"
      :style="{ width: 'min(860px, 96vw)' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <div class="preview-banner">
        <img src="/brands/sama-purchase-header.jpg" alt="أبراج سما" />
        <h2>استمارة شراء وحدة سكنية</h2>
      </div>

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
            @update:model-value="() => { form.customerId = null; form.unitId = null }"
          />
        </div>

        <div class="field">
          <label>اختيار عميل (اختياري)</label>
          <Select
            v-model="form.customerId"
            :options="customerOptions"
            option-label="label"
            option-value="id"
            placeholder="لتعبئة الاسم والهاتف تلقائياً"
            show-clear
            filter
            checkmark
            append-to="body"
          />
        </div>

        <div class="field">
          <label>اختيار وحدة متاحة (اختياري)</label>
          <Select
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
        </div>

        <div class="field full section-label">بيانات الزبون</div>
        <div class="field full">
          <label>اسم الزبون الرباعي</label>
          <InputText v-model="form.customerName" />
        </div>
        <div class="field">
          <label>رقم الهاتف</label>
          <InputText v-model="form.phone" dir="ltr" />
        </div>
        <div class="field">
          <label>رقم وتاريخ اصدار البطاقة الموحدة</label>
          <InputText v-model="form.nationalId" />
        </div>
        <div class="field full">
          <label>عنوان السكن</label>
          <Textarea v-model="form.address" rows="2" auto-resize />
        </div>

        <div class="field full section-label">تفاصيل الوحدة السكنية</div>
        <div class="field">
          <label>رقم الوحدة</label>
          <InputText v-model="form.unitNumber" />
        </div>
        <div class="field">
          <label>مساحة الوحدة السكنية</label>
          <InputNumber v-model="form.unitArea" :min="0" />
        </div>
        <div class="field">
          <label>رقم البناية</label>
          <InputText v-model="form.buildingNumber" />
        </div>
        <div class="field">
          <label>سعر الوحدة السكنية</label>
          <InputNumber v-model="form.unitPrice" :min="0" />
        </div>
        <div class="field">
          <label>الطابق</label>
          <InputText v-model="form.floor" />
        </div>
        <div class="field">
          <label>سعر المتر الواحد</label>
          <InputNumber v-model="form.pricePerMeter" :min="0" :min-fraction-digits="0" :max-fraction-digits="2" />
        </div>

        <div class="field full section-label">طريقة الدفع</div>
        <div class="field full pay-options">
          <label class="pay-opt">
            <RadioButton v-model="form.paymentMethod" input-id="pay-cash" :value="PurchaseFormPaymentMethod.Cash" />
            <span>نقد</span>
          </label>
          <label class="pay-opt">
            <RadioButton v-model="form.paymentMethod" input-id="pay-half" :value="PurchaseFormPaymentMethod.HalfCash" />
            <span>نصف نقد</span>
          </label>
          <label class="pay-opt">
            <RadioButton v-model="form.paymentMethod" input-id="pay-inst" :value="PurchaseFormPaymentMethod.Installments" />
            <span>اقساط</span>
          </label>
        </div>

        <div class="field full">
          <label>ملاحظات</label>
          <Textarea v-model="form.notes" rows="2" auto-resize />
        </div>

        <div class="field full warn-box">
          * في حال التراجع عن الاستمارة يعتبر الحجز ملغي مع خصم 15% من قيمة المبلغ المدفوع وتعتبر الاستمارة غير نافذة .
        </div>
      </div>

      <template #footer>
        <Button label="إلغاء" severity="secondary" text :disabled="saving" @click="dialogVisible = false" />
        <Button :label="editingId ? 'حفظ التعديل' : 'حفظ الاستمارة'" icon="pi pi-check" :loading="saving" @click="save" />
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
.preview-banner {
  text-align: center;
  margin-bottom: 14px;
}
.preview-banner img {
  width: 100%;
  max-height: 100px;
  object-fit: contain;
}
.preview-banner h2 {
  margin: 8px 0 0;
  font-size: 1.2rem;
}
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
.section-label {
  margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--border, #dde5ea);
  font-weight: 800 !important;
  font-size: 1rem !important;
}
.pay-options {
  display: flex;
  flex-direction: row;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}
.pay-opt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  cursor: pointer;
}
.warn-box {
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff7ed;
  border: 1px solid #fdba74;
  color: #9a3412;
  font-weight: 600;
  line-height: 1.7;
}
@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
