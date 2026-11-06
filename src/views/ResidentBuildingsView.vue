<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Select from 'primevue/select'
import type { Complex, ResidentBuildingStats } from '@/types'
import { getResidentBuildingStats } from '@/api/residentContracts'
import { getComplexes } from '@/api/complexes'
import { getErrorMessage } from '@/api/client'
import { asSelectOptions } from '@/utils/enums'
import { useNotify } from '@/composables/useNotify'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import { sortByTableMode, type TableSortMode } from '@/utils/tableSort'

const auth = useAuthStore()
const router = useRouter()
const notify = useNotify()

const complexes = ref<Complex[]>([])
const complexFilter = ref<string | null>(auth.scopedComplexId)
const cards = ref<ResidentBuildingStats[]>([])
const loading = ref(true)
const search = ref('')
const sortMode = ref<TableSortMode>('latest')

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

const displayCards = computed(() => {
  const q = search.value.trim()
  const filtered = !q
    ? cards.value
    : cards.value.filter(
        (c) => c.buildingName.includes(q) || c.blockName.includes(q),
      )
  return sortByTableMode(filtered, sortMode.value, [
    'createdAt',
    'buildingName',
    'blockName',
  ])
})

async function load() {
  loading.value = true
  try {
    cards.value = await getResidentBuildingStats(complexFilter.value)
  } catch (error) {
    notify.error(getErrorMessage(error))
    cards.value = []
  } finally {
    loading.value = false
  }
}

function openContracts(card: ResidentBuildingStats) {
  void router.push({
    name: 'resident-contracts',
    query: {
      buildingId: card.buildingId,
      buildingName: card.buildingName,
    },
  })
}

watch(complexFilter, () => {
  void load()
})

onMounted(async () => {
  try {
    const result = await getComplexes({ Page: 1, PageSize: 200 })
    complexes.value = result.items ?? []
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  await load()
})
</script>

<template>
  <div class="page">
    <PageHeader title="بناية الساكنين" subtitle="عرض إحصائيات الإشغال لكل بناية" />

    <div class="data-panel">
      <FilterBar
        v-model:search="search"
        v-model:sort-mode="sortMode"
        placeholder="ابحث عن بناية أو بلوك..."
      >
        <template #filters>
          <Select
            v-if="auth.canSelectComplex"
            v-model="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="كل المجمعات"
            show-clear
            style="min-width: 180px"
          />
        </template>
      </FilterBar>

      <div v-if="loading" class="buildings-grid">
        <div v-for="n in 6" :key="n" class="building-card building-card--skeleton" />
      </div>

      <div v-else-if="displayCards.length === 0" class="empty-box">لا توجد بنايات</div>

      <div v-else class="buildings-grid">
        <article
          v-for="card in displayCards"
          :key="card.buildingId"
          class="building-card"
          role="button"
          tabindex="0"
          @click="openContracts(card)"
          @keydown.enter.prevent="openContracts(card)"
          @keydown.space.prevent="openContracts(card)"
        >
          <div class="building-card__head">
            <div class="building-card__icon" aria-hidden="true">
              <i class="pi pi-building" />
            </div>
            <div class="building-card__titles">
              <h3>{{ card.buildingName }}</h3>
              <p>البلوك: {{ card.blockName }}</p>
            </div>
          </div>

          <div class="building-card__stats">
            <div class="stat">
              <span class="stat__label">الكلي</span>
              <strong class="stat__value">{{ card.totalUnits }}</strong>
            </div>
            <div class="stat is-occupied">
              <span class="stat__label">الساكن</span>
              <strong class="stat__value">{{ card.occupied }}</strong>
            </div>
            <div class="stat is-available">
              <span class="stat__label">متاح</span>
              <strong class="stat__value">{{ card.available }}</strong>
            </div>
          </div>

          <div class="building-card__footer">
            <span>عقود الساكنين</span>
            <i class="pi pi-arrow-left" />
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.buildings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.building-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem 1.1rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.building-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  border-color: color-mix(in srgb, var(--brand) 35%, var(--border));
}

.building-card--skeleton {
  min-height: 160px;
  background: linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
  cursor: default;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

.building-card__head {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 0.9rem;
}

.building-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--brand) 12%, white);
  color: var(--brand);
}

.building-card__titles h3 {
  margin: 0;
  font-size: 1.05rem;
}

.building-card__titles p {
  margin: 0.2rem 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.building-card__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.stat {
  background: #f8fafc;
  border-radius: 10px;
  padding: 0.55rem 0.4rem;
  text-align: center;
}

.stat__label {
  display: block;
  font-size: 0.75rem;
  color: var(--muted);
  margin-bottom: 0.2rem;
}

.stat__value {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--brand);
}

.stat.is-occupied {
  background: #eff6ff;
}

.stat.is-occupied .stat__value {
  color: #1d4ed8;
}

.stat.is-available {
  background: #ecfdf5;
}

.stat.is-available .stat__value {
  color: #047857;
}

.building-card__footer {
  margin-top: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 600;
}
</style>
