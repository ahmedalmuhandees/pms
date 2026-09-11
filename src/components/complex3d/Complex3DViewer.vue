<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import { TresCanvas } from '@tresjs/core'
import { PCFShadowMap } from 'three'
import type { Unit } from '@/types'
import type { ComplexMapLayoutMode, MapBlock } from '@/types/complexMap'
import {
  buildComplex3dLayout,
  UNIT_STATUS_3D_COLORS,
} from '@/utils/complex3dLayout'
import { formatMoney, labelOf, unitStatusOptions, unitTypeOptions } from '@/utils/enums'
import Complex3DScene from './Complex3DScene.vue'

const props = defineProps<{
  blocks: MapBlock[]
  layoutMode: ComplexMapLayoutMode
  complexName: string
  selectedUnit: Unit | null
}>()

const emit = defineEmits<{
  close: []
  select: [unit: Unit | null]
  open: [unit: Unit]
}>()

const layout = computed(() =>
  buildComplex3dLayout(props.blocks, props.layoutMode, props.complexName),
)

const layoutHint = computed(() => {
  if (props.layoutMode === 'horizontal') return 'فلل على الشوارع الداخلية'
  if (props.layoutMode === 'vertical') return 'أبراج حسب الطوابق والوحدات'
  return 'مبانٍ متعددة حسب هيكل المجمع'
})

function statusClass(status: number) {
  switch (status) {
    case 1:
      return 'is-available'
    case 2:
      return 'is-reserved'
    case 3:
      return 'is-sold'
    case 4:
      return 'is-rented'
    default:
      return 'is-maintenance'
  }
}

function openSelected() {
  if (props.selectedUnit) emit('open', props.selectedUnit)
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.cursor = ''
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="c3d">
    <header class="c3d__bar">
      <div class="c3d__title">
        <i class="pi pi-box" />
        <div>
          <h2>عرض المجمع 3D</h2>
          <p>
            {{ complexName }} · {{ layoutHint }} · اسحب للتدوير · مرّر للتكبير · اضغط وحدة للاختيار
          </p>
        </div>
      </div>
      <Button
        label="إغلاق"
        icon="pi pi-times"
        severity="secondary"
        outlined
        @click="emit('close')"
      />
    </header>

    <div class="c3d__stage">
      <TresCanvas
        shadows
        :alpha="false"
        :shadow-map-type="PCFShadowMap"
        clear-color="#9ec7dc"
        class="c3d__canvas"
        @pointermissed="emit('select', null)"
      >
        <Complex3DScene
          :layout="layout"
          :selected-unit-id="selectedUnit?.id"
          @select="emit('select', $event)"
          @open="emit('open', $event)"
        />
      </TresCanvas>

      <div class="c3d__legend">
        <span
          v-for="opt in unitStatusOptions"
          :key="`c3d-${opt.value}`"
          class="c3d__chip"
          :style="{ '--chip': UNIT_STATUS_3D_COLORS[opt.value] }"
        >
          {{ opt.label }}
        </span>
      </div>

      <aside v-if="selectedUnit" class="c3d__panel">
        <div class="c3d__panel-head">
          <h3>{{ selectedUnit.unitNumber }}</h3>
          <span class="c3d__pill" :class="statusClass(selectedUnit.status)">
            {{ labelOf(unitStatusOptions, selectedUnit.status) }}
          </span>
        </div>
        <dl>
          <div>
            <dt>النوع</dt>
            <dd>{{ labelOf(unitTypeOptions, selectedUnit.unitType) }}</dd>
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
            <dt>السعر</dt>
            <dd>{{ formatMoney(selectedUnit.price) }}</dd>
          </div>
        </dl>
        <Button
          label="فتح تفاصيل الوحدة"
          icon="pi pi-arrow-left"
          class="c3d__open"
          @click="openSelected"
        />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.c3d {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  flex-direction: column;
  background: #0b3d4a;
}

.c3d__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(11, 61, 74, 0.94);
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.c3d__title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.c3d__title i {
  font-size: 1.35rem;
  color: #9ecbd3;
}

.c3d__title h2 {
  margin: 0;
  font-size: 1.05rem;
}

.c3d__title p {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #c0dde3;
  font-weight: 600;
}

.c3d__stage {
  position: relative;
  flex: 1;
  min-height: 0;
}

.c3d__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.c3d__legend {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  pointer-events: none;
}

.c3d__chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  background: color-mix(in srgb, var(--chip) 82%, #062830);
  border: 1px solid color-mix(in srgb, var(--chip) 55%, #fff);
}

.c3d__panel {
  position: absolute;
  top: 16px;
  left: 16px;
  width: min(280px, calc(100% - 32px));
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.c3d__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.c3d__panel-head h3 {
  margin: 0;
  font-size: 1.05rem;
}

.c3d__pill {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.c3d__pill.is-available {
  background: #e8f5f0;
  color: #1f7a5c;
}

.c3d__pill.is-reserved {
  background: #f8efe6;
  color: #c46b2b;
}

.c3d__pill.is-sold {
  background: #e4edf8;
  color: #2b6cb0;
}

.c3d__pill.is-rented {
  background: #ebe4f2;
  color: #6b46a1;
}

.c3d__pill.is-maintenance {
  background: #f8ecec;
  color: #b04a4a;
}

.c3d__panel dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0 0 12px;
}

.c3d__panel dt {
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.c3d__panel dd {
  margin: 2px 0 0;
  font-weight: 800;
}

.c3d__open {
  width: 100%;
}
</style>

<style>
.c3d-html {
  pointer-events: none !important;
}

.c3d-label {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(11, 61, 74, 0.82);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(6, 40, 48, 0.2);
}

.c3d-unit-num {
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(6, 40, 48, 0.82);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
  font-family: inherit;
  line-height: 1.3;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.c3d-unit-num.selected {
  background: #156574;
  outline: 1px solid #9ecbd3;
}

.c3d-gate-sign {
  padding: 6px 14px;
  border-radius: 6px;
  background: #0b3d4a;
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  white-space: nowrap;
  font-family: inherit;
  border: 1px solid #c9a227;
  box-shadow: 0 6px 16px rgba(6, 40, 48, 0.35);
}
</style>
