import type { StoneType } from './constants'

export interface Item {
  id: string
  name: string
  type: StoneType
  share: number
  packWeight: number
  weightConfirmed: boolean
  balance: number
  createdAt: string
  updatedAt: string
}

export interface ShipmentItemResult {
  id: string
  name: string
  type: StoneType
  share: number
  packWeight: number
  prevBalance: number
  calcWeight: number
  adjustedWeight: number
  packs: number
  factWeight: number
  delta: number
  newBalance: number
}

export interface ShipmentTotals {
  totalRequested: number
  totalActual: number
  totalDelta: number
}

export interface CalculationResult {
  items: ShipmentItemResult[]
  totals: ShipmentTotals
}

export interface Calculation {
  id: string
  name: string
  targetWeight: number
  category: string | null
  fraction: string | null
  allowMixing: boolean
  result: CalculationResult
  totalWeight: number
  overweight: number
  createdAt: string
}

export interface ApiError {
  error: string
}
