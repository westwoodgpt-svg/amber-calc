import type { CalculationStatus, ItemType } from '@prisma/client'

export interface Item {
  id: string
  name: string
  type: ItemType
  packWeight: number
  weightConfirmed: boolean
  createdAt: string
  updatedAt: string
}

export interface DistributionItemShare {
  itemId: string
  share: number
}

export interface DistributionItemView {
  id: string
  configId: string
  itemId: string
  share: number
  item: Item
}

export interface DistributionConfigView {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  items: DistributionItemView[]
}

export interface ShipmentItemResult {
  itemId: string
  name: string
  type: ItemType
  share: number
  packWeight: number
  calcWeight: number
  adjustedWeight: number
  packs: number
  factWeight: number
  delta: number
  newBalance: number
}

export interface CalculationResult {
  items: ShipmentItemResult[]
  totals: {
    totalRequested: number
    totalCalcWeight: number
    totalActual: number
    totalDelta: number
  }
}

export interface CalculationWarning {
  code: 'MISSING_DISTRIBUTION' | 'UNCONFIRMED_WEIGHT' | 'INVALID_PACK_WEIGHT' | 'EXCLUDED_ITEM'
  itemId: string
  message: string
}

export interface CalculateResponse extends CalculationResult {
  calculationId: string
  createdAt: string
  warnings: CalculationWarning[]
}

export interface HistoryCalculation {
  id: string
  status: CalculationStatus
  totalWeight: number
  totalActual: number
  totalDelta: number
  deletedAt: string | null
  createdAt: string
  items: Array<{
    id: string
    calculationId: string
    itemId: string
    calcWeight: number
    adjustedWeight: number
    packs: number
    factWeight: number
    delta: number
    item: Item
  }>
}

export interface ApiError {
  error: string
}
