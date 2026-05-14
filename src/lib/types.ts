export interface Container {
  id: string
  weight: number
  fraction: string
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface CalculationResult {
  selectedContainers: {
    id: string
    weight: number
    fraction: string
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
