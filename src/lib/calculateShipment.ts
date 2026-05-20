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
  /** Unrounded deltas keyed by itemId — used internally for precise balance propagation */
  rawDeltaByItemId: Record<string, number>
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
 * @param excludedIds   Items to skip entirely (their lot share is redistributed to the rest)
 */
export function computeCategory(
  targetKg: number,
  items: CalcItem[],
  balance: Record<string, number>,
  allowPartial = false,
  excludedIds: ReadonlySet<string> = new Set(),
): CategoryResult {
  const safeTarget = safeNumber(targetKg)
  // Excluded items are skipped; their lot weight is removed from totalLot so the
  // remaining items' shares automatically grow to fill 100%.
  const activeItems = excludedIds.size > 0 ? items.filter((i) => !excludedIds.has(i.id)) : items
  const totalLot = activeItems.reduce((s, i) => s + i.lotKg, 0)
  if (totalLot <= 0) {
    return { targetKg: safeTarget, items: [], totalCalcWeight: 0, totalActual: 0, totalDelta: 0, rawDeltaByItemId: {} }
  }

  const results: PlannedShipmentItem[] = []
  const rawDeltaByItemId: Record<string, number> = {}

  for (const item of activeItems) {
    if (item.lotKg <= 0) continue
    const packWeight = safeNumber(item.packWeight)
    if (packWeight <= 0) continue

    const share = item.lotKg / totalLot
    const calcWeight = safeTarget * share          // raw — not rounded
    const prevBalance = safeNumber(balance[item.id])
    const adjustedWeight = calcWeight - prevBalance  // raw

    let packs: number
    let rawFactWeight: number
    let isPartial = false

    if (adjustedWeight <= 0) {
      // Over-delivered in prior shipments — skip, carry balance forward
      packs = 0
      rawFactWeight = 0
    } else if (allowPartial) {
      // 5th shipment (zero-out): deliver exact adjusted weight
      packs = Math.ceil(adjustedWeight / packWeight)
      rawFactWeight = adjustedWeight
      isPartial = (adjustedWeight % packWeight) > 0.0001
    } else if (adjustedWeight < packWeight / 2) {
      // Less than half a pack — skip this shipment, accumulate balance for next time
      // delta will be 0 - calcWeight = negative, growing the "owed" amount each shipment
      // until it reaches packWeight/2 and triggers a box
      packs = 0
      rawFactWeight = 0
    } else {
      packs = Math.ceil(adjustedWeight / packWeight)
      rawFactWeight = packs * packWeight
    }

    // Raw delta used for precise balance propagation (no rounding accumulation)
    const rawDelta = rawFactWeight - calcWeight
    rawDeltaByItemId[item.id] = rawDelta

    results.push({
      itemId: item.id,
      name: item.name,
      article: item.article,
      type: item.type,
      packWeight,
      lotKg: item.lotKg,
      share: Number(share.toFixed(6)),
      calcWeight: round2(calcWeight),
      adjustedWeight: round2(adjustedWeight),
      packs,
      factWeight: round2(rawFactWeight),
      delta: round2(rawDelta),
      isPartial,
    })
  }

  const totalCalcWeight = round2(results.reduce((s, r) => s + r.calcWeight, 0))
  const totalActual = round2(results.reduce((s, r) => s + r.factWeight, 0))
  const totalDelta = round2(results.reduce((s, r) => s + r.delta, 0))

  return { targetKg: round2(safeTarget), items: results, totalCalcWeight, totalActual, totalDelta, rawDeltaByItemId }
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
  excludedIds: ReadonlySet<string> = new Set(),
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
      ? computeCategory(perShipVes, vesItems, runningBalance, isPartial, excludedIds)
      : null
    const sitoResult = annualSitoKg > 0
      ? computeCategory(perShipSito, sitoItems, runningBalance, isPartial, excludedIds)
      : null
    const lakResult = annualLakKg > 0
      ? computeCategory(perShipLak, lakItems, runningBalance, isPartial, excludedIds)
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

    // If this shipment is planned (not yet executed), carry its raw delta forward
    // for subsequent projections. Raw (unrounded) values prevent ~3 kg rounding
    // accumulation across 52 VES items × 5 shipments.
    // If it IS executed, the real balance is already in executedBalance.
    if (status === 'planned') {
      const allRawDeltas = {
        ...(vesResult?.rawDeltaByItemId ?? {}),
        ...(sitoResult?.rawDeltaByItemId ?? {}),
        ...(lakResult?.rawDeltaByItemId ?? {}),
      }
      for (const [itemId, rawDelta] of Object.entries(allRawDeltas)) {
        runningBalance[itemId] = (runningBalance[itemId] ?? 0) + rawDelta
      }
    }
  }

  return plans
}
