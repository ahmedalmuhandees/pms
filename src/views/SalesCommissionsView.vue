<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import AutoComplete from 'primevue/autocomplete'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Complex } from '@/types'
import {
  createSalesCommission,
  deleteSalesCommission,
  getSalesCommissions,
  lookupSalesCommissionContracts,
  updateSalesCommission,
  type CreateSalesCommissionPayload,
  type SalesCommission,
  type SalesCommissionContractLookup,
  type SalesCommissionParams,
} from '@/api/salesCommissions'
import { getComplexes } from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions, formatDate, formatMoney } from '@/utils/enums'
import { resolveMediaUrl } from '@/utils/media'
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
const complexFilter = ref<string | null>(auth.scopedComplexId)
const contractSuggestions = ref<SalesCommissionContractLookup[]>([])
const selectedContract = ref<SalesCommissionContractLookup | null>(null)

const {
  items, loading, page, pageSize, total, search, load, onSearch, setFilter, setSortMode,
  onTableSort, sortField, sortOrder, sortMode, onLazyPage,
} = usePagedList<SalesCommission, SalesCommissionParams>(getSalesCommissions)

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const receiptDateModel = ref<Date | null>(new Date())

const form = reactive({
  complexId: '' as string,
  salesContractId: '' as string,
  commissionPercent: 2 as number,
  commissionAmount: 0 as number,
  consultantName: '' as string,
  customerName: '' as string,
  customerPhone: '' as string,
  unitNumber: '' as string,
  sellingPrice: 0 as number,
})

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

const descriptionPreview = computed(() => {
  const pct = formatPercent(form.commissionPercent)
  const unit = form.unitNumber || '—'
  return `عمولة ${pct}% للشقة رقم ${unit}`
})

const redDisclaimer = computed(() => {
  const pct = formatPercent(form.commissionPercent)
  return `العمولة الادارية عمولة ${pct}% في حالة تم الاسترجاع يتم خصم ١٪ من مبلغ العمولة`
})

const amountInWords = computed(() => numberToArabicWords(form.commissionAmount))

watch(
  () => [form.commissionPercent, form.sellingPrice] as const,
  ([pct, price]) => {
    if (price > 0 && pct > 0) {
      form.commissionAmount = Math.round((price * pct) / 100)
    }
  },
)

watch(complexFilter, (id) => {
  setFilter('ComplexId', id || undefined)
})

async function loadComplexes() {
  const result = await getComplexes({ Page: 1, PageSize: 200 })
  complexes.value = result.items ?? []
}

async function searchContracts(event: { query: string }) {
  const complexId = form.complexId || complexFilter.value
  if (!complexId) {
    contractSuggestions.value = []
    return
  }
  contractSuggestions.value = await lookupSalesCommissionContracts(complexId, event.query || undefined)
}

function applyContract(contract: SalesCommissionContractLookup | null) {
  if (!contract || typeof contract !== 'object' || !('id' in contract)) {
    form.salesContractId = ''
    form.customerName = ''
    form.customerPhone = ''
    form.unitNumber = ''
    form.sellingPrice = 0
    form.commissionAmount = 0
    return
  }
  form.salesContractId = contract.id
  form.complexId = contract.complexId
  form.customerName = contract.customerName
  form.customerPhone = contract.customerPhone || ''
  form.unitNumber = contract.unitNumber || ''
  form.sellingPrice = contract.sellingPrice
  if (form.commissionPercent > 0) {
    form.commissionAmount = Math.round((contract.sellingPrice * form.commissionPercent) / 100)
  }
}

watch(selectedContract, (c) => applyContract(c as SalesCommissionContractLookup | null))

function openCreate() {
  editingId.value = null
  receiptDateModel.value = new Date()
  selectedContract.value = null
  Object.assign(form, {
    complexId: complexFilter.value || auth.scopedComplexId || '',
    salesContractId: '',
    commissionPercent: 2,
    commissionAmount: 0,
    consultantName: '',
    customerName: '',
    customerPhone: '',
    unitNumber: '',
    sellingPrice: 0,
  })
  dialogVisible.value = true
}

function openEdit(row: SalesCommission) {
  editingId.value = row.id
  receiptDateModel.value = row.receiptDate ? new Date(row.receiptDate) : new Date()
  selectedContract.value = {
    id: row.salesContractId,
    contractNumber: row.contractNumber || '',
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    unitNumber: row.unitNumber,
    sellingPrice: row.sellingPrice,
    complexId: row.complexId,
  }
  Object.assign(form, {
    complexId: row.complexId,
    salesContractId: row.salesContractId,
    commissionPercent: row.commissionPercent,
    commissionAmount: row.commissionAmount,
    consultantName: row.consultantName || '',
    customerName: row.customerName,
    customerPhone: row.customerPhone || '',
    unitNumber: row.unitNumber || '',
    sellingPrice: row.sellingPrice,
  })
  dialogVisible.value = true
}

function buildPayload(): CreateSalesCommissionPayload {
  return {
    salesContractId: form.salesContractId,
    complexId: form.complexId,
    receiptDate: receiptDateModel.value
      ? new Date(receiptDateModel.value.getFullYear(), receiptDateModel.value.getMonth(), receiptDateModel.value.getDate()).toISOString()
      : null,
    commissionPercent: form.commissionPercent,
    commissionAmount: form.commissionAmount,
    description: descriptionPreview.value,
    consultantName: form.consultantName || null,
  }
}

async function save() {
  if (!form.complexId || !form.salesContractId) {
    notify.warning('اختر المجمع والعقد')
    return
  }
  if (!form.commissionPercent || form.commissionPercent <= 0) {
    notify.warning('أدخل نسبة المبيعات')
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    const saved = editingId.value
      ? await updateSalesCommission(editingId.value, payload)
      : await createSalesCommission(payload)
    notify.success(editingId.value ? 'تم تحديث الوصل' : 'تم إنشاء الوصل')
    dialogVisible.value = false
    await load()
    printReceipt(saved)
  } catch (e) {
    notify.error(getErrorMessage(e))
  } finally {
    saving.value = false
  }
}

async function remove(row: SalesCommission) {
  const ok = await ask(`حذف وصل العمولة رقم ${row.receiptNumber}؟`)
  if (!ok) return
  try {
    await deleteSalesCommission(row.id)
    notify.success('تم الحذف')
    await load()
  } catch (e) {
    notify.error(getErrorMessage(e))
  }
}

function complexOf(id: string) {
  return complexes.value.find((c) => c.id === id)
}

function printReceipt(row: SalesCommission) {
  const complex = complexOf(row.complexId)
  const brandAr = complex?.nameAr || row.complexName || 'المجمع'
  const brandEn = complex?.name || ''
  const logoUrl = complex?.logoUrl ? resolveMediaUrl(complex.logoUrl) : ''
  const address = [complex?.address, complex?.city].filter(Boolean).join(' - ') || ''
  const dateStr = formatPrintDate(row.receiptDate)
  const receiptNo = row.receiptNumber?.replace(/^SC-\d+-/, '') || row.receiptNumber
  const amountStr = `${formatMoney(row.commissionAmount)} IQD`
  const words = numberToArabicWords(row.commissionAmount)
  const phone = row.customerPhone?.trim() || '/'
  const pct = formatPercent(row.commissionPercent)
  const disclaimer = `العمولة الادارية عمولة ${pct}% في حالة تم الاسترجاع يتم خصم ١٪ من مبلغ العمولة`
  const desc = row.description || `عمولة ${pct}% للشقة رقم ${row.unitNumber || '—'}`

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>وصل قبض — ${escapeHtml(row.receiptNumber)}</title>
<style>
  @page { size: A5 landscape; margin: 8mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", Tahoma, "Noto Naskh Arabic", Arial, sans-serif;
    color: #111;
    background: #fff;
    direction: rtl;
  }
  .sheet {
    position: relative;
    width: 100%;
    min-height: 130mm;
    padding: 10mm 14mm 10mm 10mm;
    border: 1.5px solid #1a4f9c;
  }
  .side-strip {
    position: absolute;
    top: 8mm;
    bottom: 8mm;
    right: 4mm;
    width: 0;
    border-right: 2px dotted #1a4f9c;
  }
  .side-contact {
    position: absolute;
    top: 50%;
    right: 1.5mm;
    transform: translateY(-50%) rotate(90deg);
    transform-origin: right center;
    white-space: nowrap;
    font-size: 9px;
    color: #1a4f9c;
    letter-spacing: 0.2px;
  }
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 120px;
  }
  .brand img { height: 42px; width: auto; object-fit: contain; }
  .brand-text .ar {
    font-size: 22px;
    font-weight: 800;
    color: #1a4f9c;
    line-height: 1.1;
  }
  .brand-text .en {
    font-size: 11px;
    font-weight: 700;
    color: #1a4f9c;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .title-block { text-align: center; flex: 1; }
  .title-block h1 {
    margin: 0;
    font-size: 26px;
    font-weight: 800;
  }
  .meta {
    font-size: 13px;
    line-height: 1.7;
    min-width: 110px;
    text-align: left;
  }
  .meta strong { font-weight: 700; }
  .field {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 7px 0;
    font-size: 14px;
  }
  .field .label { white-space: nowrap; font-weight: 600; }
  .field .line {
    flex: 1;
    border-bottom: 1px dotted #444;
    min-height: 1.2em;
    padding: 0 6px 2px;
  }
  .amount-box {
    display: inline-block;
    background: #d9d9d9;
    border: 1px solid #888;
    padding: 4px 14px;
    font-weight: 700;
    font-size: 15px;
    min-width: 160px;
    text-align: center;
  }
  .words {
    margin: 4px 0 8px;
    font-size: 14px;
    font-weight: 600;
    padding-right: 4px;
  }
  .warn {
    color: #c00000;
    font-size: 13px;
    font-weight: 700;
    margin: 14px 0 18px;
    text-align: center;
  }
  .signs {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 8px;
    padding: 0 20px;
  }
  .sign {
    text-align: center;
    min-width: 140px;
  }
  .sign .role { font-weight: 800; font-size: 15px; margin-bottom: 28px; }
  .sign .name { font-size: 13px; font-weight: 600; border-top: 1px solid transparent; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { border-color: #1a4f9c; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="side-strip"></div>
    ${address ? `<div class="side-contact">${escapeHtml(address)}</div>` : ''}
    <div class="header">
      <div class="brand">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt=""/>` : ''}
        <div class="brand-text">
          <div class="ar">${escapeHtml(brandAr)}</div>
          ${brandEn ? `<div class="en">${escapeHtml(brandEn)}</div>` : ''}
        </div>
      </div>
      <div class="title-block"><h1>وصل قبض</h1></div>
      <div class="meta">
        <div><strong>تاريخ :</strong> ${escapeHtml(dateStr)}</div>
        <div><strong>رقم :</strong> ${escapeHtml(receiptNo)}</div>
      </div>
    </div>

    <div class="field">
      <span class="label">استلمت من السيد/ة</span>
      <span class="line">${escapeHtml(row.customerName || '—')}</span>
    </div>
    <div class="field">
      <span class="label">رقم الموبايل</span>
      <span class="line">${escapeHtml(phone)}</span>
    </div>
    <div class="field">
      <span class="label">مبلغاً وقدره</span>
      <span class="amount-box">${escapeHtml(amountStr)}</span>
    </div>
    <div class="words">${escapeHtml(words)}</div>
    <div class="field">
      <span class="label">وذلك عن</span>
      <span class="line">${escapeHtml(desc)}</span>
    </div>
    <div class="field">
      <span class="label">مستشار العقاري</span>
      <span class="line">${escapeHtml(row.consultantName || '—')}</span>
    </div>

    <div class="warn">${escapeHtml(disclaimer)}</div>

    <div class="signs">
      <div class="sign">
        <div class="role">زبون</div>
        <div class="name">${escapeHtml(row.customerName || '—')}</div>
      </div>
      <div class="sign">
        <div class="role">محاسب</div>
        <div class="name">${escapeHtml(row.accountantName || '—')}</div>
      </div>
    </div>
  </div>
  <script>window.onload = function () { window.print(); }<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    notify.warning('اسمح بالنوافذ المنبثقة للطباعة')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

function formatPercent(value: number) {
  if (value == null || Number.isNaN(value)) return '0'
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '')
}

function formatPrintDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function numberToArabicWords(n: number): string {
  const num = Math.round(Math.abs(n || 0))
  if (num === 0) return 'صفر دينار عراقي'
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
    'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر']
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

  return `${parts.join(' و')} دينار عراقي`
}

onMounted(async () => {
  try {
    await loadComplexes()
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
    <PageHeader title="نسبة المبيعات" subtitle="وصولات عمولة المبيعات وطباعتها">
      <template #actions>
        <Button label="وصل جديد" icon="pi pi-plus" @click="openCreate" />
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
      <Column field="receiptDate" header="التاريخ" sortable>
        <template #body="{ data }">{{ formatDate(data.receiptDate) }}</template>
      </Column>
      <Column field="customerName" header="العميل" />
      <Column field="unitNumber" header="الوحدة" />
      <Column field="commissionPercent" header="النسبة">
        <template #body="{ data }">{{ formatPercent(data.commissionPercent) }}%</template>
      </Column>
      <Column field="commissionAmount" header="المبلغ">
        <template #body="{ data }">{{ formatMoney(data.commissionAmount) }}</template>
      </Column>
      <Column field="consultantName" header="المستشار" />
      <Column field="accountantName" header="المحاسب" />
      <Column header="" style="width: 8rem">
        <template #body="{ data }">
          <RowActions
            show-print
            @edit="openEdit(data)"
            @remove="remove(data)"
            @print="printReceipt(data)"
          />
        </template>
      </Column>
      <template #empty><div class="empty-box">لا توجد وصولات عمولة</div></template>
    </DataTable>
    </template>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل وصل نسبة المبيعات' : 'وصل نسبة مبيعات جديد'"
      :style="{ width: '640px' }"
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
            class="w-full"
            append-to="body"
            :disabled="!!editingId"
          />
        </div>

        <div class="field">
          <label>اختيار العقد</label>
          <AutoComplete
            v-model="selectedContract"
            :suggestions="contractSuggestions"
            option-label="contractNumber"
            force-selection
            dropdown
            class="w-full"
            placeholder="ابحث برقم العقد / العميل / الوحدة"
            @complete="searchContracts"
          >
            <template #option="{ option }">
              <div class="contract-opt">
                <strong>{{ option.contractNumber }}</strong>
                <span>{{ option.customerName }} — {{ option.unitNumber || '—' }}</span>
              </div>
            </template>
          </AutoComplete>
        </div>

        <div class="field">
          <label>اسم العميل</label>
          <InputText :model-value="form.customerName" class="w-full" disabled />
        </div>
        <div class="field">
          <label>رقم الهاتف</label>
          <InputText :model-value="form.customerPhone || '/'" class="w-full" disabled />
        </div>

        <div class="field">
          <label>نسبة المبيعات %</label>
          <InputNumber
            v-model="form.commissionPercent"
            :min="0.01"
            :max="100"
            :min-fraction-digits="0"
            :max-fraction-digits="2"
            suffix=" %"
            class="w-full"
          />
          <small class="hint">من مبلغ سعر الشقة: {{ formatMoney(form.sellingPrice) }}</small>
        </div>

        <div class="field">
          <label>مبلغاً وقدره</label>
          <InputNumber
            v-model="form.commissionAmount"
            :min="0"
            :min-fraction-digits="0"
            :max-fraction-digits="0"
            class="w-full"
          />
          <small class="hint">{{ amountInWords }}</small>
        </div>

        <div class="field">
          <label>تاريخ الوصل</label>
          <DatePicker v-model="receiptDateModel" date-format="dd/mm/yy" show-icon class="w-full" />
        </div>

        <div class="field full">
          <label>وذلك عن</label>
          <InputText :model-value="descriptionPreview" class="w-full" disabled />
        </div>

        <div class="field full">
          <label>مستشار عقاري</label>
          <InputText v-model="form.consultantName" class="w-full" placeholder="يُدخل يدوياً" />
        </div>

        <div class="field full">
          <p class="red-note">{{ redDisclaimer }}</p>
        </div>

        <div class="signs-preview full">
          <div>
            <strong>زبون</strong>
            <div>{{ form.customerName || '—' }}</div>
          </div>
          <div>
            <strong>محاسب</strong>
            <div>{{ auth.displayName || '—' }}</div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="إلغاء" severity="secondary" text @click="dialogVisible = false" />
        <Button
          :label="editingId ? 'حفظ وطباعة' : 'إنشاء وطباعة'"
          icon="pi pi-print"
          :loading="saving"
          @click="save"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field.full {
  grid-column: 1 / -1;
}
.field label {
  font-weight: 600;
  font-size: 0.9rem;
}
.hint {
  color: var(--p-text-muted-color, #64748b);
  font-size: 0.8rem;
}
.red-note {
  margin: 0;
  color: #c00000;
  font-weight: 700;
  font-size: 0.92rem;
  text-align: center;
  line-height: 1.6;
}
.signs-preview {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-top: 1px dashed var(--p-content-border-color, #e2e8f0);
}
.signs-preview strong {
  display: block;
  margin-bottom: 0.25rem;
}
.contract-opt {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.contract-opt span {
  font-size: 0.85rem;
  opacity: 0.75;
}
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
