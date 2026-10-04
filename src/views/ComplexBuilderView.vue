<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ProgressBar from 'primevue/progressbar'
import type { Complex } from '@/types'
import { UnitStatus, UnitType, UnitUi } from '@/types'
import { getComplexes } from '@/api/complexes'
import { createBlock, getBlocks } from '@/api/blocks'
import { createBuilding } from '@/api/buildings'
import { createFloor } from '@/api/floors'
import { createUnit } from '@/api/units'
import { getErrorMessage } from '@/api/client'
import { useNotify } from '@/composables/useNotify'
import { asSelectOptions, complexLayoutTypeOptions, labelOf, unitTypeOptions, unitUiOptions } from '@/utils/enums'
import {
  buildStructurePreview,
  countsFromSlots,
  defaultAreaByUi,
  floorUnitSlots,
  HORIZONTAL_SEQUENCE_DIRECTION_OPTIONS,
  horizontalStreetSlots,
  horizontalUnitNumber,
  MAX_UNITS_PER_FLOOR,
  resolveBuildingCode,
  resolveHorizontalIndexOrder,
  resolveVerticalIndexOrder,
  SEQUENCE_DIRECTION_OPTIONS,
  syncBuildingNames,
  unitNumber,
  verticalFloorCells,
  type StructureConfig,
} from '@/utils/complexBuilder'
import PageHeader from '@/components/PageHeader.vue'

const notify = useNotify()
const router = useRouter()
const route = useRoute()
const isHorizontal = computed(() => route.meta.builderLayout === 'horizontal')

const step = ref(1)
const creating = ref(false)
const done = ref(false)
const selectedComplexId = ref<string | null>(null)
const complexes = ref<Complex[]>([])
const loadingComplexes = ref(false)

const progress = reactive({
  current: 0,
  total: 0,
  label: '',
  errors: [] as string[],
})

const structure = reactive<StructureConfig>({
  layoutMode: 'vertical',
  blocksCount: 2,
  buildingsPerBlock: 2,
  buildingNames: ['A', 'B'],
  floorsPerBuilding: 4,
  unitsPerFloor: 6,
  startFloor: 1,
  blockIndexOffset: 0,
  unitType: UnitType.Apartment,
  area: 120,
  bedrooms: 3,
  bathrooms: 2,
  parkingCount: 1,
  price: 0,
  cost: 0,
  countByUi: countsFromSlots(floorUnitSlots(6)),
  areaByUi: defaultAreaByUi(120),
  rowAreas: Array.from({ length: 6 }, () => 120),
  horizontalPickedIndices: [],
  verticalPickedIndices: [],
  sequenceStartUi: UnitUi.MiddleFront,
  sequenceDirection: 'manual',
  sequenceOrder: [],
})

const sampleBuildingCode = computed(() =>
  resolveBuildingCode(structure.buildingNames, 0),
)

const sampleUnitLabel = computed(() => {
  if (isHorizontal.value) return sampleBuildingCode.value
  return `${sampleBuildingCode.value}-${structure.startFloor || 1}-1`
})

const complexOptions = computed(() =>
  asSelectOptions(complexes.value, (c) => c.nameAr || c.name || c.id),
)

const selectedComplex = computed(() =>
  complexes.value.find((c) => c.id === selectedComplexId.value) || null,
)

const selectedComplexName = computed(
  () => selectedComplex.value?.nameAr || selectedComplex.value?.name || '—',
)

const pageTitle = computed(() => (isHorizontal.value ? 'هيكل أفقي' : 'هيكل عمودي'))
const pageSubtitle = computed(() =>
  isHorizontal.value
    ? 'أضف بلوكات وفلل في صف أفقي بدون طوابق، مع تسمية تلقائية'
    : 'أضف بلوكات ومبانٍ وطوابق ووحدات بتسمية تلقائية لمجمع قائم',
)
const directionOptions = computed(() =>
  isHorizontal.value ? HORIZONTAL_SEQUENCE_DIRECTION_OPTIONS : SEQUENCE_DIRECTION_OPTIONS,
)
const stepItems = computed(() => [
  { n: 1, t: 'اختيار المجمع' },
  { n: 2, t: isHorizontal.value ? 'هيكل الصف' : 'هيكل البناء' },
  { n: 3, t: isHorizontal.value ? 'ترتيب الفلل' : 'تفاصيل الطابق' },
  { n: 4, t: 'المعاينة' },
  { n: 5, t: 'التنفيذ' },
])

const preview = computed(() => buildStructurePreview(structure))

const floorSampleNumber = computed(() => structure.startFloor || 1)

const isManualSequence = computed(() => structure.sequenceDirection === 'manual')
const floorUnitTotal = computed(() =>
  isHorizontal.value ? structure.buildingsPerBlock : structure.unitsPerFloor,
)
const isPickComplete = computed(() => {
  if (!isManualSequence.value) return true
  if (isHorizontal.value) {
    if (structure.buildingsPerBlock <= 1) return true
    return structure.horizontalPickedIndices.length >= structure.buildingsPerBlock
  }
  if (structure.unitsPerFloor <= 1) return true
  return structure.verticalPickedIndices.length >= structure.unitsPerFloor
})

const PICK_ORDINALS = [
  '',
  'البداية',
  'النقطة الثانية',
  'النقطة الثالثة',
  'النقطة الرابعة',
  'النقطة الخامسة',
  'النقطة السادسة',
  'النقطة السابعة',
  'النقطة الثامنة',
  'النقطة التاسعة',
  'النقطة العاشرة',
]

function pickStepTitle(stepNumber: number) {
  return PICK_ORDINALS[stepNumber] || `النقطة ${stepNumber}`
}

const nextPickNumber = computed(() => {
  const used = isHorizontal.value
    ? structure.horizontalPickedIndices.length
    : structure.verticalPickedIndices.length
  return Math.min(used + 1, Math.max(floorUnitTotal.value, 1))
})

const nextPickPrompt = computed(() => {
  if (!isManualSequence.value) return 'اضغط أي وحدة لبدء التسلسل يدوياً'
  if (isPickComplete.value) return 'اكتمل تحديد التسلسل'
  return `حدد ${pickStepTitle(nextPickNumber.value)}`
})

const pickSteps = computed(() => {
  if (isHorizontal.value) {
    const street = horizontalStreetSlots(structure.buildingsPerBlock)
    const picked = structure.horizontalPickedIndices
    return Array.from({ length: street.length }, (_, index) => {
      const houseIndex = picked[index]
      const ui = houseIndex != null ? street[houseIndex] : undefined
      return {
        n: index + 1,
        title: pickStepTitle(index + 1),
        ui,
        label:
          ui && houseIndex != null
            ? `فيلا ${houseIndex + 1}`
            : index === picked.length
              ? nextPickPrompt.value
              : 'بانتظار التحديد',
        current: isManualSequence.value && index === picked.length && !isPickComplete.value,
        done: index < picked.length,
      }
    })
  }
  const cells = verticalFloorCells(structure.unitsPerFloor)
  const picked = structure.verticalPickedIndices
  return Array.from({ length: cells.length }, (_, index) => {
    const cellIndex = picked[index]
    const cell = cellIndex != null ? cells[cellIndex] : undefined
    return {
      n: index + 1,
      title: pickStepTitle(index + 1),
      ui: cell?.unitUi,
      label:
        cell != null
          ? `وحدة ${cell.index + 1}`
          : index === picked.length
            ? nextPickPrompt.value
            : 'بانتظار التحديد',
      current: isManualSequence.value && index === picked.length && !isPickComplete.value,
      done: index < picked.length,
    }
  })
})

const floorAreaTotal = computed(() => {
  if (isHorizontal.value) {
    return horizontalStreetSlots(structure.buildingsPerBlock).reduce(
      (sum, _, index) => sum + (structure.rowAreas[index] || structure.area || 0),
      0,
    )
  }
  return verticalFloorCells(structure.unitsPerFloor).reduce(
    (sum, _, index) => sum + (structure.rowAreas[index] || structure.area || 0),
    0,
  )
})

const streetHouses = computed(() => {
  const street = horizontalStreetSlots(structure.buildingsPerBlock)
  const order = resolveHorizontalIndexOrder(
    street.length,
    structure.sequenceDirection,
    structure.horizontalPickedIndices,
  )
  return street.map((ui, index) => ({
    index,
    ui,
    area: structure.rowAreas[index] ?? structure.area,
    side:
      street.length === 1
        ? 'وسط'
        : index === 0
          ? 'يمين'
          : index === street.length - 1
            ? 'يسار'
            : 'وسط',
    sequence: order.indexOf(index) + 1,
    picked: structure.horizontalPickedIndices.includes(index),
    unitNumber: horizontalUnitNumber(
      structure.blockIndexOffset || 0,
      order.indexOf(index),
      resolveBuildingCode(structure.buildingNames, index),
    ),
  }))
})

const floorCells = computed(() => {
  const cells = verticalFloorCells(structure.unitsPerFloor)
  const order = resolveVerticalIndexOrder(
    cells.length,
    structure.sequenceDirection,
    structure.verticalPickedIndices,
  )
  const code = resolveBuildingCode(structure.buildingNames, 0)
  return cells.map((cell) => ({
    ...cell,
    area: structure.rowAreas[cell.index] ?? structure.area,
    sequence: order.indexOf(cell.index) + 1,
    picked: structure.verticalPickedIndices.includes(cell.index),
    unitNumber: unitNumber(
      structure.blockIndexOffset || 0,
      0,
      floorSampleNumber.value,
      order.indexOf(cell.index) + 1,
      code,
    ),
  }))
})

const floorFrontCells = computed(() => floorCells.value.filter((c) => c.side === 'front'))
const floorBackCells = computed(() => floorCells.value.filter((c) => c.side === 'back'))
const orderedFloorCells = computed(() =>
  [...floorCells.value].sort((a, b) => a.sequence - b.sequence),
)

function syncVerticalFloor() {
  const n = Math.max(1, Math.min(MAX_UNITS_PER_FLOOR, structure.unitsPerFloor || 1))
  structure.unitsPerFloor = n
  structure.countByUi = countsFromSlots(floorUnitSlots(n))
  structure.rowAreas = Array.from(
    { length: n },
    (_, i) => structure.rowAreas[i] ?? structure.area,
  )
}

function resetManualSequence() {
  structure.horizontalPickedIndices = []
  structure.verticalPickedIndices = []
  structure.sequenceOrder = []
}

function onSequenceDirectionChange(value: StructureConfig['sequenceDirection']) {
  structure.sequenceDirection = value
  if (value === 'manual') {
    resetManualSequence()
  } else {
    structure.horizontalPickedIndices = []
    structure.verticalPickedIndices = []
  }
}

function syncBuildingNameFields() {
  structure.buildingNames = syncBuildingNames(
    structure.buildingNames,
    structure.buildingsPerBlock,
  )
}

function syncHorizontalStreet() {
  structure.floorsPerBuilding = 1
  structure.unitsPerFloor = 1
  structure.startFloor = 1
  const n = Math.max(1, Math.min(40, structure.buildingsPerBlock || 1))
  structure.buildingsPerBlock = n
  syncBuildingNameFields()
  structure.countByUi = countsFromSlots(horizontalStreetSlots(n))
  structure.rowAreas = Array.from(
    { length: n },
    (_, i) => structure.rowAreas[i] ?? structure.area,
  )
}

function onVillasPerBlockChange(value: number | null) {
  structure.buildingsPerBlock = Math.max(1, Math.min(40, value || 1))
  syncBuildingNameFields()
  if (!isHorizontal.value) return
  structure.horizontalPickedIndices = []
  syncHorizontalStreet()
}

function onUnitsPerFloorChange(value: number | null) {
  const count = Math.min(MAX_UNITS_PER_FLOOR, Math.max(1, value || 1))
  structure.unitsPerFloor = count
  if (isHorizontal.value) {
    syncHorizontalStreet()
    return
  }
  structure.verticalPickedIndices = []
  syncVerticalFloor()
}

function applyAreaToAll() {
  const area = structure.area || 1
  structure.areaByUi = defaultAreaByUi(area)
  if (isHorizontal.value) {
    structure.rowAreas = Array.from({ length: structure.buildingsPerBlock }, () => area)
  } else {
    structure.rowAreas = Array.from({ length: structure.unitsPerFloor }, () => area)
  }
}

function pickHorizontalHouse(index: number) {
  structure.sequenceDirection = 'manual'
  structure.layoutMode = 'horizontal'
  if (isPickComplete.value && structure.horizontalPickedIndices.length >= structure.buildingsPerBlock) {
    notify.info('اكتمل التسلسل. أعد التحديد من البداية إن أردت تغييره.')
    return
  }
  if (structure.horizontalPickedIndices.includes(index)) {
    notify.warning('هذه الفيلا حُددت مسبقاً')
    return
  }
  structure.horizontalPickedIndices = [...structure.horizontalPickedIndices, index]
}

function pickVerticalUnit(index: number) {
  structure.sequenceDirection = 'manual'
  structure.layoutMode = 'vertical'
  if (isPickComplete.value && structure.verticalPickedIndices.length >= structure.unitsPerFloor) {
    notify.info('اكتمل التسلسل. أعد التحديد من البداية إن أردت تغييره.')
    return
  }
  if (structure.verticalPickedIndices.includes(index)) {
    notify.warning('هذه الوحدة حُددت مسبقاً')
    return
  }
  structure.verticalPickedIndices = [...structure.verticalPickedIndices, index]
}

function floorFrontUnits(units: { unitUi: number; unitNumber: string; sequenceNumber: number; area: number }[]) {
  return units.filter((unit) =>
    unit.unitUi === UnitUi.CornerFrontRight ||
    unit.unitUi === UnitUi.MiddleFront ||
    unit.unitUi === UnitUi.CornerFrontLeft,
  )
}

function floorBackUnits(units: { unitUi: number; unitNumber: string; sequenceNumber: number; area: number }[]) {
  return units.filter((unit) =>
    unit.unitUi === UnitUi.CornerBackRight ||
    unit.unitUi === UnitUi.MiddleBack ||
    unit.unitUi === UnitUi.CornerBackLeft,
  )
}

const progressPercent = computed(() => {
  if (!progress.total) return 0
  return Math.min(100, Math.round((progress.current / progress.total) * 100))
})

async function loadComplexes() {
  loadingComplexes.value = true
  try {
    const result = await getComplexes({ Page: 1, PageSize: 200 })
    complexes.value = result.items ?? []
    if (!selectedComplexId.value && complexes.value[0]) {
      selectedComplexId.value = complexes.value[0].id
      await refreshBlockOffset()
    }
  } catch (error) {
    notify.error(getErrorMessage(error))
  } finally {
    loadingComplexes.value = false
  }
}

async function refreshBlockOffset() {
  if (!selectedComplexId.value) {
    structure.blockIndexOffset = 0
    return
  }
  try {
    const result = await getBlocks({
      ComplexId: selectedComplexId.value,
      Page: 1,
      PageSize: 200,
    })
    structure.blockIndexOffset = result.totalCount || (result.items?.length ?? 0)
  } catch {
    structure.blockIndexOffset = 0
  }
}

async function onComplexChange() {
  await refreshBlockOffset()
}

function validateStep1() {
  if (!selectedComplexId.value) {
    notify.warning('اختر المجمع')
    return false
  }
  return true
}

function validateStep2() {
  if (isHorizontal.value) {
    syncHorizontalStreet()
    if (!structure.blocksCount || structure.blocksCount < 1 || !structure.buildingsPerBlock || structure.buildingsPerBlock < 1) {
      notify.warning('أرقام الهيكل يجب أن تكون 1 على الأقل')
      return false
    }
  } else {
    const { blocksCount, buildingsPerBlock, floorsPerBuilding, unitsPerFloor } = structure
    if ([blocksCount, buildingsPerBlock, floorsPerBuilding, unitsPerFloor].some((n) => !n || n < 1)) {
      notify.warning('أرقام الهيكل يجب أن تكون 1 على الأقل')
      return false
    }
    syncBuildingNameFields()
  }

  const names = syncBuildingNames(structure.buildingNames, structure.buildingsPerBlock)
  structure.buildingNames = names
  const emptyName = names.some((n) => !n?.trim())
  if (emptyName) {
    notify.warning(isHorizontal.value ? 'أدخل اسم/رمز كل فيلا' : 'أدخل اسم/رمز كل مبنى')
    return false
  }
  const normalized = names.map((n) => n.trim().toLowerCase())
  if (new Set(normalized).size !== normalized.length) {
    notify.warning('أسماء المباني يجب أن تكون مختلفة')
    return false
  }

  if (preview.value.totals.units > 800) {
    notify.warning('عدد الوحدات كبير جداً (الحد 800). قلّل الأرقام.')
    return false
  }
  return true
}

function validateStep3() {
  if (isHorizontal.value) {
    syncHorizontalStreet()
    if (structure.buildingsPerBlock < 1) {
      notify.warning('حدد فيلا واحدة على الأقل في الصف')
      return false
    }
    const missingArea = horizontalStreetSlots(structure.buildingsPerBlock).some(
      (_, index) => !structure.rowAreas[index] || structure.rowAreas[index]! <= 0,
    )
    if (missingArea) {
      notify.warning('حدد مساحة أكبر من صفر لكل فيلا في الصف')
      return false
    }
    if (isManualSequence.value && structure.buildingsPerBlock > 1 && structure.horizontalPickedIndices.length < structure.buildingsPerBlock) {
      notify.warning(`حدد ${pickStepTitle(structure.horizontalPickedIndices.length + 1)} ثم أكمل بقية النقاط`)
      return false
    }
    return true
  }
  syncVerticalFloor()
  if (structure.unitsPerFloor < 1) {
    notify.warning('حدد وحدة واحدة على الأقل في الطابق')
    return false
  }
  const missing = verticalFloorCells(structure.unitsPerFloor).some(
    (_, index) => !structure.rowAreas[index] || structure.rowAreas[index]! <= 0,
  )
  if (missing) {
    notify.warning('حدد مساحة أكبر من صفر لكل وحدة في الطابق')
    return false
  }
  if (isManualSequence.value && structure.unitsPerFloor > 1 && structure.verticalPickedIndices.length < structure.unitsPerFloor) {
    notify.warning(`حدد ${pickStepTitle(structure.verticalPickedIndices.length + 1)} ثم أكمل بقية النقاط`)
    return false
  }
  return true
}

function next() {
  if (step.value === 1 && !validateStep1()) return
  if (step.value === 2 && !validateStep2()) return
  if (step.value === 3 && !validateStep3()) return
  step.value = Math.min(5, step.value + 1)
  if (step.value === 5 && !creating.value && !done.value) {
    void runCreate()
  }
}

function back() {
  if (creating.value) return
  step.value = Math.max(1, step.value - 1)
}

async function runCreate() {
  if (!selectedComplexId.value) {
    notify.warning('اختر المجمع')
    step.value = 1
    return
  }

  const complexId = selectedComplexId.value
  creating.value = true
  done.value = false
  progress.errors = []
  progress.current = 0

  const p = preview.value
  progress.total = p.totals.blocks + p.totals.buildings + p.totals.floors + p.totals.units

  try {
    for (const blockPreview of p.blocks) {
      progress.label = `إنشاء ${blockPreview.name}...`
      const block = await createBlock({
        name: blockPreview.name,
        description: `تم إنشاؤه تلقائياً — رمز ${blockPreview.code}`,
        complexId,
      })
      progress.current++

      for (const buildingPreview of blockPreview.buildings) {
        progress.label = `إنشاء ${buildingPreview.name} في ${blockPreview.name}...`
        const building = await createBuilding({
          name: buildingPreview.name,
          description: `${blockPreview.name} — ${buildingPreview.name}`,
          blockId: block.id,
        })
        progress.current++

        for (const floorPreview of buildingPreview.floors) {
          progress.label = isHorizontal.value
            ? `إنشاء ${buildingPreview.name}`
            : `طابق ${floorPreview.floorNumber} — ${buildingPreview.name}`
          const floor = await createFloor({
            floorNumber: floorPreview.floorNumber,
            buildingId: building.id,
          })
          progress.current++

          const unitJobs = floorPreview.units.map(async (u) => {
            try {
              await createUnit({
                unitNumber: u.unitNumber,
                unitType: structure.unitType,
                area: u.area,
                bedrooms: structure.bedrooms,
                bathrooms: structure.bathrooms,
                parkingCount: structure.parkingCount,
                gardenArea: 0,
                roofArea: 0,
                direction: null,
                unitUi: u.unitUi,
                floorLevel: floorPreview.floorNumber,
                status: UnitStatus.Available,
                price: structure.price,
                cost: structure.cost,
                notes: null,
                floorId: floor.id,
                complexId,
              })
            } catch (error) {
              progress.errors.push(`${u.unitNumber}: ${getErrorMessage(error)}`)
            } finally {
              progress.current++
            }
          })
          await Promise.all(unitJobs)
        }
      }
    }

    done.value = true
    progress.label = 'اكتمل الإنشاء'
    if (progress.errors.length) {
      notify.warning(`تم الإنشاء مع ${progress.errors.length} أخطاء في بعض الوحدات`)
    } else {
      notify.success('تم إضافة الهيكل للمجمع بنجاح')
    }
  } catch (error) {
    notify.error(getErrorMessage(error))
    progress.label = 'توقف الإنشاء بسبب خطأ'
  } finally {
    creating.value = false
  }
}

function goToComplex() {
  void router.push('/complexes')
}

function goToUnits() {
  void router.push('/units')
}

function goToStep(n: number) {
  if (creating.value || n >= step.value) return
  step.value = n
}

async function resetWizard() {
  done.value = false
  creating.value = false
  progress.current = 0
  progress.total = 0
  progress.label = ''
  progress.errors = []
  step.value = 1
  await refreshBlockOffset()
}

function applyLayoutDefaults(horizontal: boolean) {
  structure.layoutMode = horizontal ? 'horizontal' : 'vertical'
  structure.sequenceDirection = 'manual'
  structure.sequenceOrder = []
  structure.horizontalPickedIndices = []
  structure.verticalPickedIndices = []
  if (horizontal) {
    structure.buildingsPerBlock = 6
    structure.floorsPerBuilding = 1
    structure.unitsPerFloor = 1
    structure.startFloor = 1
    structure.unitType = UnitType.Villa
    structure.area = 250
    structure.bedrooms = 4
    structure.bathrooms = 3
    structure.parkingCount = 2
    structure.areaByUi = defaultAreaByUi(250)
    structure.rowAreas = Array.from({ length: 6 }, () => 250)
    syncHorizontalStreet()
  } else {
    structure.buildingsPerBlock = 2
    structure.floorsPerBuilding = 4
    structure.unitsPerFloor = 6
    structure.unitType = UnitType.Apartment
    structure.area = 120
    structure.bedrooms = 3
    structure.bathrooms = 2
    structure.parkingCount = 1
    structure.areaByUi = defaultAreaByUi(120)
    structure.rowAreas = Array.from({ length: 6 }, () => 120)
    syncBuildingNameFields()
    syncVerticalFloor()
  }
}

watch(
  isHorizontal,
  (horizontal) => {
    applyLayoutDefaults(horizontal)
    if (!creating.value) {
      step.value = 1
      done.value = false
    }
  },
  { immediate: true },
)

onMounted(() => {
  void loadComplexes()
})
</script>

<template>
  <div class="page builder">
    <PageHeader
      :title="pageTitle"
      :subtitle="pageSubtitle"
    />

    <div class="steps">
      <button
        v-for="s in stepItems"
        :key="s.n"
        type="button"
        class="step"
        :class="{ active: step === s.n, done: step > s.n }"
        :disabled="creating"
        @click="goToStep(s.n)"
      >
        <span class="step__num">{{ s.n }}</span>
        <span class="step__label">{{ s.t }}</span>
      </button>
    </div>

    <!-- Step 1 -->
    <section v-show="step === 1" class="panel">
      <h3 class="panel__title">اختيار المجمع</h3>
      <p class="panel__hint">اختر المجمع الذي تريد إضافة الهيكل إليه (بدون إنشاء مجمع جديد).</p>
      <div class="form-grid" style="grid-template-columns: 1fr">
        <div class="field">
          <label>المجمع</label>
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
            @update:model-value="onComplexChange"
          />
        </div>
      </div>

      <div v-if="selectedComplex" class="complex-card">
        <div class="complex-card__title">{{ selectedComplexName }}</div>
        <div class="complex-card__meta">
          <span v-if="selectedComplex.city">{{ selectedComplex.city }}</span>
          <span v-if="selectedComplex.address">{{ selectedComplex.address }}</span>
          <span>
            التخطيط: {{ labelOf(complexLayoutTypeOptions, selectedComplex.layoutType) }}
          </span>
          <span v-if="structure.blockIndexOffset">
            بلوكات موجودة: {{ structure.blockIndexOffset }} — التسمية ستكمل من الحرف التالي
          </span>
          <span v-else>لا توجد بلوكات بعد — ستبدأ التسمية من بلوك أ</span>
        </div>
      </div>
    </section>

    <!-- Step 2 -->
    <section v-show="step === 2" class="panel">
      <h3 class="panel__title">{{ isHorizontal ? 'هيكل الصف والتسمية التلقائية' : 'هيكل البناء والتسمية التلقائية' }}</h3>
      <p class="panel__hint">
        <template v-if="isHorizontal">
          التسمية: اسم الفيلا يصبح رقم الوحدة — مثال
          <strong>{{ sampleUnitLabel }}</strong>
        </template>
        <template v-else>
          التسمية: اسم المبنى كبادئة للوحدات — مثال
          <strong>{{ sampleUnitLabel }}</strong>
          (مبنى - طابق - تسلسل)
        </template>
        <template v-if="structure.blockIndexOffset">
          — ستبدأ من بعد {{ structure.blockIndexOffset }} بلوك موجود
        </template>
      </p>
      <div class="form-grid">
        <div class="field">
          <label>عدد البلوكات الجديدة</label>
          <InputNumber v-model="structure.blocksCount" :min="1" :max="28" show-buttons />
        </div>
        <div class="field">
          <label>{{ isHorizontal ? 'فلل لكل بلوك' : 'مبانٍ لكل بلوك' }}</label>
          <InputNumber
            v-model="structure.buildingsPerBlock"
            :min="1"
            :max="40"
            show-buttons
            @update:model-value="onVillasPerBlockChange"
          />
        </div>
        <div class="field full building-names">
          <label>{{ isHorizontal ? 'أسماء / رموز الفلل' : 'أسماء / رموز المباني' }}</label>
          <small class="field-hint">
            أدخل حرفاً أو كلمة لكل {{ isHorizontal ? 'فيلا' : 'مبنى' }} — كل الوحدات التابعة تبدأ بهذا الاسم (مثال: C → C-1-1)
          </small>
          <div class="building-names__grid">
            <div
              v-for="(_, index) in structure.buildingNames"
              :key="index"
              class="building-names__item"
            >
              <label>{{ isHorizontal ? 'فيلا' : 'مبنى' }} {{ index + 1 }}</label>
              <InputText
                v-model="structure.buildingNames[index]"
                :placeholder="isHorizontal ? 'مثال: V1' : 'مثال: C'"
              />
            </div>
          </div>
        </div>
        <div v-if="!isHorizontal" class="field">
          <label>طوابق لكل مبنى</label>
          <InputNumber
            v-model="structure.floorsPerBuilding"
            :min="1"
            :max="50"
            show-buttons
          />
        </div>
        <div v-if="!isHorizontal" class="field">
          <label>وحدات لكل طابق</label>
          <InputNumber
            v-model="structure.unitsPerFloor"
            :min="1"
            :max="MAX_UNITS_PER_FLOOR"
            show-buttons
            @update:model-value="onUnitsPerFloorChange"
          />
        </div>
        <div v-if="!isHorizontal" class="field">
          <label>رقم أول طابق</label>
          <InputNumber v-model="structure.startFloor" :min="0" :max="10" show-buttons />
        </div>
        <div class="field">
          <label>نوع الوحدة الافتراضي</label>
          <Select
            v-model="structure.unitType"
            :options="unitTypeOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
          />
        </div>
        <div class="field">
          <label>غرف النوم</label>
          <InputNumber v-model="structure.bedrooms" :min="0" show-buttons />
        </div>
        <div class="field">
          <label>الحمامات</label>
          <InputNumber v-model="structure.bathrooms" :min="0" show-buttons />
        </div>
        <div class="field">
          <label>مواقف</label>
          <InputNumber v-model="structure.parkingCount" :min="0" show-buttons />
        </div>
        <div class="field">
          <label>السعر الافتراضي</label>
          <InputNumber v-model="structure.price" :min="0" />
        </div>
        <div class="field">
          <label>التكلفة الافتراضية</label>
          <InputNumber v-model="structure.cost" :min="0" />
        </div>
      </div>

      <div v-if="!isHorizontal" class="ui-legend">
        <span v-for="opt in unitUiOptions" :key="opt.value" class="ui-legend__item">
          <strong>{{ opt.value }}</strong>
          {{ opt.label }}
        </span>
      </div>

      <div class="totals">
        <div class="totals__item">
          <span>بلوكات</span>
          <strong>{{ preview.totals.blocks }}</strong>
        </div>
        <div class="totals__item">
          <span>{{ isHorizontal ? 'فلل' : 'مبانٍ' }}</span>
          <strong>{{ preview.totals.buildings }}</strong>
        </div>
        <div v-if="!isHorizontal" class="totals__item">
          <span>طوابق</span>
          <strong>{{ preview.totals.floors }}</strong>
        </div>
        <div class="totals__item highlight">
          <span>{{ isHorizontal ? 'فلل / وحدات' : 'وحدات' }}</span>
          <strong>{{ preview.totals.units }}</strong>
        </div>
      </div>
    </section>

    <!-- Step 3: floor details -->
    <section v-show="step === 3" class="panel">
      <h3 class="panel__title">{{ isHorizontal ? 'ترتيب الفلل في الصف' : 'تفاصيل الطابق الواحد' }}</h3>
      <p class="panel__hint">
        <template v-if="isHorizontal">
          الفلل تُرتَّب في صف واحد من اليمين إلى اليسار بدون طوابق. اضغط الفيلا لتحديد البداية ثم النقطة الثانية ثم الثالثة.
        </template>
        <template v-else>
          كل وحدة تظهر كخانة مستقلة: نصفها تقريباً في الواجهة الأمامية ونصفها في الخلفية.
          اضغط الوحدات لتحديد البداية ثم النقطة الثانية ثم الثالثة، أو اختر الترقيم التلقائي.
        </template>
      </p>

      <div class="floor-toolbar">
        <div class="field">
          <label>اتجاه التسلسل</label>
          <Select
            :model-value="structure.sequenceDirection"
            :options="directionOptions"
            option-label="label"
            option-value="value"
            checkmark
            append-to="body"
            @update:model-value="onSequenceDirectionChange"
          />
        </div>
        <Button
          v-if="isManualSequence && (isHorizontal ? structure.horizontalPickedIndices.length : structure.verticalPickedIndices.length)"
          label="إعادة التحديد من البداية"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          @click="resetManualSequence"
        />
        <div class="field">
          <label>مساحة افتراضية (م²)</label>
          <InputNumber v-model="structure.area" :min="1" />
        </div>
        <Button
          label="تطبيق المساحة على كل المواضع"
          icon="pi pi-copy"
          severity="secondary"
          outlined
          @click="applyAreaToAll"
        />
        <div class="floor-toolbar__stats">
          <span>{{ isHorizontal ? structure.buildingsPerBlock : structure.unitsPerFloor }} {{ isHorizontal ? 'فلل في الصف' : 'وحدات في الطابق' }}</span>
          <strong>إجمالي المساحة: {{ floorAreaTotal }} م²</strong>
        </div>
      </div>

      <div v-if="isManualSequence" class="pick-banner" :class="{ done: isPickComplete }">
        <strong>{{ nextPickPrompt }}</strong>
        <span v-if="!isPickComplete">
          {{ isHorizontal ? structure.horizontalPickedIndices.length : structure.verticalPickedIndices.length }}
          /
          {{ floorUnitTotal }}
        </span>
      </div>

      <div v-if="isManualSequence" class="pick-steps">
        <div
          v-for="item in pickSteps"
          :key="item.n"
          class="pick-step"
          :class="{ done: item.done, current: item.current }"
        >
          <span class="pick-step__num">{{ item.n }}</span>
          <span class="pick-step__meta">
            <small>{{ item.title }}</small>
            <strong>{{ item.label }}</strong>
          </span>
        </div>
      </div>

      <div v-else-if="!isHorizontal" class="sequence-path">
        <span
          v-for="cell in orderedFloorCells"
          :key="`seq-${cell.index}`"
          class="sequence-path__item"
        >
          <strong>{{ cell.sequence }}</strong>
          وحدة {{ cell.index + 1 }}
          <i v-if="cell.sequence < orderedFloorCells.length" class="pi pi-arrow-left" />
        </span>
      </div>

      <div v-if="isHorizontal" class="street-wrap">
        <p class="street-wrap__hint">صف الفلل داخل البلوك — من اليمين إلى اليسار</p>
        <div class="street-units">
          <button
            v-for="house in streetHouses"
            :key="`house-${house.index}`"
            type="button"
            class="street-house"
            :class="{
              picked: house.picked,
              current: isManualSequence && !isPickComplete && !house.picked,
              start: house.sequence === 1,
            }"
            @click="pickHorizontalHouse(house.index)"
          >
            <span class="street-house__seq">{{ house.sequence }}</span>
            <span class="street-house__title">فيلا {{ house.index + 1 }}</span>
            <span class="street-house__side">{{ house.side }}</span>
            <span class="street-house__num">{{ house.unitNumber }}</span>
            <span class="street-house__area" @click.stop>
              <InputNumber
                :model-value="structure.rowAreas[house.index]"
                :min="1"
                suffix=" م²"
                @update:model-value="(value) => (structure.rowAreas[house.index] = value || 1)"
              />
            </span>
          </button>
        </div>
      </div>

      <div v-else class="floor-sheet">
        <div class="floor-sheet__label">واجهة أمامية</div>
        <div class="floor-sheet__row floor-sheet__row--units">
          <button
            v-for="cell in floorFrontCells"
            :key="`front-${cell.index}`"
            type="button"
            class="floor-unit"
            :class="{
              picked: cell.picked,
              current: isManualSequence && !isPickComplete && !cell.picked,
              start: cell.sequence === 1,
            }"
            @click="pickVerticalUnit(cell.index)"
          >
            <span class="floor-unit__seq">{{ cell.sequence }}</span>
            <span class="floor-unit__title">وحدة {{ cell.index + 1 }}</span>
            <span class="floor-unit__side">{{ cell.label }}</span>
            <span class="floor-unit__num">{{ cell.unitNumber }}</span>
            <span class="floor-unit__area" @click.stop>
              <InputNumber
                :model-value="structure.rowAreas[cell.index]"
                :min="1"
                suffix=" م²"
                @update:model-value="(value) => (structure.rowAreas[cell.index] = value || 1)"
              />
            </span>
          </button>
        </div>

        <div class="floor-sheet__corridor">الممر / قلب المبنى</div>

        <div class="floor-sheet__row floor-sheet__row--units">
          <button
            v-for="cell in floorBackCells"
            :key="`back-${cell.index}`"
            type="button"
            class="floor-unit"
            :class="{
              picked: cell.picked,
              current: isManualSequence && !isPickComplete && !cell.picked,
              start: cell.sequence === 1,
            }"
            @click="pickVerticalUnit(cell.index)"
          >
            <span class="floor-unit__seq">{{ cell.sequence }}</span>
            <span class="floor-unit__title">وحدة {{ cell.index + 1 }}</span>
            <span class="floor-unit__side">{{ cell.label }}</span>
            <span class="floor-unit__num">{{ cell.unitNumber }}</span>
            <span class="floor-unit__area" @click.stop>
              <InputNumber
                :model-value="structure.rowAreas[cell.index]"
                :min="1"
                suffix=" م²"
                @update:model-value="(value) => (structure.rowAreas[cell.index] = value || 1)"
              />
            </span>
          </button>
        </div>
        <div class="floor-sheet__label">واجهة خلفية</div>
      </div>
    </section>

    <!-- Step 5 -->
    <section v-show="step === 5" class="panel">
      <h3 class="panel__title">معاينة الهيكل</h3>
      <p class="panel__hint">
        المجمع:
        <strong>{{ selectedComplexName }}</strong>
        — سيُضاف
        <strong>{{ preview.totals.units }}</strong>
        {{ isHorizontal ? 'فيلا' : 'وحدة' }}
        تلقائياً
      </p>

      <div class="preview-tree">
        <details
          v-for="block in preview.blocks"
          :key="block.code"
          class="preview-block"
          open
        >
          <summary>
            <i class="pi pi-th-large" />
            {{ block.name }}
            <span class="muted">({{ block.code }})</span>
          </summary>
          <div
            v-if="isHorizontal"
            class="preview-street"
          >
            <span class="floor-plan__side">يمين</span>
            <div class="preview-units">
              <span
                v-for="building in block.buildings"
                :key="building.name"
                class="unit-chip"
              >
                {{ building.floors[0]?.units[0]?.unitNumber || building.name }}
                <small>
                  {{ building.name }}
                  —
                  {{ building.floors[0]?.units[0]?.area }}م²
                </small>
              </span>
            </div>
            <span class="floor-plan__side">يسار</span>
          </div>
          <template v-else>
            <div
              v-for="building in block.buildings"
              :key="building.name"
              class="preview-building"
            >
              <div class="preview-building__title">
                <i class="pi pi-home" />
                {{ building.name }}
              </div>
              <div class="preview-floors">
                <div
                  v-for="floor in building.floors"
                  :key="floor.floorNumber"
                  class="preview-floor"
                >
                  <div class="preview-floor__label">طابق {{ floor.floorNumber }}</div>
                  <div class="floor-plan">
                    <div v-if="floorFrontUnits(floor.units).length" class="floor-plan__row">
                      <span class="floor-plan__side">أمام</span>
                      <div class="preview-units">
                        <span
                          v-for="unit in floorFrontUnits(floor.units)"
                          :key="unit.unitNumber"
                          class="unit-chip"
                        >
                          {{ unit.unitNumber }}
                          <small>{{ unit.sequenceNumber }} — {{ labelOf(unitUiOptions, unit.unitUi) }} — {{ unit.area }}م²</small>
                        </span>
                      </div>
                    </div>
                    <div v-if="floorBackUnits(floor.units).length" class="floor-plan__row">
                      <span class="floor-plan__side">خلف</span>
                      <div class="preview-units">
                        <span
                          v-for="unit in floorBackUnits(floor.units)"
                          :key="unit.unitNumber"
                          class="unit-chip"
                        >
                          {{ unit.unitNumber }}
                          <small>{{ unit.sequenceNumber }} — {{ labelOf(unitUiOptions, unit.unitUi) }} — {{ unit.area }}م²</small>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </details>
      </div>
    </section>

    <!-- Step 5 -->
    <section v-show="step === 5" class="panel">
      <h3 class="panel__title">{{ done ? 'اكتمل الإنشاء' : 'جاري الإنشاء...' }}</h3>
      <p class="panel__hint">{{ progress.label }}</p>
      <ProgressBar :value="progressPercent" class="progress" />
      <div class="progress-meta">
        {{ progress.current }} / {{ progress.total }}
        ({{ progressPercent }}%)
      </div>

      <ul v-if="progress.errors.length" class="errors">
        <li v-for="(err, i) in progress.errors.slice(0, 12)" :key="i">{{ err }}</li>
        <li v-if="progress.errors.length > 12">
          ... و {{ progress.errors.length - 12 }} أخطاء أخرى
        </li>
      </ul>

      <div v-if="done" class="done-actions">
        <Button label="عرض المجمعات" icon="pi pi-building" @click="goToComplex" />
        <Button label="عرض الوحدات" icon="pi pi-key" severity="secondary" outlined @click="goToUnits" />
        <Button label="إضافة هيكل آخر" icon="pi pi-plus" severity="secondary" text @click="resetWizard" />
      </div>
    </section>

    <div v-if="step < 5 || (step === 5 && !creating && !done)" class="nav">
      <Button
        v-if="step > 1 && step < 5"
        label="السابق"
        severity="secondary"
        outlined
        icon="pi pi-arrow-right"
        :disabled="creating"
        @click="back"
      />
      <div class="nav__spacer" />
      <Button
        v-if="step < 4"
        label="التالي"
        icon="pi pi-arrow-left"
        icon-pos="right"
        @click="next"
      />
      <Button
        v-else-if="step === 4"
        label="بدء الإنشاء"
        icon="pi pi-check"
        @click="next"
      />
    </div>
  </div>
</template>

<style scoped>
.builder {
  gap: 18px;
}

.steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: #fff;
  font-family: inherit;
  cursor: pointer;
  color: var(--muted);
  transition: 0.2s ease;
}

.step.active {
  border-color: color-mix(in srgb, var(--brand-mid) 40%, var(--border));
  background: var(--brand-soft);
  color: var(--brand);
}

.step.done {
  color: var(--text);
}

.step__num {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.85rem;
  background: #eef3f5;
  color: inherit;
}

.step.active .step__num {
  background: var(--brand-mid);
  color: #fff;
}

.step__label {
  font-weight: 700;
  font-size: 0.88rem;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.panel__title {
  margin: 0 0 6px;
  font-size: 1.05rem;
}

.panel__hint {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 0.9rem;
}

.complex-card {
  margin-top: 16px;
  padding: 16px 18px;
  border-radius: 14px;
  background: var(--brand-soft);
  border: 1px solid color-mix(in srgb, var(--brand-mid) 22%, var(--border));
}

.complex-card__title {
  font-weight: 800;
  color: var(--brand);
  margin-bottom: 6px;
}

.complex-card__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 600;
}

.totals {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.totals__item {
  padding: 14px;
  border-radius: 14px;
  background: #f7fafb;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.totals__item span {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.totals__item strong {
  font-size: 1.4rem;
  color: var(--text-strong);
}

.totals__item.highlight {
  background: var(--brand-soft);
  border-color: color-mix(in srgb, var(--brand-mid) 25%, var(--border));
}

.totals__item.highlight strong {
  color: var(--brand);
}

.floor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 14px;
  margin-bottom: 18px;
}

.floor-toolbar .field {
  margin: 0;
  min-width: 200px;
}

.floor-toolbar__stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-inline-start: auto;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--muted);
}

.floor-toolbar__stats strong {
  color: var(--brand);
  font-size: 1rem;
}

.pick-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--brand);
  color: #fff;
  font-size: 1rem;
}

.pick-banner.done {
  background: #1f7a4d;
}

.pick-banner span {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.pick-steps {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.pick-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px dashed var(--border);
  background: #f7fafb;
  color: var(--muted);
}

.pick-step.current {
  border-style: solid;
  border-color: var(--brand-mid);
  background: #fff;
  color: var(--text);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-soft) 80%, transparent);
}

.pick-step.done {
  border-style: solid;
  border-color: color-mix(in srgb, var(--brand-mid) 35%, var(--border));
  background: var(--brand-soft);
  color: var(--text);
}

.pick-step__num {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #eef3f5;
  font-weight: 800;
  flex-shrink: 0;
}

.pick-step.current .pick-step__num,
.pick-step.done .pick-step__num {
  background: var(--brand-mid);
  color: #fff;
}

.pick-step__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pick-step__meta small {
  font-size: 0.7rem;
  font-weight: 700;
}

.pick-step__meta strong {
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sequence-path {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--brand-soft);
  border: 1px solid color-mix(in srgb, var(--brand-mid) 20%, var(--border));
}

.sequence-path__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text);
}

.sequence-path__item.next {
  padding: 4px 8px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 0 0 2px var(--brand-mid);
}

.sequence-path__item strong {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--brand-mid);
  color: #fff;
  font-size: 0.75rem;
}

.sequence-path__item > i {
  color: var(--brand);
  font-size: 0.72rem;
}

.sequence-path__move {
  display: inline-flex;
  gap: 2px;
}

.sequence-path__move button {
  width: 22px;
  height: 22px;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
}

.sequence-path__move button:disabled {
  opacity: 0.35;
  cursor: default;
}

.street-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 8px;
}

.street-block {
  display: grid;
  grid-template-columns: 52px 1fr 52px;
  gap: 8px;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  background: #eef6f7;
  border: 1px solid var(--border);
}

.street-block__side {
  text-align: center;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--brand);
}

.street-block__row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
}

.street-villa {
  min-width: 88px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--border);
  color: var(--brand);
  font-size: 0.78rem;
}

.street-wrap__hint {
  margin: 0;
  text-align: center;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.street-units {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 0 8px;
}

.street-house {
  min-width: 150px;
  flex: 1 0 150px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 14px;
  border: 2px solid var(--border);
  background: #fff;
  font-family: inherit;
  cursor: pointer;
  text-align: start;
}

.street-house.current {
  border-color: var(--brand-mid);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-soft) 80%, transparent);
}

.street-house.picked,
.street-house.start {
  border-color: var(--brand-mid);
  background: var(--brand-soft);
}

.street-house__seq {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--brand-mid);
  color: #fff;
  font-weight: 800;
  font-size: 0.8rem;
}

.street-house__title {
  font-weight: 800;
  color: var(--text-strong);
}

.street-house__side,
.street-house__num {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted);
}

.street-house__area :deep(.p-inputnumber),
.street-house__area :deep(.p-inputnumber-input) {
  width: 100%;
}

.floor-sheet {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: 18px;
  background: #f4f7f8;
  border: 1px solid var(--border);
}

.floor-sheet__label {
  text-align: center;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--brand);
}

.floor-sheet__row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.floor-sheet__row--units {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.floor-sheet__row--units .floor-unit {
  flex: 1 1 140px;
  min-width: 130px;
  max-width: 200px;
}

.floor-unit {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  padding: 12px;
  border-radius: 14px;
  border: 2px solid var(--border);
  background: #fff;
  font-family: inherit;
  text-align: start;
  cursor: pointer;
  transition: 0.2s ease;
}

.floor-unit:hover {
  border-color: color-mix(in srgb, var(--brand-mid) 40%, var(--border));
}

.floor-unit.current {
  border-color: var(--brand-mid);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-soft) 80%, transparent);
}

.floor-unit.picked {
  background: color-mix(in srgb, var(--brand-soft) 55%, #fff);
  border-color: var(--brand-mid);
}

.floor-unit.start {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, transparent);
}

.floor-unit__seq {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.85rem;
  background: var(--brand);
  color: #fff;
}

.floor-unit__title {
  font-weight: 800;
  color: var(--text-strong);
}

.floor-unit__side {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 600;
}

.floor-unit__num {
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--brand-mid);
}

.floor-unit__area :deep(.p-inputnumber),
.floor-unit__area :deep(.p-inputnumber-input) {
  width: 100%;
}

.floor-sheet__corridor {
  text-align: center;
  padding: 10px;
  border-radius: 10px;
  background: repeating-linear-gradient(
    135deg,
    #e8eef1,
    #e8eef1 8px,
    #f7fafb 8px,
    #f7fafb 16px
  );
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px dashed var(--border);
}

.floor-slot {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  padding: 12px;
  border-radius: 14px;
  border: 2px solid var(--border);
  background: #fff;
  font-family: inherit;
  text-align: start;
  transition: 0.2s ease;
  min-height: 168px;
}

.floor-slot.on {
  border-color: color-mix(in srgb, var(--brand-mid) 45%, var(--border));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-soft) 80%, transparent);
}

.floor-slot.start {
  border-color: var(--brand-mid);
}

.floor-slot.pickable {
  cursor: pointer;
}

.floor-slot.current {
  border-color: var(--brand-mid);
  animation: pick-pulse 1.4s ease-in-out infinite;
}

@keyframes pick-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-mid) 18%, transparent);
  }
  50% {
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--brand-mid) 10%, transparent);
  }
}

.floor-slot.off {
  opacity: 0.45;
  background: #f7fafb;
}

.floor-slot__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.floor-slot__seq {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--brand-soft);
  color: var(--brand);
  font-weight: 800;
  font-size: 0.78rem;
}

.floor-slot.off .floor-slot__seq {
  background: #eef3f5;
  color: var(--muted);
}

.floor-slot__start {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--muted);
  border-radius: 999px;
  padding: 3px 8px;
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

.floor-slot__start.active {
  background: var(--brand-mid);
  border-color: var(--brand-mid);
  color: #fff;
}

.floor-slot__title {
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--text-strong);
}

.floor-slot__num {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.floor-slot__count,
.floor-slot__area {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.floor-slot__count label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--muted);
}

.floor-slot__count :deep(.p-inputnumber),
.floor-slot__count :deep(.p-inputnumber-input),
.floor-slot__area :deep(.p-inputnumber),
.floor-slot__area :deep(.p-inputnumber-input) {
  width: 100%;
}

.preview-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 520px;
  overflow: auto;
}

.preview-block {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 14px;
  background: #fbfdfe;
}

.preview-block summary {
  cursor: pointer;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none;
}

.preview-block summary::-webkit-details-marker {
  display: none;
}

.muted {
  color: var(--muted);
  font-weight: 600;
  font-size: 0.85rem;
}

.preview-building {
  margin: 12px 0 8px;
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--border);
}

.preview-street {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--border);
  overflow-x: auto;
}

.preview-building__title {
  font-weight: 700;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--brand);
}

.preview-floors {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-floor {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 10px;
  align-items: start;
}

.floor-plan {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.floor-plan__row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.floor-plan__side {
  flex-shrink: 0;
  min-width: 40px;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--brand);
  padding-top: 6px;
}

.ui-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.ui-legend__item {
  padding: 6px 10px;
  border-radius: 999px;
  background: #f7fafb;
  border: 1px solid var(--border);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
}

.ui-legend__item strong {
  color: var(--brand);
  margin-inline-end: 4px;
}

.preview-floor__label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--muted);
  padding-top: 4px;
}

.preview-units {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.unit-chip {
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.78rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.2;
}

.unit-chip small {
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--muted);
}

.progress {
  height: 14px;
  border-radius: 999px;
  overflow: hidden;
}

.progress-meta {
  margin-top: 10px;
  color: var(--muted);
  font-weight: 600;
}

.errors {
  margin: 14px 0 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: #fdf2f1;
  color: var(--danger);
  font-size: 0.85rem;
}

.done-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav__spacer {
  flex: 1;
}

.field.full {
  grid-column: 1 / -1;
}

.building-names__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 8px;
}

.building-names__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.building-names__item label {
  font-size: 0.8rem;
  color: var(--muted);
  font-weight: 700;
}

.field-hint {
  display: block;
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.45;
}

@media (max-width: 900px) {
  .steps {
    grid-template-columns: 1fr 1fr;
  }

  .totals {
    grid-template-columns: 1fr 1fr;
  }

  .preview-floor {
    grid-template-columns: 1fr;
  }

  .floor-sheet__row {
    grid-template-columns: 1fr;
  }
}
</style>
