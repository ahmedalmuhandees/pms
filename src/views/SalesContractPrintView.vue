<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import SalesContractTemplate from '@/components/contracts/SalesContractTemplate.vue'
import { downloadSalesContractPdf, getSalesContract, type BankPdfOptions } from '@/api/salesContracts'
import { getCustomer } from '@/api/customers'
import { getUnit } from '@/api/units'
import { getComplex } from '@/api/complexes'
import { getContractDesign } from '@/api/contractDesigns'
import { getEmployee } from '@/api/employees'
import { getErrorMessage } from '@/api/client'
import {
  contractPaymentTypeOptions,
  contractStatusOptions,
  contractTypeOptions,
  labelOf,
} from '@/utils/enums'
import {
  PdfLayoutKind,
  type Complex,
  type ContractDesign,
  type Customer,
  type SalesContract,
  type Unit,
} from '@/types'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const pdfUrl = ref('')
const mode = ref<'html' | 'pdf'>('pdf')

const salesContract = ref<SalesContract | null>(null)
const customer = ref<Customer | null>(null)
const unit = ref<Unit | null>(null)
const complex = ref<Complex | null>(null)
const design = ref<ContractDesign | null>(null)
const salesAgentName = ref('—')

const isBankVariant = computed(() => route.query.variant === 'bank')

function isSamaComplex(c: Complex | null | undefined): boolean {
  if (!c) return false
  const ar = (c.nameAr || '').toLowerCase()
  const en = (c.name || '').toLowerCase()
  const slug = (c.portalSlug || '').toLowerCase()
  return ar.includes('سما') || en.includes('sama') || slug.includes('sama')
}

function layoutKind(d: ContractDesign | null | undefined): number {
  const k = d?.pdfLayoutKind
  if (k === PdfLayoutKind.DreamCity || k === 'DreamCity') return PdfLayoutKind.DreamCity
  if (k === PdfLayoutKind.TemplateOverlay || k === 'TemplateOverlay') return PdfLayoutKind.TemplateOverlay
  if (k === PdfLayoutKind.Standard || k === 'Standard') return PdfLayoutKind.Standard
  if (typeof k === 'number') return k
  return PdfLayoutKind.Standard
}

/** مجمع سما، أو تصميم بدون قالب مرفوع (قياسي / بدون templatePath) */
function shouldUseHtmlTemplate(c: Complex | null, d: ContractDesign | null): boolean {
  if (isSamaComplex(c)) return true
  const kind = layoutKind(d)
  if (kind === PdfLayoutKind.DreamCity) return false
  if (kind === PdfLayoutKind.TemplateOverlay && d?.templatePath) return false
  return true
}

function readBankPdfOptions(contractId: string): BankPdfOptions | undefined {
  const key = `bankPdf:${contractId}`
  const raw = localStorage.getItem(key)
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as BankPdfOptions & { savedAt?: number }
    localStorage.removeItem(key)
    if (parsed.savedAt && Date.now() - parsed.savedAt > 30 * 60 * 1000) return undefined
    if (!parsed?.paymentLines?.length) return undefined
    return { paymentLines: parsed.paymentLines }
  } catch {
    localStorage.removeItem(key)
    return undefined
  }
}

async function loadPdf(id: string, variant?: string) {
  const options = variant === 'bank' ? readBankPdfOptions(id) : undefined
  const blob = await downloadSalesContractPdf(id, variant, options)
  if (blob.type && blob.type.includes('json')) {
    const text = await blob.text()
    const parsed = JSON.parse(text)
    throw new Error(parsed.message || 'فشل توليد ملف PDF')
  }
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
  pdfUrl.value = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
  mode.value = 'pdf'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const id = String(route.params.id || '')
    if (!id) throw new Error('معرّف العقد غير موجود')
    const variant = typeof route.query.variant === 'string' ? route.query.variant : undefined

    if (variant === 'bank') {
      await loadPdf(id, variant)
      return
    }

    // قرّر المسار: HTML لسما / بدون قالب، وإلا PDF
    const contract = await getSalesContract(id)
    salesContract.value = contract

    const [cust, u, cx, agent] = await Promise.all([
      getCustomer(contract.customerId),
      getUnit(contract.unitId),
      getComplex(contract.complexId),
      contract.salesAgentId
        ? getEmployee(contract.salesAgentId).catch(() => null)
        : Promise.resolve(null),
    ])
    customer.value = cust
    unit.value = u
    complex.value = cx
    salesAgentName.value = agent?.name?.trim() || '—'

    let d: ContractDesign | null = contract.contractDesign ?? null
    if (!d && contract.contractDesignId) {
      d = await getContractDesign(contract.contractDesignId).catch(() => null)
    }
    design.value = d

    if (shouldUseHtmlTemplate(cx, d)) {
      mode.value = 'html'
      return
    }

    await loadPdf(id, variant)
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
}

function printHtml() {
  window.print()
}

function printPdf() {
  if (!pdfUrl.value) return
  const w = window.open(pdfUrl.value, '_blank', 'noopener,noreferrer')
  w?.focus()
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'sales-contracts' })
}

const sellerAddress = computed(
  () => design.value?.layout?.sellerCompanyAddress?.trim() || '',
)

const contractTypeLabel = computed(() =>
  salesContract.value ? labelOf(contractTypeOptions, salesContract.value.contractType) : '—',
)
const paymentTypeLabel = computed(() =>
  salesContract.value
    ? labelOf(contractPaymentTypeOptions, salesContract.value.contractPaymentType)
    : '—',
)
const contractStatusLabel = computed(() =>
  salesContract.value ? labelOf(contractStatusOptions, salesContract.value.contractStatus) : '—',
)

const pricePerMeter = computed(() => {
  const fromDesign = design.value?.pricePerMeter
  if (fromDesign != null && Number(fromDesign) > 0) return Number(fromDesign)
  const fromContract = salesContract.value?.pricePerMeterUsd
  if (fromContract != null && Number(fromContract) > 0) return Number(fromContract)
  return null
})

onMounted(() => {
  void load()
})

onUnmounted(() => {
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
})
</script>

<template>
  <div class="print-page" :class="{ 'html-mode': mode === 'html' }">
    <div class="toolbar no-print">
      <div class="toolbar-title">
        <strong>
          {{
            isBankVariant
              ? 'معاينة طباعة المصرف العقاري'
              : mode === 'html'
                ? 'معاينة عقد البيع'
                : 'معاينة عقد البيع (PDF)'
          }}
        </strong>
        <span>
          {{
            mode === 'html'
              ? 'قالب أبراج سما (HTML) مع جدول الدفعات والبيانات المالية'
              : 'مطابق لقالب المجمع المرفوع'
          }}
        </span>
      </div>
      <div class="toolbar-actions">
        <Button label="رجوع" severity="secondary" outlined icon="pi pi-arrow-right" @click="goBack" />
        <Button label="تحديث" severity="secondary" outlined icon="pi pi-refresh" :loading="loading" @click="load" />
        <Button
          v-if="mode === 'html'"
          label="طباعة"
          icon="pi pi-print"
          :disabled="loading || !salesContract"
          @click="printHtml"
        />
        <Button
          v-else
          label="فتح / طباعة"
          icon="pi pi-print"
          :disabled="loading || !pdfUrl"
          @click="printPdf"
        />
      </div>
    </div>

    <div v-if="loading" class="state">جاري تجهيز العقد...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <div v-else-if="mode === 'html' && salesContract && customer && unit" class="html-wrap">
      <SalesContractTemplate
        :customer="customer"
        :unit="unit"
        :sales-contract="salesContract"
        :seller-address="sellerAddress"
        :contract-type-label="contractTypeLabel"
        :payment-type-label="paymentTypeLabel"
        :contract-status-label="contractStatusLabel"
        :sales-agent-name="salesAgentName"
        :price-per-meter="pricePerMeter"
      />
    </div>
    <iframe v-else-if="pdfUrl" class="pdf-frame" :src="pdfUrl" title="عقد البيع" />
  </div>
</template>

<style scoped>
.print-page {
  min-height: 100vh;
  background: #e8ebe6;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #d5ddd4;
  position: sticky;
  top: 0;
  z-index: 5;
}

.toolbar-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toolbar-title strong {
  color: #2f5139;
}

.toolbar-title span {
  color: #6b7c6e;
  font-size: 0.85rem;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.state {
  padding: 48px 20px;
  text-align: center;
  color: #445;
}

.state.error {
  color: #b42318;
}

.pdf-frame {
  flex: 1;
  width: 100%;
  min-height: calc(100vh - 70px);
  border: 0;
  background: #cfd6cb;
}

.html-wrap {
  padding: 12px 0 24px;
}

@media print {
  .no-print {
    display: none !important;
  }
  .print-page {
    background: #fff;
  }
  .html-wrap {
    padding: 0;
  }
}
</style>
