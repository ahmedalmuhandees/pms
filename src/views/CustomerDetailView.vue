<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import type {
  Complex,
  ContractDesign,
  CreatePaymentDto,
  Customer,
  CustomerDocument,
  Employee,
  Installment,
  Payment,
  SalesContract,
  Unit,
} from '@/types'
import { InstallmentStatus, PaymentMethod, PaymentPurpose, UnitUi } from '@/types'
import { downloadCustomerAccountStatementPdf, getCustomer } from '@/api/customers'
import { getComplexes } from '@/api/complexes'
import { getContractDesigns } from '@/api/contractDesigns'
import {
  deleteSalesContract,
  downloadSalesContractPdf,
  type BankPdfPaymentLine,
  getSalesContract,
  getSalesContracts,
} from '@/api/salesContracts'
import {
  deletePayment,
  downloadPaymentBatchPdf,
  downloadPaymentPdf,
  getPayments,
  processBatchPayment,
  processPayment,
} from '@/api/payments'
import {
  deleteCustomerDocument,
  downloadCustomerDocument,
  getCustomerDocuments,
  uploadCustomerDocument,
} from '@/api/customerDocuments'
import {
  getCustomerWhatsAppLogs,
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  WhatsAppTemplateType,
  whatsAppTemplateOptions,
  type WhatsAppMessageLog,
} from '@/api/whatsapp'
import { getUnits } from '@/api/units'
import { getEmployees } from '@/api/employees'
import { getErrorMessage } from '@/api/client'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import PageHeader from '@/components/PageHeader.vue'
import {
  asSelectOptions,
  contractPaymentTypeOptions,
  contractStatusOptions,
  contractTypeOptions,
  formatDate,
  formatMoney,
  educationLevelOptions,
  installmentOrdinalLabel,
  installmentStatusLabel,
  isInstallmentDue,
  isInstallmentNotYetDue,
  labelOf,
  maritalStatusOptions,
  paymentMethodOptions,
} from '@/utils/enums'
import { resolveMediaUrl } from '@/utils/media'

interface CustomerInstallment extends Installment {
  contractId: string
  contractNumber: string | null
  /** بند من جدول تقسيط المقدمة */
  isDownPayment?: boolean
}

const route = useRoute()
const router = useRouter()
const notify = useNotify()
const { ask } = useConfirmAction()

const customerId = computed(() => String(route.params.id))
const loading = ref(true)
const customer = ref<Customer | null>(null)
const complex = ref<Complex | null>(null)
const contracts = ref<SalesContract[]>([])
const selectedContractId = ref<string | null>(null)
const installments = ref<CustomerInstallment[]>([])
const payments = ref<Payment[]>([])
const employees = ref<Employee[]>([])
const unitMap = ref<Record<string, string>>({})
const unitsById = ref<Record<string, Unit>>({})
const contractDesign = ref<ContractDesign | null>(null)
const profileSection = ref<'personal' | 'contracts' | 'payments' | 'statement' | 'whatsapp'>(
  'personal',
)
const activeTab = ref('due')
const statementPrinting = ref(false)
const contractPdfBusy = ref(false)
const bankPrintVisible = ref(false)
const bankPrintBusy = ref(false)
interface BankPaymentRow {
  label: string
  amount: number | null
}
const bankPaymentRows = ref<BankPaymentRow[]>([
  { label: 'الدفعة الاولى', amount: null },
  { label: 'المبلغ المتبقي (قسط)', amount: null },
])
const bankPaymentTotal = computed(() =>
  bankPaymentRows.value.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
)

const documents = ref<CustomerDocument[]>([])
const documentsLoading = ref(false)
const uploadingDoc = ref(false)
const downloadingDocId = ref<string | null>(null)
const docFile = ref<File | null>(null)
const docInputRef = ref<HTMLInputElement | null>(null)
const docForm = reactive({
  referenceNumber: null as string | null,
  notes: null as string | null,
})
const apiOrigin = import.meta.env.VITE_API_BASE_URL || 'https://apicomplex.solidcode-iq.com'

const waLogs = ref<WhatsAppMessageLog[]>([])
const waLogsLoading = ref(false)
const waSending = ref(false)
const waTestMessage = ref('مرحباً، هذه رسالة تجريبية من نظام إدارة العقارات.')
const waTemplateType = ref<WhatsAppTemplateType>(WhatsAppTemplateType.InstallmentReminder)
const sendWaAfterPay = ref(true)

const payVisible = ref(false)
const paying = ref(false)
const printingId = ref<string | null>(null)
const payingInstallment = ref<CustomerInstallment | null>(null)
const payingPurpose = ref<PaymentPurpose>(PaymentPurpose.Installment)
const splitPartial = ref(false)
const paymentDateModel = ref<Date | null>(null)
const payForm = reactive<CreatePaymentDto>({
  paymentMethod: PaymentMethod.Cash,
  referenceNumber: null,
  bankName: null,
  notes: null,
  amount: 0,
  paymentDate: new Date().toISOString(),
  installmentId: null,
  contractId: '',
  customerId: '',
  receivedById: '',
  complexId: '',
  purpose: PaymentPurpose.Installment,
  splitPartial: false,
})

const multiPayVisible = ref(false)
const multiPaying = ref(false)
const selectedDueInstallments = ref<CustomerInstallment[]>([])
const selectedUnpaidInstallments = ref<CustomerInstallment[]>([])
const multiAmountManual = ref(false)
const multiPayForm = reactive({
  paymentMethod: PaymentMethod.Cash as PaymentMethod,
  referenceNumber: null as string | null,
  bankName: null as string | null,
  notes: null as string | null,
  amount: 0,
  receivedById: '',
})
const multiPaymentDateModel = ref<Date | null>(null)

const fullName = computed(() => {
  if (!customer.value) return '—'
  return [customer.value.firstName, customer.value.lastName].filter(Boolean).join(' ') || '—'
})

const selectedContract = computed(
  () => contracts.value.find((c) => c.id === selectedContractId.value) ?? null,
)

const contractOptions = computed(() =>
  asSelectOptions(contracts.value, (c) => c.contractNumber || c.id.slice(0, 8)),
)

const contractInstallments = computed(() =>
  installments.value.filter((i) => i.contractId === selectedContractId.value),
)

const contractDownPaymentInstallments = computed((): CustomerInstallment[] => {
  const contract = selectedContract.value
  if (!contract) return []
  return (contract.downPaymentInstallments ?? [])
    .filter((i) => i.status !== InstallmentStatus.Cancelled)
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .map((i) => ({
      ...i,
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      isDownPayment: true,
    }))
})

const contractPayments = computed(() =>
  payments.value.filter((p) => p.contractId === selectedContractId.value),
)

const dueInstallments = computed(() => {
  const down = contractDownPaymentInstallments.value.filter((i) =>
    isInstallmentDue(i.status, i.dueDate),
  )
  const plan = contractInstallments.value
    .filter((i) => isInstallmentDue(i.status, i.dueDate))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  return [...down, ...plan]
})

const unpaidInstallments = computed(() => {
  const down = contractDownPaymentInstallments.value.filter((i) =>
    isInstallmentNotYetDue(i.status, i.dueDate),
  )
  const plan = contractInstallments.value
    .filter((i) => isInstallmentNotYetDue(i.status, i.dueDate))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  return [...down, ...plan]
})

const partialPayments = computed(() =>
  contractPayments.value.filter((p) => p.isPartialSplit),
)

const dueTotal = computed(() => dueInstallments.value.reduce((sum, i) => sum + remainingOf(i), 0))
const unpaidTotal = computed(() =>
  unpaidInstallments.value.reduce((sum, i) => sum + remainingOf(i), 0),
)
const paidTotal = computed(() =>
  contractPayments.value.reduce((sum, p) => sum + (p.amount || 0), 0),
)

const downPaid = computed(() =>
  contractPayments.value
    .filter((p) => p.purpose === PaymentPurpose.DownPayment)
    .reduce((s, p) => s + p.amount, 0),
)
const deliveryPaid = computed(() =>
  contractPayments.value
    .filter((p) => p.purpose === PaymentPurpose.Delivery)
    .reduce((s, p) => s + p.amount, 0),
)
const downRemaining = computed(() =>
  Math.max(0, (selectedContract.value?.downPayment || 0) - downPaid.value),
)
const deliveryRemaining = computed(() =>
  Math.max(0, (selectedContract.value?.deliveryAmount || 0) - deliveryPaid.value),
)

const downPaymentScheduleItems = computed(() => {
  const items = selectedContract.value?.downPaymentInstallments || []
  return items
    .filter((i) => i.status !== InstallmentStatus.Cancelled)
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
})

const hasDownPaymentSchedule = computed(() => downPaymentScheduleItems.value.length > 0)

const employeeOptions = computed(() =>
  asSelectOptions(
    customer.value
      ? employees.value.filter((e) => e.complexId === customer.value!.complexId)
      : employees.value,
    (e) => e.name || e.id,
  ),
)

const paymentReferenceOptions = computed(() => {
  const refs = [
    ...new Set(
      payments.value
        .map((p) => p.referenceNumber?.trim())
        .filter((v): v is string => !!v),
    ),
  ]
  return refs.map((r) => ({ label: r, value: r }))
})

function mediaUrl(path: string | null | undefined) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${apiOrigin.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function remainingOf(row: Installment) {
  return Math.max(0, (row.amount || 0) + (row.penalty || 0) - (row.paidAmount || 0))
}

function installmentLabelOf(row: CustomerInstallment) {
  if (row.name?.trim()) return row.name.trim()
  if (row.isDownPayment) return 'دفعة مقدمة'
  const siblings = contractInstallments.value
    .filter((i) => i.planID === row.planID && !String(i.name || '').startsWith('الباقي من '))
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  const index = siblings.findIndex((i) => i.id === row.id) + 1
  return index > 0 ? installmentOrdinalLabel(index) : 'قسط'
}

function openPayRow(row: CustomerInstallment) {
  if (row.isDownPayment) openPayDownItem(row)
  else openPayInstallment(row)
}

function paymentInstallmentLabel(payment: Payment) {
  if (payment.installmentLabel) return payment.installmentLabel
  if (payment.purpose === PaymentPurpose.DownPayment) return 'دفعة المقدمة'
  if (payment.purpose === PaymentPurpose.Delivery) return 'دفعة الاستلام'
  const inst = contractInstallments.value.find((i) => i.id === payment.installmentId)
  return inst ? installmentLabelOf(inst) : 'قسط'
}

const selectedMultiInstallments = computed(() => {
  const map = new Map<string, CustomerInstallment>()
  for (const row of [...selectedDueInstallments.value, ...selectedUnpaidInstallments.value]) {
    map.set(row.id, row)
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )
})

const selectedMultiTotal = computed(() =>
  selectedMultiInstallments.value.reduce((sum, i) => sum + remainingOf(i), 0),
)

function syncMultiAmount() {
  if (!multiAmountManual.value) {
    multiPayForm.amount = selectedMultiTotal.value
  }
}

function purposeLabel(purpose: PaymentPurpose | undefined) {
  if (purpose === PaymentPurpose.DownPayment) return 'دفعة المقدمة'
  if (purpose === PaymentPurpose.Delivery) return 'دفعة الاستلام'
  return 'قسط'
}

function currentPayRemaining() {
  if (payingInstallment.value) return remainingOf(payingInstallment.value)
  if (payingPurpose.value === PaymentPurpose.DownPayment) return downRemaining.value
  if (payingPurpose.value === PaymentPurpose.Delivery) return deliveryRemaining.value
  return 0
}

function downItemLabel(row: Installment, index: number) {
  return row.name?.trim() || `دفعة مقدمة ${index + 1}`
}

/** صفوف جدول المدفوعات/المستحقات — تقسيط المقدمة أولاً إن وُجد */
function paymentScheduleRowsForContract(contract: SalesContract) {
  const downItems = (contract.downPaymentInstallments ?? [])
    .filter((i) => i.status !== InstallmentStatus.Cancelled)
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const rows: { id: string; label: string; dueDate: string | null; amount: number }[] = []

  if (downItems.length > 0) {
    for (let idx = 0; idx < downItems.length; idx++) {
      const item = downItems[idx]!
      rows.push({
        id: item.id,
        label: downItemLabel(item, idx),
        dueDate: item.dueDate,
        amount: item.amount,
      })
    }
  } else if (contract.downPayment > 0) {
    rows.push({
      id: 'down',
      label: 'المقدمة',
      dueDate: contract.contractDate,
      amount: contract.downPayment,
    })
  }

  if (contract.deliveryAmount > 0) {
    rows.push({
      id: 'delivery',
      label: 'مبلغ الاستلام',
      dueDate: contract.deliveryDate,
      amount: contract.deliveryAmount,
    })
  }

  for (const [idx, inst] of (contract.installments ?? []).entries()) {
    rows.push({
      id: inst.id,
      label: installmentOrdinalLabel(idx + 1),
      dueDate: inst.dueDate,
      amount: inst.amount,
    })
  }

  return rows
}

function orderedPayableInstallments(excludeIds: Set<string> = new Set()) {
  return contractInstallments.value
    .filter((i) => remainingOf(i) > 0 && !excludeIds.has(i.id))
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
}

function nextInstallmentAfterCurrent(): CustomerInstallment | null {
  const ordered = orderedPayableInstallments()
  if (!payingInstallment.value) return ordered[0] ?? null
  const idx = ordered.findIndex((i) => i.id === payingInstallment.value!.id)
  if (idx >= 0) return ordered[idx + 1] ?? null
  return ordered.find((i) => i.id !== payingInstallment.value!.id) ?? null
}

const singleOverflowAmount = computed(() =>
  Math.max(0, (payForm.amount || 0) - currentPayRemaining()),
)

const singleOverflowNext = computed(() => {
  if (singleOverflowAmount.value <= 0) return null
  return nextInstallmentAfterCurrent()
})

const singleNextDesiredPay = computed(() => {
  const next = singleOverflowNext.value
  if (!next) return null
  return Math.max(0, remainingOf(next) - singleOverflowAmount.value)
})

const multiOverflowAmount = computed(() =>
  Math.max(0, (multiPayForm.amount || 0) - selectedMultiTotal.value),
)

const multiOverflowNext = computed(() => {
  if (multiOverflowAmount.value <= 0) return null
  const selectedIds = new Set(selectedMultiInstallments.value.map((i) => i.id))
  return orderedPayableInstallments(selectedIds)[0] ?? null
})

const multiNextDesiredPay = computed(() => {
  const next = multiOverflowNext.value
  if (!next) return null
  return Math.max(0, remainingOf(next) - multiOverflowAmount.value)
})

function openPayInstallment(row: CustomerInstallment) {
  const remaining = remainingOf(row)
  if (remaining <= 0) {
    notify.warning('هذا القسط مدفوع بالكامل')
    return
  }
  payingInstallment.value = row
  payingPurpose.value = PaymentPurpose.Installment
  splitPartial.value = false
  paymentDateModel.value = new Date()
  Object.assign(payForm, {
    paymentMethod: PaymentMethod.Cash,
    referenceNumber: null,
    bankName: null,
    notes: null,
    amount: remaining,
    paymentDate: new Date().toISOString(),
    installmentId: row.id,
    contractId: row.contractId,
    customerId: customerId.value,
    receivedById: employees.value.find((e) => e.complexId === row.complexId)?.id || '',
    complexId: row.complexId,
    purpose: PaymentPurpose.Installment,
    splitPartial: false,
  })
  payVisible.value = true
}

function openPayPurpose(purpose: PaymentPurpose) {
  if (!selectedContract.value) return
  const remaining =
    purpose === PaymentPurpose.DownPayment ? downRemaining.value : deliveryRemaining.value
  if (remaining <= 0) {
    notify.warning('هذه الدفعة مسددة بالكامل')
    return
  }
  payingInstallment.value = null
  payingPurpose.value = purpose
  splitPartial.value = false
  paymentDateModel.value = new Date()
  Object.assign(payForm, {
    paymentMethod: PaymentMethod.Cash,
    referenceNumber: null,
    bankName: null,
    notes: null,
    amount: remaining,
    paymentDate: new Date().toISOString(),
    installmentId: null,
    contractId: selectedContract.value.id,
    customerId: customerId.value,
    receivedById:
      employees.value.find((e) => e.complexId === selectedContract.value!.complexId)?.id || '',
    complexId: selectedContract.value.complexId,
    purpose,
    splitPartial: false,
  })
  payVisible.value = true
}

function openPayDownItem(row: Installment) {
  if (!selectedContract.value) return
  const remaining = remainingOf(row)
  if (remaining <= 0) {
    notify.warning('هذه الدفعة مسددة بالكامل')
    return
  }
  payingInstallment.value = {
    ...row,
    contractId: selectedContract.value.id,
  } as CustomerInstallment
  payingPurpose.value = PaymentPurpose.DownPayment
  splitPartial.value = false
  paymentDateModel.value = new Date()
  Object.assign(payForm, {
    paymentMethod: PaymentMethod.Cash,
    referenceNumber: null,
    bankName: null,
    notes: null,
    amount: remaining,
    paymentDate: new Date().toISOString(),
    installmentId: row.id,
    contractId: selectedContract.value.id,
    customerId: customerId.value,
    receivedById:
      employees.value.find((e) => e.complexId === selectedContract.value!.complexId)?.id || '',
    complexId: selectedContract.value.complexId,
    purpose: PaymentPurpose.DownPayment,
    splitPartial: false,
  })
  payVisible.value = true
}

async function submitPayment() {
  if (!payForm.receivedById) {
    notify.warning('اختر المستلم')
    return
  }
  if (!paymentDateModel.value) {
    notify.warning('حدد تاريخ الدفع')
    return
  }
  if (!payForm.amount || payForm.amount <= 0) {
    notify.warning('أدخل مبلغاً صالحاً')
    return
  }

  const maxAmount = currentPayRemaining()
  const overflow = Math.max(0, payForm.amount - maxAmount)

  if (overflow > 0 && !singleOverflowNext.value) {
    notify.warning('لا توجد دفعة تالية لخصم المبلغ الزائد منها')
    return
  }

  const isPartialInstallment =
    payingPurpose.value === PaymentPurpose.Installment &&
    payingInstallment.value != null &&
    payForm.amount < remainingOf(payingInstallment.value)

  paying.value = true
  try {
    payForm.paymentDate = paymentDateModel.value.toISOString()
    payForm.purpose = payingPurpose.value
    payForm.splitPartial = splitPartial.value && isPartialInstallment

    if (isPartialInstallment && !splitPartial.value) {
      notify.warning('لتسجيل مبلغ أقل من المتبقي فعّل خيار «دفع جزئي»')
      paying.value = false
      return
    }

    if (overflow > 0) {
      const batch = await processBatchPayment({
        paymentMethod: payForm.paymentMethod,
        referenceNumber: payForm.referenceNumber,
        bankName: payForm.bankName,
        notes: payForm.notes,
        amount: payForm.amount,
        paymentDate: payForm.paymentDate,
        contractId: payForm.contractId,
        customerId: payForm.customerId,
        receivedById: payForm.receivedById,
        complexId: payForm.complexId,
        purpose: payingPurpose.value,
        installmentId: payForm.installmentId,
        installmentIds: payForm.installmentId ? [payForm.installmentId] : [],
        applyOverflowToNext: true,
      })
      notify.success(`تم تسجيل الدفعة وتوزيع الفائض على ${batch.allocations.length} بند`)
      payVisible.value = false
      await loadProfile()
      await printBatch(batch.batchId)
      await offerPaymentWhatsApp({ batchId: batch.batchId })
    } else {
      const result = await processPayment({ ...payForm })
      notify.success(
        result.wasPartialSplit
          ? 'تم تسجيل دفعة جزئية وتقسيم المتبقي كدين'
          : 'تم تسجيل الدفعة بنجاح',
      )
      payVisible.value = false
      await loadProfile()
      if (result.payment?.id) {
        await printPayment(result.payment.id)
        await offerPaymentWhatsApp({ paymentId: result.payment.id })
      }
    }
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    paying.value = false
  }
}

function openMultiPay() {
  if (!selectedContract.value) return
  if (selectedMultiInstallments.value.length === 0) {
    notify.warning('اختر قسطاً واحداً على الأقل')
    return
  }
  multiAmountManual.value = false
  multiPaymentDateModel.value = new Date()
  multiPayForm.paymentMethod = PaymentMethod.Cash
  multiPayForm.referenceNumber = null
  multiPayForm.bankName = null
  multiPayForm.notes = null
  multiPayForm.receivedById =
    employees.value.find((e) => e.complexId === selectedContract.value!.complexId)?.id || ''
  multiPayForm.amount = selectedMultiTotal.value
  multiPayVisible.value = true
}

async function submitMultiPay() {
  if (!selectedContract.value) return
  if (!multiPayForm.receivedById) {
    notify.warning('اختر المستلم')
    return
  }
  if (!multiPaymentDateModel.value) {
    notify.warning('حدد تاريخ الدفع')
    return
  }
  if (!multiPayForm.amount || multiPayForm.amount <= 0) {
    notify.warning('أدخل مبلغاً صالحاً')
    return
  }
  const rows = selectedMultiInstallments.value
  if (!rows.length) {
    notify.warning('اختر قسطاً واحداً على الأقل')
    return
  }

  if (multiOverflowAmount.value > 0 && !multiOverflowNext.value) {
    notify.warning('لا توجد دفعة تالية لخصم المبلغ الزائد منها')
    return
  }

  multiPaying.value = true
  try {
    const batch = await processBatchPayment({
      paymentMethod: multiPayForm.paymentMethod,
      referenceNumber: multiPayForm.referenceNumber,
      bankName: multiPayForm.bankName,
      notes: multiPayForm.notes,
      amount: multiPayForm.amount,
      paymentDate: multiPaymentDateModel.value.toISOString(),
      contractId: selectedContract.value.id,
      customerId: customerId.value,
      receivedById: multiPayForm.receivedById,
      complexId: selectedContract.value.complexId,
      purpose: PaymentPurpose.Installment,
      installmentIds: rows.map((r) => r.id),
      applyOverflowToNext: true,
    })
    notify.success(`تم تسجيل ${batch.allocations.length} دفعة بنجاح`)
    multiPayVisible.value = false
    selectedDueInstallments.value = []
    selectedUnpaidInstallments.value = []
    await loadProfile()
    await printBatch(batch.batchId)
    await offerPaymentWhatsApp({ batchId: batch.batchId })
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    multiPaying.value = false
  }
}

async function printPayment(paymentId: string) {
  printingId.value = paymentId
  try {
    const blob = await downloadPaymentPdf(paymentId)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    printingId.value = null
  }
}

async function printBatch(batchId: string) {
  printingId.value = batchId
  try {
    const blob = await downloadPaymentBatchPdf(batchId)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    printingId.value = null
  }
}

function isCornerUnit(unitUi: UnitUi | null | undefined): boolean {
  return (
    unitUi === UnitUi.CornerFrontRight ||
    unitUi === UnitUi.CornerFrontLeft ||
    unitUi === UnitUi.CornerBackRight ||
    unitUi === UnitUi.CornerBackLeft
  )
}

function planImageForContract(contract: SalesContract): string {
  const unit = unitsById.value[contract.unitId]
  const assets = contractDesign.value?.assets
  const path = isCornerUnit(unit?.unitUi)
    ? assets?.cornerUnitImagePath
    : assets?.middleUnitImagePath
  return resolveMediaUrl(path)
}

function exteriorImageUrl(): string {
  return resolveMediaUrl(contractDesign.value?.assets?.complexExteriorImagePath)
}

function planImageTitle(contract: SalesContract): string {
  const unit = unitsById.value[contract.unitId]
  return isCornerUnit(unit?.unitUi) ? 'مخطط الوحدة الطرفية' : 'مخطط الوحدة الوسطية'
}

async function printAccountStatement() {
  statementPrinting.value = true
  try {
    const blob = await downloadCustomerAccountStatementPdf(customerId.value)
    if (blob.type && blob.type.includes('json')) {
      const text = await blob.text()
      const parsed = JSON.parse(text)
      throw new Error(parsed.message || 'فشل توليد كشف الحساب')
    }
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 120_000)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    statementPrinting.value = false
  }
}

async function downloadSelectedContractPdf() {
  if (!selectedContract.value) return
  contractPdfBusy.value = true
  try {
    const blob = await downloadSalesContractPdf(selectedContract.value.id)
    if (blob.type && blob.type.includes('json')) {
      const text = await blob.text()
      const parsed = JSON.parse(text)
      throw new Error(parsed.message || 'فشل توليد ملف PDF')
    }
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `عقد-${selectedContract.value.contractNumber || selectedContract.value.id.slice(0, 8)}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 120_000)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    contractPdfBusy.value = false
  }
}

async function printSelectedContract(variant?: 'bank') {
  if (!selectedContract.value) return
  const ALZHRAA = '08df2238-f846-4fa4-80c7-efd2f98b1109'
  const c = selectedContract.value
  // عقود الزهراء (خصوصاً بدون contractDesignId) → PDF مباشرة وليس قالب سما HTML
  if ((c.complexId || '').toLowerCase() === ALZHRAA && variant !== 'bank') {
    contractPdfBusy.value = true
    try {
      const blob = await downloadSalesContractPdf(c.id)
      if (blob.type && blob.type.includes('json')) {
        const text = await blob.text()
        const parsed = JSON.parse(text)
        throw new Error(parsed.message || 'فشل توليد ملف PDF')
      }
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 120_000)
    } catch (error) {
      notify.error(getErrorMessage(error))
    } finally {
      contractPdfBusy.value = false
    }
    return
  }
  const resolved = router.resolve({
    name: 'sales-contract-print',
    params: { id: c.id },
    query: variant ? { variant } : undefined,
  })
  window.open(resolved.href, '_blank', 'noopener,noreferrer')
}

function openBankPrintModal() {
  if (!selectedContract.value) return
  const c = selectedContract.value
  bankPaymentRows.value = [
    { label: 'الدفعة الاولى', amount: c.downPayment || null },
    { label: 'المبلغ المتبقي (قسط)', amount: c.remainingAmount || null },
  ]
  bankPrintVisible.value = true
}

function addBankPaymentRow() {
  bankPaymentRows.value.push({ label: '', amount: null })
}

function removeBankPaymentRow(index: number) {
  if (bankPaymentRows.value.length <= 1) return
  bankPaymentRows.value.splice(index, 1)
}

function confirmBankPrint() {
  if (!selectedContract.value) return
  const lines: BankPdfPaymentLine[] = bankPaymentRows.value
    .map((row) => ({
      label: (row.label || '').trim(),
      amount: Number(row.amount) || 0,
    }))
    .filter((row) => row.label)

  if (lines.length === 0) {
    notify.warning('أضف سطراً واحداً على الأقل لتفاصيل الدفع')
    return
  }

  // localStorage لأن sessionStorage لا يُشارك مع تبويب الطباعة الجديد
  localStorage.setItem(
    `bankPdf:${selectedContract.value.id}`,
    JSON.stringify({ paymentLines: lines, savedAt: Date.now() }),
  )
  bankPrintVisible.value = false
  printSelectedContract('bank')
}

async function removeSelectedContract() {
  if (!selectedContract.value) return
  if (!(await ask('حذف هذا العقد؟ سيتم تحرير رقم العقد وإرجاع الوحدة إن أمكن.'))) return
  try {
    await deleteSalesContract(selectedContract.value.id)
    notify.success('تم حذف العقد')
    selectedContractId.value = null
    await loadProfile()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

async function removePaymentRow(paymentId: string) {
  if (!(await ask('حذف هذه الدفعة وإرجاع حالة القسط؟'))) return
  try {
    await deletePayment(paymentId)
    notify.success('تم حذف الدفعة')
    await loadProfile()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

async function loadDocuments() {
  documentsLoading.value = true
  try {
    const data = await getCustomerDocuments(customerId.value, { Page: 1, PageSize: 200 })
    documents.value = data.items ?? []
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    documentsLoading.value = false
  }
}

async function loadWhatsAppLogs() {
  waLogsLoading.value = true
  try {
    waLogs.value = await getCustomerWhatsAppLogs(customerId.value)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    waLogsLoading.value = false
  }
}

async function sendCustomerTestWhatsApp() {
  if (!customer.value?.phone) {
    notify.warning('لا يوجد رقم هاتف لهذا العميل')
    return
  }
  waSending.value = true
  try {
    await sendWhatsAppTemplate({
      templateType: waTemplateType.value,
      customerId: customer.value.id,
      contractId: selectedContract.value?.id,
      complexId: customer.value.complexId,
    })
    notify.success('تم إرسال رسالة واتساب')
    await loadWhatsAppLogs()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    waSending.value = false
  }
}

async function sendCustomWhatsApp() {
  if (!customer.value?.phone) {
    notify.warning('لا يوجد رقم هاتف لهذا العميل')
    return
  }
  if (!waTestMessage.value.trim()) {
    notify.warning('أدخل نص الرسالة')
    return
  }
  waSending.value = true
  try {
    await sendWhatsAppMessage({
      customerId: customer.value.id,
      phone: customer.value.phone,
      message: waTestMessage.value.trim(),
      isTest: false,
      complexId: customer.value.complexId,
    })
    notify.success('تم إرسال الرسالة عبر رقم واتساب المجمع')
    await loadWhatsAppLogs()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    waSending.value = false
  }
}

async function offerPaymentWhatsApp(opts: { batchId?: string; paymentId?: string }) {
  if (!sendWaAfterPay.value || !customer.value?.phone) return
  try {
    await sendWhatsAppTemplate({
      templateType: WhatsAppTemplateType.PaymentReceipt,
      customerId: customer.value.id,
      contractId: selectedContract.value?.id,
      paymentId: opts.paymentId,
      batchId: opts.batchId,
      complexId: customer.value.complexId,
    })
    notify.success('تم إرسال رسالة تأكيد الدفع عبر واتساب')
    if (profileSection.value === 'whatsapp') await loadWhatsAppLogs()
  } catch (error) {
    notify.error(getErrorMessage(error) || 'تعذر إرسال واتساب بعد الدفع')
  }
}

function triggerDocPick() {
  docInputRef.value?.click()
}

function onDocFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const allowed = ['.pdf', '.png', '.jpg', '.jpeg']
  const ext = `.${file.name.split('.').pop()?.toLowerCase() || ''}`
  if (!allowed.includes(ext)) {
    notify.warning('يُسمح فقط بملفات PDF و PNG و JPG')
    return
  }
  docFile.value = file
}

async function submitDocument() {
  if (!docFile.value) {
    notify.warning('اختر ملفاً للرفع')
    return
  }
  uploadingDoc.value = true
  try {
    await uploadCustomerDocument(customerId.value, docFile.value, {
      referenceNumber: docForm.referenceNumber,
      notes: docForm.notes,
    })
    notify.success('تم رفع المستند')
    docFile.value = null
    docForm.referenceNumber = null
    docForm.notes = null
    await loadDocuments()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    uploadingDoc.value = false
  }
}

async function downloadDocument(doc: CustomerDocument) {
  if (!doc.filePath && !doc.id) {
    notify.warning('لا يوجد ملف للتنزيل')
    return
  }
  downloadingDocId.value = doc.id
  try {
    const blob = await downloadCustomerDocument(customerId.value, doc.id)
    if (blob.type && blob.type.includes('json')) {
      const text = await blob.text()
      const parsed = JSON.parse(text) as { message?: string }
      throw new Error(parsed.message || 'فشل تنزيل المستند')
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.originalFileName || `مستند-${doc.id.slice(0, 8)}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    downloadingDocId.value = null
  }
}

async function removeDocument(doc: CustomerDocument) {
  if (!(await ask('حذف هذا المستند؟'))) return
  try {
    await deleteCustomerDocument(customerId.value, doc.id)
    notify.success('تم حذف المستند')
    documents.value = documents.value.filter((d) => d.id !== doc.id)
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

async function loadProfile() {
  loading.value = true
  try {
    const customerData = await getCustomer(customerId.value)
    customer.value = customerData

    const [complexResult, contractResult, paymentResult, unitResult, employeeResult, designResult] =
      await Promise.all([
        getComplexes({ Page: 1, PageSize: 200 }),
        getSalesContracts({ CustomerId: customerId.value, Page: 1, PageSize: 200 }),
        getPayments({ CustomerId: customerId.value, Page: 1, PageSize: 500 }),
        getUnits({ ComplexId: customerData.complexId, Page: 1, PageSize: 500 }),
        getEmployees({ Page: 1, PageSize: 500 }),
        getContractDesigns({ ComplexId: customerData.complexId, Page: 1, PageSize: 20 }),
        loadDocuments(),
        loadWhatsAppLogs(),
      ])

    complex.value =
      (complexResult.items ?? []).find((c) => c.id === customerData.complexId) ?? null
    contracts.value = contractResult.items ?? []
    payments.value = (paymentResult.items ?? []).sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
    )
    employees.value = employeeResult.items ?? []
    const units = unitResult.items ?? []
    unitMap.value = Object.fromEntries(
      units.map((u: Unit) => [u.id, u.unitNumber || u.id.slice(0, 8)]),
    )
    unitsById.value = Object.fromEntries(units.map((u: Unit) => [u.id, u]))
    contractDesign.value = (designResult.items ?? [])[0] ?? null

    const detailed = await Promise.all(
      contracts.value.map(async (c) => {
        try {
          return await getSalesContract(c.id)
        } catch {
          return c
        }
      }),
    )
    contracts.value = detailed

    if (!selectedContractId.value || !detailed.some((c) => c.id === selectedContractId.value)) {
      selectedContractId.value = detailed[0]?.id ?? null
    }

    installments.value = detailed.flatMap((contract) =>
      (contract.installments ?? []).map((inst) => ({
        ...inst,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
      })),
    )
  } catch (error) {
    notify.error(getErrorMessage(error))
    customer.value = null
  } finally {
    loading.value = false
  }
}

watch(selectedContractId, () => {
  selectedDueInstallments.value = []
  selectedUnpaidInstallments.value = []
  if (!selectedContractId.value) activeTab.value = 'documents'
})

watch(profileSection, (section) => {
  if (section === 'payments' && !selectedContractId.value) activeTab.value = 'documents'
})

watch(selectedMultiInstallments, () => {
  if (multiPayVisible.value) syncMultiAmount()
})

watch(customerId, () => {
  selectedContractId.value = null
  void loadProfile()
})

onMounted(() => {
  void loadProfile()
})
</script>

<template>
  <div class="page">
    <PageHeader :title="fullName" subtitle="بروفايل العميل — التفاصيل والدفعات">
      <template #actions>
        <Button
          label="رجوع"
          icon="pi pi-arrow-right"
          severity="secondary"
          outlined
          @click="router.push({ name: 'customers' })"
        />
      </template>
    </PageHeader>

    <div v-if="loading" class="loading-box">
      <ProgressSpinner stroke-width="3" />
    </div>

    <template v-else-if="customer">
      <nav class="profile-nav">
        <button
          type="button"
          class="profile-nav__item"
          :class="{ 'is-active': profileSection === 'personal' }"
          @click="profileSection = 'personal'"
        >
          المعلومات الشخصية
        </button>
        <button
          type="button"
          class="profile-nav__item"
          :class="{ 'is-active': profileSection === 'contracts' }"
          @click="profileSection = 'contracts'"
        >
          العقود
        </button>
        <button
          type="button"
          class="profile-nav__item"
          :class="{ 'is-active': profileSection === 'payments' }"
          @click="profileSection = 'payments'"
        >
          المدفوعات
        </button>
        <button
          type="button"
          class="profile-nav__item"
          :class="{ 'is-active': profileSection === 'statement' }"
          @click="profileSection = 'statement'"
        >
          كشف الحساب
        </button>
        <button
          type="button"
          class="profile-nav__item"
          :class="{ 'is-active': profileSection === 'whatsapp' }"
          @click="profileSection = 'whatsapp'"
        >
          واتساب
        </button>
      </nav>

      <div v-if="profileSection === 'personal'" class="data-panel">
        <h3 class="section-title">المعلومات الشخصية</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">الاسم</span>
            <span class="detail-value">{{ fullName }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">الهاتف</span>
            <span class="detail-value">{{ customer.phone || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">البريد</span>
            <span class="detail-value">{{ customer.email || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">الرقم الوطني</span>
            <span class="detail-value">{{ customer.nationalID || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">جواز السفر</span>
            <span class="detail-value">{{ customer.passport || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">تاريخ الميلاد</span>
            <span class="detail-value">{{ formatDate(customer.birthDate) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">المجمع</span>
            <span class="detail-value">{{ complex?.nameAr || complex?.name || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">الحالة الاجتماعية</span>
            <span class="detail-value">{{ labelOf(maritalStatusOptions, customer.maritalStatus) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">التحصيل الدراسي</span>
            <span class="detail-value">{{ labelOf(educationLevelOptions, customer.educationLevel) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">المهنة</span>
            <span class="detail-value">{{ customer.occupation || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">جهة العمل</span>
            <span class="detail-value">{{ customer.employer || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">الدخل الشهري</span>
            <span class="detail-value">{{ customer.monthlyIncome != null ? formatMoney(customer.monthlyIncome) : '—' }}</span>
          </div>
          <div class="detail-item full">
            <span class="detail-label">العنوان</span>
            <span class="detail-value">{{ customer.address || '—' }}</span>
          </div>
          <div class="detail-item full">
            <span class="detail-label">الملاحظات</span>
            <span class="detail-value">{{ customer.notes || '—' }}</span>
          </div>
        </div>
      </div>

      <div v-else-if="profileSection === 'contracts'" class="data-panel contract-panel">
        <div class="contract-toolbar">
          <h3 class="section-title">العقود</h3>
          <div class="contract-toolbar__actions">
            <Select
              v-model="selectedContractId"
              :options="contractOptions"
              option-label="label"
              option-value="id"
              placeholder="اختر العقد"
              checkmark
              append-to="body"
              class="contract-select"
            />
            <Button
              label="تحميل PDF"
              icon="pi pi-file-pdf"
              severity="secondary"
              outlined
              size="small"
              :disabled="!selectedContract"
              :loading="contractPdfBusy"
              @click="downloadSelectedContractPdf"
            />
            <Button
              label="طباعة"
              icon="pi pi-print"
              size="small"
              :disabled="!selectedContract"
              @click="printSelectedContract()"
            />
            <Button
              label="طباعة المصرف العقاري"
              icon="pi pi-building"
              severity="help"
              outlined
              size="small"
              :disabled="!selectedContract"
              @click="openBankPrintModal"
            />
            <Button
              label="حذف العقد"
              icon="pi pi-trash"
              severity="danger"
              outlined
              size="small"
              :disabled="!selectedContract"
              @click="removeSelectedContract"
            />
          </div>
        </div>

        <template v-if="selectedContract">
          <div class="summary-row">
            <div class="summary-card is-due">
              <span>المستحق الآن</span>
              <strong>{{ formatMoney(dueTotal) }}</strong>
              <small>{{ dueInstallments.length }} قسط</small>
            </div>
            <div class="summary-card is-unpaid">
              <span>غير مدفوع (قادم)</span>
              <strong>{{ formatMoney(unpaidTotal) }}</strong>
              <small>{{ unpaidInstallments.length }} قسط</small>
            </div>
            <div class="summary-card is-paid">
              <span>مدفوعات هذا العقد</span>
              <strong>{{ formatMoney(paidTotal) }}</strong>
              <small>{{ contractPayments.length }} دفعة</small>
            </div>
            <div class="summary-card">
              <span>المتبقي بالعقد</span>
              <strong>{{ formatMoney(selectedContract.remainingAmount) }}</strong>
              <small>{{ unitMap[selectedContract.unitId] || 'وحدة' }}</small>
            </div>
          </div>

          <div class="purpose-cards">
            <div class="purpose-card">
              <div class="purpose-card__head">
                <h4>دفعة المقدمة</h4>
                <span class="badge" :class="downRemaining <= 0 ? 'is-ok' : 'is-warn'">
                  {{ downRemaining <= 0 ? 'مسددة' : 'متبقي' }}
                </span>
              </div>
              <div class="purpose-card__grid">
                <div><span>المطلوب</span><strong>{{ formatMoney(selectedContract.downPayment) }}</strong></div>
                <div><span>المدفوع</span><strong>{{ formatMoney(downPaid) }}</strong></div>
                <div><span>المتبقي</span><strong>{{ formatMoney(downRemaining) }}</strong></div>
              </div>
              <template v-if="hasDownPaymentSchedule">
                <div
                  v-for="(item, idx) in downPaymentScheduleItems"
                  :key="item.id"
                  class="purpose-card__item"
                >
                  <div>
                    <strong>{{ downItemLabel(item, idx) }}</strong>
                    <small>{{ formatDate(item.dueDate) }} · متبقي {{ formatMoney(remainingOf(item)) }}</small>
                  </div>
                  <Button
                    label="دفع"
                    icon="pi pi-wallet"
                    size="small"
                    :disabled="remainingOf(item) <= 0"
                    @click="openPayDownItem(item)"
                  />
                </div>
              </template>
              <Button
                v-else
                label="تسجيل دفعة"
                icon="pi pi-wallet"
                size="small"
                :disabled="downRemaining <= 0"
                @click="openPayPurpose(PaymentPurpose.DownPayment)"
              />
            </div>

            <div class="purpose-card">
              <div class="purpose-card__head">
                <h4>دفعة الاستلام</h4>
                <span class="badge" :class="deliveryRemaining <= 0 ? 'is-ok' : 'is-warn'">
                  {{ deliveryRemaining <= 0 ? 'مسددة' : 'متبقي' }}
                </span>
              </div>
              <div class="purpose-card__grid">
                <div><span>المطلوب</span><strong>{{ formatMoney(selectedContract.deliveryAmount) }}</strong></div>
                <div><span>المدفوع</span><strong>{{ formatMoney(deliveryPaid) }}</strong></div>
                <div><span>المتبقي</span><strong>{{ formatMoney(deliveryRemaining) }}</strong></div>
              </div>
              <Button
                label="تسجيل دفعة"
                icon="pi pi-wallet"
                size="small"
                :disabled="deliveryRemaining <= 0"
                @click="openPayPurpose(PaymentPurpose.Delivery)"
              />
            </div>
          </div>

          <div class="contract-meta">
            <span>رقم العقد: <strong>{{ selectedContract.contractNumber || '—' }}</strong></span>
            <span>الحالة: <strong>{{ labelOf(contractStatusOptions, selectedContract.contractStatus) }}</strong></span>
            <span>الدفع: <strong>{{ labelOf(contractPaymentTypeOptions, selectedContract.contractPaymentType) }}</strong></span>
            <span>التاريخ: <strong>{{ formatDate(selectedContract.contractDate) }}</strong></span>
          </div>
        </template>
        <div v-else class="empty-box">لا توجد عقود لهذا العميل</div>
      </div>

      <div v-else-if="profileSection === 'statement'" class="data-panel contract-panel">
        <div class="contract-toolbar">
          <h3 class="section-title">كشف الحساب</h3>
          <Button
            label="طباعة"
            icon="pi pi-print"
            :loading="statementPrinting"
            @click="printAccountStatement"
          />
        </div>

        <div class="statement-block">
          <h4 class="statement-subtitle">معلومات العميل</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">الاسم</span>
              <span class="detail-value">{{ fullName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">الهاتف</span>
              <span class="detail-value">{{ customer.phone || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">الرقم الوطني</span>
              <span class="detail-value">{{ customer.nationalID || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">المهنة</span>
              <span class="detail-value">{{ customer.occupation || '—' }}</span>
            </div>
            <div class="detail-item full">
              <span class="detail-label">العنوان</span>
              <span class="detail-value">{{ customer.address || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">عدد العقود</span>
              <span class="detail-value">{{ contracts.length }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">المجمع</span>
              <span class="detail-value">{{ complex?.nameAr || complex?.name || '—' }}</span>
            </div>
          </div>
        </div>

        <div v-if="!contracts.length" class="empty-box">لا توجد عقود لهذا العميل</div>

        <div
          v-for="contract in contracts"
          :key="contract.id"
          class="statement-contract"
        >
          <h4 class="statement-subtitle">
            العقد: {{ contract.contractNumber || contract.id.slice(0, 8) }}
            <small>— الوحدة {{ unitMap[contract.unitId] || '—' }}</small>
          </h4>

          <div class="detail-grid statement-table">
            <div class="detail-item">
              <span class="detail-label">نوع العقد</span>
              <span class="detail-value">{{ labelOf(contractTypeOptions, contract.contractType) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">الحالة</span>
              <span class="detail-value">{{ labelOf(contractStatusOptions, contract.contractStatus) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">طريقة الدفع</span>
              <span class="detail-value">{{ labelOf(contractPaymentTypeOptions, contract.contractPaymentType) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">سعر البيع</span>
              <span class="detail-value">{{ formatMoney(contract.sellingPrice) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">الخصم</span>
              <span class="detail-value">{{ formatMoney(contract.discount) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">المقدمة</span>
              <span class="detail-value">{{ formatMoney(contract.downPayment) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">مبلغ الاستلام</span>
              <span class="detail-value">{{ formatMoney(contract.deliveryAmount) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">المتبقي</span>
              <span class="detail-value">{{ formatMoney(contract.remainingAmount) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">تاريخ العقد</span>
              <span class="detail-value">{{ formatDate(contract.contractDate) }}</span>
            </div>
          </div>

          <DataTable
            v-if="paymentScheduleRowsForContract(contract).length > 0"
            :value="paymentScheduleRowsForContract(contract)"
            class="p-datatable-sm statement-pay-table"
            striped-rows
          >
            <Column field="label" header="رقم الدفع" />
            <Column header="تاريخ استحقاق الدفع">
              <template #body="{ data }">{{ formatDate(data.dueDate) }}</template>
            </Column>
            <Column header="المبلغ">
              <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
            </Column>
          </DataTable>

          <div class="statement-images">
            <figure v-if="planImageForContract(contract)" class="statement-figure">
              <figcaption>{{ planImageTitle(contract) }}</figcaption>
              <img :src="planImageForContract(contract)" :alt="planImageTitle(contract)" />
            </figure>
            <figure v-if="exteriorImageUrl()" class="statement-figure">
              <figcaption>صورة المجمع من الخارج</figcaption>
              <img :src="exteriorImageUrl()" alt="صورة المجمع من الخارج" />
            </figure>
          </div>
        </div>
      </div>

      <div v-else-if="profileSection === 'payments'" class="data-panel contract-panel">
        <div class="contract-toolbar">
          <h3 class="section-title">المدفوعات</h3>
          <Select
            v-model="selectedContractId"
            :options="contractOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر العقد"
            checkmark
            append-to="body"
            class="contract-select"
          />
        </div>

        <template v-if="selectedContract">
          <div class="multi-pay-bar">
            <Button
              label="دفع أكثر من قسط"
              icon="pi pi-wallet"
              severity="help"
              outlined
              :disabled="selectedMultiInstallments.length === 0"
              @click="openMultiPay"
            />
            <small v-if="selectedMultiInstallments.length">
              محدد: {{ selectedMultiInstallments.length }} — {{ formatMoney(selectedMultiTotal) }}
            </small>
          </div>

          <Tabs v-model:value="activeTab">
            <TabList>
              <Tab value="due">
                <span class="tab-label">مستحقة <span class="tab-count">{{ dueInstallments.length }}</span></span>
              </Tab>
              <Tab value="unpaid">
                <span class="tab-label">غير مدفوعة <span class="tab-count">{{ unpaidInstallments.length }}</span></span>
              </Tab>
              <Tab value="payments">
                <span class="tab-label">سجل المدفوعات <span class="tab-count">{{ contractPayments.length }}</span></span>
              </Tab>
              <Tab value="partial">
                <span class="tab-label">مدفوعات جزئية <span class="tab-count">{{ partialPayments.length }}</span></span>
              </Tab>
              <Tab value="documents">
                <span class="tab-label">المستندات <span class="tab-count">{{ documents.length }}</span></span>
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel value="due">
                <DataTable
                  v-model:selection="selectedDueInstallments"
                  :value="dueInstallments"
                  data-key="id"
                  size="small"
                  striped-rows
                >
                  <Column selection-mode="multiple" header-style="width: 3rem" />
                  <Column header="الدفعة" style="width: 130px">
                    <template #body="{ data }">{{ installmentLabelOf(data) }}</template>
                  </Column>
                  <Column header="الاستحقاق" style="width: 120px">
                    <template #body="{ data }">{{ formatDate(data.dueDate) }}</template>
                  </Column>
                  <Column header="المبلغ" style="width: 110px">
                    <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
                  </Column>
                  <Column header="المدفوع" style="width: 110px">
                    <template #body="{ data }">{{ formatMoney(data.paidAmount) }}</template>
                  </Column>
                  <Column header="المتبقي" style="width: 110px">
                    <template #body="{ data }">{{ formatMoney(remainingOf(data)) }}</template>
                  </Column>
                  <Column header="الحالة" style="width: 100px">
                    <template #body="{ data }">
                      {{ installmentStatusLabel(data.status, data.dueDate) }}
                    </template>
                  </Column>
                  <Column header="" style="width: 100px">
                    <template #body="{ data }">
                      <Button
                        label="دفع"
                        icon="pi pi-wallet"
                        size="small"
                        :disabled="remainingOf(data) <= 0"
                        @click="openPayRow(data)"
                      />
                    </template>
                  </Column>
                  <template #empty><div class="empty-box">لا توجد أقساط مستحقة</div></template>
                </DataTable>
              </TabPanel>

              <TabPanel value="unpaid">
                <DataTable
                  v-model:selection="selectedUnpaidInstallments"
                  :value="unpaidInstallments"
                  data-key="id"
                  size="small"
                  striped-rows
                >
                  <Column selection-mode="multiple" header-style="width: 3rem" />
                  <Column header="الدفعة" style="width: 130px">
                    <template #body="{ data }">{{ installmentLabelOf(data) }}</template>
                  </Column>
                  <Column header="الاستحقاق" style="width: 120px">
                    <template #body="{ data }">{{ formatDate(data.dueDate) }}</template>
                  </Column>
                  <Column header="المبلغ" style="width: 110px">
                    <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
                  </Column>
                  <Column header="المتبقي" style="width: 110px">
                    <template #body="{ data }">{{ formatMoney(remainingOf(data)) }}</template>
                  </Column>
                  <Column header="الحالة" style="width: 100px">
                    <template #body="{ data }">
                      {{ installmentStatusLabel(data.status, data.dueDate) }}
                    </template>
                  </Column>
                  <Column header="" style="width: 100px">
                    <template #body="{ data }">
                      <Button
                        label="دفع"
                        icon="pi pi-wallet"
                        size="small"
                        severity="secondary"
                        outlined
                        :disabled="remainingOf(data) <= 0"
                        @click="openPayRow(data)"
                      />
                    </template>
                  </Column>
                  <template #empty><div class="empty-box">لا توجد أقساط قادمة</div></template>
                </DataTable>
              </TabPanel>

              <TabPanel value="payments">
                <DataTable :value="contractPayments" size="small" striped-rows>
                  <Column header="التاريخ" style="width: 120px">
                    <template #body="{ data }">{{ formatDate(data.paymentDate) }}</template>
                  </Column>
                  <Column header="الدفعة" style="width: 140px">
                    <template #body="{ data }">{{ paymentInstallmentLabel(data) }}</template>
                  </Column>
                  <Column header="النوع" style="width: 120px">
                    <template #body="{ data }">{{ purposeLabel(data.purpose) }}</template>
                  </Column>
                  <Column header="المبلغ" style="width: 120px">
                    <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
                  </Column>
                  <Column header="الطريقة" style="width: 120px">
                    <template #body="{ data }">
                      {{ labelOf(paymentMethodOptions, data.paymentMethod) }}
                    </template>
                  </Column>
                  <Column header="المرجع">
                    <template #body="{ data }">{{ data.referenceNumber || '—' }}</template>
                  </Column>
                  <Column header="" style="width: 210px">
                    <template #body="{ data }">
                      <div class="row-actions-wrap">
                        <Button
                          label="طباعة"
                          icon="pi pi-print"
                          size="small"
                          outlined
                          :loading="printingId === data.id"
                          @click="printPayment(data.id)"
                        />
                        <Button
                          label="حذف"
                          icon="pi pi-trash"
                          size="small"
                          severity="danger"
                          outlined
                          @click="removePaymentRow(data.id)"
                        />
                      </div>
                    </template>
                  </Column>
                  <template #empty><div class="empty-box">لا توجد مدفوعات لهذا العقد</div></template>
                </DataTable>
              </TabPanel>

              <TabPanel value="partial">
                <p class="tab-hint">سجل الدفعات الجزئية التي قسّمت القسط إلى مدفوع + دين</p>
                <DataTable :value="partialPayments" size="small" striped-rows>
                  <Column header="التاريخ" style="width: 120px">
                    <template #body="{ data }">{{ formatDate(data.paymentDate) }}</template>
                  </Column>
                  <Column header="المبلغ المدفوع" style="width: 130px">
                    <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
                  </Column>
                  <Column header="الطريقة" style="width: 120px">
                    <template #body="{ data }">
                      {{ labelOf(paymentMethodOptions, data.paymentMethod) }}
                    </template>
                  </Column>
                  <Column header="" style="width: 110px">
                    <template #body="{ data }">
                      <Button
                        label="طباعة"
                        icon="pi pi-print"
                        size="small"
                        outlined
                        :loading="printingId === data.id"
                        @click="printPayment(data.id)"
                      />
                    </template>
                  </Column>
                  <template #empty><div class="empty-box">لا توجد مدفوعات جزئية</div></template>
                </DataTable>
              </TabPanel>

              <TabPanel value="documents">
                <div class="docs-upload">
                  <div class="form-grid">
                    <div class="field">
                      <label>رقم المرجع</label>
                      <Select
                        v-model="docForm.referenceNumber"
                        :options="paymentReferenceOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="اختر أو اكتب رقم المرجع"
                        show-clear
                        editable
                        filter
                        append-to="body"
                      />
                    </div>
                    <div class="field">
                      <label>الملف (PDF / PNG / JPG)</label>
                      <div class="docs-file-row">
                        <Button
                          label="اختيار ملف"
                          icon="pi pi-upload"
                          severity="secondary"
                          outlined
                          @click="triggerDocPick"
                        />
                        <span class="docs-file-name">{{ docFile?.name || 'لم يُختر ملف' }}</span>
                      </div>
                      <input
                        ref="docInputRef"
                        type="file"
                        class="hidden-input"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        @change="onDocFileSelected"
                      >
                    </div>
                    <div class="field full">
                      <label>الملاحظات</label>
                      <Textarea
                        v-model="docForm.notes"
                        rows="2"
                        auto-resize
                        placeholder="ملاحظات المستند (اختياري)"
                      />
                    </div>
                  </div>
                  <div class="dialog-actions docs-actions">
                    <Button
                      label="رفع المستند"
                      icon="pi pi-check"
                      :loading="uploadingDoc"
                      :disabled="!docFile"
                      @click="submitDocument"
                    />
                  </div>
                </div>

                <DataTable
                  :value="documents"
                  :loading="documentsLoading"
                  size="small"
                  striped-rows
                  class="docs-table"
                >
                  <Column header="التاريخ" style="width: 120px">
                    <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
                  </Column>
                  <Column header="رقم المرجع" style="width: 140px">
                    <template #body="{ data }">{{ data.referenceNumber || '—' }}</template>
                  </Column>
                  <Column header="الملف">
                    <template #body="{ data }">
                      <a
                        v-if="data.filePath"
                        :href="mediaUrl(data.filePath)"
                        target="_blank"
                        rel="noopener"
                      >
                        {{ data.originalFileName || 'عرض الملف' }}
                      </a>
                      <span v-else>—</span>
                    </template>
                  </Column>
                  <Column header="الملاحظات">
                    <template #body="{ data }">{{ data.notes || '—' }}</template>
                  </Column>
                  <Column header="" style="width: 180px">
                    <template #body="{ data }">
                      <div class="docs-actions">
                        <Button
                          v-if="data.filePath"
                          icon="pi pi-download"
                          label="تنزيل"
                          severity="secondary"
                          text
                          size="small"
                          :loading="downloadingDocId === data.id"
                          @click="downloadDocument(data)"
                        />
                        <Button
                          icon="pi pi-trash"
                          severity="danger"
                          text
                          rounded
                          @click="removeDocument(data)"
                        />
                      </div>
                    </template>
                  </Column>
                  <template #empty><div class="empty-box">لا توجد مستندات</div></template>
                </DataTable>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </template>
        <template v-else>
          <p class="tab-hint">لا يوجد عقد محدد — يمكنك إدارة مستندات العميل هنا.</p>
          <Tabs v-model:value="activeTab">
            <TabList>
              <Tab value="documents">
                <span class="tab-label">المستندات <span class="tab-count">{{ documents.length }}</span></span>
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel value="documents">
                <div class="docs-upload">
                  <div class="form-grid">
                    <div class="field">
                      <label>رقم المرجع</label>
                      <Select
                        v-model="docForm.referenceNumber"
                        :options="paymentReferenceOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="اختر أو اكتب رقم المرجع"
                        show-clear
                        editable
                        filter
                        append-to="body"
                      />
                    </div>
                    <div class="field">
                      <label>الملف (PDF / PNG / JPG)</label>
                      <div class="docs-file-row">
                        <Button
                          label="اختيار ملف"
                          icon="pi pi-upload"
                          severity="secondary"
                          outlined
                          @click="triggerDocPick"
                        />
                        <span class="docs-file-name">{{ docFile?.name || 'لم يُختر ملف' }}</span>
                      </div>
                      <input
                        ref="docInputRef"
                        type="file"
                        class="hidden-input"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        @change="onDocFileSelected"
                      >
                    </div>
                    <div class="field full">
                      <label>الملاحظات</label>
                      <Textarea
                        v-model="docForm.notes"
                        rows="2"
                        auto-resize
                        placeholder="ملاحظات المستند (اختياري)"
                      />
                    </div>
                  </div>
                  <div class="dialog-actions docs-actions">
                    <Button
                      label="رفع المستند"
                      icon="pi pi-check"
                      :loading="uploadingDoc"
                      :disabled="!docFile"
                      @click="submitDocument"
                    />
                  </div>
                </div>

                <DataTable
                  :value="documents"
                  :loading="documentsLoading"
                  size="small"
                  striped-rows
                  class="docs-table"
                >
                  <Column header="التاريخ" style="width: 120px">
                    <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
                  </Column>
                  <Column header="رقم المرجع" style="width: 140px">
                    <template #body="{ data }">{{ data.referenceNumber || '—' }}</template>
                  </Column>
                  <Column header="الملف">
                    <template #body="{ data }">
                      <a
                        v-if="data.filePath"
                        :href="mediaUrl(data.filePath)"
                        target="_blank"
                        rel="noopener"
                      >
                        {{ data.originalFileName || 'عرض الملف' }}
                      </a>
                      <span v-else>—</span>
                    </template>
                  </Column>
                  <Column header="الملاحظات">
                    <template #body="{ data }">{{ data.notes || '—' }}</template>
                  </Column>
                  <Column header="" style="width: 180px">
                    <template #body="{ data }">
                      <div class="docs-actions">
                        <Button
                          v-if="data.filePath"
                          icon="pi pi-download"
                          label="تنزيل"
                          severity="secondary"
                          text
                          size="small"
                          :loading="downloadingDocId === data.id"
                          @click="downloadDocument(data)"
                        />
                        <Button
                          icon="pi pi-trash"
                          severity="danger"
                          text
                          rounded
                          @click="removeDocument(data)"
                        />
                      </div>
                    </template>
                  </Column>
                  <template #empty><div class="empty-box">لا توجد مستندات</div></template>
                </DataTable>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </template>
      </div>

      <div v-else-if="profileSection === 'whatsapp'" class="data-panel">
        <div class="section-head-row">
          <h3 class="section-title">سجل إرسالات واتساب</h3>
          <small>يُرسل عبر رقم واتساب الخاص بمجمع هذا العميل</small>
        </div>

        <div class="docs-upload">
          <div class="form-grid">
            <div class="field">
              <label>هاتف العميل</label>
              <InputText :model-value="customer.phone || '—'" disabled dir="ltr" />
            </div>
            <div class="field">
              <label>نوع الرسالة</label>
              <Select
                v-model="waTemplateType"
                :options="whatsAppTemplateOptions"
                option-label="label"
                option-value="value"
                placeholder="اختر الإجراء"
                checkmark
                append-to="body"
              />
            </div>
            <div class="field full">
              <label>رسالة مخصصة (اختياري — بدل القالب)</label>
              <Textarea v-model="waTestMessage" rows="3" auto-resize />
            </div>
          </div>
          <div class="dialog-actions docs-actions">
            <Button
              label="إرسال حسب القالب"
              icon="pi pi-whatsapp"
              severity="success"
              :loading="waSending"
              :disabled="!customer.phone"
              @click="sendCustomerTestWhatsApp"
            />
            <Button
              label="إرسال النص المخصص"
              icon="pi pi-send"
              severity="help"
              outlined
              :loading="waSending"
              :disabled="!customer.phone || !waTestMessage.trim()"
              @click="sendCustomWhatsApp"
            />
            <Button
              label="تحديث السجل"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              :loading="waLogsLoading"
              @click="loadWhatsAppLogs"
            />
          </div>
        </div>

        <DataTable :value="waLogs" :loading="waLogsLoading" size="small" striped-rows>
          <Column header="التاريخ" style="width: 140px">
            <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
          </Column>
          <Column header="إلى" style="width: 130px">
            <template #body="{ data }">{{ data.toPhone }}</template>
          </Column>
          <Column header="الرسالة">
            <template #body="{ data }">{{ data.message }}</template>
          </Column>
          <Column header="النوع" style="width: 90px">
            <template #body="{ data }">{{ data.isTest ? 'تجريبي' : 'عادي' }}</template>
          </Column>
          <Column header="الحالة" style="width: 100px">
            <template #body="{ data }">
              <span :class="data.success ? 'wa-ok' : 'wa-bad'">
                {{ data.success ? 'نجاح' : 'فشل' }}
              </span>
            </template>
          </Column>
          <Column header="ملاحظة">
            <template #body="{ data }">{{ data.errorMessage || data.providerMessageId || '—' }}</template>
          </Column>
          <template #empty><div class="empty-box">لا توجد إرسالات بعد</div></template>
        </DataTable>
      </div>


      <Dialog
        v-model:visible="bankPrintVisible"
        modal
        header="تفاصيل الدفع — طباعة المصرف العقاري"
        :style="{ width: '560px' }"
      >
        <div class="bank-pay-table">
          <div class="bank-pay-table__head">
            <span>تفاصيل الدفع</span>
            <span>المبلغ (دينار عراقي)</span>
            <span></span>
          </div>
          <div
            v-for="(row, index) in bankPaymentRows"
            :key="index"
            class="bank-pay-table__row"
          >
            <InputText v-model="row.label" placeholder="اسم الحقل" />
            <InputNumber
              v-model="row.amount"
              :min="0"
              :max-fraction-digits="0"
              class="w-full"
              placeholder="المبلغ"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              :disabled="bankPaymentRows.length <= 1"
              @click="removeBankPaymentRow(index)"
            />
          </div>
          <div class="bank-pay-table__total">
            <span>المبلغ الكلي</span>
            <strong>{{ formatMoney(bankPaymentTotal) }}</strong>
            <span></span>
          </div>
        </div>
        <div class="dialog-actions" style="margin-top: 12px; justify-content: space-between">
          <Button
            label="إضافة حقل آخر"
            icon="pi pi-plus"
            severity="secondary"
            outlined
            @click="addBankPaymentRow"
          />
          <div style="display: flex; gap: 8px">
            <Button label="إلغاء" severity="secondary" outlined @click="bankPrintVisible = false" />
            <Button
              label="متابعة الطباعة"
              icon="pi pi-print"
              :loading="bankPrintBusy"
              @click="confirmBankPrint"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        v-model:visible="payVisible"
        modal
        :header="
          payingPurpose === PaymentPurpose.DownPayment
            ? 'تسجيل دفعة المقدمة'
            : payingPurpose === PaymentPurpose.Delivery
              ? 'تسجيل دفعة الاستلام'
              : 'تسجيل دفعة على القسط'
        "
        :style="{ width: '540px' }"
        :breakpoints="{ '640px': '95vw' }"
      >
        <div class="pay-summary">
          <div>
            <span>العقد</span>
            <strong>{{ selectedContract?.contractNumber || '—' }}</strong>
          </div>
          <div v-if="payingInstallment">
            <span>الاستحقاق</span>
            <strong>{{ formatDate(payingInstallment.dueDate) }}</strong>
          </div>
          <div>
            <span>المتبقي</span>
            <strong>
              {{
                formatMoney(
                  payingInstallment
                    ? remainingOf(payingInstallment)
                    : payingPurpose === PaymentPurpose.DownPayment
                      ? downRemaining
                      : deliveryRemaining,
                )
              }}
            </strong>
          </div>
        </div>
        <div class="form-grid">
          <div class="field">
            <label>المبلغ</label>
            <InputNumber v-model="payForm.amount" :min="0" />
          </div>
          <div class="field">
            <label>طريقة الدفع</label>
            <Select
              v-model="payForm.paymentMethod"
              :options="paymentMethodOptions"
              option-label="label"
              option-value="value"
              checkmark
              append-to="body"
            />
          </div>
          <div v-if="singleOverflowAmount > 0" class="field full overflow-box">
            <label>المبلغ المراد خصمه من الدفعة التالية هو</label>
            <strong>{{ formatMoney(singleOverflowAmount) }}</strong>
          </div>
          <div v-if="singleOverflowNext && singleOverflowAmount > 0" class="field full next-pay-box">
            <div class="next-pay-row">
              <div>
                <span>الدفعة التالية</span>
                <strong>{{ installmentLabelOf(singleOverflowNext) }}</strong>
              </div>
              <div>
                <span>السعر الأصلي</span>
                <strong>{{ formatMoney(remainingOf(singleOverflowNext)) }}</strong>
              </div>
              <div>
                <span>المراد دفعه</span>
                <strong>{{ formatMoney(singleNextDesiredPay ?? 0) }}</strong>
              </div>
            </div>
          </div>
          <div class="field">
            <label>تاريخ الدفع</label>
            <DatePicker v-model="paymentDateModel" date-format="yy-mm-dd" show-icon />
          </div>
          <div class="field">
            <label>المستلم</label>
            <Select
              v-model="payForm.receivedById"
              :options="employeeOptions"
              option-label="label"
              option-value="id"
              placeholder="اختر الموظف"
              checkmark
              append-to="body"
              filter
            />
          </div>
          <div class="field full">
            <label>رقم المرجع (اختياري)</label>
            <InputText v-model="payForm.referenceNumber" />
          </div>
          <div
            v-if="payForm.paymentMethod === PaymentMethod.Cheque || payForm.paymentMethod === PaymentMethod.Bank"
            class="field full"
          >
            <label>اسم المصرف</label>
            <InputText v-model="payForm.bankName" placeholder="اسم المصرف" />
          </div>
          <div class="field full">
            <label>الملاحظات</label>
            <Textarea v-model="payForm.notes" rows="2" auto-resize placeholder="ملاحظات الدفعة (اختياري)" />
          </div>
          <div
            v-if="payingInstallment && payForm.amount < remainingOf(payingInstallment) && singleOverflowAmount <= 0"
            class="field full partial-row"
          >
            <Checkbox v-model="splitPartial" binary input-id="splitPartial" />
            <label for="splitPartial">
              دفع جزئي — تقسيم القسط إلى فاتورة مدفوعة والمتبقي كدين على العميل
            </label>
          </div>
          <div class="field full partial-row">
            <Checkbox v-model="sendWaAfterPay" binary input-id="sendWaAfterPay" />
            <label for="sendWaAfterPay">إرسال رسالة واتساب (تأكيد الدفع) بعد التسجيل</label>
          </div>
        </div>
        <template #footer>
          <div class="dialog-actions">
            <Button label="إلغاء" severity="secondary" outlined @click="payVisible = false" />
            <Button label="تأكيد الدفع" icon="pi pi-check" :loading="paying" @click="submitPayment" />
          </div>
        </template>
      </Dialog>

      <Dialog
        v-model:visible="multiPayVisible"
        modal
        header="دفع أكثر من قسط"
        :style="{ width: '620px' }"
        :breakpoints="{ '640px': '95vw' }"
      >
        <div class="pay-summary">
          <div>
            <span>عدد الأقساط</span>
            <strong>{{ selectedMultiInstallments.length }}</strong>
          </div>
          <div>
            <span>المجموع المحسوب</span>
            <strong>{{ formatMoney(selectedMultiTotal) }}</strong>
          </div>
        </div>
        <ul class="multi-list">
          <li v-for="row in selectedMultiInstallments" :key="row.id">
            <span>{{ installmentLabelOf(row) }} — {{ formatDate(row.dueDate) }}</span>
            <strong>{{ formatMoney(remainingOf(row)) }}</strong>
          </li>
        </ul>
        <div v-if="multiOverflowAmount > 0" class="overflow-box">
          <label>المبلغ المراد خصمه من الدفعة التالية هو</label>
          <strong>{{ formatMoney(multiOverflowAmount) }}</strong>
        </div>
        <div v-if="multiOverflowNext && multiOverflowAmount > 0" class="next-pay-box">
          <div class="next-pay-row">
            <div>
              <span>الدفعة التالية</span>
              <strong>{{ installmentLabelOf(multiOverflowNext) }}</strong>
            </div>
            <div>
              <span>السعر الأصلي</span>
              <strong>{{ formatMoney(remainingOf(multiOverflowNext)) }}</strong>
            </div>
            <div>
              <span>المراد دفعه</span>
              <strong>{{ formatMoney(multiNextDesiredPay ?? 0) }}</strong>
            </div>
          </div>
        </div>
        <div class="form-grid">
          <div class="field">
            <label>المبلغ الكلي</label>
            <InputNumber
              v-model="multiPayForm.amount"
              :min="0"
              @update:model-value="multiAmountManual = true"
            />
          </div>
          <div class="field">
            <label>طريقة الدفع</label>
            <Select
              v-model="multiPayForm.paymentMethod"
              :options="paymentMethodOptions"
              option-label="label"
              option-value="value"
              checkmark
              append-to="body"
            />
          </div>
          <div class="field">
            <label>تاريخ الدفع</label>
            <DatePicker v-model="multiPaymentDateModel" date-format="yy-mm-dd" show-icon />
          </div>
          <div class="field">
            <label>المستلم</label>
            <Select
              v-model="multiPayForm.receivedById"
              :options="employeeOptions"
              option-label="label"
              option-value="id"
              placeholder="اختر الموظف"
              checkmark
              append-to="body"
              filter
            />
          </div>
          <div class="field full">
            <label>رقم المرجع (اختياري)</label>
            <InputText v-model="multiPayForm.referenceNumber" />
          </div>
          <div
            v-if="multiPayForm.paymentMethod === PaymentMethod.Cheque || multiPayForm.paymentMethod === PaymentMethod.Bank"
            class="field full"
          >
            <label>اسم المصرف</label>
            <InputText v-model="multiPayForm.bankName" placeholder="اسم المصرف" />
          </div>
          <div class="field full">
            <label>الملاحظات</label>
            <Textarea v-model="multiPayForm.notes" rows="2" auto-resize placeholder="ملاحظات الدفعة (اختياري)" />
          </div>
          <div class="field full partial-row">
            <Checkbox v-model="sendWaAfterPay" binary input-id="sendWaAfterPayMulti" />
            <label for="sendWaAfterPayMulti">إرسال رسالة واتساب (تأكيد الدفع) بعد التسجيل</label>
          </div>
        </div>
        <template #footer>
          <div class="dialog-actions">
            <Button label="إلغاء" severity="secondary" outlined @click="multiPayVisible = false" />
            <Button label="تأكيد الدفع" icon="pi pi-check" :loading="multiPaying" @click="submitMultiPay" />
          </div>
        </template>
      </Dialog>
    </template>

    <div v-else class="empty-box">العميل غير موجود</div>
  </div>
</template>

<style scoped>
.multi-pay-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.multi-list {
  list-style: none;
  margin: 0 0 14px;
  padding: 0;
  display: grid;
  gap: 6px;
}
.multi-list li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--surface-2, #f4f7f8);
  border: 1px solid var(--border);
  font-size: 0.88rem;
}

.overflow-box,
.next-pay-box {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #d7e3d9;
  background: #f3f8f4;
}

.overflow-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.overflow-box label,
.next-pay-row span {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.overflow-box strong,
.next-pay-row strong {
  font-size: 1rem;
  font-weight: 800;
  color: #1f4d2e;
}

.next-pay-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.next-pay-row > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.loading-box {
  display: grid;
  place-items: center;
  min-height: 240px;
}

.contract-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.contract-toolbar .section-title {
  margin: 0;
}

.contract-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.contract-select {
  min-width: 220px;
}

.statement-block {
  margin-bottom: 22px;
}

.statement-subtitle {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--brand);
}

.statement-subtitle small {
  font-weight: 600;
  color: var(--muted);
  margin-inline-start: 6px;
}

.statement-contract {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.statement-table {
  margin-bottom: 14px;
}

.statement-pay-table {
  margin-bottom: 16px;
}

.statement-images {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.statement-figure {
  margin: 0;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.statement-figure figcaption {
  margin-bottom: 8px;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--muted);
  text-align: center;
}

.statement-figure img {
  display: block;
  width: 100%;
  max-height: 280px;
  object-fit: contain;
  border-radius: 8px;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.summary-card span,
.summary-card small {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.summary-card strong {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text);
}

.summary-card.is-due {
  border-color: rgba(192, 57, 43, 0.25);
  background: rgba(192, 57, 43, 0.06);
}

.summary-card.is-unpaid {
  border-color: rgba(180, 120, 20, 0.28);
  background: rgba(180, 120, 20, 0.07);
}

.summary-card.is-paid {
  border-color: rgba(21, 128, 61, 0.25);
  background: rgba(21, 128, 61, 0.06);
}

.purpose-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

.purpose-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(21, 101, 116, 0.05), var(--surface));
}

.purpose-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.purpose-card__head h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--brand);
}

.badge {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
}

.badge.is-ok {
  background: rgba(21, 128, 61, 0.12);
  color: #15803d;
}

.badge.is-warn {
  background: rgba(180, 120, 20, 0.14);
  color: #a16207;
}

.purpose-card__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px solid var(--border);
}

.purpose-card__item strong {
  display: block;
  font-size: 0.9rem;
}

.purpose-card__item small {
  color: var(--muted);
  font-size: 0.78rem;
}

.purpose-card__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.purpose-card__grid div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.purpose-card__grid span {
  font-size: 0.75rem;
  color: var(--muted);
  font-weight: 700;
}

.purpose-card__grid strong {
  font-weight: 800;
}

.contract-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 22px;
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(21, 101, 116, 0.05);
  border: 1px solid var(--border);
  font-size: 0.88rem;
  color: var(--muted);
}

.contract-meta strong {
  color: var(--text);
}

.section-title {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--brand);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  background: var(--surface);
}

.detail-item.full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--muted);
}

.detail-value {
  font-weight: 700;
  color: var(--text);
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tab-count {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  font-size: 0.75rem;
  font-weight: 800;
  background: rgba(21, 101, 116, 0.12);
  color: var(--brand);
}

.tab-hint {
  margin: 4px 0 12px;
  color: var(--muted);
  font-size: 0.88rem;
}

.pay-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.pay-summary div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(21, 101, 116, 0.06);
  border: 1px solid var(--border);
}

.pay-summary span {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--muted);
}

.pay-summary strong {
  font-weight: 800;
}

.field.full {
  grid-column: 1 / -1;
}

.partial-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(180, 120, 20, 0.08);
  border: 1px solid rgba(180, 120, 20, 0.22);
}

.partial-row label {
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
}

.profile-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  padding: 6px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  overflow-x: auto;
}

.profile-nav__item {
  flex: 1;
  min-width: 140px;
  border: 0;
  border-radius: 10px;
  padding: 12px 14px;
  background: transparent;
  color: var(--muted);
  font-weight: 800;
  cursor: pointer;
  transition: 0.15s ease;
}

.profile-nav__item:hover {
  background: rgba(21, 101, 116, 0.06);
  color: var(--text);
}

.profile-nav__item.is-active {
  background: rgba(21, 101, 116, 0.12);
  color: #155f6e;
}

.docs-upload {
  margin-bottom: 16px;
  padding: 14px;
  border-radius: 12px;
  border: 1px dashed var(--border);
  background: var(--surface-2, #f7fafb);
}

.docs-file-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.docs-file-name {
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 600;
}

.docs-actions {
  margin-top: 10px;
  justify-content: flex-start;
}

.docs-table .docs-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 0;
}

.docs-table {
  margin-top: 8px;
}

.hidden-input {
  display: none;
}

.section-head-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.section-head-row .section-title {
  margin: 0;
}
.section-head-row small {
  color: var(--muted);
}
.wa-ok {
  color: #15803d;
  font-weight: 800;
}
.wa-bad {
  color: #b91c1c;
  font-weight: 800;
}

@media (max-width: 960px) {
  .summary-row,
  .detail-grid,
  .purpose-cards,
  .pay-summary {
    grid-template-columns: 1fr 1fr;
  }
  .contract-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 640px) {
  .summary-row,
  .detail-grid,
  .purpose-cards,
  .pay-summary,
  .purpose-card__grid,
  .statement-images {
    grid-template-columns: 1fr;
  }

  .contract-toolbar__actions {
    flex-direction: column;
    align-items: stretch;
  }
}

.bank-pay-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #c5d0c7;
  border-radius: 10px;
  overflow: hidden;
}
.bank-pay-table__head,
.bank-pay-table__row,
.bank-pay-table__total {
  display: grid;
  grid-template-columns: 1.4fr 1fr 40px;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
}
.bank-pay-table__head {
  background: #2f5139;
  color: #fff;
  font-weight: 800;
  font-size: 0.9rem;
}
.bank-pay-table__row {
  background: #fff;
  border-top: 1px solid #e4ebe5;
}
.bank-pay-table__total {
  background: #2f5139;
  color: #fff;
  font-weight: 800;
}
.bank-pay-table__total strong {
  font-variant-numeric: tabular-nums;
}
</style>
