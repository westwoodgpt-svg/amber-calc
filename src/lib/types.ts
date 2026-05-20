import type { CalculationStatus, ItemType } from '@prisma/client'

export interface Item {
  id: string
  name: string
  article: string
  type: ItemType
  packWeight: number
  lotKg: number
  weightConfirmed: boolean
  createdAt: string
  updatedAt: string
}

export interface CompanyOrder {
  id: string
  year: number
  companyName: string
  vesKg: number
  sitoKg: number
  lakKg: number
  createdAt: string
  updatedAt: string
}

// ── Calculation result (single shipment) ─────────────────────────────────────

export interface ShipmentItemResult {
  itemId: string
  name: string
  article: string
  type: ItemType
  share: number
  packWeight: number
  lotKg: number
  calcWeight: number
  adjustedWeight: number
  packs: number
  factWeight: number
  delta: number
  newBalance: number
  isPartial?: boolean
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

export interface CalculateResponse {
  calculationId: string
  createdAt: string
  companyName: string
  shipmentNumber: number
  priorOrderCount: number
  warnings: CalculationWarning[]
  items: ShipmentItemResult[]
  totals: {
    totalRequested: number
    totalCalcWeight: number
    totalActual: number
    totalDelta: number
  }
}

// ── 5-shipment plan ───────────────────────────────────────────────────────────

export interface PlannedShipmentItem {
  itemId: string
  name: string
  article: string
  type: ItemType
  packWeight: number
  lotKg: number
  share: number
  calcWeight: number
  adjustedWeight: number
  packs: number
  factWeight: number
  delta: number
  isPartial: boolean
}

export interface PlannedShipment {
  number: number
  status: 'executed' | 'planned'
  allowPartialPack: boolean
  calculationId?: string
  createdAt?: string
  targetVesKg: number
  targetSitoKg: number
  targetLakKg: number
  totalTarget: number
  totalActual: number
  totalDelta: number
  items: PlannedShipmentItem[]
}

export interface ShipmentPlanResponse {
  order: CompanyOrder
  executedCount: number
  shipments: PlannedShipment[]
}

// ── History ───────────────────────────────────────────────────────────────────

export interface HistoryCalculation {
  id: string
  status: CalculationStatus
  companyName: string
  totalWeight: number
  totalActual: number
  totalDelta: number
  allowPartialPack: boolean
  shipmentNumber: number
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
