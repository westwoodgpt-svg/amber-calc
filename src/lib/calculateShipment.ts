import type { Item, CalculationResult, ShipmentItemResult } from './types'

interface CalculateInput {
  totalWeight: number
  items: Item[]
  balance?: Record<string, number>
}

function round3(value: number): number {
  return Number(value.toFixed(3))
}

function safeNumber(value: unknown, fallback = 0): number {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : fallback
}

export function calculateShipment({ totalWeight, items, balance = {} }: CalculateInput): CalculationResult {
  const safeTotalWeight = safeNumber(totalWeight)
  if (safeTotalWeight <= 0) {
    throw new Error('Общий вес должен быть положительным числом')
  }

  const results: ShipmentItemResult[] = []

  for (const item of items) {
    const share = safeNumber(item.share)
    const packWeight = safeNumber(item.packWeight)
    if (share < 0) {
      throw new Error(`Доля позиции "${item.name}" не может быть отрицательной`)
    }
    if (packWeight <= 0) {
      throw new Error(`Вес упаковки позиции "${item.name}" должен быть больше 0`)
    }

    const calcWeight = safeTotalWeight * share
    const prevBalance = safeNumber(balance[item.id], safeNumber(item.balance))
    const adjustedWeight = calcWeight - prevBalance

    const packs = adjustedWeight <= 0 ? 0 : Math.ceil(adjustedWeight / packWeight)
    const factWeight = packs * packWeight
    const delta = factWeight - calcWeight
    const newBalance = delta

    results.push({
      id: item.id,
      name: item.name,
      type: item.type,
      share,
      packWeight,
      prevBalance: round3(prevBalance),
      calcWeight: round3(calcWeight),
      adjustedWeight: round3(adjustedWeight),
      packs,
      factWeight: round3(factWeight),
      delta: round3(delta),
      newBalance: round3(newBalance),
    })
  }

  const totalActual = results.reduce((sum, row) => sum + row.factWeight, 0)
  const totalDelta = results.reduce((sum, row) => sum + row.delta, 0)

  return {
    items: results,
    totals: {
      totalRequested: round3(safeTotalWeight),
      totalActual: round3(totalActual),
      totalDelta: round3(totalDelta),
    },
  }
}

export function validateShares(items: Pick<Item, 'name' | 'share'>[], tolerance = 0.001): { valid: boolean; sum: number } {
  const sum = items.reduce((acc, item) => acc + safeNumber(item.share), 0)
  return { valid: Math.abs(sum - 1) <= tolerance, sum: round3(sum) }
}
