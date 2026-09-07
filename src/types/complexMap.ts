import type { Block, Building, Floor, Unit } from '@/types'

export interface MapFloor {
  floor: Floor
  units: Unit[]
}

export interface MapBuilding {
  building: Building
  floors: MapFloor[]
}

export interface MapBlock {
  block: Block
  buildings: MapBuilding[]
}

export type ComplexMapLayoutMode = 'horizontal' | 'vertical' | 'horizontal-vertical'
