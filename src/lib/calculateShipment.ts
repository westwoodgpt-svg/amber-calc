import type { ItemType } from '@prisma/client'
import type { PlannedShipmentItem } from './types'

export interface CalcItem {
  id: string
  name: string
  article: string
  type: ItemType
  packWeight: number
  lotKg: number
}

export interface CategoryResult {
  targetKg: number
  items: PlannedShipmentItem[]
  totalCalcWeight: number
  totalActual: number
  totalDelta: number
}

function round2(value: number): number {
  return Number(value.toFixed(2))
}

function safeNumber(value: unknown, fallback = 0): number {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : fallback
}

/**
 * Compute one category's shipment allocation.
 *
 * @param targetKg      Total kg to allocate for this category in this shipment
 * @param items         All items in this category
 * @param balance       Accumulated delta per itemId from prior shipments (same company)
 * @param allowPartial  If true, last unit may be partial (5th shipment zero-out mode)
 */
export function computeCategory(
  targetKg: number,
  items: CalcItem[],
  balance: Record<string, number>,
  allowPartial = false,
): CategoryResult {
  const safeTarget = safeNumber(targetKg)
  const totalLot = items.reduce((s, i) => s + i.lotKg, 0)
  if (totalLot <= 0) {
    return { targetKg: safeTarget, items: [], totalCalcWeight: 0, totalActual: 0, totalDelta: 0 }
  }

  const results: PlannedShipmentItem[] = []

  for (const item of items) {
    if (item.lotKg <= 0) continue
    const packWeight = safeNumber(item.packWeight)
    if (packWeight <= 0) continue

    const share = item.lotKg / totalLot
    const calcWeight = safeTarget * share
    const prevBalance = safeNumber(balance[item.id])
    const adjustedWeight = calcWeight - prevBalance

    let packs: number
    let factWeight: number
    let isPartial = false

    if (adjustedWeight <= 0) {
      packs = 0
      factWeight = 0
    } else if (allowPartial) {
      packs = Math.ceil(adjustedWeight / packWeight)
      factWeight = adjustedWeight
      isPartial = (adjustedWeight % packWeight) > 0.0001
    } else {
      packs = Math.ceil(adjustedWeight / packWeight)
      factWeight = packs * packWeight
    }

    const delta = round2(factWeight - calcWeight)

    results.push({
      itemId: item.id,
      name: item.name,
      article: item.article,
      type: item.type,
      packWeight,
      lotKg: item.lotKg,
      share: round2(share),
      calcWeight: round2(calcWeight),
      adjustedWeight: round2(adjustedWeight),
      packs,
      factWeight: round2(factWeight),
      delta,
      isPartial,
    })
  }

  const totalCalcWeight = round2(results.reduce((s, r) => s + r.calcWeight, 0))
  const totalActual = round2(results.reduce((s, r) => s + r.factWeight, 0))
  const totalDelta = round2(results.reduce((s, r) => s + r.delta, 0))

  return { targetKg: round2(safeTarget), items: results, totalCalcWeight, totalActual, totalDelta }
}

/**
 * Compute all 5 planned shipments for a company.
 * executedBalances: actual per-item delta sums from already-saved shipments in DB.
 * executedShipmentNumbers: which shipment numbers have already been executed.
 */
export function planAllShipments(
  vesItems: CalcItem[],
  sitoItems: CalcItem[],
  lakItems: CalcItem[],
  annualVesKg: number,
  annualSitoKg: number,
  annualLakKg: number,
  executedBalance: Record<string, number>,
  executedShipmentNumbers: Set<number>,
) {
  const perShipVes = annualVesKg / 5
  const perShipSito = annualSitoKg / 5
  const perShipLak = annualLakKg / 5

  const plans = []
  let runningBalance = { ...executedBalance }

  for (let n = 1; n <= 5; n++) {
    const isPartial = n === 5
    const status = executedShipmentNumbers.has(n) ? 'executed' : 'planned'

    // For planned shipments, compute from running balance (accumulated deltas)
    const vesResult = annualVesKg > 0
      ? computeCategory(perShipVes, vesItems, runningBalance, isPartial)
      : null
    const sitoResult = annualSitoKg > 0
      ? computeCategory(perShipSito, sitoItems, runningBalance, isPartial)
      : null
    const lakResult = annualLakKg > 0
      ? computeCategory(perShipLak, lakItems, runningBalance, isPartial)
      : null

    const allItems = [
      ...(vesResult?.items ?? []),
      ...(sitoResult?.items ?? []),
      ...(lakResult?.items ?? []),
    ]

    const totalTarget = round2(
      (vesResult?.targetKg ?? 0) + (sitoResult?.targetKg ?? 0) + (lakResult?.targetKg ?? 0),
    )
    const totalActual = round2(
      (vesResult?.totalActual ?? 0) + (sitoResult?.totalActual ?? 0) + (lakResult?.totalActual ?? 0),
    )
    const totalDelta = round2(
      (vesResult?.totalDelta ?? 0) + (sitoResult?.totalDelta ?? 0) + (lakResult?.totalDelta ?? 0),
    )

    plans.push({
      number: n,
      status: status as 'executed' | 'planned',
      allowPartialPack: isPartial,
      calculationId: undefined as string | undefined,
      createdAt: undefined as string | undefined,
      targetVesKg: vesResult?.targetKg ?? 0,
      targetSitoKg: sitoResult?.targetKg ?? 0,
      targetLakKg: lakResult?.targetKg ?? 0,
      totalTarget,
      totalActual,
      totalDelta,
      items: allItems,
    })

    // If this shipment is planned (not yet executed), carry its delta forward
    // for subsequent projections.
    // If it IS executed, the real balance is already in executedBalance.
    if (status === 'planned') {
      for (const item of allItems) {
        runningBalance[item.itemId] = (runningBalance[item.itemId] ?? 0) + item.delta
      }
    }
  }

  return plans
}
