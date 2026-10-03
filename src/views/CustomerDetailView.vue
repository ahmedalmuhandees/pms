<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
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
import { InstallmentStatus, PaymentMethod } from '@/types'
import { getCustomer } from '@/api/customers'
import { getComplexes } from '@/api/complexes'
import { getSalesContract, getSalesContracts } from '@/api/salesContracts'
import { createPayment, getPayments } from '@/api/payments'
import { updateInstallment } from '@/api/installments'
import { createReceipt } from '@/api/receipts'
import { getUnits } from '@/api/units'
import { getEmployees } from '@/api/employees'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import PageHeader from '@/components/PageHeader.vue'
import {
  asSelectOptions,
  contractPaymentTypeOptions,
  contractStatusOptions,
  contractTypeOptions,
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
const installments = ref<CustomerInstallment[]>([])
const payments = ref<Payment[]>([])
const employees = ref<Employee[]>([])
const unitMap = ref<Record<string, string>>({})
const activeTab = ref('due')

const payVisible = ref(false)
const paying = ref(false)
const payingInstallment = ref<CustomerInstallment | null>(null)
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
})

const fullName = computed(() => {
  if (!customer.value) return '—'
  return [customer.value.firstName, customer.value.lastName].filter(Boolean).join(' ') || '—'
})

const dueInstallments = computed(() =>
  installments.value
    .filter((i) => isInstallmentDue(i.status, i.dueDate))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
)

const unpaidInstallments = computed(() =>
  installments.value
    .filter((i) => isInstallmentNotYetDue(i.status, i.dueDate))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
)

const dueTotal = computed(() =>
  dueInstallments.value.reduce((sum, i) => sum + remainingOf(i), 0),
)

const unpaidTotal = computed(() =>
  unpaidInstallments.value.reduce((sum, i) => sum + remainingOf(i), 0),
)

const paidTotal = computed(() =>
  payments.value.reduce((sum, p) => sum + (p.amount || 0), 0),
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

function openPay(row: CustomerInstallment) {
  const remaining = remainingOf(row)
  if (remaining <= 0) {
    notify.warning('هذا القسط مدفوع بالكامل')
    return
  }
  payingInstallment.value = row
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
  })
  payVisible.value = true
}

async function submitPayment() {
  if (!payingInstallment.value) return
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
  const remaining = remainingOf(payingInstallment.value)
  if (payForm.amount > remaining) {
    notify.warning(`المبلغ أكبر من المتبقي (${formatMoney(remaining)})`)
    return
  }

  paying.value = true
  try {
    payForm.paymentDate = paymentDateModel.value.toISOString()
    const payment = await createPayment({ ...payForm })

    const inst = payingInstallment.value
    const newPaid = (inst.paidAmount || 0) + payForm.amount
    const totalDue = (inst.amount || 0) + (inst.penalty || 0)
    let status: (typeof InstallmentStatus)[keyof typeof InstallmentStatus] = InstallmentStatus.Pending
    if (newPaid >= totalDue) status = InstallmentStatus.Paid
    else if (newPaid > 0) status = InstallmentStatus.Partial

    await updateInstallment(inst.id, {
      dueDate: inst.dueDate,
      amount: inst.amount,
      paidAmount: newPaid,
      penalty: inst.penalty,
      status,
      paidDate: status === InstallmentStatus.Paid ? payForm.paymentDate : inst.paidDate,
      planID: inst.planID,
      complexId: inst.complexId,
    })

    try {
      await createReceipt({
        receiptNumber: null,
        date: payForm.paymentDate,
        amount: payForm.amount,
        paymentId: payment.id,
      })
    } catch {
      // الدفع نجح؛ الوصل اختياري إن فشل إنشاؤه
    }

    notify.success(
      status === InstallmentStatus.Paid
        ? 'تم دفع القسط بالكامل'
        : 'تم تسجيل دفعة جزئية على القسط',
    )
    payVisible.value = false
    await loadProfile()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    paying.value = false
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
          <span>إجمالي المدفوعات</span>
          <strong>{{ formatMoney(paidTotal) }}</strong>
          <small>{{ payments.length }} دفعة</small>
        </div>
        <div class="summary-card">
          <span>العقود</span>
          <strong>{{ contracts.length }}</strong>
          <small>عقد مرتبط</small>
        </div>
      </div>

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
            <span class="detail-label">جواز السفر</span>
            <span class="detail-value">{{ customer.passport || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">تاريخ الميلاد</span>
            <span class="detail-value">{{ formatDate(customer.birthDate) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">الحالة الاجتماعية</span>
            <span class="detail-value">{{ labelOf(maritalStatusOptions, customer.maritalStatus) }}</span>
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
            <span class="detail-value">{{ formatMoney(customer.monthlyIncome) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">المجمع</span>
            <span class="detail-value">{{ complex?.nameAr || complex?.name || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">تاريخ التسجيل</span>
            <span class="detail-value">{{ formatDate(customer.createdAt) }}</span>
          </div>
          <div class="detail-item full">
            <span class="detail-label">العنوان</span>
            <span class="detail-value">{{ customer.address || '—' }}</span>
          </div>
        </div>
      </div>

      <div class="data-panel">
        <h3 class="section-title">العقود</h3>
        <DataTable :value="contracts" size="small" striped-rows>
          <Column header="رقم العقد" style="width: 110px">
            <template #body="{ data }">{{ data.contractNumber || data.id.slice(0, 8) }}</template>
          </Column>
          <Column header="النوع" style="width: 90px">
            <template #body="{ data }">{{ labelOf(contractTypeOptions, data.contractType) }}</template>
          </Column>
          <Column header="الدفع" style="width: 110px">
            <template #body="{ data }">
              {{ labelOf(contractPaymentTypeOptions, data.contractPaymentType) }}
            </template>
          </Column>
          <Column header="الوحدة" style="width: 100px">
            <template #body="{ data }">{{ unitMap[data.unitId] || data.unitId.slice(0, 8) }}</template>
          </Column>
          <Column header="سعر البيع" style="width: 120px">
            <template #body="{ data }">{{ formatMoney(data.sellingPrice) }}</template>
          </Column>
          <Column header="المتبقي" style="width: 120px">
            <template #body="{ data }">{{ formatMoney(data.remainingAmount) }}</template>
          </Column>
          <Column header="الحالة" style="width: 90px">
            <template #body="{ data }">{{ labelOf(contractStatusOptions, data.contractStatus) }}</template>
          </Column>
          <Column header="التاريخ" style="width: 110px">
            <template #body="{ data }">{{ formatDate(data.contractDate) }}</template>
          </Column>
          <template #empty><div class="empty-box">لا توجد عقود</div></template>
        </DataTable>
      </div>

      <div class="data-panel">
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="due">
              <span class="tab-label">
                مستحقة
                <span class="tab-count">{{ dueInstallments.length }}</span>
              </span>
            </Tab>
            <Tab value="unpaid">
              <span class="tab-label">
                غير مدفوعة
                <span class="tab-count">{{ unpaidInstallments.length }}</span>
              </span>
            </Tab>
            <Tab value="payments">
              <span class="tab-label">
                المدفوعات
                <span class="tab-count">{{ payments.length }}</span>
              </span>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="due">
              <p class="tab-hint">أقساط حان تاريخ استحقاقها — يمكنك الدفع مباشرة من هنا</p>
              <DataTable :value="dueInstallments" size="small" striped-rows>
                <Column header="الاستحقاق" style="width: 120px">
                  <template #body="{ data }">{{ formatDate(data.dueDate) }}</template>
                </Column>
                <Column header="العقد" style="width: 110px">
                  <template #body="{ data }">
                    {{ data.contractNumber || data.contractId.slice(0, 8) }}
                  </template>
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
                    {{
                      data.status === InstallmentStatus.Overdue
                        ? 'متأخر'
                        : installmentStatusLabel(data.status, data.dueDate)
                    }}
                  </template>
                </Column>
                <Column header="" style="width: 100px">
                  <template #body="{ data }">
                    <Button
                      label="دفع"
                      icon="pi pi-wallet"
                      size="small"
                      :disabled="remainingOf(data) <= 0"
                      @click="openPay(data)"
                    />
                  </template>
                </Column>
                <template #empty><div class="empty-box">لا توجد أقساط مستحقة</div></template>
              </DataTable>
            </TabPanel>

            <TabPanel value="unpaid">
              <p class="tab-hint">أقساط قادمة — يمكن الدفع المبكر إن رغبت</p>
              <DataTable :value="unpaidInstallments" size="small" striped-rows>
                <Column header="الاستحقاق" style="width: 120px">
                  <template #body="{ data }">{{ formatDate(data.dueDate) }}</template>
                </Column>
                <Column header="العقد" style="width: 110px">
                  <template #body="{ data }">
                    {{ data.contractNumber || data.contractId.slice(0, 8) }}
                  </template>
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
                      @click="openPay(data)"
                    />
                  </template>
                </Column>
                <template #empty><div class="empty-box">لا توجد أقساط غير مدفوعة قادمة</div></template>
              </DataTable>
            </TabPanel>

            <TabPanel value="payments">
              <p class="tab-hint">سجل الدفعات المستلمة من العميل</p>
              <DataTable :value="payments" size="small" striped-rows>
                <Column header="التاريخ" style="width: 120px">
                  <template #body="{ data }">{{ formatDate(data.paymentDate) }}</template>
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
                <template #empty><div class="empty-box">لا توجد مدفوعات</div></template>
              </DataTable>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>

      <Dialog
        v-model:visible="payVisible"
        modal
        header="تسجيل دفعة على القسط"
        :style="{ width: '520px' }"
        :breakpoints="{ '640px': '95vw' }"
      >
        <template v-if="payingInstallment">
          <div class="pay-summary">
            <div>
              <span>العقد</span>
              <strong>{{ payingInstallment.contractNumber || payingInstallment.contractId.slice(0, 8) }}</strong>
            </div>
            <div>
              <span>الاستحقاق</span>
              <strong>{{ formatDate(payingInstallment.dueDate) }}</strong>
            </div>
            <div>
              <span>المتبقي</span>
              <strong>{{ formatMoney(remainingOf(payingInstallment)) }}</strong>
            </div>
          </div>
          <div class="form-grid">
            <div class="field">
              <label>المبلغ</label>
              <InputNumber v-model="payForm.amount" :min="0" :max="remainingOf(payingInstallment)" />
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
          </div>
        </template>
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

@media (max-width: 960px) {
  .summary-row,
  .detail-grid,
  .pay-summary {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .summary-row,
  .detail-grid,
  .pay-summary {
    grid-template-columns: 1fr;
  }
}
</style>
