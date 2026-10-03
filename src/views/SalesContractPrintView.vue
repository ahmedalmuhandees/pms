<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import type {
  ContractClause,
  ContractDesign,
  Customer,
  Employee,
  SalesContract,
  Unit,
} from '@/types'
import { ContractPaymentType } from '@/types'
import { getSalesContract } from '@/api/salesContracts'
import { getContractClauses } from '@/api/contractClauses'
import { getContractDesigns } from '@/api/contractDesigns'
import { getComplex } from '@/api/complexes'
import { getCustomer } from '@/api/customers'
import { getUnit } from '@/api/units'
import { getEmployee } from '@/api/employees'
import { getErrorMessage } from '@/api/client'
import {
  contractPaymentTypeOptions,
  contractStatusOptions,
  contractTypeOptions,
  formatDate,
  formatMoney,
  labelOf,
} from '@/utils/enums'
import {
  DEFAULT_CONTRACT_LOGO,
  DEFAULT_CONTRACT_WATERMARK,
  resolveContractPrintCss,
} from '@/utils/contractPrintTheme'

type ContentBlock =
  | { id: string; kind: 'cover' }
  | { id: string; kind: 'finance' }
  | {
      id: string
      kind: 'installments-chunk'
      from: number
      to: number
      continued: boolean
    }
  | { id: string; kind: 'clauses-heading' }
  | { id: string; kind: 'clause'; title: string; body: string }

/** عدد صفوف الأقساط تقريباً لكل صفحة لتجنّب القص */
const INSTALLMENT_ROWS_PER_CHUNK = 14

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const contract = ref<SalesContract | null>(null)
const customer = ref<Customer | null>(null)
const unit = ref<Unit | null>(null)
const employee = ref<Employee | null>(null)
const complexName = ref('—')
const developerName = ref('شركة الاعمار والتطوير للاستثمارات العقارية والسياحية والزراعية')
const clauses = ref<ContractClause[]>([])
const design = ref<ContractDesign | null>(null)
const pages = ref<ContentBlock[][]>([])
const paginating = ref(false)

const measurePage = ref<HTMLElement | null>(null)
const measureContent = ref<HTMLElement | null>(null)

const customerName = computed(() => {
  const c = customer.value
  if (!c) return '—'
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—'
})

const isBank = computed(
  () => contract.value?.contractPaymentType === ContractPaymentType.RealEstateBank,
)

const agentName = computed(() => employee.value?.name || '—')
const primaryColor = computed(() => design.value?.style?.primaryColor || '#2f5139')
const fontFamily = computed(() => design.value?.style?.fontFamily || 'Cairo')
const headerTitle = computed(
  () => design.value?.header?.title || 'عقد بيع ابتدائي',
)
const headerSubtitle = computed(
  () =>
    design.value?.header?.subtitle ||
    '(مع احتفاظ البائع بالملكية لحين سداد باقي الثمن)',
)
const logoUrl = computed(
  () => design.value?.header?.logoUrl || DEFAULT_CONTRACT_LOGO,
)
const watermarkUrl = computed(
  () => design.value?.header?.logoUrl || DEFAULT_CONTRACT_WATERMARK,
)
const showPaymentTable = computed(() => design.value?.body?.showPaymentTable ?? true)
const footerText = computed(() => design.value?.footer?.footerText || '')

const companyLines = computed(() => {
  const raw = developerName.value || ''
  if (raw.includes('للاستثمارات')) {
    return ['شركة الاعمار والتطوير', 'للاستثمارات العقارية', 'والسياحية والزراعية']
  }
  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length <= 3) return [raw]
  return [parts.slice(0, 3).join(' '), parts.slice(3, 5).join(' '), parts.slice(5).join(' ')].filter(
    Boolean,
  )
})

const complexEn = computed(() => {
  if (/[A-Za-z]/.test(complexName.value)) return complexName.value
  return 'AlZahraa Residential Complex'
})

/** تواقيع ثابتة مطابقة لنموذج العقد: يمين = الطرف الثاني، يسار = الطرف الأول + اسم المجمع */
const signatureBlocks = computed(() => [
  {
    role: 'الطرف الثاني ( المشتري )',
    name: `الاسم: ${customerName.value}`,
    showSignature: true,
  },
  {
    role: 'الطرف الاول ( البائع )',
    name: complexName.value || developerName.value,
    showSignature: false,
  },
])

function splitClause(text: string | null | undefined) {
  const raw = (text || '').trim()
  if (!raw) return { title: '', body: '' }
  const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const first = lines[0] || ''
  if (/^البند\s/.test(first) && lines.length > 1) {
    return { title: first, body: lines.slice(1).join('\n') }
  }
  return { title: '', body: raw }
}

const contentBlocks = computed<ContentBlock[]>(() => {
  if (!contract.value) return []
  const blocks: ContentBlock[] = [
    { id: 'cover', kind: 'cover' },
    { id: 'finance', kind: 'finance' },
  ]
  const installments = contract.value.installments ?? []
  if (showPaymentTable.value && installments.length) {
    for (let i = 0; i < installments.length; i += INSTALLMENT_ROWS_PER_CHUNK) {
      const to = Math.min(i + INSTALLMENT_ROWS_PER_CHUNK, installments.length)
      blocks.push({
        id: `inst-${i}-${to}`,
        kind: 'installments-chunk',
        from: i,
        to,
        continued: i > 0,
      })
    }
  }
  blocks.push({ id: 'clauses-heading', kind: 'clauses-heading' })
  for (const clause of clauses.value) {
    const parts = splitClause(clause.text)
    blocks.push({
      id: clause.id,
      kind: 'clause',
      title: parts.title,
      body: parts.body,
    })
  }
  return blocks
})

function installmentSlice(from: number, to: number) {
  return (contract.value?.installments ?? []).slice(from, to)
}

const sheetStyle = computed(() => ({
  '--print-primary': primaryColor.value,
  fontFamily: `'${fontFamily.value}', 'Cairo', 'Segoe UI', Tahoma, sans-serif`,
}))

const DESIGN_STYLE_ID = 'contract-design-custom-css'

function applyCss(css: string) {
  let el = document.getElementById(DESIGN_STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = DESIGN_STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}

const customCss = computed(() => resolveContractPrintCss(design.value?.body?.terms))
watch(customCss, (css) => applyCss(css), { immediate: true })

function ensureFont(family: string) {
  const id = `contract-font-${family.replace(/\s+/g, '-').toLowerCase()}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;700;800&display=swap`
  document.head.appendChild(link)
}

watch(
  fontFamily,
  (family) => {
    if (family) ensureFont(family)
  },
  { immediate: true },
)

async function paginate() {
  if (!contract.value || !contentBlocks.value.length) {
    pages.value = []
    return
  }

  paginating.value = true
  await nextTick()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

  const pageEl = measurePage.value
  const contentEl = measureContent.value
  if (!pageEl || !contentEl) {
    pages.value = [contentBlocks.value]
    paginating.value = false
    return
  }

  const maxH = contentEl.clientHeight
  const nodes = Array.from(contentEl.querySelectorAll<HTMLElement>('[data-block-id]'))
  const heights = new Map<string, number>()
  for (const node of nodes) {
    const id = node.dataset.blockId || ''
    heights.set(id, Math.ceil(node.getBoundingClientRect().height) + 10)
  }

  const result: ContentBlock[][] = []
  let current: ContentBlock[] = []
  let used = 0

  function pushPage() {
    if (current.length) {
      result.push(current)
      current = []
      used = 0
    }
  }

  function addBlock(block: ContentBlock, h: number) {
    if (current.length && used + h > maxH) pushPage()
    if (!current.length && h > maxH && block.kind === 'installments-chunk') {
      // قسّم الجزء إلى نصفين إن كان أطول من الصفحة
      const mid = Math.floor((block.from + block.to) / 2)
      if (mid > block.from && mid < block.to) {
        addBlock(
          {
            id: `inst-${block.from}-${mid}`,
            kind: 'installments-chunk',
            from: block.from,
            to: mid,
            continued: block.continued,
          },
          Math.ceil(h * ((mid - block.from) / (block.to - block.from))) + 24,
        )
        addBlock(
          {
            id: `inst-${mid}-${block.to}`,
            kind: 'installments-chunk',
            from: mid,
            to: block.to,
            continued: true,
          },
          Math.ceil(h * ((block.to - mid) / (block.to - block.from))) + 24,
        )
        return
      }
    }
    current.push(block)
    used += h
  }

  for (const block of contentBlocks.value) {
    const h = heights.get(block.id) || 80
    addBlock(block, h)
  }
  pushPage()
  pages.value = result
  paginating.value = false
}

watch(contentBlocks, async () => {
  await nextTick()
  await paginate()
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const id = String(route.params.id || '')
    if (!id) throw new Error('معرّف العقد غير موجود')

    const data = await getSalesContract(id)
    contract.value = data

    const [complex, cust, unitData, agent, clausesResult, designsResult] = await Promise.all([
      getComplex(data.complexId).catch(() => null),
      getCustomer(data.customerId).catch(() => null),
      getUnit(data.unitId).catch(() => null),
      getEmployee(data.salesAgentId).catch(() => null),
      getContractClauses({ ComplexId: data.complexId, Page: 1, PageSize: 200 }),
      getContractDesigns({ ComplexId: data.complexId, Page: 1, PageSize: 20 }).catch(() => ({
        items: [] as ContractDesign[],
      })),
    ])

    complexName.value = complex?.nameAr || complex?.name || '—'
    if (complex?.developer) developerName.value = complex.developer
    customer.value = cust
    unit.value = unitData
    employee.value = agent
    clauses.value = [...(clausesResult.items ?? [])].sort((a, b) =>
      String(a.createdAt).localeCompare(String(b.createdAt)),
    )
    const designs = designsResult.items ?? []
    design.value =
      designs.find((d) => d.complexId === data.complexId) || designs[0] || null
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    loading.value = false
    await nextTick()
    await paginate()
    setTimeout(() => void paginate(), 400)
  }
}

function printPdf() {
  void paginate().then(() => {
    requestAnimationFrame(() => window.print())
  })
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'sales-contracts' })
}

onMounted(() => {
  load()
  window.addEventListener('beforeprint', () => void paginate())
})

onUnmounted(() => {
  document.getElementById(DESIGN_STYLE_ID)?.remove()
})
</script>

<template>
  <div class="print-page">
    <div class="toolbar no-print">
      <div class="toolbar-title">
        <strong>معاينة عقد البيع</strong>
        <span v-if="contract">{{ contract.contractNumber || contract.id.slice(0, 8) }}</span>
        <span v-if="pages.length">{{ pages.length }} صفحة · منسّق A4</span>
      </div>
      <div class="toolbar-actions">
        <Button label="رجوع" severity="secondary" outlined icon="pi pi-arrow-right" @click="goBack" />
        <Button
          label="طباعة PDF"
          icon="pi pi-print"
          :disabled="loading || !contract || paginating"
          @click="printPdf"
        />
      </div>
    </div>

    <div v-if="loading" class="state no-print">جاري تحميل العقد...</div>
    <div v-else-if="error" class="state error no-print">{{ error }}</div>

    <template v-else-if="contract">
      <!-- قياس حقيقي لكل بلوك بنفس تنسيق الصفحة -->
      <div class="a4-measure" aria-hidden="true">
        <section ref="measurePage" class="a4-page" :style="sheetStyle">
          <header class="doc-topbar">
            <div class="company">
              <div v-for="(line, i) in companyLines" :key="i">{{ line }}</div>
            </div>
            <div class="logo-wrap"><img :src="logoUrl" alt="" /></div>
            <div class="complex">
              <span class="ar">{{ complexName }}</span>
              <span class="en">{{ complexEn }}</span>
            </div>
          </header>
          <div class="a4-main">
            <div ref="measureContent" class="a4-content">
              <div
                v-for="block in contentBlocks"
                :key="`m-${block.id}`"
                :data-block-id="block.id"
                class="measure-block"
              >
                <template v-if="block.kind === 'cover'">
                  <div class="doc-meta-row">رقم العقد: {{ contract.contractNumber || '—' }}</div>
                  <div class="doc-title-block">
                    <h1>{{ headerTitle }}</h1>
                    <p class="sub">{{ headerSubtitle }}</p>
                  </div>
                  <p class="intro">
                    انه في يوم {{ formatDate(contract.contractDate) }} قد تحرر هذا العقد فيما بين كل من —
                    الطرف الاول (البائع): {{ developerName }}، والطرف الثاني (المشتري):
                    {{ customerName }}
                    <template v-if="customer?.nationalID">
                      صاحب البطاقة الوطنية المرقمة: {{ customer.nationalID }}
                    </template>
                    <template v-if="customer?.address">، العنوان: {{ customer.address }}</template>
                    <template v-if="customer?.phone">، الهاتف: {{ customer.phone }}</template>
                    ، لشراء الوحدة السكنية رقم ({{ unit?.unitNumber || '—' }})
                    بمساحة ({{ unit?.area ?? '—' }}) م² في {{ complexName }}.
                  </p>
                </template>

                <section v-else-if="block.kind === 'finance'" class="block">
                  <h2 class="is-start">البيانات المالية</h2>
                  <div class="grid">
                    <div class="cell"><span>نوع العقد</span><strong>{{ labelOf(contractTypeOptions, contract.contractType) }}</strong></div>
                    <div class="cell"><span>طريقة الدفع</span><strong>{{ labelOf(contractPaymentTypeOptions, contract.contractPaymentType) }}</strong></div>
                    <div class="cell"><span>الحالة</span><strong>{{ labelOf(contractStatusOptions, contract.contractStatus) }}</strong></div>
                    <div class="cell"><span>وكيل المبيعات</span><strong>{{ agentName }}</strong></div>
                    <div class="cell"><span>سعر البيع</span><strong>{{ formatMoney(contract.sellingPrice) }}</strong></div>
                    <div class="cell"><span>الخصم</span><strong>{{ formatMoney(contract.discount) }}</strong></div>
                    <div class="cell"><span>الضريبة</span><strong>{{ formatMoney(contract.tax) }}</strong></div>
                    <div class="cell"><span>رسوم التسجيل</span><strong>{{ formatMoney(contract.registrationFee) }}</strong></div>
                    <div class="cell"><span>المقدمة</span><strong>{{ formatMoney(contract.downPayment) }}</strong></div>
                    <div class="cell"><span>مبلغ الاستلام</span><strong>{{ formatMoney(contract.deliveryAmount) }}</strong></div>
                    <div class="cell"><span>تاريخ الاستلام</span><strong>{{ formatDate(contract.deliveryDate) }}</strong></div>
                    <div class="cell"><span>المتبقي</span><strong>{{ formatMoney(contract.remainingAmount) }}</strong></div>
                    <template v-if="isBank">
                      <div class="cell"><span>المصرف</span><strong>{{ contract.bankName || '—' }}</strong></div>
                      <div class="cell"><span>مبلغ المصرف</span><strong>{{ formatMoney(contract.financedAmount) }}</strong></div>
                      <div class="cell"><span>السنوات</span><strong>{{ contract.years ?? '—' }}</strong></div>
                      <div class="cell"><span>فترة الدفع</span><strong>{{ contract.paymentIntervalMonths || '—' }}</strong></div>
                    </template>
                  </div>
                </section>

                <section v-else-if="block.kind === 'installments-chunk'" class="block">
                  <h2 class="is-start">
                    جدول الأقساط
                    <small v-if="block.continued" class="cont-label">(تابع)</small>
                    <small class="cont-label">
                      {{ block.from + 1 }}–{{ block.to }} من {{ contract.installments?.length || 0 }}
                    </small>
                  </h2>
                  <table>
                    <thead>
                      <tr><th>#</th><th>الاستحقاق</th><th>المبلغ</th></tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(item, index) in installmentSlice(block.from, block.to)"
                        :key="item.id || `${block.from}-${index}`"
                      >
                        <td>{{ block.from + index + 1 }}</td>
                        <td>{{ formatDate(item.dueDate) }}</td>
                        <td>{{ formatMoney(item.amount) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <section v-else-if="block.kind === 'clauses-heading'" class="block">
                  <h2>البنود</h2>
                </section>

                <article v-else-if="block.kind === 'clause'" class="clause">
                  <h3 v-if="block.title" class="clause-title">{{ block.title }}</h3>
                  <p class="clause-body">{{ block.body }}</p>
                </article>
              </div>
            </div>
          </div>
          <footer class="a4-foot">
            <div class="signatures signatures-2">
              <div v-for="(sig, i) in signatureBlocks" :key="i" class="sig">
                <div class="sig-role">{{ sig.role }}</div>
                <div class="sig-name">{{ sig.name }}</div>
                <div v-if="sig.showSignature" class="sig-line">التوقيع: ............</div>
              </div>
            </div>
          </footer>
        </section>
      </div>

      <div class="a4-book">
        <section
          v-for="(pageBlocks, pageIndex) in pages"
          :key="pageIndex"
          class="a4-page"
          :style="sheetStyle"
        >
          <header class="doc-topbar">
            <div class="company">
              <div v-for="(line, i) in companyLines" :key="i">{{ line }}</div>
            </div>
            <div class="logo-wrap">
              <img :src="logoUrl" alt="شعار" />
            </div>
            <div class="complex">
              <span class="ar">{{ complexName }}</span>
              <span class="en">{{ complexEn }}</span>
            </div>
          </header>

          <div class="a4-main">
            <div class="a4-watermark" aria-hidden="true">
              <img :src="watermarkUrl" alt="" />
            </div>

            <div class="a4-content">
              <template v-for="block in pageBlocks" :key="block.id">
                <template v-if="block.kind === 'cover'">
                  <div class="doc-meta-row">رقم العقد: {{ contract.contractNumber || '—' }}</div>
                  <div class="doc-title-block">
                    <h1>{{ headerTitle }}</h1>
                    <p class="sub">{{ headerSubtitle }}</p>
                  </div>
                  <p class="intro">
                    انه في يوم {{ formatDate(contract.contractDate) }} قد تحرر هذا العقد فيما بين كل من —
                    الطرف الاول (البائع): {{ developerName }}، والطرف الثاني (المشتري):
                    {{ customerName }}
                    <template v-if="customer?.nationalID">
                      صاحب البطاقة الوطنية المرقمة: {{ customer.nationalID }}
                    </template>
                    <template v-if="customer?.address">، العنوان: {{ customer.address }}</template>
                    <template v-if="customer?.phone">، الهاتف: {{ customer.phone }}</template>
                    ، لشراء الوحدة السكنية رقم ({{ unit?.unitNumber || '—' }})
                    بمساحة ({{ unit?.area ?? '—' }}) م² في {{ complexName }}.
                  </p>
                </template>

                <section v-else-if="block.kind === 'finance'" class="block">
                  <h2 class="is-start">البيانات المالية</h2>
                  <div class="grid">
                    <div class="cell"><span>نوع العقد</span><strong>{{ labelOf(contractTypeOptions, contract.contractType) }}</strong></div>
                    <div class="cell"><span>طريقة الدفع</span><strong>{{ labelOf(contractPaymentTypeOptions, contract.contractPaymentType) }}</strong></div>
                    <div class="cell"><span>الحالة</span><strong>{{ labelOf(contractStatusOptions, contract.contractStatus) }}</strong></div>
                    <div class="cell"><span>وكيل المبيعات</span><strong>{{ agentName }}</strong></div>
                    <div class="cell"><span>سعر البيع</span><strong>{{ formatMoney(contract.sellingPrice) }}</strong></div>
                    <div class="cell"><span>الخصم</span><strong>{{ formatMoney(contract.discount) }}</strong></div>
                    <div class="cell"><span>الضريبة</span><strong>{{ formatMoney(contract.tax) }}</strong></div>
                    <div class="cell"><span>رسوم التسجيل</span><strong>{{ formatMoney(contract.registrationFee) }}</strong></div>
                    <div class="cell"><span>المقدمة</span><strong>{{ formatMoney(contract.downPayment) }}</strong></div>
                    <div class="cell"><span>مبلغ الاستلام</span><strong>{{ formatMoney(contract.deliveryAmount) }}</strong></div>
                    <div class="cell"><span>تاريخ الاستلام</span><strong>{{ formatDate(contract.deliveryDate) }}</strong></div>
                    <div class="cell"><span>المتبقي</span><strong>{{ formatMoney(contract.remainingAmount) }}</strong></div>
                    <template v-if="isBank">
                      <div class="cell"><span>المصرف</span><strong>{{ contract.bankName || '—' }}</strong></div>
                      <div class="cell"><span>مبلغ المصرف</span><strong>{{ formatMoney(contract.financedAmount) }}</strong></div>
                      <div class="cell"><span>السنوات</span><strong>{{ contract.years ?? '—' }}</strong></div>
                      <div class="cell">
                        <span>فترة الدفع</span>
                        <strong>{{ contract.paymentIntervalMonths ? `${contract.paymentIntervalMonths} شهر` : '—' }}</strong>
                      </div>
                    </template>
                  </div>
                </section>

                <section v-else-if="block.kind === 'installments-chunk'" class="block">
                  <h2 class="is-start">
                    جدول الأقساط
                    <small v-if="block.continued" class="cont-label">(تابع)</small>
                    <small class="cont-label">
                      {{ block.from + 1 }}–{{ block.to }} من {{ contract.installments?.length || 0 }}
                    </small>
                  </h2>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>الاستحقاق</th>
                        <th>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(item, index) in installmentSlice(block.from, block.to)"
                        :key="item.id || `${block.from}-${index}`"
                      >
                        <td>{{ block.from + index + 1 }}</td>
                        <td>{{ formatDate(item.dueDate) }}</td>
                        <td>{{ formatMoney(item.amount) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <section v-else-if="block.kind === 'clauses-heading'" class="block">
                  <h2>البنود</h2>
                  <p v-if="!clauses.length" class="muted">لا توجد بنود مرتبطة بهذا المجمع.</p>
                </section>

                <article v-else-if="block.kind === 'clause'" class="clause">
                  <h3 v-if="block.title" class="clause-title">{{ block.title }}</h3>
                  <p class="clause-body">{{ block.body }}</p>
                </article>
              </template>
            </div>
          </div>

          <footer class="a4-foot">
            <div class="signatures signatures-2">
              <div
                v-for="(sig, index) in signatureBlocks"
                :key="`${pageIndex}-${index}`"
                class="sig"
              >
                <div class="sig-role">{{ sig.role }}</div>
                <div class="sig-name">{{ sig.name }}</div>
                <div v-if="sig.showSignature" class="sig-line">التوقيع: ........................</div>
              </div>
            </div>
            <div v-if="footerText" class="doc-footer">{{ footerText }}</div>
          </footer>

          <div class="a4-page-num">{{ pageIndex + 1 }} / {{ pages.length }}</div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.print-page {
  min-height: 100vh;
}

.toolbar {
  max-width: 210mm;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #d3e0e5;
}

.toolbar-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toolbar-title span {
  color: #5a717a;
  font-size: 0.85rem;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.state {
  max-width: 900px;
  margin: 40px auto;
  text-align: center;
  color: #5a717a;
  font-weight: 600;
}

.state.error {
  color: #c0392b;
}

@media print {
  .no-print {
    display: none !important;
  }
}
</style>
