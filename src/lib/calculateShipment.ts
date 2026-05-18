import type { ItemType } from '@prisma/client'
import type { CalculationResult, DistributionItemShare, ShipmentItemResult } from './types'

interface CalcItem {
  id: string
  name: string
  type: ItemType
  packWeight: number
}

function round2(value: number): number {
  return Number(value.toFixed(2))
}

function safeNumber(value: unknown, fallback = 0): number {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : fallback
}

export function calculateShipment(
  totalWeight: number,
  items: CalcItem[],
  distribution: DistributionItemShare[],
  balance: Record<string, number>,
): CalculationResult {
  const safeTotalWeight = safeNumber(totalWeight)
  if (safeTotalWeight <= 0) {
    throw new Error('Общий вес должен быть положительным числом')
  }

  const itemById = new Map(items.map((item) => [item.id, item]))
  const results: ShipmentItemResult[] = []

  for (const dist of distribution) {
    const item = itemById.get(dist.itemId)
    if (!item) continue

    const share = safeNumber(dist.share)
    const packWeight = safeNumber(item.packWeight)
    if (share < 0) {
      throw new Error(`Доля позиции "${item.name}" не может быть отрицательной`)
    }
    if (packWeight <= 0) {
      throw new Error(`Вес упаковки позиции "${item.name}" должен быть больше 0`)
    }

    const calcWeight = safeTotalWeight * share
    const prevBalance = safeNumber(balance[item.id])
    const adjustedWeight = calcWeight - prevBalance

    const packs = adjustedWeight <= 0 ? 0 : Math.ceil(adjustedWeight / packWeight)
    const factWeight = packs * packWeight
    const delta = factWeight - calcWeight
    const newBalance = delta

    results.push({
      itemId: item.id,
      name: item.name,
      type: item.type,
      share,
      packWeight,
      calcWeight: round2(calcWeight),
      adjustedWeight: round2(adjustedWeight),
      packs,
      factWeight: round2(factWeight),
      delta: round2(delta),
      newBalance: round2(newBalance),
    })
  }

  const totalCalcWeight = results.reduce((sum, row) => sum + row.calcWeight, 0)
  const totalActual = results.reduce((sum, row) => sum + row.factWeight, 0)
  const totalDelta = results.reduce((sum, row) => sum + row.delta, 0)

  return {
    items: results,
    totals: {
      totalRequested: round2(safeTotalWeight),
      totalCalcWeight: round2(totalCalcWeight),
      totalActual: round2(totalActual),
      totalDelta: round2(totalDelta),
    },
  }
}

export function validateDistribution(distribution: DistributionItemShare[], tolerance = 0.0001): { valid: boolean; sum: number } {
  const sum = distribution.reduce((acc, row) => acc + safeNumber(row.share), 0)
  return { valid: Math.abs(sum - 1) <= tolerance, sum: round2(sum) }
}
