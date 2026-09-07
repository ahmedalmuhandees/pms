<script setup lang="ts">
// @ts-nocheck — TresJS mesh props accept tuples at runtime; vue-tsc types them as Vector3.
import { computed, onBeforeUnmount, shallowRef } from 'vue'
import { ContactShadows, Html, OrbitControls, Sky, Stars } from '@tresjs/cientos'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import type { Unit } from '@/types'
import type { Complex3dLayout, SceneBuildingMesh, SceneUnitMesh } from '@/utils/complex3dLayout'

const props = defineProps<{
  layout: Complex3dLayout
  selectedUnitId?: string | null
  isNight?: boolean
}>()

const emit = defineEmits<{
  select: [unit: Unit | null]
  open: [unit: Unit]
}>()

const halfPi = -Math.PI / 2
const maxPolar = Math.PI / 2.05
const maxDistance = computed(() => Math.max(80, props.layout.groundSize * 1.8))
const contactScale = computed(() => props.layout.groundSize * 1.1)
const fountain = computed(() => props.layout.fountain)
const night = computed(() => Boolean(props.isNight))

function makeNoiseTexture(base: [number, number, number], specks: number, extra?: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = `rgb(${base[0]}, ${base[1]}, ${base[2]})`
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < specks; i++) {
    const n = (Math.random() - 0.5) * 36
    ctx.fillStyle = `rgba(${base[0] + n}, ${base[1] + n}, ${base[2] + n}, ${0.18 + Math.random() * 0.28})`
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }
  extra?.(ctx)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.anisotropy = 4
  return texture
}

const asphaltMap = shallowRef(
  makeNoiseTexture([52, 55, 60], 5200, (ctx) => {
    ctx.fillStyle = 'rgba(70, 72, 76, 0.18)'
    for (let y = 0; y < 256; y += 18) ctx.fillRect(0, y, 256, 1)
  }),
)
const grassMap = shallowRef(
  makeNoiseTexture([62, 108, 52], 3800, (ctx) => {
    ctx.fillStyle = 'rgba(40, 90, 38, 0.22)'
    for (let i = 0; i < 80; i++) ctx.fillRect(Math.random() * 256, Math.random() * 256, 8, 1)
  }),
)

if (asphaltMap.value) asphaltMap.value.repeat.set(14, 14)
if (grassMap.value) grassMap.value.repeat.set(6, 6)

onBeforeUnmount(() => {
  asphaltMap.value?.dispose()
  grassMap.value?.dispose()
})

function isSelected(id: string) {
  return props.selectedUnitId === id
}

function selectUnit(unit: Unit) {
  emit('select', unit)
}

function openUnit(unit: Unit) {
  emit('open', unit)
}

function hoverUnit() {
  document.body.style.cursor = 'pointer'
}

function unhoverUnit() {
  document.body.style.cursor = ''
}

function balconyZ(unit: SceneUnitMesh) {
  return unit.position[2] + (unit.position[2] >= 0 ? 0.9 : -0.9)
}

function windowEmissive(unit: SceneUnitMesh) {
  if (isSelected(unit.id)) return night.value ? 0.95 : 0.62
  return night.value ? 0.55 : 0.16
}

function towerY(building: SceneBuildingMesh) {
  return building.bodySize[1] / 2
}
</script>

<template>
  <TresPerspectiveCamera
    :position="layout.cameraPosition"
    :fov="42"
    :near="0.1"
    :far="2400"
  />
  <OrbitControls
    make-default
    enable-damping
    :damping-factor="0.08"
    :target="layout.cameraTarget"
    :min-distance="14"
    :max-distance="maxDistance"
    :max-polar-angle="maxPolar"
    :min-polar-angle="0.18"
  />

  <Sky
    v-if="!night"
    :elevation="18"
    :azimuth="160"
    :turbidity="3.4"
    :rayleigh="0.55"
  />
  <Sky
    v-else
    :elevation="-4"
    :azimuth="200"
    :turbidity="12"
    :rayleigh="0.08"
  />
  <Stars v-if="night" :radius="180" :depth="40" :count="900" :size="0.18" />
  <TresFog
    :args="night ? ['#071018', 40, layout.groundSize * 1.7] : ['#c3d7e6', 70, layout.groundSize * 2.4]"
  />

  <TresAmbientLight :intensity="night ? 0.1 : 0.42" :color="night ? '#1a2433' : '#f2f4f8'" />
  <TresHemisphereLight
    :color="night ? '#1c2c48' : '#d7e9ff'"
    :ground-color="night ? '#0d1210' : '#7d6b4e'"
    :intensity="night ? 0.18 : 0.72"
  />
  <TresDirectionalLight
    :position="night ? [layout.sunPosition[0] * 0.4, layout.groundSize * 0.7, -layout.sunPosition[2]] : layout.sunPosition"
    :color="night ? '#c5d4ee' : '#fff1d6'"
    :intensity="night ? 0.28 : 2.15"
    :cast-shadow="true"
    :shadow-mapSize="[2048, 2048]"
    :shadow-bias="-0.00025"
  />

  <TresMesh :rotation="[halfPi, 0, 0]" :receive-shadow="true">
    <TresCircleGeometry :args="[layout.groundSize * 0.72, 72]" />
    <TresMeshStandardMaterial
      :color="night ? '#2a2d32' : '#3f4349'"
      :map="asphaltMap"
      :roughness="0.96"
    />
  </TresMesh>

  <TresMesh
    v-for="yard in layout.yards"
    :key="yard.id"
    :position="yard.position"
    :receive-shadow="true"
  >
    <TresBoxGeometry :args="yard.size" />
    <TresMeshStandardMaterial :color="yard.color" :map="grassMap" :roughness="1" />
  </TresMesh>

  <TresMesh
    v-for="road in layout.roads"
    :key="road.id"
    :position="road.position"
    :receive-shadow="true"
  >
    <TresBoxGeometry :args="road.size" />
    <TresMeshStandardMaterial :color="road.color" :map="asphaltMap" :roughness="0.92" />
  </TresMesh>

  <TresMesh
    v-for="mark in layout.laneMarks"
    :key="mark.id"
    :position="mark.position"
  >
    <TresBoxGeometry :args="mark.size" />
    <TresMeshStandardMaterial :color="mark.color" :roughness="0.55" :emissive="night ? mark.color : '#000000'" :emissive-intensity="night ? 0.12 : 0" />
  </TresMesh>

  <TresMesh
    v-for="xw in layout.crosswalks"
    :key="xw.id"
    :position="xw.position"
  >
    <TresBoxGeometry :args="xw.size" />
    <TresMeshStandardMaterial :color="xw.color" :roughness="0.7" />
  </TresMesh>

  <TresMesh
    v-for="walk in layout.sidewalks"
    :key="walk.id"
    :position="walk.position"
    :receive-shadow="true"
  >
    <TresBoxGeometry :args="walk.size" />
    <TresMeshStandardMaterial :color="walk.color" :roughness="0.88" />
  </TresMesh>

  <TresMesh
    v-for="wall in layout.walls"
    :key="wall.id"
    :position="wall.position"
    :cast-shadow="true"
    :receive-shadow="true"
  >
    <TresBoxGeometry :args="wall.size" />
    <TresMeshStandardMaterial :color="wall.color" :roughness="0.86" />
  </TresMesh>

  <TresGroup :position="layout.gate.position">
    <TresMesh :position="[-layout.gate.width / 2, 1.7, 0]" :cast-shadow="true">
      <TresBoxGeometry :args="[0.7, 3.4, 0.7]" />
      <TresMeshStandardMaterial color="#cfc6b8" :roughness="0.7" />
    </TresMesh>
    <TresMesh :position="[layout.gate.width / 2, 1.7, 0]" :cast-shadow="true">
      <TresBoxGeometry :args="[0.7, 3.4, 0.7]" />
      <TresMeshStandardMaterial color="#cfc6b8" :roughness="0.7" />
    </TresMesh>
    <TresMesh :position="[0, 3.25, 0]" :cast-shadow="true">
      <TresBoxGeometry :args="[layout.gate.width + 0.8, 0.35, 0.45]" />
      <TresMeshStandardMaterial color="#b7a48a" :metalness="0.2" :roughness="0.55" />
    </TresMesh>
    <TresMesh :position="[-layout.gate.width / 2, 3.55, 0]">
      <TresSphereGeometry :args="[0.28, 12, 12]" />
      <TresMeshStandardMaterial color="#c9a227" :metalness="0.55" :roughness="0.35" />
    </TresMesh>
    <TresMesh :position="[layout.gate.width / 2, 3.55, 0]">
      <TresSphereGeometry :args="[0.28, 12, 12]" />
      <TresMeshStandardMaterial color="#c9a227" :metalness="0.55" :roughness="0.35" />
    </TresMesh>
    <TresMesh :position="[0, 2.55, 0.32]" :cast-shadow="true">
      <TresBoxGeometry :args="[Math.min(14, Math.max(7, layout.gate.name.length * 0.55)), 1.15, 0.14]" />
      <TresMeshStandardMaterial
        color="#0b3d4a"
        :emissive="night ? '#156574' : '#000000'"
        :emissive-intensity="night ? 0.35 : 0"
        :roughness="0.45"
      />
    </TresMesh>
    <Html :position="[0, 2.55, 0.48]" center :distance-factor="18" wrapper-class="c3d-html">
      <div class="c3d-gate-sign" :class="{ night }">{{ layout.gate.name }}</div>
    </Html>
  </TresGroup>

  <TresGroup v-if="fountain" :position="fountain.position">
    <TresMesh :position="[0, 0.28, 0]" :receive-shadow="true">
      <TresCylinderGeometry :args="[fountain.radius, fountain.radius * 1.08, 0.55, 32]" />
      <TresMeshStandardMaterial color="#c5beb3" :roughness="0.7" />
    </TresMesh>
    <TresMesh :position="[0, 0.42, 0]">
      <TresCylinderGeometry :args="[fountain.radius * 0.78, fountain.radius * 0.78, 0.22, 32]" />
      <TresMeshStandardMaterial color="#4fa3c4" :roughness="0.18" :metalness="0.35" :transparent="true" :opacity="0.85" />
    </TresMesh>
    <TresMesh :position="[0, 1.1, 0]" :cast-shadow="true">
      <TresCylinderGeometry :args="[0.38, 0.55, 1.6, 16]" />
      <TresMeshStandardMaterial color="#d0c9bd" :roughness="0.65" />
    </TresMesh>
  </TresGroup>

  <TresGroup v-for="tree in layout.trees" :key="tree.id" :position="tree.position" :scale="tree.scale">
    <TresMesh :position="[0, 0.85, 0]" :cast-shadow="true">
      <TresCylinderGeometry :args="[0.22, 0.28, 1.7, 8]" />
      <TresMeshStandardMaterial color="#6b4a2f" :roughness="1" />
    </TresMesh>
    <TresMesh :position="[0, 2.15, 0]" :cast-shadow="true">
      <TresConeGeometry :args="[1.35, 2.1, 8]" />
      <TresMeshStandardMaterial :color="night ? '#1d4a28' : '#2f6b3a'" :roughness="0.9" />
    </TresMesh>
    <TresMesh :position="[0, 2.85, 0]" :cast-shadow="true">
      <TresConeGeometry :args="[1.05, 1.7, 8]" />
      <TresMeshStandardMaterial :color="night ? '#245532' : '#3b7d46'" :roughness="0.88" />
    </TresMesh>
  </TresGroup>

  <TresGroup v-for="lamp in layout.lamps" :key="lamp.id" :position="lamp.position">
    <TresMesh :position="[0, 2.4, 0]" :cast-shadow="true">
      <TresCylinderGeometry :args="[0.08, 0.12, 4.8, 8]" />
      <TresMeshStandardMaterial color="#4d535a" :metalness="0.4" :roughness="0.45" />
    </TresMesh>
    <TresMesh :position="[0, 4.9, 0]">
      <TresSphereGeometry :args="[0.22, 10, 10]" />
      <TresMeshStandardMaterial
        color="#ffe7b0"
        emissive="#ffd58a"
        :emissive-intensity="night ? 2.4 : 0.35"
      />
    </TresMesh>
    <TresPointLight
      v-if="night && lamp.id.endsWith('-a')"
      :position="[0, 4.7, 0]"
      color="#ffd9a0"
      :intensity="8"
      :distance="18"
      :decay="2"
    />
  </TresGroup>

  <TresGroup
    v-for="building in layout.buildings"
    :key="building.id"
    :position="building.position"
  >
    <TresMesh
      :position="[0, towerY(building), 0]"
      :cast-shadow="true"
      :receive-shadow="true"
    >
      <TresBoxGeometry :args="building.bodySize" />
      <TresMeshStandardMaterial :color="building.facadeColor" :roughness="0.82" />
    </TresMesh>

    <TresMesh
      v-if="building.roof.type === 'flat'"
      :position="building.roof.position"
      :cast-shadow="true"
    >
      <TresBoxGeometry :args="building.roof.size" />
      <TresMeshStandardMaterial :color="building.roofColor" :roughness="0.78" />
    </TresMesh>
    <TresMesh
      v-else
      :position="building.roof.position"
      :rotation="[0, building.roof.rotationY, 0]"
      :cast-shadow="true"
    >
      <TresConeGeometry :args="[building.roof.size[0], building.roof.size[1], 4]" />
      <TresMeshStandardMaterial :color="building.roofColor" :roughness="0.7" />
    </TresMesh>

    <TresMesh :position="building.entrance.position" :cast-shadow="true">
      <TresBoxGeometry :args="building.entrance.size" />
      <TresMeshStandardMaterial color="#2b3338" :roughness="0.45" />
    </TresMesh>

    <TresMesh
      v-for="ac in building.acUnits"
      :key="ac.id"
      :position="ac.position"
      :cast-shadow="true"
    >
      <TresBoxGeometry :args="ac.size" />
      <TresMeshStandardMaterial color="#8b949c" :metalness="0.35" :roughness="0.4" />
    </TresMesh>

    <template v-for="unitMesh in building.units" :key="unitMesh.id">
      <TresMesh :position="unitMesh.position">
        <TresBoxGeometry
          :args="[unitMesh.size[0] + 0.18, unitMesh.size[1] + 0.18, unitMesh.size[2] * 0.7]"
        />
        <TresMeshStandardMaterial color="#1d2a30" :roughness="0.5" />
      </TresMesh>
      <TresMesh
        :position="unitMesh.position"
        :scale="isSelected(unitMesh.id) ? 1.08 : 1"
        :cast-shadow="true"
        @click.stop="selectUnit(unitMesh.unit)"
        @dblclick.stop="openUnit(unitMesh.unit)"
        @pointerenter="hoverUnit"
        @pointerleave="unhoverUnit"
      >
        <TresBoxGeometry :args="unitMesh.size" />
        <TresMeshStandardMaterial
          :color="unitMesh.color"
          :emissive="unitMesh.color"
          :emissive-intensity="windowEmissive(unitMesh)"
          :roughness="0.22"
          :metalness="0.28"
        />
      </TresMesh>
      <TresMesh
        v-if="unitMesh.balcony"
        :position="[unitMesh.position[0], unitMesh.position[1] - unitMesh.size[1] * 0.42, balconyZ(unitMesh)]"
        :cast-shadow="true"
      >
        <TresBoxGeometry :args="[unitMesh.size[0] * 0.95, 0.12, 1.45]" />
        <TresMeshStandardMaterial color="#d5cec3" :roughness="0.8" />
      </TresMesh>
      <Html
        v-if="unitMesh.number"
        :position="unitMesh.labelPosition"
        center
        :distance-factor="10"
        wrapper-class="c3d-html"
      >
        <div class="c3d-unit-num" :class="{ selected: isSelected(unitMesh.id), night }">
          {{ unitMesh.number }}
        </div>
      </Html>
    </template>

    <Html :position="building.labelPosition" center :distance-factor="26" wrapper-class="c3d-html">
      <div class="c3d-label" :class="{ night }">{{ building.name }}</div>
    </Html>
  </TresGroup>

  <ContactShadows
    :opacity="night ? 0.22 : 0.42"
    :scale="contactScale"
    :blur="2.4"
    :far="28"
    :position="[0, 0.04, 0]"
  />
</template>
