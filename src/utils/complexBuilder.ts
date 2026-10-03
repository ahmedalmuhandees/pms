/** Arabic / Latin labels for auto-naming complex structure */

import { UnitUi, type UnitType } from '@/types'

const ARABIC_LETTERS = [
  'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر',
  'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
  'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي',
]

const LATIN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function blockArabicName(index: number): string {
  const letter = ARABIC_LETTERS[index] ?? String(index + 1)
  return `بلوك ${letter}`
}

export function blockLatinCode(index: number): string {
  if (index < 26) return LATIN_LETTERS[index]!
  return `B${index + 1}`
}

export function buildingName(index: number, layout: BuilderLayout = 'vertical'): string {
  return layout === 'horizontal' ? `فيلا ${index + 1}` : `مبنى ${index + 1}`
}

export const MAX_UNITS_PER_FLOOR = 24
export const MAX_UNITS_PER_SLOT = 8

/** Villa number like A1 (block + villa sequence, no floor) */
export function horizontalUnitNumber(blockIndex: number, villaSequence: number): string {
  return `${blockLatinCode(blockIndex)}${villaSequence + 1}`
}

/** Unit number like A1-1-4 (block + building + floor + sequence 1–n) */
export function unitNumber(
  blockIndex: number,
  buildingIndex: number,
  floorNumber: number,
  sequenceNumber: number,
): string {
  const block = blockLatinCode(blockIndex)
  const building = buildingIndex + 1
  return `${block}${building}-${floorNumber}-${sequenceNumber}`
}

export type SequenceDirection = 'clockwise' | 'counterclockwise' | 'manual'
export type BuilderLayout = 'vertical' | 'horizontal'
export type UnitCountByUi = Record<UnitUi, number>

export interface StructureConfig {
  layoutMode: BuilderLayout
  blocksCount: number
  buildingsPerBlock: number
  floorsPerBuilding: number
  unitsPerFloor: number
  startFloor: number
  /** Continue naming after existing blocks (e.g. 2 → start at ج / C) */
  blockIndexOffset: number
  unitType: UnitType
  area: number
  bedrooms: number
  bathrooms: number
  parkingCount: number
  price: number
  cost: number
  countByUi: UnitCountByUi
  areaByUi: Record<UnitUi, number>
  /** Per-unit areas for horizontal villas or vertical floor units */
  rowAreas: number[]
  horizontalPickedIndices: number[]
  /** Manual pick order for individual floor units (vertical) */
  verticalPickedIndices: number[]
  /** Physical slot that receives sequence number 1 */
  sequenceStartUi: UnitUi
  sequenceDirection: SequenceDirection
  /** Explicit numbering order when sequenceDirection is manual */
  sequenceOrder: UnitUi[]
}

export interface FloorUnitCell {
  index: number
  unitUi: UnitUi
  side: 'front' | 'back'
  label: string
}

export interface PreviewUnit {
  unitNumber: string
  floorNumber: number
  unitUi: UnitUi
  sequenceNumber: number
  area: number
}

export const FLOOR_FRONT_ROW: UnitUi[] = [
  UnitUi.CornerFrontRight,
  UnitUi.MiddleFront,
  UnitUi.CornerFrontLeft,
]

export const FLOOR_BACK_ROW: UnitUi[] = [
  UnitUi.CornerBackRight,
  UnitUi.MiddleBack,
  UnitUi.CornerBackLeft,
]

/** Clockwise ring around the floor (front at top) */
export const FLOOR_CLOCKWISE_RING: UnitUi[] = [
  UnitUi.CornerFrontLeft,
  UnitUi.MiddleFront,
  UnitUi.CornerFrontRight,
  UnitUi.CornerBackRight,
  UnitUi.MiddleBack,
  UnitUi.CornerBackLeft,
]

export const SEQUENCE_DIRECTION_OPTIONS = [
  { value: 'clockwise' as const, label: 'مع عقارب الساعة' },
  { value: 'counterclockwise' as const, label: 'عكس عقارب الساعة' },
  { value: 'manual' as const, label: 'يدوي' },
]

export const HORIZONTAL_SEQUENCE_DIRECTION_OPTIONS = [
  { value: 'clockwise' as const, label: 'من اليمين إلى اليسار' },
  { value: 'counterclockwise' as const, label: 'من اليسار إلى اليمين' },
  { value: 'manual' as const, label: 'يدوي' },
]

/** صف أفقي: يمين ثم الوسط ثم يسار */
export function horizontalStreetSlots(count: number): UnitUi[] {
  const n = Math.max(1, Math.min(40, count))
  if (n === 1) return [UnitUi.MiddleFront]
  if (n === 2) return [UnitUi.CornerFrontRight, UnitUi.CornerFrontLeft]
  return [
    UnitUi.CornerFrontRight,
    ...Array.from({ length: n - 2 }, () => UnitUi.MiddleFront),
    UnitUi.CornerFrontLeft,
  ]
}

export function resolveHorizontalIndexOrder(
  count: number,
  direction: SequenceDirection = 'clockwise',
  pickedIndices: number[] = [],
): number[] {
  const n = Math.max(1, count)
  const base = Array.from({ length: n }, (_, i) => i)
  if (direction === 'manual') {
    const picked = pickedIndices.filter((i) => i >= 0 && i < n)
    const rest = base.filter((i) => !picked.includes(i))
    return [...picked, ...rest]
  }
  if (direction === 'counterclockwise') return [...base].reverse()
  return base
}

export function emptyCountByUi(): UnitCountByUi {
  return {
    [UnitUi.MiddleFront]: 0,
    [UnitUi.MiddleBack]: 0,
    [UnitUi.CornerFrontRight]: 0,
    [UnitUi.CornerFrontLeft]: 0,
    [UnitUi.CornerBackRight]: 0,
    [UnitUi.CornerBackLeft]: 0,
  }
}

export function countsFromSlots(slots: UnitUi[]): UnitCountByUi {
  const counts = emptyCountByUi()
  for (const ui of slots) counts[ui] += 1
  return counts
}

export function totalUnitsFromCounts(countByUi: UnitCountByUi): number {
  return (Object.values(countByUi) as number[]).reduce((sum, n) => sum + (n || 0), 0)
}

export function syncedManualOrder(order: UnitUi[], countByUi: UnitCountByUi): UnitUi[] {
  const remaining = emptyCountByUi()
  for (const ui of Object.values(UnitUi) as UnitUi[]) {
    remaining[ui] = Math.max(0, countByUi[ui] || 0)
  }
  const next: UnitUi[] = []
  for (const ui of order) {
    if ((remaining[ui] || 0) > 0) {
      next.push(ui)
      remaining[ui] -= 1
    }
  }
  for (const ui of FLOOR_CLOCKWISE_RING) {
    while ((remaining[ui] || 0) > 0) {
      next.push(ui)
      remaining[ui] -= 1
    }
  }
  return next
}

export function orderedFloorSlots(
  countByUi: UnitCountByUi,
  startUi: UnitUi,
  direction: SequenceDirection = 'clockwise',
  manualOrder: UnitUi[] = [],
): UnitUi[] {
  if (direction === 'manual') {
    return syncedManualOrder(manualOrder, countByUi)
  }
  const ring =
    direction === 'clockwise'
      ? [...FLOOR_CLOCKWISE_RING]
      : [...FLOOR_CLOCKWISE_RING].slice().reverse()
  const startIndex = ring.indexOf(startUi)
  const rotated =
    startIndex >= 0 ? [...ring.slice(startIndex), ...ring.slice(0, startIndex)] : ring
  const slots: UnitUi[] = []
  for (const ui of rotated) {
    const n = Math.max(0, countByUi[ui] || 0)
    for (let i = 0; i < n; i++) slots.push(ui)
  }
  return slots
}

export function sequenceNumbersForUi(
  ui: UnitUi,
  countByUi: UnitCountByUi,
  startUi: UnitUi,
  direction: SequenceDirection = 'clockwise',
  manualOrder: UnitUi[] = [],
): number[] {
  return orderedFloorSlots(countByUi, startUi, direction, manualOrder).reduce<number[]>(
    (acc, slot, index) => {
      if (slot === ui) acc.push(index + 1)
      return acc
    },
    [],
  )
}

export function defaultAreaByUi(area: number): Record<UnitUi, number> {
  return {
    [UnitUi.MiddleFront]: area,
    [UnitUi.MiddleBack]: area,
    [UnitUi.CornerFrontRight]: area,
    [UnitUi.CornerFrontLeft]: area,
    [UnitUi.CornerBackRight]: area,
    [UnitUi.CornerBackLeft]: area,
  }
}

export function isFrontUnitUi(unitUi: UnitUi): boolean {
  return (
    unitUi === UnitUi.MiddleFront ||
    unitUi === UnitUi.CornerFrontRight ||
    unitUi === UnitUi.CornerFrontLeft
  )
}

/**
 * صف وحدات فردية (يمين → يسار): زاوية يمين، وسطيات، زاوية يسار.
 * كل وحدة خانة مستقلة وليست عدّاداً مكرراً على نفس الموضع.
 */
export function rowUnitSlots(
  count: number,
  side: 'front' | 'back',
): UnitUi[] {
  const n = Math.max(0, count)
  if (n === 0) return []
  if (side === 'front') {
    if (n === 1) return [UnitUi.MiddleFront]
    if (n === 2) return [UnitUi.CornerFrontRight, UnitUi.CornerFrontLeft]
    return [
      UnitUi.CornerFrontRight,
      ...Array.from({ length: n - 2 }, () => UnitUi.MiddleFront),
      UnitUi.CornerFrontLeft,
    ]
  }
  if (n === 1) return [UnitUi.MiddleBack]
  if (n === 2) return [UnitUi.CornerBackRight, UnitUi.CornerBackLeft]
  return [
    UnitUi.CornerBackRight,
    ...Array.from({ length: n - 2 }, () => UnitUi.MiddleBack),
    UnitUi.CornerBackLeft,
  ]
}

/**
 * يقسم وحدات الطابق إلى واجهة أمامية وخلفية بالتساوي تقريباً.
 * مثال: 8 وحدات → 4 أمام + 4 خلف (كل خانة وحدة واحدة).
 */
export function verticalFloorCells(unitsPerFloor: number): FloorUnitCell[] {
  const n = Math.max(1, Math.min(MAX_UNITS_PER_FLOOR, unitsPerFloor))
  const frontCount = Math.ceil(n / 2)
  const backCount = n - frontCount
  const front = rowUnitSlots(frontCount, 'front')
  const back = rowUnitSlots(backCount, 'back')
  const cells: FloorUnitCell[] = []
  front.forEach((unitUi, i) => {
    cells.push({
      index: i,
      unitUi,
      side: 'front',
      label: frontCount === 1 ? 'وسط أمامي' : i === 0 ? 'يمين أمامي' : i === frontCount - 1 ? 'يسار أمامي' : `وسط أمامي ${i}`,
    })
  })
  back.forEach((unitUi, i) => {
    const index = frontCount + i
    cells.push({
      index,
      unitUi,
      side: 'back',
      label: backCount === 1 ? 'وسط خلفي' : i === 0 ? 'يمين خلفي' : i === backCount - 1 ? 'يسار خلفي' : `وسط خلفي ${i}`,
    })
  })
  return cells
}

/** ترتيب ترقيم الوحدات الفردية في الطابق */
export function resolveVerticalIndexOrder(
  count: number,
  direction: SequenceDirection = 'clockwise',
  pickedIndices: number[] = [],
): number[] {
  const n = Math.max(1, Math.min(MAX_UNITS_PER_FLOOR, count))
  const frontCount = Math.ceil(n / 2)
  const base = Array.from({ length: n }, (_, i) => i)
  if (direction === 'manual') {
    const picked = pickedIndices.filter((i) => i >= 0 && i < n)
    const rest = base.filter((i) => !picked.includes(i))
    return [...picked, ...rest]
  }
  // أمام: يمين→يسار ثم خلف: يسار→يمين (لفّ حول الطابق)
  const clockwise = [
    ...Array.from({ length: frontCount }, (_, i) => i),
    ...Array.from({ length: n - frontCount }, (_, i) => n - 1 - i),
  ]
  if (direction === 'counterclockwise') return [...clockwise].reverse()
  return clockwise
}

/**
 * مواضع الطابق كقائمة UnitUi فردية (للتوافق مع countByUi).
 */
export function floorUnitSlots(unitsPerFloor: number): UnitUi[] {
  return verticalFloorCells(unitsPerFloor).map((cell) => cell.unitUi)
}

export function unitUiForIndex(unitIndex: number, unitsPerFloor: number): UnitUi {
  const slots = floorUnitSlots(unitsPerFloor)
  return slots[unitIndex] ?? UnitUi.MiddleFront
}

export interface PreviewFloor {
  floorNumber: number
  units: PreviewUnit[]
}

export interface PreviewBuilding {
  name: string
  floors: PreviewFloor[]
}

export interface PreviewBlock {
  name: string
  code: string
  buildings: PreviewBuilding[]
}

export interface StructurePreview {
  blocks: PreviewBlock[]
  totals: {
    blocks: number
    buildings: number
    floors: number
    units: number
  }
}

export function buildStructurePreview(config: StructureConfig): StructurePreview {
  const blocks: PreviewBlock[] = []
  let buildings = 0
  let floors = 0
  let units = 0
  const offset = config.blockIndexOffset || 0
  const layout = config.layoutMode ?? 'vertical'

  for (let b = 0; b < config.blocksCount; b++) {
    const blockIndex = offset + b
    const blockBuildings: PreviewBuilding[] = []
    if (layout === 'horizontal') {
      const villaCount = Math.max(1, config.buildingsPerBlock)
      const street = horizontalStreetSlots(villaCount)
      const order = resolveHorizontalIndexOrder(
        villaCount,
        config.sequenceDirection ?? 'clockwise',
        config.horizontalPickedIndices ?? [],
      )
      for (let s = 0; s < order.length; s++) {
        const visualIndex = order[s]!
        const unitUi = street[visualIndex] ?? UnitUi.MiddleFront
        const sequenceNumber = s + 1
        const unit: PreviewUnit = {
          unitNumber: horizontalUnitNumber(blockIndex, s),
          floorNumber: 1,
          unitUi,
          sequenceNumber,
          area: config.rowAreas?.[visualIndex] ?? config.area,
        }
        blockBuildings.push({
          name: buildingName(s, 'horizontal'),
          floors: [{ floorNumber: 1, units: [unit] }],
        })
        buildings++
        floors++
        units++
      }
    } else {
      for (let g = 0; g < config.buildingsPerBlock; g++) {
        const buildingFloors: PreviewFloor[] = []
        const cells = verticalFloorCells(config.unitsPerFloor)
        const order = resolveVerticalIndexOrder(
          cells.length,
          config.sequenceDirection ?? 'clockwise',
          config.verticalPickedIndices ?? [],
        )
        for (let f = 0; f < config.floorsPerBuilding; f++) {
          const floorNumber = config.startFloor + f
          const floorUnits: PreviewUnit[] = []
          for (let s = 0; s < order.length; s++) {
            const visualIndex = order[s]!
            const cell = cells[visualIndex]!
            const sequenceNumber = s + 1
            floorUnits.push({
              unitNumber: unitNumber(blockIndex, g, floorNumber, sequenceNumber),
              floorNumber,
              unitUi: cell.unitUi,
              sequenceNumber,
              area: config.rowAreas?.[visualIndex] ?? config.area,
            })
            units++
          }
          buildingFloors.push({ floorNumber, units: floorUnits })
          floors++
        }
        blockBuildings.push({ name: buildingName(g, layout), floors: buildingFloors })
        buildings++
      }
    }
    blocks.push({
      name: blockArabicName(blockIndex),
      code: blockLatinCode(blockIndex),
      buildings: blockBuildings,
    })
  }

  return {
    blocks,
    totals: {
      blocks: config.blocksCount,
      buildings,
      floors,
      units,
    },
  }
}
