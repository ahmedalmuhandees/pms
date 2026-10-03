<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { ChartData } from 'chart.js'
import type { Installment, Reservation, SalesContract, Statistics, Unit } from '@/types'
import {
  ContractStatus,
  InstallmentStatus,
  ReservationStatus,
  UnitStatus,
} from '@/types'
import { getStatistics } from '@/api/statistics'
import { getUnits } from '@/api/units'
import { getSalesContracts } from '@/api/salesContracts'
import { getInstallments } from '@/api/installments'
import { getReservations } from '@/api/reservations'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import {
  contractStatusOptions,
  formatMoney,
  installmentStatusOptions,
  labelOf,
  unitStatusOptions,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton.vue'
import DashboardChart from '@/components/DashboardChart.vue'

const COLORS = {
  teal: '#156574',
  tealSoft: '#1f8494',
  copper: '#c46b2b',
  ocean: '#2b6cb0',
  forest: '#1f7a5c',
  rose: '#b04a4a',
  slate: '#3d5560',
  amber: '#b7791f',
  mist: '#8aa0a8',
}

const UNIT_STATUS_COLORS: Record<number, string> = {
  [UnitStatus.Available]: COLORS.forest,
  [UnitStatus.Reserved]: COLORS.amber,
  [UnitStatus.Sold]: COLORS.teal,
  [UnitStatus.Rented]: COLORS.ocean,
  [UnitStatus.Maintenance]: COLORS.rose,
}

const INSTALLMENT_STATUS_COLORS: Record<number, string> = {
  [InstallmentStatus.Pending]: COLORS.amber,
  [InstallmentStatus.Paid]: COLORS.forest,
  [InstallmentStatus.Partial]: COLORS.ocean,
  [InstallmentStatus.Overdue]: COLORS.rose,
  [InstallmentStatus.Cancelled]: COLORS.mist,
}

const CONTRACT_STATUS_COLORS: Record<number, string> = {
  [ContractStatus.Draft]: COLORS.mist,
  [ContractStatus.Active]: COLORS.teal,
  [ContractStatus.Completed]: COLORS.forest,
  [ContractStatus.Cancelled]: COLORS.rose,
  [ContractStatus.Suspended]: COLORS.amber,
}

const notify = useNotify()
const router = useRouter()
const loading = ref(true)

const stats = ref<Statistics>({
  complexesCount: 0,
  blocksCount: 0,
  buildingsCount: 0,
  floorsCount: 0,
  unitsCount: 0,
  usersCount: 0,
  employeesCount: 0,
  customersCount: 0,
  residentsCount: 0,
  vehiclesCount: 0,
  visitorsCount: 0,
})

const units = ref<Unit[]>([])
const contracts = ref<SalesContract[]>([])
const installments = ref<Installment[]>([])
const reservations = ref<Reservation[]>([])
const contractsTotal = ref(0)
const installmentsTotal = ref(0)
const reservationsTotal = ref(0)

function formatCount(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatPct(value: number) {
  return `${value.toFixed(0)}%`
}

function countBy<T>(items: T[], getKey: (item: T) => number | null | undefined) {
  const map = new Map<number, number>()
  for (const item of items) {
    const key = getKey(item)
    if (key == null) continue
    map.set(key, (map.get(key) || 0) + 1)
  }
  return map
}

function go(path: string) {
  void router.push(path)
}

const unitStatusCounts = computed(() => countBy(units.value, (u) => u.status))

const unitsAvailable = computed(() => unitStatusCounts.value.get(UnitStatus.Available) || 0)
const unitsSold = computed(() => unitStatusCounts.value.get(UnitStatus.Sold) || 0)
const unitsReserved = computed(() => unitStatusCounts.value.get(UnitStatus.Reserved) || 0)

const soldRate = computed(() => {
  const total = stats.value.unitsCount || units.value.length
  if (!total) return 0
  return (unitsSold.value / total) * 100
})

const occupancyRate = computed(() => {
  const total = stats.value.unitsCount || units.value.length
  if (!total) return 0
  const taken =
    unitsSold.value +
    unitsReserved.value +
    (unitStatusCounts.value.get(UnitStatus.Rented) || 0)
  return (taken / total) * 100
})

const activeContracts = computed(
  () => contracts.value.filter((c) => c.contractStatus === ContractStatus.Active).length,
)

const overdueInstallments = computed(
  () => installments.value.filter((i) => i.status === InstallmentStatus.Overdue).length,
)

const pendingInstallments = computed(
  () => installments.value.filter((i) => i.status === InstallmentStatus.Pending).length,
)

const activeReservations = computed(
  () =>
    reservations.value.filter(
      (r) =>
        r.status === ReservationStatus.Pending || r.status === ReservationStatus.Confirmed,
    ).length,
)

const kpiCards = computed(() => [
  {
    key: 'units',
    label: 'إجمالي الوحدات',
    value: formatCount(stats.value.unitsCount),
    hint: `${formatCount(unitsAvailable.value)} متاح · ${formatCount(unitsSold.value)} مباع`,
    icon: 'pi pi-key',
    tone: 'teal',
    to: '/units',
  },
  {
    key: 'sold',
    label: 'نسبة البيع',
    value: formatPct(soldRate.value),
    hint: `${formatCount(unitsSold.value)} وحدة مباعة`,
    icon: 'pi pi-chart-line',
    tone: 'copper',
    to: '/units',
  },
  {
    key: 'contracts',
    label: 'عقود سارية',
    value: formatCount(activeContracts.value),
    hint: `${formatCount(contractsTotal.value)} عقد إجمالي`,
    icon: 'pi pi-file',
    tone: 'ocean',
    to: '/sales-contracts',
  },
  {
    key: 'overdue',
    label: 'أقساط متأخرة',
    value: formatCount(overdueInstallments.value),
    hint: `${formatCount(pendingInstallments.value)} غير مدفوع`,
    icon: 'pi pi-exclamation-triangle',
    tone: 'rose',
    to: '/installments',
  },
  {
    key: 'customers',
    label: 'العملاء',
    value: formatCount(stats.value.customersCount),
    hint: `${formatCount(stats.value.residentsCount)} مقيم`,
    icon: 'pi pi-users',
    tone: 'forest',
    to: '/customers',
  },
  {
    key: 'reservations',
    label: 'حجوزات نشطة',
    value: formatCount(activeReservations.value),
    hint: `${formatCount(reservationsTotal.value)} حجز إجمالي`,
    icon: 'pi pi-bookmark',
    tone: 'amber',
    to: '/reservations',
  },
])

const unitStatusChart = computed<ChartData>(() => {
  const labels: string[] = []
  const values: number[] = []
  const colors: string[] = []
  for (const opt of unitStatusOptions) {
    const count = unitStatusCounts.value.get(opt.value) || 0
    if (!count) continue
    labels.push(opt.label)
    values.push(count)
    colors.push(UNIT_STATUS_COLORS[opt.value] || COLORS.mist)
  }
  if (!values.length) {
    return {
      labels: ['لا بيانات'],
      datasets: [{ data: [1], backgroundColor: ['#d3e0e5'], borderWidth: 0 }],
    }
  }
  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }
})

const structureChart = computed<ChartData>(() => ({
  labels: ['مجمعات', 'بلوكات', 'مباني', 'طوابق', 'وحدات'],
  datasets: [
    {
      label: 'العدد',
      data: [
        stats.value.complexesCount,
        stats.value.blocksCount,
        stats.value.buildingsCount,
        stats.value.floorsCount,
        stats.value.unitsCount,
      ],
      backgroundColor: [
        COLORS.teal,
        COLORS.tealSoft,
        COLORS.ocean,
        COLORS.slate,
        COLORS.copper,
      ],
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 42,
    },
  ],
}))

const installmentChart = computed<ChartData>(() => {
  const counts = countBy(installments.value, (i) => i.status)
  const labels: string[] = []
  const values: number[] = []
  const colors: string[] = []
  for (const opt of installmentStatusOptions) {
    const count = counts.get(opt.value) || 0
    if (!count) continue
    labels.push(opt.label)
    values.push(count)
    colors.push(INSTALLMENT_STATUS_COLORS[opt.value] || COLORS.mist)
  }
  if (!values.length) {
    return {
      labels: ['لا بيانات'],
      datasets: [{ data: [1], backgroundColor: ['#d3e0e5'], borderWidth: 0 }],
    }
  }
  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }
})

const contractStatusChart = computed<ChartData>(() => {
  const counts = countBy(contracts.value, (c) => c.contractStatus)
  return {
    labels: contractStatusOptions.map((o) => o.label),
    datasets: [
      {
        label: 'العقود',
        data: contractStatusOptions.map((o) => counts.get(o.value) || 0),
        backgroundColor: contractStatusOptions.map(
          (o) => CONTRACT_STATUS_COLORS[o.value] || COLORS.mist,
        ),
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 36,
      },
    ],
  }
})

const peopleChart = computed<ChartData>(() => ({
  labels: ['عملاء', 'مقيمون', 'موظفون', 'مستخدمون', 'زوار', 'مركبات'],
  datasets: [
    {
      label: 'العدد',
      data: [
        stats.value.customersCount,
        stats.value.residentsCount,
        stats.value.employeesCount,
        stats.value.usersCount,
        stats.value.visitorsCount,
        stats.value.vehiclesCount,
      ],
      backgroundColor: [
        COLORS.ocean,
        COLORS.teal,
        COLORS.forest,
        COLORS.slate,
        COLORS.rose,
        COLORS.copper,
      ],
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 36,
    },
  ],
}))

const doughnutOptions = {
  cutout: '68%',
  plugins: {
    legend: { position: 'bottom' as const },
  },
}

const recentContracts = computed(() =>
  [...contracts.value]
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 6),
)

const quickLinks = [
  { label: 'عقد جديد', icon: 'pi pi-plus', to: '/sales-contracts', tone: 'teal' },
  { label: 'الوحدات', icon: 'pi pi-key', to: '/units', tone: 'copper' },
  { label: 'الأقساط', icon: 'pi pi-wallet', to: '/installments', tone: 'rose' },
  { label: 'الحجوزات', icon: 'pi pi-bookmark', to: '/reservations', tone: 'amber' },
  { label: 'العملاء', icon: 'pi pi-users', to: '/customers', tone: 'ocean' },
  { label: 'خريطة المجمع', icon: 'pi pi-map', to: '/complex-map', tone: 'forest' },
]

function contractStatusLabel(status: number) {
  return labelOf(contractStatusOptions, status)
}

onMounted(async () => {
  loading.value = true
  try {
    const [statistics, unitsPage, contractsPage, installmentsPage, reservationsPage] =
      await Promise.all([
        getStatistics(),
        getUnits({ Page: 1, PageSize: 500 }),
        getSalesContracts({ Page: 1, PageSize: 500 }),
        getInstallments({ Page: 1, PageSize: 500 }),
        getReservations({ Page: 1, PageSize: 300 }),
      ])

    stats.value = statistics
    units.value = unitsPage.items || []
    contracts.value = contractsPage.items || []
    installments.value = installmentsPage.items || []
    reservations.value = reservationsPage.items || []
    contractsTotal.value = contractsPage.totalCount || contracts.value.length
    installmentsTotal.value = installmentsPage.totalCount || installments.value.length
    reservationsTotal.value = reservationsPage.totalCount || reservations.value.length
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page dash">
    <PageHeader title="لوحة التحكم" subtitle="متابعة المبيعات والوحدات والأقساط والحركة اليومية">
      <template #actions>
        <div class="live-pill">
          <span class="live-dot" />
          بيانات مباشرة
        </div>
      </template>
    </PageHeader>

    <DashboardSkeleton v-if="loading" />

    <template v-else>
      <section class="hero">
        <div class="hero__copy">
          <p class="hero__eyebrow">ملخص تشغيلي</p>
          <h2 class="hero__title">أداء المجمعات والمبيعات في نظرة واحدة</h2>
          <p class="hero__text">
            نسبة الإشغال
            <strong>{{ formatPct(occupancyRate) }}</strong>
            · العقود السارية
            <strong>{{ formatCount(activeContracts) }}</strong>
            · الأقساط المتأخرة
            <strong>{{ formatCount(overdueInstallments) }}</strong>
          </p>
        </div>
        <div class="hero__metrics">
          <div class="hero-metric">
            <span class="hero-metric__value">{{ formatCount(stats.complexesCount) }}</span>
            <span class="hero-metric__label">مجمع</span>
          </div>
          <div class="hero-metric">
            <span class="hero-metric__value">{{ formatCount(stats.unitsCount) }}</span>
            <span class="hero-metric__label">وحدة</span>
          </div>
          <div class="hero-metric">
            <span class="hero-metric__value">{{ formatCount(stats.customersCount) }}</span>
            <span class="hero-metric__label">عميل</span>
          </div>
          <div class="hero-metric">
            <span class="hero-metric__value">{{ formatCount(contractsTotal) }}</span>
            <span class="hero-metric__label">عقد</span>
          </div>
        </div>
      </section>

      <section class="kpi-grid">
        <button
          v-for="(card, index) in kpiCards"
          :key="card.key"
          type="button"
          class="kpi-card"
          :class="`tone-${card.tone}`"
          :style="{ animationDelay: `${index * 50}ms` }"
          @click="go(card.to)"
        >
          <span class="kpi-card__icon"><i :class="card.icon" /></span>
          <div class="kpi-card__body">
            <div class="kpi-card__label">{{ card.label }}</div>
            <div class="kpi-card__value">{{ card.value }}</div>
            <div class="kpi-card__hint">{{ card.hint }}</div>
          </div>
        </button>
      </section>

      <section class="charts-grid">
        <article class="panel">
          <header class="panel__head">
            <div>
              <h3>توزيع حالة الوحدات</h3>
              <p>متاح · محجوز · مباع · مؤجر · صيانة</p>
            </div>
            <button type="button" class="panel__link" @click="go('/units')">عرض الوحدات</button>
          </header>
          <DashboardChart type="doughnut" :data="unitStatusChart" :options="doughnutOptions" :height="280" />
        </article>

        <article class="panel">
          <header class="panel__head">
            <div>
              <h3>الهيكل العقاري</h3>
              <p>من المجمع حتى الوحدة</p>
            </div>
            <button type="button" class="panel__link" @click="go('/complexes')">المجمعات</button>
          </header>
          <DashboardChart type="bar" :data="structureChart" :height="280" />
        </article>

        <article class="panel">
          <header class="panel__head">
            <div>
              <h3>حالة الأقساط</h3>
              <p>مدفوع · متأخر · غير مدفوع</p>
            </div>
            <button type="button" class="panel__link" @click="go('/installments')">الأقساط</button>
          </header>
          <DashboardChart type="doughnut" :data="installmentChart" :options="doughnutOptions" :height="280" />
        </article>

        <article class="panel">
          <header class="panel__head">
            <div>
              <h3>حالة عقود البيع</h3>
              <p>مسودة · ساري · مكتمل · ملغى</p>
            </div>
            <button type="button" class="panel__link" @click="go('/sales-contracts')">العقود</button>
          </header>
          <DashboardChart type="bar" :data="contractStatusChart" :height="280" />
        </article>
      </section>

      <section class="bottom-grid">
        <article class="panel">
          <header class="panel__head">
            <div>
              <h3>الأشخاص والحركة</h3>
              <p>عملاء · مقيمون · موظفون · زوار</p>
            </div>
          </header>
          <DashboardChart type="bar" :data="peopleChart" :height="260" />
        </article>

        <article class="panel">
          <header class="panel__head">
            <div>
              <h3>أحدث العقود</h3>
              <p>آخر العقود المسجّلة في النظام</p>
            </div>
            <button type="button" class="panel__link" @click="go('/sales-contracts')">الكل</button>
          </header>

          <div v-if="recentContracts.length" class="recent-list">
            <button
              v-for="row in recentContracts"
              :key="row.id"
              type="button"
              class="recent-row"
              @click="go('/sales-contracts')"
            >
              <div class="recent-row__main">
                <strong>{{ row.contractNumber || '—' }}</strong>
                <span>{{ formatMoney(row.sellingPrice) }}</span>
              </div>
              <div class="recent-row__meta">
                <span class="badge">{{ contractStatusLabel(row.contractStatus) }}</span>
                <span class="muted">{{ row.contractDate?.slice(0, 10) || '—' }}</span>
              </div>
            </button>
          </div>
          <div v-else class="empty-hint">لا توجد عقود بعد</div>
        </article>

        <article class="panel panel--actions">
          <header class="panel__head">
            <div>
              <h3>اختصارات سريعة</h3>
              <p>الوصول لأهم الشاشات مباشرة</p>
            </div>
          </header>
          <div class="quick-grid">
            <button
              v-for="link in quickLinks"
              :key="link.to + link.label"
              type="button"
              class="quick-card"
              :class="`tone-${link.tone}`"
              @click="go(link.to)"
            >
              <i :class="link.icon" />
              <span>{{ link.label }}</span>
            </button>
          </div>

          <div class="insight-box">
            <div class="insight-box__item">
              <span>أقساط قيد المتابعة</span>
              <strong>{{ formatCount(installmentsTotal) }}</strong>
            </div>
            <div class="insight-box__item">
              <span>وحدات محجوزة</span>
              <strong>{{ formatCount(unitsReserved) }}</strong>
            </div>
            <div class="insight-box__item">
              <span>موظفون / مستخدمون</span>
              <strong>{{ formatCount(stats.employeesCount) }} / {{ formatCount(stats.usersCount) }}</strong>
            </div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dash {
  gap: 20px;
}

.live-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--brand-mid);
  background: var(--brand-soft);
  border: 1px solid color-mix(in srgb, var(--brand-mid) 16%, transparent);
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1f7a5c;
  animation: pulse 1.8s ease infinite;
}

.hero {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-radius: 22px;
  background:
    radial-gradient(ellipse 70% 120% at 100% 0%, rgba(196, 107, 43, 0.18), transparent 55%),
    linear-gradient(135deg, #0b3d4a 0%, #156574 52%, #1f8494 100%);
  color: #f4fafb;
  box-shadow: 0 18px 40px rgba(6, 40, 48, 0.16);
}

.hero__eyebrow {
  margin: 0 0 8px;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(244, 250, 251, 0.7);
}

.hero__title {
  margin: 0;
  font-size: clamp(1.2rem, 2vw, 1.55rem);
  font-weight: 700;
  line-height: 1.35;
  color: #fff;
}

.hero__text {
  margin: 10px 0 0;
  color: rgba(244, 250, 251, 0.8);
  font-size: 0.95rem;
}

.hero__text strong {
  color: #fff;
  font-weight: 800;
}

.hero__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.hero-metric {
  min-width: 88px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(8px);
  text-align: center;
}

.hero-metric__value {
  display: block;
  font-size: 1.3rem;
  font-weight: 800;
  color: #fff;
}

.hero-metric__label {
  display: block;
  margin-top: 4px;
  font-size: 0.76rem;
  opacity: 0.75;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.kpi-card {
  --tone: #156574;
  --tone-soft: #e6f3f5;

  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: start;
  padding: 16px 14px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--tone) 14%, #d3e0e5);
  background: linear-gradient(145deg, color-mix(in srgb, var(--tone-soft) 75%, white), #fff 60%);
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  box-shadow: 0 8px 22px rgba(6, 40, 48, 0.05);
  animation: rise 0.5s var(--ease-out) both;
  transition:
    transform 0.25s var(--ease),
    box-shadow 0.25s var(--ease);
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 28px color-mix(in srgb, var(--tone) 14%, rgba(6, 40, 48, 0.08));
}

.kpi-card__icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(145deg, color-mix(in srgb, var(--tone) 80%, white), var(--tone));
  flex-shrink: 0;
}

.kpi-card__label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--muted);
}

.kpi-card__value {
  margin-top: 4px;
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-strong);
  font-variant-numeric: tabular-nums;
}

.kpi-card__hint {
  margin-top: 4px;
  font-size: 0.72rem;
  color: var(--muted);
}

.charts-grid,
.bottom-grid {
  display: grid;
  gap: 14px;
}

.charts-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.bottom-grid {
  grid-template-columns: 1.2fr 1fr 0.95fr;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 18px 18px 14px;
  box-shadow: var(--shadow-sm);
  animation: rise 0.55s var(--ease-out) both;
}

.panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.panel__head h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.panel__head p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.82rem;
}

.panel__link {
  border: 0;
  background: var(--brand-soft);
  color: var(--brand-mid);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
}

.panel__link:hover {
  background: color-mix(in srgb, var(--brand-soft) 70%, white);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  text-align: start;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  transition: border-color 0.2s var(--ease), background 0.2s var(--ease);
}

.recent-row:hover {
  border-color: color-mix(in srgb, var(--brand-mid) 30%, var(--border));
  background: #fff;
}

.recent-row__main {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.9rem;
}

.recent-row__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.badge {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--brand-mid);
  background: var(--brand-soft);
}

.muted {
  color: var(--muted);
  font-size: 0.75rem;
}

.empty-hint {
  padding: 28px 12px;
  text-align: center;
  color: var(--muted);
  font-size: 0.9rem;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quick-card {
  --tone: #156574;
  --tone-soft: #e6f3f5;

  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--tone) 14%, #d3e0e5);
  background: color-mix(in srgb, var(--tone-soft) 70%, white);
  color: var(--text-strong);
  font: inherit;
  font-weight: 700;
  font-size: 0.86rem;
  cursor: pointer;
  text-align: start;
  transition: transform 0.2s var(--ease);
}

.quick-card i {
  color: var(--tone);
}

.quick-card:hover {
  transform: translateY(-2px);
}

.insight-box {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 14px;
  background: linear-gradient(160deg, #f4f8f9, #fff);
  border: 1px solid var(--border);
}

.insight-box__item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.82rem;
  color: var(--muted);
}

.insight-box__item strong {
  color: var(--text-strong);
  font-variant-numeric: tabular-nums;
}

.tone-teal {
  --tone: #156574;
  --tone-soft: #e6f3f5;
}
.tone-copper {
  --tone: #c46b2b;
  --tone-soft: #f8efe6;
}
.tone-ocean {
  --tone: #2b6cb0;
  --tone-soft: #eaf2fa;
}
.tone-forest {
  --tone: #1f7a5c;
  --tone-soft: #e8f5f0;
}
.tone-rose {
  --tone: #b04a4a;
  --tone-soft: #f8ecec;
}
.tone-amber {
  --tone: #b7791f;
  --tone-soft: #f7f1e4;
}
.tone-slate {
  --tone: #3d5560;
  --tone-soft: #eef2f4;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(31, 122, 92, 0.45);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(31, 122, 92, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(31, 122, 92, 0);
  }
}

@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .bottom-grid {
    grid-template-columns: 1fr 1fr;
  }

  .panel--actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .charts-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .hero {
    padding: 18px;
  }
}
</style>
