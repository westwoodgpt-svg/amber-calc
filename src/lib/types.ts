export interface Container {
  id: string
  name: string
  category: string
  fraction: string | null
  weight: number
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface CalculationResult {
  selectedContainers: {
    id: string
    name: string
    category: string
    fraction: string | null
    weight: number
    quantityUsed: number
  }[]
  totalWeight: number
  targetWeight: number
  overweight: number
  feasible: boolean
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
