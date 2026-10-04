<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
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
  CreatePaymentDto,
  Customer,
  Employee,
  Installment,
  Payment,
  SalesContract,
  Unit,
} from '@/types'
import { PaymentMethod, PaymentPurpose } from '@/types'
import { getCustomer } from '@/api/customers'
import { getComplexes } from '@/api/complexes'
import { getSalesContract, getSalesContracts } from '@/api/salesContracts'
import { downloadPaymentPdf, getPayments, processPayment } from '@/api/payments'
import { getUnits } from '@/api/units'
import { getEmployees } from '@/api/employees'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import PageHeader from '@/components/PageHeader.vue'
import {
  asSelectOptions,
  contractPaymentTypeOptions,
  contractStatusOptions,
  formatDate,
  formatMoney,
  installmentStatusLabel,
  isInstallmentDue,
  isInstallmentNotYetDue,
  labelOf,
  maritalStatusOptions,
  paymentMethodOptions,
} from '@/utils/enums'

interface CustomerInstallment extends Installment {
  contractId: string
  contractNumber: string | null
}

const route = useRoute()
const router = useRouter()
const notify = useNotify()

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
const activeTab = ref('due')

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

const contractPayments = computed(() =>
  payments.value.filter((p) => p.contractId === selectedContractId.value),
)

const dueInstallments = computed(() =>
  contractInstallments.value
    .filter((i) => isInstallmentDue(i.status, i.dueDate))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
)

const unpaidInstallments = computed(() =>
  contractInstallments.value
    .filter((i) => isInstallmentNotYetDue(i.status, i.dueDate))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
)

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

const employeeOptions = computed(() =>
  asSelectOptions(
    customer.value
      ? employees.value.filter((e) => e.complexId === customer.value!.complexId)
      : employees.value,
    (e) => e.name || e.id,
  ),
)

function remainingOf(row: Installment) {
  return Math.max(0, (row.amount || 0) + (row.penalty || 0) - (row.paidAmount || 0))
}

function purposeLabel(purpose: PaymentPurpose | undefined) {
  if (purpose === PaymentPurpose.DownPayment) return 'دفعة المقدمة'
  if (purpose === PaymentPurpose.Delivery) return 'دفعة الاستلام'
  return 'قسط'
}

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

  const maxAmount =
    payingPurpose.value === PaymentPurpose.DownPayment
      ? downRemaining.value
      : payingPurpose.value === PaymentPurpose.Delivery
        ? deliveryRemaining.value
        : payingInstallment.value
          ? remainingOf(payingInstallment.value)
          : 0

  if (payForm.amount > maxAmount) {
    notify.warning(`المبلغ أكبر من المتبقي (${formatMoney(maxAmount)})`)
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
    }
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    paying.value = false
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

async function loadProfile() {
  loading.value = true
  try {
    const customerData = await getCustomer(customerId.value)
    customer.value = customerData

    const [complexResult, contractResult, paymentResult, unitResult, employeeResult] =
      await Promise.all([
        getComplexes({ Page: 1, PageSize: 200 }),
        getSalesContracts({ CustomerId: customerId.value, Page: 1, PageSize: 200 }),
        getPayments({ CustomerId: customerId.value, Page: 1, PageSize: 500 }),
        getUnits({ ComplexId: customerData.complexId, Page: 1, PageSize: 500 }),
        getEmployees({ Page: 1, PageSize: 500 }),
      ])

    complex.value =
      (complexResult.items ?? []).find((c) => c.id === customerData.complexId) ?? null
    contracts.value = contractResult.items ?? []
    payments.value = (paymentResult.items ?? []).sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
    )
    employees.value = employeeResult.items ?? []
    unitMap.value = Object.fromEntries(
      (unitResult.items ?? []).map((u: Unit) => [u.id, u.unitNumber || u.id.slice(0, 8)]),
    )

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
      <div class="data-panel">
        <h3 class="section-title">البيانات الشخصية</h3>
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
            <span class="detail-label">المجمع</span>
            <span class="detail-value">{{ complex?.nameAr || complex?.name || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">الحالة الاجتماعية</span>
            <span class="detail-value">{{ labelOf(maritalStatusOptions, customer.maritalStatus) }}</span>
          </div>
          <div class="detail-item full">
            <span class="detail-label">العنوان</span>
            <span class="detail-value">{{ customer.address || '—' }}</span>
          </div>
        </div>
      </div>

      <div class="data-panel contract-panel">
        <div class="contract-toolbar">
          <h3 class="section-title">العقد والدفعات</h3>
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
                <span
                  class="badge"
                  :class="downRemaining <= 0 ? 'is-ok' : 'is-warn'"
                >
                  {{ downRemaining <= 0 ? 'مسددة' : 'متبقي' }}
                </span>
              </div>
              <div class="purpose-card__grid">
                <div><span>المطلوب</span><strong>{{ formatMoney(selectedContract.downPayment) }}</strong></div>
                <div><span>المدفوع</span><strong>{{ formatMoney(downPaid) }}</strong></div>
                <div><span>المتبقي</span><strong>{{ formatMoney(downRemaining) }}</strong></div>
              </div>
              <Button
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
                <span
                  class="badge"
                  :class="deliveryRemaining <= 0 ? 'is-ok' : 'is-warn'"
                >
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
            </TabList>
            <TabPanels>
              <TabPanel value="due">
                <DataTable :value="dueInstallments" size="small" striped-rows>
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
                        @click="openPayInstallment(data)"
                      />
                    </template>
                  </Column>
                  <template #empty><div class="empty-box">لا توجد أقساط مستحقة</div></template>
                </DataTable>
              </TabPanel>

              <TabPanel value="unpaid">
                <DataTable :value="unpaidInstallments" size="small" striped-rows>
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
                        @click="openPayInstallment(data)"
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
            </TabPanels>
          </Tabs>
        </template>
        <div v-else class="empty-box">لا توجد عقود لهذا العميل</div>
      </div>

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
            <InputNumber
              v-model="payForm.amount"
              :min="0"
              :max="
                payingInstallment
                  ? remainingOf(payingInstallment)
                  : payingPurpose === PaymentPurpose.DownPayment
                    ? downRemaining
                    : deliveryRemaining
              "
            />
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
            v-if="payingInstallment && payForm.amount < remainingOf(payingInstallment)"
            class="field full partial-row"
          >
            <Checkbox v-model="splitPartial" binary input-id="splitPartial" />
            <label for="splitPartial">
              دفع جزئي — تقسيم القسط إلى فاتورة مدفوعة والمتبقي كدين على العميل
            </label>
          </div>
        </div>
        <template #footer>
          <div class="dialog-actions">
            <Button label="إلغاء" severity="secondary" outlined @click="payVisible = false" />
            <Button label="تأكيد الدفع" icon="pi pi-check" :loading="paying" @click="submitPayment" />
          </div>
        </template>
      </Dialog>
    </template>

    <div v-else class="empty-box">العميل غير موجود</div>
  </div>
</template>

<style scoped>
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

.contract-select {
  min-width: 220px;
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
  .purpose-card__grid {
    grid-template-columns: 1fr;
  }
}
</style>
