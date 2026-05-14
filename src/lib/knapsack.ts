export interface ContainerInput {
  id: string
  name: string
  category: string
  fraction: string | null
  weight: number
  quantity: number
}

export interface SelectedContainer {
  id: string
  name: string
  category: string
  fraction: string | null
  weight: number
  quantityUsed: number
}

export interface KnapsackResult {
  selectedContainers: SelectedContainer[]
  totalWeight: number
  targetWeight: number
  overweight: number
  feasible: boolean
}

// Bounded knapsack: find minimum total_weight >= target_weight
// using at most quantity[i] copies of each container.
// Priority: 1) total >= target, 2) minimize overweight, 3) minimize count.
export function solveKnapsack(
  containers: ContainerInput[],
  targetWeight: number
): KnapsackResult {
  if (containers.length === 0 || targetWeight <= 0) {
    return { selectedContainers: [], totalWeight: 0, targetWeight, overweight: 0, feasible: false }
  }

  // Expand bounded items into individual units
  type Item = { id: string; name: string; category: string; fraction: string | null; weight: number }
  const items: Item[] = []
  for (const c of containers) {
    for (let q = 0; q < c.quantity; q++) {
      items.push({ id: c.id, name: c.name, category: c.category, fraction: c.fraction, weight: c.weight })
    }
  }

  const n = items.length
  const maxWeight = Math.ceil(targetWeight * 3)

  // Scale to integers (×100, max 50 000 = 500 kg at 0.01 precision)
  const scale = 100
  const targetInt = Math.round(targetWeight * scale)
  const maxInt = Math.min(Math.round(maxWeight * scale), 50000)

  const INF = 1e9
  const dp = new Float64Array(maxInt + 1).fill(INF)
  dp[0] = 0
  const from = new Int32Array(maxInt + 1).fill(-1)

  for (let i = 0; i < n; i++) {
    const wInt = Math.round(items[i].weight * scale)
    if (wInt <= 0) continue
    for (let w = maxInt; w >= wInt; w--) {
      if (dp[w - wInt] + 1 < dp[w]) {
        dp[w] = dp[w - wInt] + 1
        from[w] = i
      }
    }
  }

  // Find minimum w >= targetInt with dp[w] < INF
  let bestW = -1
  for (let w = targetInt; w <= maxInt; w++) {
    if (dp[w] < INF) { bestW = w; break }
  }

  if (bestW === -1) {
    // Fallback: use all containers
    let total = 0
    const sel: SelectedContainer[] = []
    for (const c of containers) {
      total += c.weight * c.quantity
      sel.push({ id: c.id, name: c.name, category: c.category, fraction: c.fraction, weight: c.weight, quantityUsed: c.quantity })
    }
    return { selectedContainers: sel, totalWeight: total, targetWeight, overweight: total - targetWeight, feasible: false }
  }

  // Reconstruct
  const usedItems: Item[] = []
  let w = bestW
  while (w > 0 && from[w] !== -1) {
    const i = from[w]
    usedItems.push(items[i])
    w -= Math.round(items[i].weight * scale)
  }

  const countById: Record<string, number> = {}
  for (const item of usedItems) {
    countById[item.id] = (countById[item.id] || 0) + 1
  }

  const selectedContainers: SelectedContainer[] = Object.entries(countById).map(([id, qty]) => {
    const c = containers.find((c) => c.id === id)!
    return { id, name: c.name, category: c.category, fraction: c.fraction, weight: c.weight, quantityUsed: qty }
  })

  const totalWeight = bestW / scale
  return {
    selectedContainers,
    totalWeight,
    targetWeight,
    overweight: parseFloat((totalWeight - targetWeight).toFixed(4)),
    feasible: true,
  }
}
