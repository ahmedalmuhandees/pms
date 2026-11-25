<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Password from 'primevue/password'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import type {
  Complex,
  CreateResidentDto,
  CreateServiceBillDto,
  Customer,
  ResidentProfile,
  ServiceBill,
  ServiceType,
  Unit,
} from '@/types'
import { MeterReadingSource, OccupancyType, PaymentMethod, ResidentStatus } from '@/types'
import {
  getResidentProfile,
  regenerateResidentLoginCode,
  revealResidentLoginCode,
  updateResident,
} from '@/api/residents'
import { downloadHandoverPdf, downloadOccupancyPdf } from '@/api/residentContracts'
import { createServiceBill, deleteServiceBill, getServiceBills, payServiceBills } from '@/api/serviceBills'
import { getServiceTypes } from '@/api/serviceTypes'
import { getComplexes } from '@/api/complexes'
import { getCustomers } from '@/api/customers'
import { getUnits } from '@/api/units'
import { getErrorMessage } from '@/api/client'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { useAuthStore } from '@/stores/auth'
import {
  asSelectOptions,
  familyRelationOptions,
  formatDate,
  formatMoney,
  labelOf,
  monthOptions,
  occupancyFormTypeOptions,
  occupancyTypeOptions,
  residentStatusOptions,
  serviceBillPaymentOptions,
} from '@/utils/enums'
import { resolveMediaUrl } from '@/utils/media'
import { printServiceInvoice } from '@/utils/serviceInvoicePrint'
import PageHeader from '@/components/PageHeader.vue'

type ProfileSection = 'personal' | 'family' | 'handover' | 'emergency' | 'invoices'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const notify = useNotify()
const { ask } = useConfirmAction()

const loading = ref(true)
const printing = ref(false)
const profile = ref<ResidentProfile | null>(null)
const profileSection = ref<ProfileSection>('personal')
const previewUrl = ref<string | null>(null)
const previewVisible = ref(false)

const bills = ref<ServiceBill[]>([])
const billsLoading = ref(false)
const serviceTypes = ref<ServiceType[]>([])
const selectedBills = ref<ServiceBill[]>([])
const addBillVisible = ref(false)
const payVisible = ref(false)
const savingBill = ref(false)
const paying = ref(false)
const deletingId = ref<string | null>(null)
const payTargetIds = ref<string[]>([])
const payMethod = ref<PaymentMethod>(PaymentMethod.Cash)
const payDiscount = ref(0)

const filterDialogVisible = ref(false)
const billPaidFilter = ref<boolean | null>(null)
const billMonthFilter = ref<number | null>(null)
const billYearFilter = ref<number | null>(null)
const billPaymentFilter = ref<PaymentMethod | null>(null)

const draftPaidFilter = ref<boolean | null>(null)
const draftMonthFilter = ref<number | null>(null)
const draftYearFilter = ref<number | null>(null)
const draftPaymentFilter = ref<PaymentMethod | null>(null)

const paidFilterOptions = [
  { value: true, label: 'مدفوع' },
  { value: false, label: 'غير مدفوع' },
]

const activeBillFiltersCount = computed(() =>
  [billPaidFilter.value, billMonthFilter.value, billYearFilter.value, billPaymentFilter.value].filter(
    (v) => v !== null && v !== undefined,
  ).length,
)

const now = new Date()
const billForm = reactive({
  serviceTypeId: '' as string,
  year: now.getFullYear(),
  months: [now.getMonth() + 1] as number[],
  amount: 0,
  discount: 0,
  paymentMethod: PaymentMethod.Cash as PaymentMethod,
})

const editVisible = ref(false)
const saving = ref(false)
const complexes = ref<Complex[]>([])
const customers = ref<Customer[]>([])
const units = ref<Unit[]>([])
const moveInModel = ref<Date | null>(null)
const moveOutModel = ref<Date | null>(null)
const form = reactive<CreateResidentDto>({
  moveInDate: new Date().toISOString(),
  moveOutDate: null,
  status: ResidentStatus.Active,
  occupancyType: OccupancyType.Owner,
  customerId: '',
  unitId: '',
  complexId: '',
})

const residentId = computed(() => String(route.params.id || ''))

const occupancyLabel = computed(() =>
  profile.value ? labelOf(occupancyFormTypeOptions, profile.value.occupancyType) : '—',
)
const isTenant = computed(() => profile.value?.occupancyType === OccupancyType.Tenant)

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)
const filteredCustomers = computed(() =>
  form.complexId ? customers.value.filter((c) => c.complexId === form.complexId) : customers.value,
)
const filteredUnits = computed(() =>
  form.complexId ? units.value.filter((u) => u.complexId === form.complexId) : units.value,
)
const customerOptions = computed(() =>
  asSelectOptions(filteredCustomers.value, (c) =>
    [c.firstName, c.lastName].filter(Boolean).join(' ') || c.id,
  ),
)
const unitOptions = computed(() =>
  asSelectOptions(filteredUnits.value, (u) => u.unitNumber || u.id),
)

const serviceTypeOptions = computed(() =>
  asSelectOptions(
    serviceTypes.value.filter((s) => s.isActive),
    (s) => s.displayName || s.id,
  ),
)

const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => ({ value: y - i, label: String(y - i) }))
})

const selectedService = computed(() =>
  serviceTypes.value.find((s) => s.id === billForm.serviceTypeId) ?? null,
)

const billNetPreview = computed(() =>
  Math.max(0, Number(billForm.amount || 0) - Number(billForm.discount || 0)),
)

const selectedUnpaid = computed(() => selectedBills.value.filter((b) => !b.paid))

const selectedPayTotal = computed(() =>
  selectedUnpaid.value.reduce((sum, b) => sum + Number(b.netAmount ?? b.amount - (b.discount || 0)), 0),
)

const payTargetGross = computed(() => {
  const ids = new Set(payTargetIds.value)
  return bills.value
    .filter((b) => ids.has(b.id) && !b.paid)
    .reduce((sum, b) => sum + Number(b.amount || 0), 0)
})
const payTargetTotal = computed(() =>
  Math.max(0, payTargetGross.value - Number(payDiscount.value || 0)),
)

watch(
  () => billForm.serviceTypeId,
  (id) => {
    const service = serviceTypes.value.find((s) => s.id === id)
    if (!service) return
    billForm.amount = Number(service.fixedAmount || service.unitPrice || 0)
  },
)

async function loadProfile() {
  if (!residentId.value) {
    profile.value = null
    return
  }
  loading.value = true
  try {
    profile.value = await getResidentProfile(residentId.value)
    if (profile.value) {
      await Promise.all([loadBills(), loadServiceTypes(profile.value.complexId)])
    }
  } catch (error) {
    notify.error(getErrorMessage(error))
    profile.value = null
  } finally {
    loading.value = false
  }
}

async function loadBills() {
  if (!profile.value) return
  billsLoading.value = true
  try {
    const result = await getServiceBills({
      ResidentId: profile.value.id,
      ComplexId: profile.value.complexId,
      Month: billMonthFilter.value ?? undefined,
      Year: billYearFilter.value ?? undefined,
      Paid: billPaidFilter.value ?? undefined,
      PaymentMethod: billPaymentFilter.value ?? undefined,
      Page: 1,
      PageSize: 200,
    })
    bills.value = result.items ?? []
    selectedBills.value = []
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    billsLoading.value = false
  }
}

function openBillFilters() {
  draftPaidFilter.value = billPaidFilter.value
  draftMonthFilter.value = billMonthFilter.value
  draftYearFilter.value = billYearFilter.value
  draftPaymentFilter.value = billPaymentFilter.value
  filterDialogVisible.value = true
}

function applyBillFilters() {
  billPaidFilter.value = draftPaidFilter.value
  billMonthFilter.value = draftMonthFilter.value
  billYearFilter.value = draftYearFilter.value
  billPaymentFilter.value = draftPaymentFilter.value
  filterDialogVisible.value = false
  void loadBills()
}

function clearBillFilters() {
  draftPaidFilter.value = null
  draftMonthFilter.value = null
  draftYearFilter.value = null
  draftPaymentFilter.value = null
  billPaidFilter.value = null
  billMonthFilter.value = null
  billYearFilter.value = null
  billPaymentFilter.value = null
  filterDialogVisible.value = false
  void loadBills()
}

async function loadServiceTypes(complexId: string) {
  const result = await getServiceTypes({
    ComplexId: complexId,
    IsActive: true,
    Page: 1,
    PageSize: 200,
  })
  serviceTypes.value = result.items ?? []
}

function openAddBill() {
  if (!profile.value) return
  const service = serviceTypes.value.find((s) => s.isActive)
  billForm.serviceTypeId = service?.id || ''
  billForm.year = new Date().getFullYear()
  billForm.months = [new Date().getMonth() + 1]
  billForm.amount = Number(service?.fixedAmount || service?.unitPrice || 0)
  billForm.discount = 0
  billForm.paymentMethod = PaymentMethod.Cash
  addBillVisible.value = true
}

async function saveBill() {
  if (!profile.value) return
  if (!billForm.serviceTypeId) {
    notify.warning('اختر الخدمة')
    return
  }
  if (!billForm.months.length) {
    notify.warning('اختر شهراً واحداً على الأقل')
    return
  }
  if (billForm.discount < 0 || billForm.discount > billForm.amount) {
    notify.warning('الخصم غير صالح')
    return
  }

  const payload: CreateServiceBillDto = {
    months: [...billForm.months].sort((a, b) => a - b),
    year: billForm.year,
    previousReading: 0,
    reading: 0,
    amount: billForm.amount,
    discount: billForm.discount,
    paid: false,
    paymentMethod: billForm.paymentMethod,
    readingSource: selectedService.value?.readingSource ?? MeterReadingSource.Manual,
    residentId: profile.value.id,
    serviceTypeId: billForm.serviceTypeId,
    unitId: profile.value.unitId,
    complexId: profile.value.complexId,
  }

  savingBill.value = true
  try {
    const created = await createServiceBill(payload)
    notify.success(
      created.length > 1
        ? `تمت إضافة ${created.length} فواتير للأشهر المحددة`
        : 'تمت إضافة الفاتورة للشهر المحدد',
    )
    addBillVisible.value = false
    await loadBills()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    savingBill.value = false
  }
}

function openPaySingle(row: ServiceBill) {
  if (row.paid) {
    printBills([row])
    return
  }
  payTargetIds.value = [row.id]
  payMethod.value = row.paymentMethod || PaymentMethod.Cash
  payDiscount.value = Number(row.discount || 0)
  payVisible.value = true
}

async function removeBill(row: ServiceBill) {
  const ok = await ask(
    row.paid
      ? 'الفاتورة مسددة — سيتم إرجاعها إلى حالة غير مسددة دون حذفها. هل تريد المتابعة؟'
      : 'الفاتورة غير مسددة — سيتم حذفها بالكامل. هل تريد المتابعة؟',
    row.paid ? 'إلغاء التسديد' : 'حذف الفاتورة',
  )
  if (!ok) return

  deletingId.value = row.id
  try {
    await deleteServiceBill(row.id)
    notify.success(row.paid ? 'تم إرجاع الفاتورة إلى غير مسدد' : 'تم حذف الفاتورة')
    await loadBills()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    deletingId.value = null
  }
}

function openPaySelected() {
  if (selectedUnpaid.value.length === 0) {
    notify.warning('حدد فواتير غير مسددة أولاً')
    return
  }
  payTargetIds.value = selectedUnpaid.value.map((b) => b.id)
  payMethod.value = PaymentMethod.Cash
  payDiscount.value = selectedUnpaid.value.reduce((s, b) => s + Number(b.discount || 0), 0)
  payVisible.value = true
}

async function confirmPay() {
  if (payTargetIds.value.length === 0) return
  const discount = Math.max(0, Number(payDiscount.value || 0))
  if (discount > payTargetGross.value) {
    notify.warning('مبلغ الخصم أكبر من إجمالي الفواتير')
    return
  }
  const ok = await ask(
    `تأكيد تسديد ${payTargetIds.value.length} فاتورة بإجمالي ${formatMoney(payTargetTotal.value)}؟`,
    'تسديد الفواتير',
  )
  if (!ok) return

  paying.value = true
  try {
    const paid = await payServiceBills({
      serviceBillIds: payTargetIds.value,
      paymentMethod: payMethod.value,
      discount,
    })
    notify.success('تم التسديد — الحالة: مسدد')
    payVisible.value = false
    await loadBills()
    printBills(paid)
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    paying.value = false
  }
}

function periodLabel(row: ServiceBill) {
  return `${labelOf(monthOptions, row.month)} ${row.year}`
}

function paymentLabel(method?: PaymentMethod | null) {
  if (method == null) return '—'
  return labelOf(serviceBillPaymentOptions, method) || labelOf(
    [
      { value: PaymentMethod.Cash, label: 'كاش' },
      { value: PaymentMethod.Card, label: 'ماستر' },
    ],
    method,
  )
}

function printBills(rows: ServiceBill[]) {
  if (!profile.value || rows.length === 0) return
  const enriched = rows.map((b) => ({
    ...b,
    residentName: b.residentName || profile.value?.primaryResidentName || null,
    unitNumber: b.unitNumber || profile.value?.unitNumber || null,
  }))
  const complex = complexes.value.find((c) => c.id === enriched[0]?.complexId)
  const logoUrl = complex?.logoUrl ? resolveMediaUrl(complex.logoUrl) : null
  if (!printServiceInvoice({ rows: enriched, logoUrl })) {
    notify.warning('اسمح بالنوافذ المنبثقة للطباعة')
  }
}

watch(profileSection, (section) => {
  if (section === 'invoices' && profile.value) void loadBills()
})

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

function openEdit() {
  if (!profile.value) return
  moveInModel.value = profile.value.moveInDate ? new Date(profile.value.moveInDate) : new Date()
  moveOutModel.value = null
  Object.assign(form, {
    moveInDate: profile.value.moveInDate,
    moveOutDate: null,
    status: profile.value.status,
    occupancyType: profile.value.occupancyType,
    customerId: profile.value.customerId,
    unitId: profile.value.unitId,
    complexId: profile.value.complexId,
  })
  editVisible.value = true
}

async function saveEdit() {
  if (!profile.value) return
  if (!form.complexId || !form.customerId || !form.unitId || !moveInModel.value) {
    notify.warning('أكمل البيانات المطلوبة')
    return
  }
  form.moveInDate = moveInModel.value.toISOString()
  form.moveOutDate = moveOutModel.value ? moveOutModel.value.toISOString() : null
  saving.value = true
  try {
    await updateResident(profile.value.id, { ...form })
    notify.success('تم التحديث')
    editVisible.value = false
    await loadProfile()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

function openPreview(path?: string | null) {
  const url = resolveMediaUrl(path)
  if (!url) {
    notify.warning('لا يوجد مرفق')
    return
  }
  previewUrl.value = url
  previewVisible.value = true
}

function downloadFile(path?: string | null) {
  const url = resolveMediaUrl(path)
  if (!url) {
    notify.warning('لا يوجد مرفق')
    return
  }
  window.open(url, '_blank')
}

async function printHandover() {
  if (!profile.value?.unitId || !profile.value.hasHandover) {
    notify.warning('لا يوجد محضر تسليم لهذه الوحدة')
    return
  }
  printing.value = true
  try {
    const blob = await downloadHandoverPdf(profile.value.unitId)
    window.open(URL.createObjectURL(blob), '_blank')
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    printing.value = false
  }
}

async function printOccupancy() {
  if (!profile.value?.unitId) return
  printing.value = true
  try {
    const blob = await downloadOccupancyPdf(profile.value.unitId)
    window.open(URL.createObjectURL(blob), '_blank')
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    printing.value = false
  }
}

watch(residentId, () => {
  void loadProfile()
})

const codeDialogVisible = ref(false)
const codeLoading = ref(false)
const managerPassword = ref('')
const revealedCode = ref<string | null>(null)

function openLoginCode() {
  managerPassword.value = ''
  revealedCode.value = null
  codeDialogVisible.value = true
}

async function submitRevealCode(regenerate = false) {
  const id = String(route.params.id || '')
  if (!id) return
  if (!managerPassword.value.trim()) {
    notify.warning('أدخل كلمة مرور حسابك لإظهار الرمز')
    return
  }
  codeLoading.value = true
  try {
    const result = regenerate
      ? await regenerateResidentLoginCode(id, managerPassword.value)
      : await revealResidentLoginCode(id, managerPassword.value)
    revealedCode.value = result.code
    notify.success(regenerate ? 'تم توليد رمز جديد' : 'تم إظهار رمز الدخول')
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    codeLoading.value = false
  }
}

async function copyRevealedCode() {
  if (!revealedCode.value) return
  try {
    await navigator.clipboard.writeText(revealedCode.value)
    notify.success('تم نسخ الرمز')
  } catch {
    notify.warning('تعذر النسخ تلقائياً')
  }
}

onMounted(async () => {
  try {
    await loadLookups()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  await loadProfile()
})
</script>

<template>
  <div class="page">
    <PageHeader
      :title="profile?.primaryResidentName || 'ملف الساكن'"
      subtitle="بروفايل الساكن — التفاصيل والتسليم والتسكين"
    >
      <template #actions>
        <Button
          label="رمز الدخول"
          icon="pi pi-key"
          outlined
          :disabled="!profile"
          @click="openLoginCode"
        />
        <Button
          label="طباعة محضر التسليم"
          icon="pi pi-print"
          outlined
          :loading="printing"
          :disabled="!profile?.hasHandover"
          @click="printHandover"
        />
        <Button
          label="طباعة نموذج التسكين"
          icon="pi pi-file"
          severity="secondary"
          outlined
          :loading="printing"
          :disabled="!profile"
          @click="printOccupancy"
        />
        <Button
          label="تعديل"
          icon="pi pi-pencil"
          severity="secondary"
          :disabled="!profile"
          @click="openEdit"
        />
        <Button
          label="رجوع"
          icon="pi pi-arrow-right"
          severity="secondary"
          outlined
          @click="router.push({ name: 'residents' })"
        />
      </template>
    </PageHeader>

    <div v-if="loading" class="loading-box">
      <ProgressSpinner stroke-width="3" />
    </div>

    <template v-else-if="profile">
      <header class="profile-banner data-panel">
        <div class="avatar" aria-hidden="true">
          <i class="pi pi-user" />
        </div>
        <div class="banner-main">
          <h2>{{ profile.primaryResidentName }}</h2>
          <p>
            شقة {{ profile.unitNumber || '—' }}
            <span v-if="profile.buildingName"> — مبنى {{ profile.buildingName }}</span>
          </p>
          <div class="banner-meta">
            <span class="badge" :class="isTenant ? 'is-tenant' : 'is-owner'">
              {{ occupancyLabel }}
            </span>
            <span class="meta-date">
              تاريخ التسكين: {{ formatDate(profile.occupancyDate || profile.moveInDate) }}
            </span>
          </div>
        </div>
      </header>

      <nav class="profile-nav">
        <button
          type="button"
          class="profile-nav__item"
          :class="{ 'is-active': profileSection === 'personal' }"
          @click="profileSection = 'personal'"
        >
          البيانات الشخصية
        </button>
        <button
          type="button"
          class="profile-nav__item"
          :class="{ 'is-active': profileSection === 'family' }"
          @click="profileSection = 'family'"
        >
          أفراد الأسرة
        </button>
        <button
          type="button"
          class="profile-nav__item"
          :class="{ 'is-active': profileSection === 'handover' }"
          @click="profileSection = 'handover'"
        >
          التسليم والقراءات
        </button>
        <button
          type="button"
          class="profile-nav__item"
          :class="{ 'is-active': profileSection === 'emergency' }"
          @click="profileSection = 'emergency'"
        >
          الطوارئ
        </button>
        <button
          type="button"
          class="profile-nav__item"
          :class="{ 'is-active': profileSection === 'invoices' }"
          @click="profileSection = 'invoices'"
        >
          الفواتير الشهرية
        </button>
      </nav>

      <div v-if="profileSection === 'personal'" class="data-panel">
        <h3 class="section-title">البيانات الشخصية والتعريفية</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">رقم الهوية / الجواز</span>
            <span class="detail-value">{{ profile.nationalId || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">رقم الهاتف الأساسي</span>
            <span class="detail-value">{{ profile.phone || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">البريد الإلكتروني</span>
            <span class="detail-value">{{ profile.email || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">مرفق الهوية</span>
            <div v-if="profile.identityDocumentUrl" class="attach-actions">
              <Button
                label="معاينة"
                icon="pi pi-eye"
                size="small"
                outlined
                @click="openPreview(profile.identityDocumentUrl)"
              />
              <Button
                label="تحميل"
                icon="pi pi-download"
                size="small"
                text
                @click="downloadFile(profile.identityDocumentUrl)"
              />
            </div>
            <span v-else class="detail-value">—</span>
          </div>
        </div>
      </div>

      <div v-else-if="profileSection === 'family'" class="data-panel">
        <h3 class="section-title">أفراد الأسرة القاطنون</h3>
        <div class="family-stats">
          <span>إجمالي القاطنين: <b>{{ profile.totalOccupants }}</b></span>
          <span>الذكور: <b>{{ profile.maleCount }}</b></span>
          <span>الإناث: <b>{{ profile.femaleCount }}</b></span>
        </div>
        <DataTable :value="profile.familyMembers" size="small" striped-rows>
          <Column header="#">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>
          <Column field="fullName" header="الاسم الكامل" />
          <Column header="صلة القرابة">
            <template #body="{ data }">
              {{ labelOf(familyRelationOptions, data.relation) }}
            </template>
          </Column>
          <Column header="رقم الهوية">
            <template #body="{ data }">{{ data.nationalId || '—' }}</template>
          </Column>
          <Column header="تاريخ الميلاد">
            <template #body="{ data }">{{ formatDate(data.birthDate) }}</template>
          </Column>
          <template #empty>
            <div class="empty-box">لا يوجد أفراد أسرة مسجلون</div>
          </template>
        </DataTable>
      </div>

      <div v-else-if="profileSection === 'handover'" class="data-panel">
        <h3 class="section-title">بيانات التسليم والقراءات</h3>
        <div v-if="!profile.handover" class="empty-box">لا يوجد محضر تسليم مفاتيح لهذه الوحدة</div>
        <template v-else>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">تاريخ استلام المفاتيح</span>
              <span class="detail-value">{{ formatDate(profile.handover.receivedAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">عدد المفاتيح المستلمة</span>
              <span class="detail-value">{{ profile.handover.keysCount }} مفاتيح</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">بطاقات / ريموتات الدخول</span>
              <span class="detail-value">{{ profile.handover.accessCardsCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">اسم المهندس المرافق</span>
              <span class="detail-value">{{ profile.handover.engineerName || '—' }}</span>
            </div>
            <div class="detail-item full">
              <span class="detail-label">ملاحظات الاستلام</span>
              <span class="detail-value">
                {{ profile.handover.generalNotes || profile.handover.engineerNotes || '—' }}
              </span>
            </div>
          </div>

          <h4 class="sub-title">قراءات العدادات عند الاستلام (اللحظة صفر)</h4>
          <table class="meters-table">
            <thead>
              <tr>
                <th>نوع العداد</th>
                <th>القراءة الابتدائية</th>
                <th>صورة العداد</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>عداد الكهرباء</td>
                <td>{{ profile.handover.electricityReading ?? '—' }}</td>
                <td>
                  <Button
                    v-if="profile.handover.electricityMeterPhotoUrl"
                    label="معاينة"
                    icon="pi pi-camera"
                    size="small"
                    text
                    @click="openPreview(profile.handover.electricityMeterPhotoUrl)"
                  />
                  <span v-else>—</span>
                </td>
              </tr>
              <tr>
                <td>عداد الماء</td>
                <td>{{ profile.handover.waterReading ?? '—' }}</td>
                <td>
                  <Button
                    v-if="profile.handover.waterMeterPhotoUrl"
                    label="معاينة"
                    icon="pi pi-camera"
                    size="small"
                    text
                    @click="openPreview(profile.handover.waterMeterPhotoUrl)"
                  />
                  <span v-else>—</span>
                </td>
              </tr>
              <tr>
                <td>عداد الغاز</td>
                <td>{{ profile.handover.gasReading ?? '—' }}</td>
                <td>
                  <Button
                    v-if="profile.handover.gasMeterPhotoUrl"
                    label="معاينة"
                    icon="pi pi-camera"
                    size="small"
                    text
                    @click="openPreview(profile.handover.gasMeterPhotoUrl)"
                  />
                  <span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>

      <div v-else-if="profileSection === 'emergency'" class="data-panel">
        <h3 class="section-title">بيانات الطوارئ</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">اسم شخص الطوارئ</span>
            <span class="detail-value">{{ profile.emergencyContactName || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">صلة القرابة</span>
            <span class="detail-value">
              {{
                profile.emergencyRelation != null
                  ? labelOf(familyRelationOptions, profile.emergencyRelation)
                  : '—'
              }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">رقم هاتف الطوارئ</span>
            <span class="detail-value">{{ profile.emergencyPhone || '—' }}</span>
          </div>
        </div>
      </div>

      <div v-else class="data-panel invoices-panel">
        <div class="invoices-toolbar">
          <h3 class="section-title">الفواتير الشهرية</h3>
          <div class="invoices-actions">
            <Button
              :label="activeBillFiltersCount ? `فلترة (${activeBillFiltersCount})` : 'فلترة'"
              icon="pi pi-filter"
              severity="secondary"
              outlined
              size="small"
              @click="openBillFilters"
            />
            <Button
              label="تسديد المحدد"
              icon="pi pi-wallet"
              severity="success"
              outlined
              :disabled="selectedUnpaid.length === 0"
              @click="openPaySelected"
            />
            <Button
              label="طباعة المحدد"
              icon="pi pi-print"
              severity="secondary"
              outlined
              :disabled="selectedBills.length === 0"
              @click="printBills(selectedBills)"
            />
            <Button label="إضافة فاتورة" icon="pi pi-plus" @click="openAddBill" />
          </div>
        </div>
        <p class="invoices-hint">
          الفواتير التلقائية تُنشأ يوم 1 من كل شهر. الإضافة اليدوية تخص الشهر المحدد فقط.
        </p>
        <div v-if="selectedUnpaid.length" class="selection-bar">
          محدد غير مسدد: <b>{{ selectedUnpaid.length }}</b>
          — الإجمالي: <b>{{ formatMoney(selectedPayTotal) }}</b>
        </div>
        <DataTable
          v-model:selection="selectedBills"
          :value="bills"
          :loading="billsLoading"
          data-key="id"
          size="small"
          striped-rows
          paginator
          :rows="10"
        >
          <Column selection-mode="multiple" header-style="width: 3rem" />
          <Column header="الخدمة">
            <template #body="{ data }">{{ data.serviceDisplayName || '—' }}</template>
          </Column>
          <Column header="الفترة">
            <template #body="{ data }">{{ periodLabel(data) }}</template>
          </Column>
          <Column header="المبلغ">
            <template #body="{ data }">{{ formatMoney(data.amount) }}</template>
          </Column>
          <Column header="الخصم">
            <template #body="{ data }">{{ formatMoney(data.discount || 0) }}</template>
          </Column>
          <Column header="الصافي">
            <template #body="{ data }">
              {{ formatMoney(data.netAmount ?? data.amount - (data.discount || 0)) }}
            </template>
          </Column>
          <Column header="الحالة">
            <template #body="{ data }">
              <Tag
                :value="data.paid ? 'مسدد' : 'غير مسدد'"
                :severity="data.paid ? 'success' : 'warn'"
              />
            </template>
          </Column>
          <Column header="السداد">
            <template #body="{ data }">{{ paymentLabel(data.paymentMethod) }}</template>
          </Column>
          <Column header="إجراءات" style="width: 14rem">
            <template #body="{ data }">
              <div class="row-actions">
                <Button
                  :label="data.paid ? 'طباعة' : 'تسديد'"
                  :icon="data.paid ? 'pi pi-print' : 'pi pi-check'"
                  size="small"
                  :severity="data.paid ? 'secondary' : 'success'"
                  outlined
                  @click="openPaySingle(data)"
                />
                <Button
                  :label="data.paid ? 'إلغاء سداد' : 'حذف'"
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  text
                  :loading="deletingId === data.id"
                  @click="removeBill(data)"
                />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="empty-box">لا توجد فواتير شهرية لهذا الساكن</div>
          </template>
        </DataTable>
      </div>
    </template>

    <div v-else class="empty-box">تعذر تحميل ملف الساكن</div>

    <Dialog
      v-model:visible="editVisible"
      modal
      header="تعديل بيانات الساكن"
      :style="{ width: '560px' }"
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
            append-to="body"
            @update:model-value="() => { form.customerId = ''; form.unitId = '' }"
          />
        </div>
        <div class="field">
          <label>نوع السكن</label>
          <Select
            v-model="form.occupancyType"
            :options="occupancyTypeOptions"
            option-label="label"
            option-value="value"
            append-to="body"
          />
        </div>
        <div class="field">
          <label>الحالة</label>
          <Select
            v-model="form.status"
            :options="residentStatusOptions"
            option-label="label"
            option-value="value"
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
            filter
            append-to="body"
          />
        </div>
        <div class="field">
          <label>الوحدة</label>
          <Select
            v-model="form.unitId"
            :options="unitOptions"
            option-label="label"
            option-value="id"
            filter
            append-to="body"
          />
        </div>
        <div class="field">
          <label>تاريخ الدخول</label>
          <DatePicker v-model="moveInModel" date-format="yy-mm-dd" show-icon />
        </div>
        <div class="field">
          <label>تاريخ المغادرة</label>
          <DatePicker v-model="moveOutModel" date-format="yy-mm-dd" show-icon show-clear />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="editVisible = false" />
          <Button label="حفظ" :loading="saving" @click="saveEdit" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="previewVisible"
      modal
      header="معاينة المرفق"
      :style="{ width: 'min(720px, 94vw)' }"
    >
      <img v-if="previewUrl" :src="previewUrl" alt="معاينة" class="preview-img" />
    </Dialog>

    <Dialog
      v-model:visible="filterDialogVisible"
      modal
      header="فلترة الفواتير"
      :style="{ width: '360px' }"
    >
      <div class="filter-modal-grid">
        <div class="field">
          <label>حالة الدفع</label>
          <Select
            v-model="draftPaidFilter"
            :options="paidFilterOptions"
            option-label="label"
            option-value="value"
            placeholder="الكل"
            show-clear
            append-to="body"
            class="w-full"
          />
        </div>
        <div class="field">
          <label>الشهر</label>
          <Select
            v-model="draftMonthFilter"
            :options="monthOptions"
            option-label="label"
            option-value="value"
            placeholder="الكل"
            show-clear
            append-to="body"
            class="w-full"
          />
        </div>
        <div class="field">
          <label>السنة</label>
          <Select
            v-model="draftYearFilter"
            :options="yearOptions"
            option-label="label"
            option-value="value"
            placeholder="الكل"
            show-clear
            append-to="body"
            class="w-full"
          />
        </div>
        <div class="field">
          <label>طريقة السداد</label>
          <Select
            v-model="draftPaymentFilter"
            :options="serviceBillPaymentOptions"
            option-label="label"
            option-value="value"
            placeholder="كاش / ماستر"
            show-clear
            append-to="body"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="مسح" severity="secondary" text icon="pi pi-filter-slash" @click="clearBillFilters" />
          <Button label="إلغاء" severity="secondary" outlined @click="filterDialogVisible = false" />
          <Button label="تطبيق" icon="pi pi-check" @click="applyBillFilters" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="addBillVisible"
      modal
      header="إضافة فاتورة شهرية"
      :style="{ width: '520px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>الخدمة</label>
          <Select
            v-model="billForm.serviceTypeId"
            :options="serviceTypeOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر الخدمة"
            filter
            append-to="body"
          />
        </div>
        <div class="field">
          <label>السنة</label>
          <Select
            v-model="billForm.year"
            :options="yearOptions"
            option-label="label"
            option-value="value"
            append-to="body"
          />
        </div>
        <div class="field">
          <label>الأشهر (واحد أو أكثر)</label>
          <MultiSelect
            v-model="billForm.months"
            :options="monthOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الأشهر"
            display="chip"
            filter
            append-to="body"
            class="w-full"
          />
        </div>
        <div class="field">
          <label>المبلغ لكل شهر (تلقائي من الخدمة)</label>
          <InputNumber v-model="billForm.amount" :min="0" :min-fraction-digits="0" :max-fraction-digits="2" />
        </div>
        <div class="field">
          <label>الخصم</label>
          <InputNumber v-model="billForm.discount" :min="0" :min-fraction-digits="0" :max-fraction-digits="2" />
        </div>
        <div class="field">
          <label>الصافي</label>
          <div class="net-box">{{ formatMoney(billNetPreview) }}</div>
        </div>
        <div class="field">
          <label>طريقة السداد</label>
          <Select
            v-model="billForm.paymentMethod"
            :options="serviceBillPaymentOptions"
            option-label="label"
            option-value="value"
            append-to="body"
          />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="addBillVisible = false" />
          <Button label="إضافة" :loading="savingBill" @click="saveBill" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="payVisible"
      modal
      header="تسديد الفواتير"
      :style="{ width: '420px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>عدد الفواتير</label>
          <div class="net-box">{{ payTargetIds.length }}</div>
        </div>
        <div class="field">
          <label>إجمالي قيمة الخدمة</label>
          <div class="net-box">{{ formatMoney(payTargetGross) }}</div>
        </div>
        <div class="field">
          <label>مقدار الخصم (مبلغ)</label>
          <InputNumber
            v-model="payDiscount"
            :min="0"
            :max="payTargetGross"
            :min-fraction-digits="0"
            :max-fraction-digits="2"
            class="w-full"
          />
          <small class="field-hint">أدخل مبلغاً وليس نسبة مئوية</small>
        </div>
        <div class="field">
          <label>المبلغ بعد الخصم</label>
          <div class="net-box">{{ formatMoney(payTargetTotal) }}</div>
        </div>
        <div class="field">
          <label>طريقة السداد</label>
          <Select
            v-model="payMethod"
            :options="serviceBillPaymentOptions"
            option-label="label"
            option-value="value"
            append-to="body"
          />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="payVisible = false" />
          <Button label="تأكيد التسديد وطباعة" :loading="paying" @click="confirmPay" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="codeDialogVisible"
      modal
      header="رمز دخول الساكن"
      :style="{ width: '420px' }"
    >
      <div class="code-dialog">
        <p class="code-hint">
          لإظهار رمز الدخول أدخل كلمة مرور حسابك الحالي.
        </p>
        <div v-if="!revealedCode" class="field">
          <label>كلمة مرور المدير</label>
          <Password
            v-model="managerPassword"
            :feedback="false"
            toggle-mask
            placeholder="كلمة المرور"
            input-class="w-full"
            class="w-full"
            @keyup.enter="submitRevealCode(false)"
          />
        </div>
        <div v-else class="revealed">
          <label>الرمز</label>
          <div class="revealed-row">
            <InputText :model-value="revealedCode" readonly class="code-value" />
            <Button icon="pi pi-copy" severity="secondary" outlined @click="copyRevealedCode" />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إغلاق" severity="secondary" outlined @click="codeDialogVisible = false" />
          <template v-if="!revealedCode">
            <Button label="إظهار الرمز" :loading="codeLoading" @click="submitRevealCode(false)" />
          </template>
          <template v-else>
            <Button
              label="توليد رمز جديد"
              severity="warn"
              :loading="codeLoading"
              @click="submitRevealCode(true)"
            />
          </template>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.loading-box {
  min-height: 240px;
  display: grid;
  place-items: center;
}

.profile-banner {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #f0f7fa 0%, #eef2ff 100%);
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #fff;
  color: var(--brand);
  font-size: 1.8rem;
  border: 2px solid color-mix(in srgb, var(--brand) 25%, white);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.banner-main h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
}

.banner-main p {
  margin: 0.25rem 0 0.55rem;
  color: var(--muted);
}

.banner-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
}

.badge {
  display: inline-flex;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.badge.is-owner {
  background: #ecfdf5;
  color: #047857;
}

.badge.is-tenant {
  background: #eff6ff;
  color: #1d4ed8;
}

.meta-date {
  font-size: 0.85rem;
  color: var(--muted);
}

.profile-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.profile-nav__item {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
  border-radius: 999px;
  padding: 0.45rem 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.15s ease;
}

.profile-nav__item:hover {
  color: var(--brand);
  border-color: color-mix(in srgb, var(--brand) 35%, var(--border));
}

.profile-nav__item.is-active {
  color: #fff;
  background: var(--brand);
  border-color: var(--brand);
}

.section-title {
  margin: 0 0 1rem;
  font-size: 1.05rem;
}

.sub-title {
  margin: 1.25rem 0 0.65rem;
  font-size: 0.95rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
}

.detail-item {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem 0.85rem;
}

.detail-item.full {
  grid-column: 1 / -1;
}

.detail-label {
  display: block;
  color: var(--muted);
  font-size: 0.8rem;
  margin-bottom: 0.35rem;
}

.detail-value {
  font-weight: 700;
  word-break: break-word;
}

.attach-actions {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.family-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.9rem;
  color: var(--muted);
}

.family-stats b {
  color: var(--brand);
}

.meters-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.meters-table th,
.meters-table td {
  border: 1px solid var(--border);
  padding: 0.55rem 0.65rem;
  text-align: start;
}

.meters-table th {
  background: #f1f5f9;
  font-weight: 700;
}

.preview-img {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  margin: 0 auto;
  border-radius: 8px;
}

.invoices-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.invoices-toolbar .section-title {
  margin: 0;
}

.invoices-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.invoices-hint {
  margin: 0 0 0.85rem;
  color: var(--muted);
  font-size: 0.85rem;
}

.filter-modal-grid {
  display: grid;
  gap: 0.75rem;
}

.filter-modal-grid .field label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.filter-modal-grid .w-full {
  width: 100%;
}

.selection-bar {
  margin-bottom: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  background: #ecfdf5;
  color: #065f46;
  font-size: 0.9rem;
}

.row-actions {
  display: flex;
  gap: 0.35rem;
}

.field-hint {
  display: block;
  margin-top: 0.35rem;
  color: var(--muted);
  font-size: 0.78rem;
}

.net-box {
  min-height: 2.5rem;
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #f8fafc;
  font-weight: 700;
}

@media (max-width: 640px) {
  .profile-banner {
    align-items: flex-start;
  }
}

.code-dialog {
  display: grid;
  gap: 14px;
}

.code-hint {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.revealed-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.code-value {
  flex: 1;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-align: center;
  text-transform: uppercase;
}
</style>
