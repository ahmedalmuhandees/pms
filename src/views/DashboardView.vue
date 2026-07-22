<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Statistics } from '@/types'
import { getStatistics } from '@/api/statistics'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import PageHeader from '@/components/PageHeader.vue'
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton.vue'

type Tone = 'teal' | 'copper' | 'slate' | 'ocean' | 'forest' | 'rose'
type StatKey = keyof Statistics

interface StatCard {
  key: StatKey
  label: string
  hint: string
  icon: string
  tone: Tone
  to: string
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

const featured: StatCard[] = [
  { key: 'complexesCount', label: 'المجمعات', hint: 'المجمعات السكنية النشطة', icon: 'pi pi-building', tone: 'teal', to: '/complexes' },
  { key: 'unitsCount', label: 'الوحدات', hint: 'إجمالي الوحدات المسجّلة', icon: 'pi pi-key', tone: 'copper', to: '/units' },
  { key: 'customersCount', label: 'العملاء', hint: 'قاعدة بيانات العملاء', icon: 'pi pi-users', tone: 'ocean', to: '/customers' },
  { key: 'usersCount', label: 'المستخدمون', hint: 'حسابات الدخول للنظام', icon: 'pi pi-user', tone: 'slate', to: '/users' },
]

const structureCards: StatCard[] = [
  { key: 'blocksCount', label: 'البلوكات', hint: 'داخل المجمعات', icon: 'pi pi-th-large', tone: 'teal', to: '/blocks' },
  { key: 'buildingsCount', label: 'المباني', hint: 'المباني المسجّلة', icon: 'pi pi-home', tone: 'ocean', to: '/buildings' },
  { key: 'floorsCount', label: 'الطوابق', hint: 'طوابق المباني', icon: 'pi pi-bars', tone: 'slate', to: '/floors' },
]

const peopleCards: StatCard[] = [
  { key: 'employeesCount', label: 'الموظفون', hint: 'الإدارة والتشغيل', icon: 'pi pi-id-card', tone: 'forest', to: '/employees' },
  { key: 'residentsCount', label: 'السكان', hint: 'المقيمون', icon: 'pi pi-home', tone: 'teal', to: '/residents' },
  { key: 'vehiclesCount', label: 'المركبات', hint: 'المسجّلة في النظام', icon: 'pi pi-car', tone: 'copper', to: '/vehicles' },
  { key: 'visitorsCount', label: 'الزوار', hint: 'سجل الزيارات', icon: 'pi pi-envelope', tone: 'rose', to: '/visitors' },
]

const totalAssets = computed(
  () =>
    stats.value.complexesCount +
    stats.value.blocksCount +
    stats.value.buildingsCount +
    stats.value.floorsCount +
    stats.value.unitsCount,
)

function formatCount(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function go(path: string) {
  void router.push(path)
}

onMounted(async () => {
  loading.value = true
  try {
    stats.value = await getStatistics()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page dash">
    <PageHeader title="لوحة التحكم" subtitle="نظرة شاملة على أصول المجمعات والحسابات">
      <template #actions>
        <div class="live-pill">
          <span class="live-dot" />
          بيانات مباشرة
        </div>
      </template>
    </PageHeader>

    <DashboardSkeleton v-if="loading" />

    <template v-else>
      <section class="overview">
        <div class="overview__copy">
          <p class="overview__eyebrow">ملخص النظام</p>
          <h2 class="overview__title">الأصول العقارية والحسابات في مكان واحد</h2>
          <p class="overview__text">
            إجمالي عناصر الهيكل العقاري المسجّل حالياً
            <strong>{{ formatCount(totalAssets) }}</strong>
          </p>
        </div>
        <div class="overview__metrics">
          <div class="mini-metric">
            <span class="mini-metric__value">{{ formatCount(stats.complexesCount) }}</span>
            <span class="mini-metric__label">مجمع</span>
          </div>
          <div class="mini-metric">
            <span class="mini-metric__value">{{ formatCount(stats.unitsCount) }}</span>
            <span class="mini-metric__label">وحدة</span>
          </div>
          <div class="mini-metric">
            <span class="mini-metric__value">{{ formatCount(stats.customersCount) }}</span>
            <span class="mini-metric__label">عميل</span>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section__head">
          <h3>المؤشرات الرئيسية</h3>
          <p>الأرقام الأكثر أهمية للمتابعة اليومية</p>
        </div>
        <div class="featured-grid">
          <button
            v-for="(card, index) in featured"
            :key="card.key"
            type="button"
            class="feature-card"
            :class="`tone-${card.tone}`"
            :style="{ animationDelay: `${index * 70}ms` }"
            @click="go(card.to)"
          >
            <span class="feature-card__mesh" aria-hidden="true" />
            <div class="feature-card__top">
              <span class="feature-card__icon">
                <i :class="card.icon" />
              </span>
              <span class="feature-card__go">
                عرض
                <i class="pi pi-arrow-left" />
              </span>
            </div>
            <div class="feature-card__value">{{ formatCount(stats[card.key]) }}</div>
            <div class="feature-card__footer">
              <div>
                <div class="feature-card__label">{{ card.label }}</div>
                <div class="feature-card__hint">{{ card.hint }}</div>
              </div>
            </div>
          </button>
        </div>
      </section>

      <section class="section">
        <div class="section__head">
          <h3>الهيكل العقاري</h3>
          <p>تفصيل البلوكات والمباني والطوابق</p>
        </div>
        <div class="metric-grid">
          <button
            v-for="(card, index) in structureCards"
            :key="card.key"
            type="button"
            class="metric-card"
            :class="`tone-${card.tone}`"
            :style="{ animationDelay: `${index * 55}ms` }"
            @click="go(card.to)"
          >
            <span class="metric-card__accent" aria-hidden="true" />
            <span class="metric-card__icon"><i :class="card.icon" /></span>
            <div class="metric-card__body">
              <div class="metric-card__label">{{ card.label }}</div>
              <div class="metric-card__value">{{ formatCount(stats[card.key]) }}</div>
              <div class="metric-card__hint">{{ card.hint }}</div>
            </div>
            <i class="pi pi-chevron-left metric-card__chevron" />
          </button>
        </div>
      </section>

      <section class="section">
        <div class="section__head">
          <h3>الأشخاص والحركة</h3>
          <p>الموظفون والسكان والمركبات والزوار</p>
        </div>
        <div class="metric-grid metric-grid--4">
          <button
            v-for="(card, index) in peopleCards"
            :key="card.key"
            type="button"
            class="metric-card"
            :class="`tone-${card.tone}`"
            :style="{ animationDelay: `${index * 55}ms` }"
            @click="go(card.to)"
          >
            <span class="metric-card__accent" aria-hidden="true" />
            <span class="metric-card__icon"><i :class="card.icon" /></span>
            <div class="metric-card__body">
              <div class="metric-card__label">{{ card.label }}</div>
              <div class="metric-card__value">{{ formatCount(stats[card.key]) }}</div>
              <div class="metric-card__hint">{{ card.hint }}</div>
            </div>
            <i class="pi pi-chevron-left metric-card__chevron" />
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dash {
  gap: 22px;
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

.overview {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-radius: 22px;
  background:
    radial-gradient(ellipse 70% 120% at 100% 0%, rgba(196, 107, 43, 0.18), transparent 55%),
    linear-gradient(135deg, #0b3d4a 0%, #156574 52%, #1f8494 100%);
  color: #f4fafb;
  box-shadow: 0 18px 40px rgba(6, 40, 48, 0.16);
  overflow: hidden;
  position: relative;
}

.overview__copy {
  position: relative;
  max-width: 520px;
}

.overview__eyebrow {
  margin: 0 0 8px;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(244, 250, 251, 0.7);
}

.overview__title {
  margin: 0;
  font-size: clamp(1.2rem, 2vw, 1.55rem);
  font-weight: 700;
  line-height: 1.35;
  color: #ffffff;
}

.overview__text {
  margin: 10px 0 0;
  color: rgba(244, 250, 251, 0.78);
  font-size: 0.95rem;
}

.overview__text strong {
  color: #fff;
  font-weight: 800;
}

.overview__metrics {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.mini-metric {
  min-width: 96px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(8px);
  text-align: center;
}

.mini-metric__value {
  display: block;
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.1;
  color: #fff;
}

.mini-metric__label {
  display: block;
  margin-top: 4px;
  font-size: 0.78rem;
  opacity: 0.75;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section__head h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.section__head p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.88rem;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.feature-card {
  --tone: #156574;
  --tone-soft: #e6f3f5;
  --tone-mid: rgba(21, 101, 116, 0.14);

  position: relative;
  isolation: isolate;
  overflow: hidden;
  text-align: start;
  border: 1px solid color-mix(in srgb, var(--tone) 18%, #d3e0e5);
  border-radius: 22px;
  padding: 22px 20px 20px;
  min-height: 188px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  background:
    linear-gradient(165deg, color-mix(in srgb, var(--tone-soft) 88%, white) 0%, #ffffff 58%),
    var(--tone-soft);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 10px 28px rgba(6, 40, 48, 0.06);
  animation: rise 0.55s var(--ease-out) both;
  transition:
    transform 0.3s var(--ease),
    box-shadow 0.3s var(--ease),
    border-color 0.3s var(--ease);
}

.feature-card::after {
  content: '';
  position: absolute;
  inset-inline: 18px;
  bottom: 0;
  height: 3px;
  border-radius: 999px 999px 0 0;
  background: linear-gradient(90deg, var(--tone), transparent);
  opacity: 0.85;
}

.feature-card:hover {
  transform: translateY(-6px) scale(1.01);
  border-color: color-mix(in srgb, var(--tone) 40%, #d3e0e5);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.9) inset,
    0 18px 40px color-mix(in srgb, var(--tone) 18%, rgba(6, 40, 48, 0.08));
}

.feature-card__mesh {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  background:
    radial-gradient(circle at 100% 0%, var(--tone-mid), transparent 42%),
    radial-gradient(circle at 0% 100%, color-mix(in srgb, var(--tone) 8%, transparent), transparent 45%);
  z-index: 0;
}

.feature-card__top,
.feature-card__value,
.feature-card__footer {
  position: relative;
  z-index: 1;
}

.feature-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: auto;
}

.feature-card__icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  color: #fff;
  background: linear-gradient(145deg, color-mix(in srgb, var(--tone) 82%, white), var(--tone));
  box-shadow: 0 10px 20px color-mix(in srgb, var(--tone) 28%, transparent);
}

.feature-card__go {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--tone);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid color-mix(in srgb, var(--tone) 16%, transparent);
  opacity: 0;
  transform: translateY(4px);
  transition: 0.25s var(--ease);
}

.feature-card:hover .feature-card__go {
  opacity: 1;
  transform: translateY(0);
}

.feature-card__value {
  margin-top: 22px;
  font-size: clamp(2rem, 2.8vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--text-strong);
  font-variant-numeric: tabular-nums;
}

.feature-card__footer {
  margin-top: 12px;
}

.feature-card__label {
  font-size: 1.02rem;
  font-weight: 700;
  color: var(--text-strong);
}

.feature-card__hint {
  margin-top: 3px;
  font-size: 0.8rem;
  color: var(--muted);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.metric-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-card {
  --tone: #156574;
  --tone-soft: #e6f3f5;

  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: start;
  border: 1px solid color-mix(in srgb, var(--tone) 14%, #d3e0e5);
  border-radius: 18px;
  padding: 18px 16px 18px 14px;
  min-height: 108px;
  background:
    linear-gradient(120deg, color-mix(in srgb, var(--tone-soft) 70%, white), #ffffff 55%);
  cursor: pointer;
  font-family: inherit;
  color: inherit;
  box-shadow: 0 8px 22px rgba(6, 40, 48, 0.05);
  animation: rise 0.55s var(--ease-out) both;
  transition:
    transform 0.28s var(--ease),
    box-shadow 0.28s var(--ease),
    border-color 0.28s var(--ease);
}

.metric-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--tone) 35%, #d3e0e5);
  box-shadow: 0 16px 32px color-mix(in srgb, var(--tone) 14%, rgba(6, 40, 48, 0.08));
}

.metric-card__accent {
  position: absolute;
  inset-block: 14px;
  inset-inline-start: 0;
  width: 4px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--tone), color-mix(in srgb, var(--tone) 40%, white));
}

.metric-card__icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  font-size: 1.15rem;
  color: var(--tone);
  background: color-mix(in srgb, var(--tone-soft) 80%, white);
  border: 1px solid color-mix(in srgb, var(--tone) 12%, transparent);
  box-shadow: 0 6px 14px color-mix(in srgb, var(--tone) 10%, transparent);
}

.metric-card__body {
  min-width: 0;
  flex: 1;
}

.metric-card__label {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--muted);
}

.metric-card__value {
  margin-top: 4px;
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--text-strong);
  letter-spacing: -0.03em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.metric-card__hint {
  margin-top: 4px;
  font-size: 0.76rem;
  color: var(--muted);
}

.metric-card__chevron {
  color: color-mix(in srgb, var(--tone) 55%, #8aa0a8);
  font-size: 0.78rem;
  opacity: 0.55;
  transition: 0.25s var(--ease);
}

.metric-card:hover .metric-card__chevron {
  opacity: 1;
  transform: translateX(-3px);
  color: var(--tone);
}

.tone-teal {
  --tone: #156574;
  --tone-soft: #e6f3f5;
  --tone-mid: rgba(21, 101, 116, 0.16);
}
.tone-copper {
  --tone: #c46b2b;
  --tone-soft: #f8efe6;
  --tone-mid: rgba(196, 107, 43, 0.16);
}
.tone-ocean {
  --tone: #2b6cb0;
  --tone-soft: #eaf2fa;
  --tone-mid: rgba(43, 108, 176, 0.14);
}
.tone-slate {
  --tone: #3d5560;
  --tone-soft: #eef2f4;
  --tone-mid: rgba(61, 85, 96, 0.14);
}
.tone-forest {
  --tone: #1f7a5c;
  --tone-soft: #e8f5f0;
  --tone-mid: rgba(31, 122, 92, 0.14);
}
.tone-rose {
  --tone: #b04a4a;
  --tone-soft: #f8ecec;
  --tone-mid: rgba(176, 74, 74, 0.14);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
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

@media (max-width: 1100px) {
  .featured-grid,
  .metric-grid--4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .featured-grid,
  .metric-grid,
  .metric-grid--4 {
    grid-template-columns: 1fr;
  }

  .overview {
    padding: 18px;
  }

  .feature-card__go {
    opacity: 1;
    transform: none;
  }
}
</style>
