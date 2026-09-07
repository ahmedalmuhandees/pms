import { UnitStatus, UnitUi, type Unit } from '@/types'
import type { ComplexMapLayoutMode, MapBlock, MapBuilding } from '@/types/complexMap'
import { isFrontUnitUi } from '@/utils/complexBuilder'

export type Vec3 = [number, number, number]

export const UNIT_STATUS_3D_COLORS: Record<number, string> = {
  [UnitStatus.Available]: '#3ea57a',
  [UnitStatus.Reserved]: '#d4893c',
  [UnitStatus.Sold]: '#3d7ec4',
  [UnitStatus.Rented]: '#7b56b0',
  [UnitStatus.Maintenance]: '#c45a5a',
}

const FACADES = ['#d7cbb8', '#cfc2ae', '#e3d6c4', '#c8bba8', '#ddd0bd']
const VILLA_WALLS = ['#efe6d6', '#e7dcc8', '#f3eadc', '#e4d8c4']
const VILLA_ROOFS = ['#9a4e32', '#8b4330', '#a85a3a', '#7e3d2c']

const UNIT_W = 7.2
const UNIT_D = 8.6
const FLOOR_H = 3.2
const CORRIDOR = 3.4
const SLOT_GAP = 0.5

export interface SceneUnitMesh {
  id: string
  unit: Unit
  number: string
  position: Vec3
  size: Vec3
  labelPosition: Vec3
  color: string
  balcony: boolean
}

export interface SceneRoof {
  type: 'flat' | 'hip'
  position: Vec3
  size: Vec3
  rotationY: number
}

export interface SceneBuildingMesh {
  id: string
  name: string
  kind: 'tower' | 'villa'
  position: Vec3
  bodySize: Vec3
  facadeColor: string
  roofColor: string
  roof: SceneRoof
  entrance: { position: Vec3; size: Vec3 }
  units: SceneUnitMesh[]
  labelPosition: Vec3
  acUnits: { id: string; position: Vec3; size: Vec3 }[]
}

export interface SceneBox {
  id: string
  position: Vec3
  size: Vec3
  color: string
  rotationY?: number
}

export interface SceneTree {
  id: string
  position: Vec3
  scale: number
}

export interface SceneLamp {
  id: string
  position: Vec3
}

export interface Complex3dLayout {
  buildings: SceneBuildingMesh[]
  yards: SceneBox[]
  roads: SceneBox[]
  sidewalks: SceneBox[]
  laneMarks: SceneBox[]
  crosswalks: SceneBox[]
  walls: SceneBox[]
  trees: SceneTree[]
  lamps: SceneLamp[]
  fountain: { position: Vec3; radius: number } | null
  gate: { position: Vec3; width: number; name: string }
  groundSize: number
  cameraPosition: Vec3
  cameraTarget: Vec3
  sunPosition: Vec3
}

/** بعد العصر (~15:30) حتى الفجر (~05:00) يُعرض الوضع الليلي */
export function isNightAfterAsr(date = new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes()
  return minutes >= 15 * 60 + 30 || minutes < 5 * 60
}

function hash01(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function colOf(ui: UnitUi | null | undefined) {
  if (ui === UnitUi.CornerFrontRight || ui === UnitUi.CornerBackRight) return 1
  if (ui === UnitUi.CornerFrontLeft || ui === UnitUi.CornerBackLeft) return -1
  return 0
}

function isFront(ui: UnitUi | null | undefined) {
  if (ui == null) return true
  return isFrontUnitUi(ui)
}

function statusColor(status: number) {
  return UNIT_STATUS_3D_COLORS[status] ?? '#8a9aa0'
}

function floorNumbers(building: MapBuilding) {
  const nums = building.floors.map((f) => f.floor.floorNumber)
  if (!nums.length) return { min: 1, max: 1, count: 1 }
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  return { min, max, count: Math.max(1, max - min + 1) }
}

function buildTowerSpec(building: MapBuilding, index: number): Omit<SceneBuildingMesh, 'position'> {
  const { min, count } = floorNumbers(building)
  const width = 3 * UNIT_W + 2 * SLOT_GAP + 1.8
  const depth = 2 * UNIT_D + CORRIDOR
  const height = count * FLOOR_H + 0.35
  const facadeColor = FACADES[index % FACADES.length]!
  const units: SceneUnitMesh[] = []

  for (const floorMap of building.floors) {
    const bySlot = new Map<UnitUi, Unit[]>()
    for (const unit of floorMap.units) {
      const ui = unit.unitUi ?? UnitUi.MiddleFront
      const list = bySlot.get(ui) ?? []
      list.push(unit)
      bySlot.set(ui, list)
    }

    const y = (floorMap.floor.floorNumber - min) * FLOOR_H + FLOOR_H * 0.55
    for (const [ui, slotUnits] of bySlot) {
      const n = slotUnits.length
      const col = colOf(ui)
      const front = isFront(ui)
      const z = front ? depth / 2 + 0.14 : -(depth / 2 + 0.14)
      for (let i = 0; i < n; i++) {
        const unit = slotUnits[i]!
        const spread = (n - 1) * 2.15
        const ox = n > 1 ? -spread / 2 + i * 2.15 : 0
        const w = Math.max(2.2, (UNIT_W * 0.78) / Math.min(n, 3))
        const x = col * (UNIT_W + SLOT_GAP) + ox
        const facing = front ? 1 : -1
        units.push({
          id: unit.id,
          unit,
          number: unit.unitNumber || '',
          position: [x, y, z],
          size: [w, FLOOR_H * 0.58, 0.32],
          labelPosition: [x, y, z + facing * 0.48],
          color: statusColor(unit.status),
          balcony: front && floorMap.floor.floorNumber > min,
        })
      }
    }
  }

  const acUnits = Array.from({ length: Math.min(4, Math.max(2, Math.ceil(count / 3))) }, (_, i) => ({
    id: `${building.building.id}-ac-${i}`,
    position: [-width * 0.28 + i * 2.4, height + 0.55, -depth * 0.18 + (i % 2) * 1.8] as Vec3,
    size: [1.35, 0.7, 1.1] as Vec3,
  }))

  return {
    id: building.building.id,
    name: building.building.name || `مبنى ${index + 1}`,
    kind: 'tower',
    bodySize: [width, height, depth],
    facadeColor,
    roofColor: '#6d7c86',
    roof: {
      type: 'flat',
      position: [0, height + 0.28, 0],
      size: [width + 0.7, 0.55, depth + 0.7],
      rotationY: 0,
    },
    entrance: {
      position: [0, 1.35, depth / 2 + 0.35],
      size: [3.2, 2.7, 0.7],
    },
    units,
    labelPosition: [0, height + 3.2, 0],
    acUnits,
  }
}

function buildVillaSpec(building: MapBuilding, index: number): Omit<SceneBuildingMesh, 'position'> {
  const { count } = floorNumbers(building)
  const width = 10.4
  const depth = 12.2
  const height = Math.max(3.6, count * 3.1)
  const wall = VILLA_WALLS[index % VILLA_WALLS.length]!
  const roofH = 2.35
  const units: SceneUnitMesh[] = []

  building.floors.forEach((floorMap, fi) => {
    floorMap.units.forEach((u, ui) => {
      const y = 1.7 + fi * 2.8
      const x = (ui - (floorMap.units.length - 1) / 2) * 3.4
      const z = depth / 2 + 0.14
      units.push({
        id: u.id,
        unit: u,
        number: u.unitNumber || '',
        position: [x, y, z],
        size: [2.4, 1.7, 0.28],
        labelPosition: [x, y, z + 0.48],
        color: statusColor(u.status),
        balcony: false,
      })
    })
  })

  return {
    id: building.building.id,
    name: building.building.name || `فيلا ${index + 1}`,
    kind: 'villa',
    bodySize: [width, height, depth],
    facadeColor: wall,
    roofColor: VILLA_ROOFS[index % VILLA_ROOFS.length]!,
    roof: {
      type: 'hip',
      position: [0, height + roofH / 2 - 0.05, 0],
      size: [Math.hypot(width, depth) * 0.56, roofH, 4],
      rotationY: Math.PI / 4,
    },
    entrance: {
      position: [0, 1.15, depth / 2 + 0.28],
      size: [1.7, 2.3, 0.45],
    },
    units,
    labelPosition: [0, height + roofH + 2.2, 0],
    acUnits: [],
  }
}

function placeInGrid<T>(
  items: T[],
  cellW: number,
  cellD: number,
  perRow: number,
): { item: T; x: number; z: number }[] {
  const rows = Math.ceil(items.length / perRow)
  const placed: { item: T; x: number; z: number }[] = []
  items.forEach((item, i) => {
    const col = i % perRow
    const row = Math.floor(i / perRow)
    const x = (col - (perRow - 1) / 2) * cellW
    const z = (row - (rows - 1) / 2) * cellD
    placed.push({ item, x, z })
  })
  return placed
}

function addLaneMarks(road: SceneBox, marks: SceneBox[]) {
  const [w, , d] = road.size
  const alongZ = d >= w
  const length = alongZ ? d : w
  const dash = 2.6
  const gap = 2.4
  const step = dash + gap
  const n = Math.max(1, Math.floor(length / step))
  for (let i = 0; i < n; i++) {
    const t = -length / 2 + dash / 2 + i * step
    if (t + dash / 2 > length / 2) break
    marks.push({
      id: `${road.id}-lane-${i}`,
      position: alongZ
        ? [road.position[0], 0.11, road.position[2] + t]
        : [road.position[0] + t, 0.11, road.position[2]],
      size: alongZ ? [0.16, 0.035, dash] : [dash, 0.035, 0.16],
      color: '#f0d56a',
    })
  }
}

function addLampsAlong(road: SceneBox, lamps: SceneLamp[], prefix: string) {
  const [w, , d] = road.size
  const alongZ = d >= w
  const length = alongZ ? d : w
  const count = Math.max(2, Math.round(length / 16))
  const side = (alongZ ? w : d) * 0.42
  for (let i = 0; i < count; i++) {
    const t = -length / 2 + ((i + 0.5) * length) / count
    lamps.push({
      id: `${prefix}-${i}-a`,
      position: alongZ
        ? [road.position[0] - side, 0, road.position[2] + t]
        : [road.position[0] + t, 0, road.position[2] - side],
    })
    lamps.push({
      id: `${prefix}-${i}-b`,
      position: alongZ
        ? [road.position[0] + side, 0, road.position[2] + t]
        : [road.position[0] + t, 0, road.position[2] + side],
    })
  }
}

function emptyLayout(name: string): Complex3dLayout {
  return {
    buildings: [],
    yards: [],
    roads: [],
    sidewalks: [],
    laneMarks: [],
    crosswalks: [],
    walls: [],
    trees: [],
    lamps: [],
    fountain: null,
    gate: { position: [0, 0, 24], width: 10, name },
    groundSize: 80,
    cameraPosition: [36, 28, 42],
    cameraTarget: [0, 3, 0],
    sunPosition: [40, 70, 25],
  }
}

export function buildComplex3dLayout(
  blocks: MapBlock[],
  mode: ComplexMapLayoutMode,
  complexName = 'المجمع',
): Complex3dLayout {
  const name = complexName.trim() || 'المجمع'
  if (!blocks.length) return emptyLayout(name)
  const isVilla = mode === 'horizontal'
  const buildings: SceneBuildingMesh[] = []
  const yards: SceneBox[] = []
  const roads: SceneBox[] = []
  const sidewalks: SceneBox[] = []
  const laneMarks: SceneBox[] = []
  const crosswalks: SceneBox[] = []
  const trees: SceneTree[] = []
  const lamps: SceneLamp[] = []

  const blockPacks = blocks.map((blockMap, bi) => {
    const specs = blockMap.buildings.map((b, i) =>
      isVilla ? buildVillaSpec(b, i) : buildTowerSpec(b, i),
    )
    const maxW = specs.reduce((m, s) => Math.max(m, s.bodySize[0]), isVilla ? 10 : 24)
    const maxD = specs.reduce((m, s) => Math.max(m, s.bodySize[2]), isVilla ? 12 : 22)
    const gapX = isVilla ? 16.5 : maxW + 12
    const gapZ = isVilla ? 22 : maxD + 16
    const perRow = specs.length <= 4 ? Math.max(1, specs.length) : Math.ceil(specs.length / 2)
    const placed = placeInGrid(specs, gapX, gapZ, perRow)
    const rows = Math.ceil(Math.max(1, specs.length) / perRow)
    const lotW = Math.max(gapX * perRow + 14, 28)
    const lotD = Math.max(gapZ * rows + 16, 30)
    return {
      block: blockMap.block,
      placed,
      lotW,
      lotD,
      index: bi,
    }
  })

  const cols = blockPacks.length <= 2 ? Math.max(1, blockPacks.length) : 2
  const colWidths: number[] = []
  const rowDepths: number[] = []
  blockPacks.forEach((pack, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    colWidths[col] = Math.max(colWidths[col] ?? 0, pack.lotW)
    rowDepths[row] = Math.max(rowDepths[row] ?? 0, pack.lotD)
  })
  const ROAD = 18
  const colX: number[] = []
  const rowZ: number[] = []
  let xCursor = 0
  colWidths.forEach((w, i) => {
    colX[i] = xCursor + w / 2
    xCursor += w + ROAD
  })
  let zCursor = 0
  rowDepths.forEach((d, i) => {
    rowZ[i] = zCursor + d / 2
    zCursor += d + ROAD
  })
  const originX = (xCursor - ROAD) / 2
  const originZ = (zCursor - ROAD) / 2

  blockPacks.forEach((pack, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const bx = (colX[col] ?? 0) - originX
    const bz = (rowZ[row] ?? 0) - originZ

    yards.push({
      id: `yard-${pack.block.id}`,
      position: [bx, 0.04, bz],
      size: [Math.max(12, pack.lotW - 10), 0.07, Math.max(12, pack.lotD - 10)],
      color: i % 2 === 0 ? '#4d8a46' : '#457c3f',
    })

    sidewalks.push({
      id: `walk-${pack.block.id}`,
      position: [bx, 0.09, bz + pack.lotD / 2 - 1.5],
      size: [pack.lotW - 6, 0.12, 2.4],
      color: '#b9b3a6',
    })
    sidewalks.push({
      id: `curb-${pack.block.id}`,
      position: [bx, 0.13, bz + pack.lotD / 2 - 0.22],
      size: [pack.lotW - 6, 0.18, 0.28],
      color: '#9c968a',
    })

    pack.placed.forEach(({ item, x, z }, pi) => {
      buildings.push({
        ...item,
        position: [bx + x, 0, bz + z],
      })
      yards.push({
        id: `plot-${item.id}`,
        position: [bx + x, 0.045, bz + z],
        size: [item.bodySize[0] + 7, 0.06, item.bodySize[2] + 7],
        color: hash01(pi + i) > 0.5 ? '#4f8f47' : '#468540',
      })

      const treeSeed = i * 17 + pi
      trees.push({
        id: `tree-${pack.block.id}-${pi}-a`,
        position: [bx + x + item.bodySize[0] * 0.7 + 2.2, 0, bz + z + 4],
        scale: 0.85 + hash01(treeSeed) * 0.4,
      })
      trees.push({
        id: `tree-${pack.block.id}-${pi}-b`,
        position: [bx + x - item.bodySize[0] * 0.7 - 2.4, 0, bz + z - 3.5],
        scale: 0.75 + hash01(treeSeed + 3) * 0.45,
      })
    })
  })

  for (let c = 0; c < cols - 1; c++) {
    const x = ((colX[c] ?? 0) + (colX[c + 1] ?? 0)) / 2 - originX
    const depth = zCursor - ROAD
    const road: SceneBox = {
      id: `road-v-${c}`,
      position: [x, 0.06, 0],
      size: [ROAD - 1.2, 0.1, depth + 10],
      color: '#3a3e45',
    }
    roads.push(road)
    addLaneMarks(road, laneMarks)
    addLampsAlong(road, lamps, `lamp-v-${c}`)
    sidewalks.push({
      id: `walk-v-${c}-l`,
      position: [x - (ROAD / 2 - 0.9), 0.09, 0],
      size: [1.6, 0.12, depth + 10],
      color: '#b7b1a4',
    })
    sidewalks.push({
      id: `walk-v-${c}-r`,
      position: [x + (ROAD / 2 - 0.9), 0.09, 0],
      size: [1.6, 0.12, depth + 10],
      color: '#b7b1a4',
    })
  }
  for (let r = 0; r < rowDepths.length - 1; r++) {
    const z = ((rowZ[r] ?? 0) + (rowZ[r + 1] ?? 0)) / 2 - originZ
    const width = xCursor - ROAD
    const road: SceneBox = {
      id: `road-h-${r}`,
      position: [0, 0.06, z],
      size: [width + 10, 0.1, ROAD - 1.2],
      color: '#3a3e45',
    }
    roads.push(road)
    addLaneMarks(road, laneMarks)
    addLampsAlong(road, lamps, `lamp-h-${r}`)
  }

  const spanX = Math.max(40, xCursor + 16)
  const spanZ = Math.max(40, zCursor + 16)
  const frontRoad: SceneBox = {
    id: 'road-front',
    position: [0, 0.06, spanZ / 2 - 5.5],
    size: [spanX + 14, 0.1, 12],
    color: '#353940',
  }
  roads.push(frontRoad)
  addLaneMarks(frontRoad, laneMarks)
  addLampsAlong(frontRoad, lamps, 'lamp-front')
  sidewalks.push({
    id: 'walk-front',
    position: [0, 0.09, spanZ / 2 - 11.2],
    size: [spanX + 10, 0.12, 2.6],
    color: '#b9b3a6',
  })

  for (let i = 0; i < 8; i++) {
    crosswalks.push({
      id: `xw-${i}`,
      position: [-3.6 + i * 1.05, 0.115, spanZ / 2 - 1.4],
      size: [0.55, 0.04, 3.4],
      color: '#ece6d4',
    })
  }

  const groundSize = Math.max(spanX, spanZ) + 48
  const halfW = spanX / 2 + 6
  const halfD = spanZ / 2 + 6
  const wallH = 1.35
  const wallT = 0.38
  const gateW = 10
  const walls: SceneBox[] = [
    { id: 'wall-n', position: [0, wallH / 2, -halfD], size: [halfW * 2 + wallT, wallH, wallT], color: '#d8d0c4' },
    {
      id: 'wall-s-l',
      position: [-(halfW + gateW / 2) / 2, wallH / 2, halfD],
      size: [halfW - gateW / 2, wallH, wallT],
      color: '#d8d0c4',
    },
    {
      id: 'wall-s-r',
      position: [(halfW + gateW / 2) / 2, wallH / 2, halfD],
      size: [halfW - gateW / 2, wallH, wallT],
      color: '#d8d0c4',
    },
    { id: 'wall-e', position: [halfW, wallH / 2, 0], size: [wallT, wallH, halfD * 2], color: '#d2cabd' },
    { id: 'wall-w', position: [-halfW, wallH / 2, 0], size: [wallT, wallH, halfD * 2], color: '#d2cabd' },
  ]

  for (let i = 0; i < 18; i++) {
    const t = i / 18
    trees.push({
      id: `tree-perim-${i}`,
      position: [
        -halfW + 3 + t * (halfW * 2 - 6),
        0,
        -halfD + 3 + hash01(i + 9) * 4,
      ],
      scale: 0.9 + hash01(i + 21) * 0.5,
    })
  }

  const occupied = buildings.some((b) => Math.hypot(b.position[0], b.position[2]) < 14)
  const fountain = occupied ? null : { position: [0, 0, 0] as Vec3, radius: 4.2 }

  const camSpan = Math.max(groundSize * 0.42, 48)
  return {
    buildings,
    yards,
    roads,
    sidewalks,
    laneMarks,
    crosswalks,
    walls,
    trees,
    lamps,
    fountain,
    gate: { position: [0, 0, halfD], width: 10, name },
    groundSize,
    cameraPosition: [camSpan * 0.72, Math.max(32, camSpan * 0.38), camSpan * 0.9],
    cameraTarget: [0, 3.5, 0],
    sunPosition: [groundSize * 0.35, groundSize * 0.55, groundSize * 0.22],
  }
}
