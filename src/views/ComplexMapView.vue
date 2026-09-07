<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import type { Complex, CreateReservationDto, Customer, Unit, UpdateUnitDto } from '@/types'
import { ComplexLayoutType, ReservationStatus, UnitStatus, UnitUi } from '@/types'
import type { MapBlock, MapBuilding } from '@/types/complexMap'
import { getComplexes } from '@/api/complexes'
import { getBlocks } from '@/api/blocks'
import { getBuildings } from '@/api/buildings'
import { getFloors } from '@/api/floors'
import { getUnits, updateUnit } from '@/api/units'
import { getCustomers } from '@/api/customers'
import { createReservation } from '@/api/reservations'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import {
  asSelectOptions,
  complexLayoutTypeOptions,
  formatMoney,
  labelOf,
  unitStatusOptions,
  unitTypeOptions,
  unitUiOptions,
} from '@/utils/enums'
import PageHeader from '@/components/PageHeader.vue'
import Complex3DViewer from '@/components/complex3d/Complex3DViewer.vue'
import { FLOOR_BACK_ROW, FLOOR_FRONT_ROW } from '@/utils/complexBuilder'

const notify = useNotify()
const router = useRouter()

const complexes = ref<Complex[]>([])
const selectedComplexId = ref<string | null>(null)
const loadingComplexes = ref(false)
const loadingMap = ref(false)
const mapBlocks = ref<MapBlock[]>([])
const selectedUnit = ref<Unit | null>(null)
const statusFilter = ref<number | null>(null)

const customers = ref<Customer[]>([])
const loadingCustomers = ref(false)
const reservationDialogVisible = ref(false)
const savingReservation = ref(false)
const reservationDateModel = ref<Date | null>(null)
const expireDateModel = ref<Date | null>(null)
const originalUnitStatus = ref<UnitStatus | null>(null)

const reservationForm = reactive<CreateReservationDto>({
  reservationDate: new Date().toISOString(),
  reservationAmount: 0,
  expireDate: new Date().toISOString(),
  status: ReservationStatus.Pending,
  unitId: '',
  customerId: '',
  complexId: '',
})
const selectedUnitStatus = ref<UnitStatus>(UnitStatus.Reserved)
const show3d = ref(false)

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

const selectedComplex = computed(
  () => complexes.value.find((c) => c.id === selectedComplexId.value) || null,
)

const layoutMode = computed(() => {
  const type = selectedComplex.value?.layoutType
  if (type === ComplexLayoutType.Horizontal) return 'horizontal'
  if (type === ComplexLayoutType.Vertical) return 'vertical'
  return 'horizontal-vertical'
})

const layoutLabel = computed(() =>
  labelOf(complexLayoutTypeOptions, selectedComplex.value?.layoutType),
)

const customerOptions = computed(() =>
  asSelectOptions(customers.value, (c) =>
    [c.firstName, c.lastName].filter(Boolean).join(' ') || c.phone || c.id,
  ),
)

const canReserve = computed(() => {
  const unit = selectedUnit.value
  if (!unit) return false
  return unit.status === UnitStatus.Available || unit.status === UnitStatus.Reserved
})

const totals = computed(() => {
  let buildings = 0
  let floors = 0
  let units = 0
  for (const block of mapBlocks.value) {
    for (const building of block.buildings) {
      buildings++
      for (const floor of building.floors) {
        floors++
        units += floor.units.length
      }
    }
  }
  return {
    blocks: mapBlocks.value.length,
    buildings,
    floors,
    units,
  }
})

function statusClass(status: number) {
  switch (status) {
    case UnitStatus.Available:
      return 'is-available'
    case UnitStatus.Reserved:
      return 'is-reserved'
    case UnitStatus.Sold:
      return 'is-sold'
    case UnitStatus.Rented:
      return 'is-rented'
    case UnitStatus.Maintenance:
      return 'is-maintenance'
    default:
      return ''
  }
}

function unitMatchesFilter(unit: Unit) {
  if (statusFilter.value == null) return true
  return unit.status === statusFilter.value
}

function unitsInSlot(units: Unit[], ui: UnitUi) {
  return units.filter((unit) => unit.unitUi === ui)
}

function otherUnits(units: Unit[]) {
  const known = new Set<number>([
    UnitUi.MiddleFront,
    UnitUi.MiddleBack,
    UnitUi.CornerFrontRight,
    UnitUi.CornerFrontLeft,
    UnitUi.CornerBackRight,
    UnitUi.CornerBackLeft,
  ])
  return units.filter((unit) => unit.unitUi == null || !known.has(unit.unitUi))
}

function slotSideLabel(ui: UnitUi) {
  if (ui === UnitUi.CornerFrontRight || ui === UnitUi.CornerBackRight) return 'يمين'
  if (ui === UnitUi.CornerFrontLeft || ui === UnitUi.CornerBackLeft) return 'يسار'
  return 'وسط'
}

function filteredFloors(building: MapBuilding) {
  return building.floors
    .map((floor) => ({
      ...floor,
      units: floor.units.filter(unitMatchesFilter),
    }))
    .filter((floor) => floor.units.length > 0 || statusFilter.value == null)
}

function flattenedUnits(building: MapBuilding) {
  return building.floors.flatMap((floor) => floor.units.filter(unitMatchesFilter))
}

function defaultExpireDate(from: Date) {
  const expire = new Date(from)
  expire.setDate(expire.getDate() + 7)
  return expire
}

function reservationStatusForUnitStatus(status: UnitStatus): ReservationStatus {
  if (status === UnitStatus.Sold) return ReservationStatus.Converted
  if (status === UnitStatus.Reserved || status === UnitStatus.Rented) return ReservationStatus.Confirmed
  return ReservationStatus.Pending
}

function unitToUpdateDto(unit: Unit, status: UnitStatus): UpdateUnitDto {
  return {
    unitNumber: unit.unitNumber,
    unitType: unit.unitType,
    area: unit.area,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
    parkingCount: unit.parkingCount,
    gardenArea: unit.gardenArea,
    roofArea: unit.roofArea,
    direction: unit.direction,
    floorLevel: unit.floorLevel,
    status,
    price: unit.price,
    cost: unit.cost,
    notes: unit.notes,
    unitUi: unit.unitUi ?? UnitUi.MiddleFront,
    floorId: unit.floorId,
    complexId: unit.complexId,
  }
}

async function loadComplexes() {
  loadingComplexes.value = true
  try {
    const result = await getComplexes({ Page: 1, PageSize: 200 })
    complexes.value = result.items ?? []
    if (complexes.value[0] && !selectedComplexId.value) {
      selectedComplexId.value = complexes.value[0].id
    }
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    loadingComplexes.value = false
  }
}

async function loadMap() {
  const keepUnitId = selectedUnit.value?.id
  selectedUnit.value = null
  mapBlocks.value = []
  if (!selectedComplexId.value) return

  loadingMap.value = true
  try {
    const complexId = selectedComplexId.value
    const [blocksResult, unitsResult] = await Promise.all([
      getBlocks({ ComplexId: complexId, Page: 1, PageSize: 200 }),
      getUnits({ ComplexId: complexId, Page: 1, PageSize: 1000 }),
    ])

    const blocks = blocksResult.items ?? []
    const units = unitsResult.items ?? []
    const unitsByFloor = new Map<string, Unit[]>()
    for (const unit of units) {
      const list = unitsByFloor.get(unit.floorId) ?? []
      list.push(unit)
      unitsByFloor.set(unit.floorId, list)
    }

    const blockMaps: MapBlock[] = []
    for (const block of blocks) {
      const buildingsResult = await getBuildings({ BlockId: block.id, Page: 1, PageSize: 200 })
      const buildings = buildingsResult.items ?? []
      const buildingMaps: MapBuilding[] = []

      for (const building of buildings) {
        const floorsResult = await getFloors({ BuildingId: building.id, Page: 1, PageSize: 200 })
        const floors = [...(floorsResult.items ?? [])].sort(
          (a, b) => b.floorNumber - a.floorNumber,
        )
        buildingMaps.push({
          building,
          floors: floors.map((floor) => ({
            floor,
            units: (unitsByFloor.get(floor.id) ?? []).sort((a, b) =>
              String(a.unitNumber).localeCompare(String(b.unitNumber), 'en', { numeric: true }),
            ),
          })),
        })
      }

      blockMaps.push({ block, buildings: buildingMaps })
    }

    mapBlocks.value = blockMaps

    if (keepUnitId) {
      selectedUnit.value = units.find((u) => u.id === keepUnitId) ?? null
    }
  } catch (error) {
    notify.error(getErrorMessage(error))
    mapBlocks.value = []
  } finally {
    loadingMap.value = false
  }
}

async function loadCustomersForComplex(complexId: string) {
  loadingCustomers.value = true
  try {
    const result = await getCustomers({ ComplexId: complexId, Page: 1, PageSize: 500 })
    customers.value = result.items ?? []
  } catch (error) {
    customers.value = []
    notify.error(getErrorMessage(error))
  } finally {
    loadingCustomers.value = false
  }
}

function selectUnit(unit: Unit | null) {
  selectedUnit.value = unit
}

function open3dView() {
  if (!selectedComplexId.value) {
    notify.warning('اختر مجمعاً أولاً')
    return
  }
  if (loadingMap.value) {
    notify.warning('انتظر حتى يكتمل تحميل الخريطة')
    return
  }
  if (!mapBlocks.value.length) {
    notify.warning('لا يوجد هيكل عقاري لعرضه ثلاثياً')
    return
  }
  show3d.value = true
}

function openUnit(unit: Unit) {
  void router.push(`/units/${unit.id}`)
}

function openUnitFrom3d(unit: Unit) {
  show3d.value = false
  openUnit(unit)
}

async function openReservationDialog() {
  const unit = selectedUnit.value
  if (!unit) return
  if (!canReserve.value) {
    notify.warning('لا يمكن حجز هذه الوحدة في حالتها الحالية')
    return
  }

  const today = new Date()
  reservationDateModel.value = today
  expireDateModel.value = defaultExpireDate(today)
  originalUnitStatus.value = unit.status
  selectedUnitStatus.value = unit.status
  Object.assign(reservationForm, {
    reservationDate: today.toISOString(),
    reservationAmount: unit.price ? Math.round(unit.price * 0.1) : 0,
    expireDate: defaultExpireDate(today).toISOString(),
    status: ReservationStatus.Pending,
    unitId: unit.id,
    customerId: '',
    complexId: unit.complexId || selectedComplexId.value || '',
  })

  reservationDialogVisible.value = true
  if (reservationForm.complexId) {
    await loadCustomersForComplex(reservationForm.complexId)
  }
}

async function saveReservation() {
  if (!reservationForm.customerId) {
    notify.warning('اختر العميل')
    return
  }
  if (!reservationForm.unitId || !reservationForm.complexId) {
    notify.warning('بيانات الوحدة أو المجمع غير مكتملة')
    return
  }
  if (!reservationDateModel.value || !expireDateModel.value) {
    notify.warning('حدد تاريخ الحجز وتاريخ الانتهاء')
    return
  }
  if (expireDateModel.value < reservationDateModel.value) {
    notify.warning('تاريخ الانتهاء يجب أن يكون بعد تاريخ الحجز')
    return
  }

  const unit = selectedUnit.value
  if (!unit) return

  reservationForm.reservationDate = reservationDateModel.value.toISOString()
  reservationForm.expireDate = expireDateModel.value.toISOString()
  reservationForm.status = reservationStatusForUnitStatus(selectedUnitStatus.value)
  savingReservation.value = true
  try {
    await createReservation({ ...reservationForm })
    await updateUnit(unit.id, unitToUpdateDto(unit, selectedUnitStatus.value))
    originalUnitStatus.value = null
    notify.success('تم إنشاء الحجز وتحديث حالة الوحدة')
    reservationDialogVisible.value = false
    await loadMap()
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    savingReservation.value = false
  }
}

function closeReservationDialog() {
  if (selectedUnit.value && originalUnitStatus.value != null) {
    selectedUnit.value.status = originalUnitStatus.value
  }
  originalUnitStatus.value = null
  reservationDialogVisible.value = false
}

watch(selectedUnitStatus, (status) => {
  if (reservationDialogVisible.value && selectedUnit.value) {
    selectedUnit.value.status = status
  }
})

watch(reservationDialogVisible, (visible) => {
  if (!visible && originalUnitStatus.value != null && selectedUnit.value) {
    selectedUnit.value.status = originalUnitStatus.value
    originalUnitStatus.value = null
  }
})

watch(selectedComplexId, () => {
  void loadMap()
})

onMounted(async () => {
  await loadComplexes()
  if (selectedComplexId.value) await loadMap()
})
</script>

<template>
  <div class="page map-page">
    <PageHeader
      title="خريطة المجمع"
      subtitle="عرض بصري للبلوكات والمباني والطوابق والوحدات"
    >
      <template #actions>
        <div class="toolbar">
          <Select
            v-model="selectedComplexId"
            :options="complexOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر المجمع"
            :loading="loadingComplexes"
            filter
            checkmark
            append-to="body"
            class="toolbar__select"
          />
          <Select
            v-model="statusFilter"
            :options="unitStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="كل الحالات"
            show-clear
            checkmark
            append-to="body"
            class="toolbar__select toolbar__select--sm"
          />
          <Button
            label="عرض المجمع 3D"
            icon="pi pi-box"
            :disabled="!selectedComplexId || loadingMap || mapBlocks.length === 0"
            @click="open3dView"
          />
        </div>
      </template>
    </PageHeader>

    <div v-if="selectedComplex" class="legend-bar">
      <div class="legend-bar__info">
        <strong>{{ selectedComplex.nameAr || selectedComplex.name }}</strong>
        <span>التخطيط: {{ layoutLabel }}</span>
        <span>{{ totals.blocks }} بلوك</span>
        <span>{{ layoutMode === 'horizontal' ? `${totals.buildings} فيلا` : `${totals.buildings} مبنى` }}</span>
        <span v-if="layoutMode !== 'horizontal'">{{ totals.floors }} طابق</span>
        <span>{{ totals.units }} وحدة</span>
      </div>
      <div class="legend">
        <span
          v-for="opt in unitStatusOptions"
          :key="`status-${opt.value}`"
          class="legend__item"
          :class="statusClass(opt.value)"
        >
          {{ opt.label }}
        </span>
      </div>
    </div>

    <div v-if="loadingMap" class="loading-wrap">
      <ProgressSpinner stroke-width="4" />
      <p>جاري تحميل خريطة المجمع...</p>
    </div>

    <div v-else-if="!selectedComplexId" class="empty-state">
      اختر مجمعاً لعرض الخريطة
    </div>

    <div v-else-if="mapBlocks.length === 0" class="empty-state">
      لا يوجد هيكل عقاري لهذا المجمع بعد
    </div>

    <div v-else class="map-layout">
      <div class="map-canvas" :class="`layout-${layoutMode}`">
        <section v-for="blockMap in mapBlocks" :key="blockMap.block.id" class="block-zone">
          <header class="block-zone__head">
            <i class="pi pi-th-large" />
            <div>
              <h3>{{ blockMap.block.name || 'بلوك' }}</h3>
              <p>
                {{
                  layoutMode === 'horizontal'
                    ? `${blockMap.buildings.length} فيلا`
                    : `${blockMap.buildings.length} مبنى`
                }}
              </p>
            </div>
          </header>

          <div class="buildings-row">
            <template v-if="layoutMode === 'horizontal'">
              <article
                v-for="buildingMap in blockMap.buildings"
                :key="buildingMap.building.id"
                class="villa-card"
              >
                <header class="villa-card__head">
                  <i class="pi pi-home" />
                  <span>{{ buildingMap.building.name || 'فيلا' }}</span>
                </header>
                <div class="villa-card__body">
                  <button
                    v-for="unit in flattenedUnits(buildingMap)"
                    :key="unit.id"
                    type="button"
                    class="unit-cell"
                    :class="[
                      statusClass(unit.status),
                      { active: selectedUnit?.id === unit.id },
                    ]"
                    :title="`${unit.unitNumber} — ${labelOf(unitTypeOptions, unit.unitType)} — ${labelOf(unitStatusOptions, unit.status)}`"
                    @click="selectUnit(unit)"
                    @dblclick="openUnit(unit)"
                  >
                    <span class="unit-cell__num">{{ unit.unitNumber }}</span>
                    <span class="unit-cell__meta">
                      {{ unit.bedrooms }}غ · {{ unit.area }}م²
                    </span>
                  </button>
                </div>
              </article>
            </template>
            <template v-else>
            <article
              v-for="buildingMap in blockMap.buildings"
              :key="buildingMap.building.id"
              class="tower"
            >
              <div class="tower__front">واجهة أمامية</div>
              <div class="tower__roof">
                <span>{{ buildingMap.building.name || 'مبنى' }}</span>
              </div>

              <div class="tower__frame">
                <div class="tower__side">يمين</div>
                <div class="tower__body">
                  <div
                    v-for="floorMap in filteredFloors(buildingMap)"
                    :key="floorMap.floor.id"
                    class="floor-plate"
                  >
                    <div class="floor-plate__label">ط {{ floorMap.floor.floorNumber }}</div>
                    <div class="floor-plan">
                      <div class="floor-plan__edge">أمام</div>
                      <div class="floor-plan__row">
                        <div
                          v-for="ui in FLOOR_FRONT_ROW"
                          :key="`f-${floorMap.floor.id}-${ui}`"
                          class="plan-slot"
                          :class="{ empty: !unitsInSlot(floorMap.units, ui).length }"
                        >
                          <span class="plan-slot__pos">{{ slotSideLabel(ui) }}</span>
                          <button
                            v-for="unit in unitsInSlot(floorMap.units, ui)"
                            :key="unit.id"
                            type="button"
                            class="unit-cell"
                            :class="[
                              statusClass(unit.status),
                              { active: selectedUnit?.id === unit.id },
                            ]"
                            :title="`${unit.unitNumber} — ${labelOf(unitTypeOptions, unit.unitType)} — ${labelOf(unitUiOptions, unit.unitUi)} — ${labelOf(unitStatusOptions, unit.status)}`"
                            @click="selectUnit(unit)"
                            @dblclick="openUnit(unit)"
                          >
                            <span class="unit-cell__num">{{ unit.unitNumber }}</span>
                            <span class="unit-cell__meta">
                              {{ unit.bedrooms }}غ · {{ unit.area }}م²
                            </span>
                          </button>
                        </div>
                      </div>
                      <div class="floor-plan__hall">الممر</div>
                      <div class="floor-plan__row">
                        <div
                          v-for="ui in FLOOR_BACK_ROW"
                          :key="`b-${floorMap.floor.id}-${ui}`"
                          class="plan-slot"
                          :class="{ empty: !unitsInSlot(floorMap.units, ui).length }"
                        >
                          <span class="plan-slot__pos">{{ slotSideLabel(ui) }}</span>
                          <button
                            v-for="unit in unitsInSlot(floorMap.units, ui)"
                            :key="unit.id"
                            type="button"
                            class="unit-cell"
                            :class="[
                              statusClass(unit.status),
                              { active: selectedUnit?.id === unit.id },
                            ]"
                            :title="`${unit.unitNumber} — ${labelOf(unitTypeOptions, unit.unitType)} — ${labelOf(unitUiOptions, unit.unitUi)} — ${labelOf(unitStatusOptions, unit.status)}`"
                            @click="selectUnit(unit)"
                            @dblclick="openUnit(unit)"
                          >
                            <span class="unit-cell__num">{{ unit.unitNumber }}</span>
                            <span class="unit-cell__meta">
                              {{ unit.bedrooms }}غ · {{ unit.area }}م²
                            </span>
                          </button>
                        </div>
                      </div>
                      <div class="floor-plan__edge">خلف</div>
                      <div v-if="otherUnits(floorMap.units).length" class="floor-plan__other">
                        <button
                          v-for="unit in otherUnits(floorMap.units)"
                          :key="unit.id"
                          type="button"
                          class="unit-cell"
                          :class="[
                            statusClass(unit.status),
                            { active: selectedUnit?.id === unit.id },
                          ]"
                          :title="`${unit.unitNumber} — ${labelOf(unitTypeOptions, unit.unitType)} — ${labelOf(unitUiOptions, unit.unitUi)} — ${labelOf(unitStatusOptions, unit.status)}`"
                          @click="selectUnit(unit)"
                          @dblclick="openUnit(unit)"
                        >
                          <span class="unit-cell__num">{{ unit.unitNumber }}</span>
                          <span class="unit-cell__meta">
                            {{ unit.bedrooms }}غ · {{ unit.area }}م²
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="tower__side">يسار</div>
              </div>

              <div class="tower__base">واجهة خلفية</div>
            </article>
            </template>
          </div>
        </section>
      </div>

      <aside class="unit-panel" :class="{ open: !!selectedUnit }">
        <template v-if="selectedUnit">
          <div class="unit-panel__head">
            <h3>{{ selectedUnit.unitNumber }}</h3>
            <span class="status-pill" :class="statusClass(selectedUnit.status)">
              {{ labelOf(unitStatusOptions, selectedUnit.status) }}
            </span>
          </div>
          <dl class="unit-panel__grid">
            <div>
              <dt>النوع</dt>
              <dd>{{ labelOf(unitTypeOptions, selectedUnit.unitType) }}</dd>
            </div>
            <div>
              <dt>الموقع</dt>
              <dd>{{ labelOf(unitUiOptions, selectedUnit.unitUi) }}</dd>
            </div>
            <div>
              <dt>المساحة</dt>
              <dd>{{ selectedUnit.area }} م²</dd>
            </div>
            <div>
              <dt>غرف</dt>
              <dd>{{ selectedUnit.bedrooms }}</dd>
            </div>
            <div>
              <dt>حمامات</dt>
              <dd>{{ selectedUnit.bathrooms }}</dd>
            </div>
            <div v-if="layoutMode !== 'horizontal'">
              <dt>الطابق</dt>
              <dd>{{ selectedUnit.floorLevel }}</dd>
            </div>
            <div>
              <dt>السعر</dt>
              <dd>{{ formatMoney(selectedUnit.price) }}</dd>
            </div>
          </dl>
          <div class="unit-panel__actions">
            <button type="button" class="unit-panel__cta" @click="openUnit(selectedUnit)">
              فتح تفاصيل الوحدة
              <i class="pi pi-arrow-left" />
            </button>
            <button
              type="button"
              class="unit-panel__reserve"
              :disabled="!canReserve"
              @click="openReservationDialog"
            >
              <i class="pi pi-bookmark" />
              حجز الوحدة
            </button>
          </div>
        </template>
        <div v-else class="unit-panel__empty">
          <i class="pi pi-map" />
          <p>اضغط على وحدة لعرض ملخصها<br />نقر مزدوج لفتح التفاصيل</p>
        </div>
      </aside>
    </div>

    <Dialog
      v-model:visible="reservationDialogVisible"
      modal
      header="تفاصيل الحجز"
      :style="{ width: '560px' }"
      :breakpoints="{ '960px': '95vw' }"
    >
      <div v-if="selectedUnit" class="reserve-unit-summary">
        <div>
          <span class="reserve-unit-summary__label">الوحدة</span>
          <strong>{{ selectedUnit.unitNumber }}</strong>
        </div>
        <div>
          <span class="reserve-unit-summary__label">المجمع</span>
          <strong>{{ selectedComplex?.nameAr || selectedComplex?.name || '—' }}</strong>
        </div>
        <div>
          <span class="reserve-unit-summary__label">السعر</span>
          <strong>{{ formatMoney(selectedUnit.price) }}</strong>
        </div>
        <div>
          <span class="reserve-unit-summary__label">حالة الوحدة</span>
          <span class="status-pill" :class="statusClass(selectedUnitStatus)">
            {{ labelOf(unitStatusOptions, selectedUnitStatus) }}
          </span>
        </div>
      </div>

      <div class="form-grid">
        <div class="field full">
          <label>العميل</label>
          <Select
            v-model="reservationForm.customerId"
            :options="customerOptions"
            option-label="label"
            option-value="id"
            placeholder="اختر العميل"
            :loading="loadingCustomers"
            filter
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>تاريخ الحجز</label>
          <DatePicker v-model="reservationDateModel" date-format="yy/mm/dd" show-icon append-to="body" />
        </div>
        <div class="field">
          <label>تاريخ الانتهاء</label>
          <DatePicker v-model="expireDateModel" date-format="yy/mm/dd" show-icon append-to="body" />
        </div>
        <div class="field">
          <label>مبلغ الحجز</label>
          <InputNumber v-model="reservationForm.reservationAmount" :min="0" />
        </div>
        <div class="field">
          <label>حالة الوحدة</label>
          <Select
            v-model="selectedUnitStatus"
            :options="unitStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="اختر الحالة"
            checkmark
            append-to="body"
          />
        </div>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <Button
            label="إلغاء"
            severity="secondary"
            outlined
            @click="closeReservationDialog"
          />
          <Button
            label="تأكيد الحجز"
            icon="pi pi-bookmark"
            :loading="savingReservation"
            @click="saveReservation"
          />
        </div>
      </template>
    </Dialog>

    <Teleport to="body">
      <Complex3DViewer
        v-if="show3d"
        :blocks="mapBlocks"
        :layout-mode="layoutMode"
        :complex-name="selectedComplex?.nameAr || selectedComplex?.name || 'المجمع'"
        :selected-unit="selectedUnit"
        @close="show3d = false"
        @select="selectUnit"
        @open="openUnitFrom3d"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.map-page {
  gap: 16px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.toolbar__select {
  min-width: 220px;
}

.toolbar__select--sm {
  min-width: 160px;
}

.legend-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
}

.legend-bar__info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  font-size: 0.88rem;
  color: var(--muted);
  font-weight: 600;
}

.legend-bar__info strong {
  color: var(--brand);
  font-size: 1rem;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.legend__item {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.legend__item.is-available,
.unit-cell.is-available,
.status-pill.is-available {
  background: #e8f5f0;
  color: #1f7a5c;
  border-color: color-mix(in srgb, #1f7a5c 20%, transparent);
}

.legend__item.is-reserved,
.unit-cell.is-reserved,
.status-pill.is-reserved {
  background: #f8efe6;
  color: #c46b2b;
  border-color: color-mix(in srgb, #c46b2b 28%, transparent);
}

.legend__item.is-sold,
.unit-cell.is-sold,
.status-pill.is-sold {
  background: #e4edf8;
  color: #2b6cb0;
  border-color: color-mix(in srgb, #2b6cb0 28%, transparent);
}

.legend__item.is-rented,
.unit-cell.is-rented,
.status-pill.is-rented {
  background: #ebe4f2;
  color: #6b46a1;
  border-color: color-mix(in srgb, #6b46a1 28%, transparent);
}

.legend__item.is-maintenance,
.unit-cell.is-maintenance,
.status-pill.is-maintenance {
  background: #f8ecec;
  color: #b04a4a;
  border-color: color-mix(in srgb, #b04a4a 28%, transparent);
}

.loading-wrap,
.empty-state {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 280px;
  border-radius: var(--radius-lg);
  border: 1px dashed var(--border);
  background: var(--surface);
  color: var(--muted);
  font-weight: 600;
}

.map-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  align-items: start;
}

.map-canvas {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.block-zone {
  border: 1px solid var(--border);
  border-radius: 20px;
  background:
    linear-gradient(180deg, #f7fbfc, #ffffff 40%),
    var(--surface);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.block-zone__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  color: var(--brand);
}

.block-zone__head h3 {
  margin: 0;
  font-size: 1.05rem;
}

.block-zone__head p {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.buildings-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.map-canvas.layout-horizontal .buildings-row {
  flex-direction: row;
  flex-wrap: wrap;
}

.map-canvas.layout-vertical .buildings-row {
  flex-direction: column;
  overflow-x: visible;
}

.map-canvas.layout-vertical .tower {
  min-width: 0;
  max-width: none;
  width: 100%;
}

.map-canvas.layout-horizontal-vertical .buildings-row {
  flex-direction: row;
  flex-wrap: nowrap;
}

.tower {
  min-width: 360px;
  max-width: 460px;
  flex: 1 1 360px;
  display: flex;
  flex-direction: column;
}

.villa-card {
  min-width: 140px;
  flex: 0 0 160px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: #fff;
}

.villa-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: var(--brand);
}

.villa-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tower__front,
.tower__base {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--brand);
}

.tower__front {
  margin-bottom: 6px;
}

.tower__roof {
  text-align: center;
  padding: 10px 12px 14px;
  background: linear-gradient(180deg, #0f4c5c, #156574);
  color: #fff;
  font-weight: 800;
  clip-path: polygon(8% 100%, 0 40%, 50% 0, 100% 40%, 92% 100%);
  margin-bottom: -2px;
}

.tower__frame {
  display: grid;
  grid-template-columns: 28px 1fr 28px;
  align-items: stretch;
  gap: 6px;
}

.tower__side {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--brand);
  background: var(--brand-soft);
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--brand-mid) 20%, var(--border));
}

.tower__body {
  background: #eef3f5;
  border: 3px solid #c5d5db;
  border-bottom: none;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
}

.floor-plate {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 8px;
  align-items: stretch;
  padding: 8px;
  border: 1.5px solid color-mix(in srgb, var(--brand) 22%, #c5d5db);
  border-radius: 12px;
  background: color-mix(in srgb, #fff 88%, #e8f0f2);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);
}

.floor-plate__label {
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--brand);
  background: #fff;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--brand) 18%, var(--border));
}

.floor-plan {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.floor-plan__edge {
  text-align: center;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--brand);
}

.floor-plan__hall {
  text-align: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--muted);
  padding: 4px 0;
  border-radius: 6px;
  background: repeating-linear-gradient(
    135deg,
    #e8eef1,
    #e8eef1 6px,
    #f7fafb 6px,
    #f7fafb 12px
  );
  border: 1px dashed var(--border);
}

.floor-plan__row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}

.plan-slot {
  min-height: 58px;
  border: 1px dashed color-mix(in srgb, var(--brand) 16%, #c5d5db);
  border-radius: 10px;
  background: #fff;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-slot.empty {
  background: #f7fafb;
}

.plan-slot__pos {
  font-size: 0.62rem;
  font-weight: 800;
  color: var(--muted);
  text-align: center;
}

.floor-plan__other {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.unit-cell {
  border: 1.5px solid transparent;
  border-radius: 10px;
  padding: 7px 6px;
  text-align: center;
  cursor: pointer;
  font-family: inherit;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  min-height: 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  width: 100%;
}

.unit-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(6, 40, 48, 0.12);
}

.unit-cell.active {
  outline: 2px solid var(--brand-mid);
  outline-offset: 1px;
}

.unit-cell__num {
  font-size: 0.78rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.unit-cell__meta {
  font-size: 0.62rem;
  opacity: 0.8;
  font-weight: 600;
}

.tower__base {
  height: auto;
  padding: 8px 10px;
  background: linear-gradient(180deg, #9eb6be, #7a96a0);
  border-radius: 0 0 10px 10px;
  color: #fff;
}

.unit-panel {
  position: sticky;
  top: 88px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
  padding: 18px;
  min-height: 280px;
  box-shadow: var(--shadow-sm);
}

.unit-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}

.unit-panel__head h3 {
  margin: 0;
  font-size: 1.2rem;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.unit-panel__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 0 0 18px;
}

.unit-panel__grid dt {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 600;
}

.unit-panel__grid dd {
  margin: 2px 0 0;
  font-weight: 800;
  color: var(--text-strong);
}

.unit-panel__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.unit-panel__cta {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(180deg, #1a7585, #156574);
  color: #fff;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
}

.unit-panel__reserve {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1.5px solid color-mix(in srgb, #c46b2b 35%, transparent);
  border-radius: 12px;
  background: linear-gradient(180deg, #f4a261, #e07a2f);
  color: #fff;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.unit-panel__reserve:hover:not(:disabled) {
  transform: translateY(-1px);
}

.unit-panel__reserve:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.reserve-unit-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 12px;
  background: var(--surface-2, #f4f7f8);
  border: 1px solid var(--border);
}

.reserve-unit-summary__label {
  display: block;
  font-size: 0.75rem;
  color: var(--muted);
  font-weight: 600;
  margin-bottom: 2px;
}

.reserve-unit-summary strong {
  font-size: 0.95rem;
  color: var(--text-strong);
}

.unit-panel__empty {
  height: 100%;
  min-height: 220px;
  display: grid;
  place-items: center;
  text-align: center;
  color: var(--muted);
  gap: 10px;
}

.unit-panel__empty i {
  font-size: 2rem;
  color: var(--brand-mid);
}

.unit-panel__empty p {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.6;
}

@media (max-width: 1000px) {
  .map-layout {
    grid-template-columns: 1fr;
  }

  .unit-panel {
    position: static;
  }
}
</style>
