<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import type { Block, Building, Complex, CreateBuildingDto, Floor, SalesContract, Unit } from '@/types'
import { ContractStatus, ContractType, UnitStatus } from '@/types'
import {
  createBuilding, deleteBuilding, getBuildings, updateBuilding, type BuildingParams,
} from '@/api/buildings'
import { getBlocks } from '@/api/blocks'
import { getComplexes } from '@/api/complexes'
import { getFloors } from '@/api/floors'
import { getUnits } from '@/api/units'
import { getSalesContracts } from '@/api/salesContracts'
import { getErrorMessage } from '@/api/client'
import { usePagedList } from '@/composables/usePagedList'
import { useNotify, useConfirmAction } from '@/composables/useNotify'
import { asSelectOptions } from '@/utils/enums'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import RowActions from '@/components/RowActions.vue'

interface BuildingStats {
  total: number
  sold: number
  available: number
}

type AvailabilityFilter = 'all' | 'has-available' | 'has-sold' | 'fully-sold' | 'empty'

const auth = useAuthStore()
const notify = useNotify()
const { ask } = useConfirmAction()
const router = useRouter()
const complexes = ref<Complex[]>([])
const blocks = ref<Block[]>([])
const blockMap = ref<Record<string, string>>({})
const floors = ref<Floor[]>([])
const units = ref<Unit[]>([])
const contracts = ref<SalesContract[]>([])
const statsLoading = ref(false)

const {
  items, loading, pageSize, total, search, load, onSearch, setFilter,
} = usePagedList<Building, BuildingParams>(getBuildings)

pageSize.value = 100

const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)
const complexFilter = ref<string | null>(null)
const blockFilter = ref<string | null>(null)
const availabilityFilter = ref<AvailabilityFilter>('all')
const form = reactive<CreateBuildingDto>({ name: '', description: '', blockId: '' })

const availabilityOptions: { id: AvailabilityFilter; label: string }[] = [
  { id: 'all', label: 'كل الحالات' },
  { id: 'has-available', label: 'فيه وحدات متاحة' },
  { id: 'has-sold', label: 'فيه وحدات مباعة' },
  { id: 'fully-sold', label: 'مباع بالكامل' },
  { id: 'empty', label: 'بدون وحدات' },
]

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

const blocksForComplex = computed(() =>
  complexFilter.value
    ? blocks.value.filter((b) => b.complexId === complexFilter.value)
    : blocks.value,
)

const blockOptions = computed(() =>
  asSelectOptions(blocksForComplex.value, (b) => b.name || b.id),
)

const blockIdsInComplex = computed(() => {
  if (!complexFilter.value) return null
  return new Set(blocksForComplex.value.map((b) => b.id))
})

const floorToBuilding = computed(() => {
  const map: Record<string, string> = {}
  for (const floor of floors.value) {
    map[floor.id] = floor.buildingId
  }
  return map
})

/** وحدات لها عقد بيع فعّال (حتى لو حالتها محجوز وليست Sold بعد) */
const soldUnitIds = computed(() => {
  const ids = new Set<string>()
  for (const contract of contracts.value) {
    if (contract.contractType !== ContractType.Sale) continue
    if (
      contract.contractStatus === ContractStatus.Cancelled ||
      contract.contractStatus === ContractStatus.Suspended
    ) {
      continue
    }
    if (contract.unitId) ids.add(contract.unitId)
  }
  return ids
})

const statsByBuilding = computed(() => {
  const map: Record<string, BuildingStats> = {}
  for (const building of items.value) {
    map[building.id] = { total: 0, sold: 0, available: 0 }
  }
  for (const unit of units.value) {
    const buildingId = floorToBuilding.value[unit.floorId]
    if (!buildingId || !map[buildingId]) continue
    map[buildingId].total += 1
    const isSold =
      unit.status === UnitStatus.Sold || soldUnitIds.value.has(unit.id)
    if (isSold) {
      map[buildingId].sold += 1
      continue
    }
    if (unit.status === UnitStatus.Available) map[buildingId].available += 1
  }
  return map
})

const filteredBuildings = computed(() => {
  const q = search.value.trim().toLowerCase()
  return items.value.filter((b) => {
    if (blockIdsInComplex.value && !blockIdsInComplex.value.has(b.blockId)) return false

    if (q) {
      const name = (b.name || '').toLowerCase()
      const desc = (b.description || '').toLowerCase()
      const block = (blockMap.value[b.blockId] || '').toLowerCase()
      if (!name.includes(q) && !desc.includes(q) && !block.includes(q)) return false
    }

    const stats = statsByBuilding.value[b.id] ?? { total: 0, sold: 0, available: 0 }
    switch (availabilityFilter.value) {
      case 'has-available':
        return stats.available > 0
      case 'has-sold':
        return stats.sold > 0
      case 'fully-sold':
        return stats.total > 0 && stats.sold >= stats.total
      case 'empty':
        return stats.total === 0
      default:
        return true
    }
  })
})

async function loadLookups() {
  const [complexResult, blockResult] = await Promise.all([
    getComplexes({ Page: 1, PageSize: 200 }),
    getBlocks({ Page: 1, PageSize: 500 }),
  ])
  complexes.value = complexResult.items ?? []
  blocks.value = blockResult.items ?? []
  blockMap.value = Object.fromEntries(blocks.value.map((b) => [b.id, b.name || b.id]))
}

function onComplexFilterChange(value: string | null) {
  complexFilter.value = value
  if (blockFilter.value) {
    const stillValid = blocksForComplex.value.some((b) => b.id === blockFilter.value)
    if (!stillValid) {
      blockFilter.value = null
      setFilter('BlockId', undefined)
      return
    }
  }
}

function onBlockFilterChange(value: string | null) {
  blockFilter.value = value
  setFilter('BlockId', value || undefined)
}

function clearFilters() {
  search.value = ''
  complexFilter.value = null
  blockFilter.value = null
  availabilityFilter.value = 'all'
  setFilter('BlockId', undefined)
  void load()
}

async function loadStatsData() {
  statsLoading.value = true
  try {
    const [floorsResult, unitsResult, contractsResult] = await Promise.all([
      getFloors({ Page: 1, PageSize: 1000 }),
      getUnits({ Page: 1, PageSize: 1000 }),
      getSalesContracts({ Page: 1, PageSize: 1000 }),
    ])
    floors.value = floorsResult.items ?? []
    units.value = unitsResult.items ?? []
    contracts.value = contractsResult.items ?? []
  } finally {
    statsLoading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, {
    name: '',
    description: '',
    blockId: blockFilter.value || blocksForComplex.value[0]?.id || blocks.value[0]?.id || '',
  })
  dialogVisible.value = true
}

function openEdit(row: Building) {
  editingId.value = row.id
  Object.assign(form, { name: row.name, description: row.description, blockId: row.blockId })
  dialogVisible.value = true
}

async function save() {
  if (!form.blockId) {
    notify.warning('اختر البلوك')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateBuilding(editingId.value, { ...form })
      notify.success('تم التحديث')
    } else {
      await createBuilding({ ...form })
      notify.success('تم الإنشاء')
    }
    dialogVisible.value = false
    await load()
    await loadStatsData()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    saving.value = false
  }
}

async function remove(row: Building) {
  if (!(await ask(`حذف المبنى "${row.name}"؟`))) return
  try {
    await deleteBuilding(row.id)
    notify.success('تم الحذف')
    await load()
    await loadStatsData()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
}

function openBuildingContracts(building: Building) {
  router.push({
    name: 'sales-contracts',
    query: {
      buildingId: building.id,
      buildingName: building.name || building.id.slice(0, 8),
    },
  })
}

function statsFor(buildingId: string): BuildingStats {
  return statsByBuilding.value[buildingId] ?? { total: 0, sold: 0, available: 0 }
}

onMounted(async () => {
  try {
    await loadLookups()
  } catch (error) {
    notify.error(getErrorMessage(error))
  }
  await Promise.all([load(), loadStatsData()])
})
</script>

<template>
  <div class="page">
    <PageHeader title="المباني" subtitle="اختر مبنى لعرض عقود ومبيعات وحداته">
      <template v-if="auth.isSuperAdmin" #actions>
        <Button label="إضافة مبنى" icon="pi pi-plus" @click="openCreate" />
      </template>
    </PageHeader>

    <div class="data-panel">
      <FilterBar v-model:search="search" placeholder="ابحث عن مبنى..." @search="onSearch">
        <template #filters>
          <Select
            v-model="complexFilter"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="كل المجمعات"
            show-clear
            style="min-width: 180px"
            @update:model-value="onComplexFilterChange"
          />
          <Select
            v-model="blockFilter"
            :options="blockOptions"
            option-label="label"
            option-value="id"
            placeholder="كل المباني"
            show-clear
            style="min-width: 180px"
            @update:model-value="onBlockFilterChange"
          />
          <Select
            v-model="availabilityFilter"
            :options="availabilityOptions"
            option-label="label"
            option-value="id"
            placeholder="حالة الوحدات"
            style="min-width: 180px"
          />
        </template>
        <template #extra>
          <Button
            label="مسح الفلاتر"
            icon="pi pi-filter-slash"
            severity="secondary"
            text
            @click="clearFilters"
          />
        </template>
      </FilterBar>

      <div v-if="!loading || items.length > 0" class="filter-summary">
        عرض {{ filteredBuildings.length }} مبنى
        <span v-if="complexFilter || blockFilter || availabilityFilter !== 'all' || search.trim()">
          بعد الفلترة
        </span>
      </div>

      <div v-if="loading && items.length === 0" class="buildings-grid">
        <div v-for="n in 6" :key="n" class="building-card building-card--skeleton" />
      </div>

      <div v-else-if="filteredBuildings.length === 0" class="empty-box">لا توجد مباني مطابقة للفلاتر</div>

      <div v-else class="buildings-grid">
        <article
          v-for="building in filteredBuildings"
          :key="building.id"
          class="building-card"
          role="button"
          tabindex="0"
          @click="openBuildingContracts(building)"
          @keydown.enter.prevent="openBuildingContracts(building)"
          @keydown.space.prevent="openBuildingContracts(building)"
        >
          <div class="building-card__head">
            <div class="building-card__icon" aria-hidden="true">
              <i class="pi pi-building" />
            </div>
            <div class="building-card__titles">
              <h3>{{ building.name || 'بدون اسم' }}</h3>
              <p>{{ blockMap[building.blockId] || 'بلوك غير معروف' }}</p>
            </div>
            <div class="building-card__actions" @click.stop>
              <RowActions @edit="openEdit(building)" @remove="remove(building)" />
            </div>
          </div>

          <div class="building-card__stats" :class="{ 'is-loading': statsLoading }">
            <div class="stat">
              <span class="stat__label">الكلي</span>
              <strong class="stat__value">{{ statsFor(building.id).total }}</strong>
            </div>
            <div class="stat is-sold">
              <span class="stat__label">المباع</span>
              <strong class="stat__value">{{ statsFor(building.id).sold }}</strong>
            </div>
            <div class="stat is-available">
              <span class="stat__label">المتاح</span>
              <strong class="stat__value">{{ statsFor(building.id).available }}</strong>
            </div>
          </div>

          <div class="building-card__footer">
            <span>عقود ومبيعات المبنى</span>
            <i class="pi pi-arrow-left" />
          </div>
        </article>
      </div>

      <div v-if="total > pageSize" class="pager-hint">
        عرض {{ items.length }} من {{ total }} مبنى
      </div>
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingId ? 'تعديل مبنى' : 'إضافة مبنى'"
      :style="{ width: '480px' }"
    >
      <div class="form-grid" style="grid-template-columns: 1fr">
        <div class="field">
          <label>البلوك</label>
          <Select
            v-model="form.blockId"
            :options="blockOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر البلوك"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>الاسم</label>
          <InputText v-model="form.name" />
        </div>
        <div class="field">
          <label>الوصف</label>
          <Textarea v-model="form.description" rows="3" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <Button label="إلغاء" severity="secondary" outlined @click="dialogVisible = false" />
          <Button label="حفظ التغييرات" :loading="saving" @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.filter-summary {
  margin: 4px 2px 10px;
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--muted);
}

.filter-summary span {
  color: var(--brand-mid);
}

.buildings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  padding: 4px 2px 8px;
}

.building-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--brand-mid) 12%, var(--border));
  background:
    linear-gradient(160deg, color-mix(in srgb, var(--brand-soft) 70%, white), #fff 55%);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition:
    transform 0.25s var(--ease),
    box-shadow 0.25s var(--ease),
    border-color 0.25s var(--ease);
  animation: rise 0.45s var(--ease-out) both;
}

.building-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--brand-mid) 28%, var(--border));
  box-shadow: 0 14px 28px rgba(6, 40, 48, 0.08);
}

.building-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(21, 101, 116, 0.22);
}

.building-card--skeleton {
  min-height: 180px;
  cursor: default;
  background: linear-gradient(90deg, #eef3f5 20%, #f7fafb 40%, #eef3f5 60%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}

.building-card__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.building-card__icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(145deg, #1f8494, #0b3d4a);
  flex-shrink: 0;
}

.building-card__titles {
  min-width: 0;
  flex: 1;
}

.building-card__titles h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.building-card__titles p {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: var(--muted);
}

.building-card__actions {
  flex-shrink: 0;
  margin-inline-start: auto;
}

.building-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.building-card__stats.is-loading .stat__value {
  opacity: 0.45;
}

.stat {
  padding: 10px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--border);
  text-align: center;
}

.stat__label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted);
}

.stat__value {
  display: block;
  margin-top: 4px;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-strong);
  font-variant-numeric: tabular-nums;
}

.stat.is-sold {
  border-color: color-mix(in srgb, var(--accent) 28%, var(--border));
  background: color-mix(in srgb, var(--accent-soft) 80%, white);
}

.stat.is-sold .stat__value {
  color: var(--accent);
}

.stat.is-available {
  border-color: color-mix(in srgb, var(--success) 28%, var(--border));
  background: color-mix(in srgb, #e8f6f0 85%, white);
}

.stat.is-available .stat__value {
  color: var(--success);
}

.building-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 2px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--brand-mid);
}

.pager-hint {
  margin-top: 12px;
  font-size: 0.82rem;
  color: var(--muted);
  text-align: center;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

@media (max-width: 640px) {
  .buildings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
