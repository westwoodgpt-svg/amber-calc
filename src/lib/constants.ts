export const STONE_TYPES = ['fraction', 'sieve'] as const

export type StoneType = (typeof STONE_TYPES)[number]

export const TYPE_DEFAULT_PACK_WEIGHT: Record<StoneType, number> = {
  fraction: 10,
  sieve: 25,
}

export const TYPE_LABELS: Record<StoneType, string> = {
  fraction: 'Фракционный',
  sieve: 'Сито',
}

export const TYPE_DESCRIPTIONS: Record<StoneType, string> = {
  fraction: 'Коробки, по умолчанию 10 кг',
  sieve: 'Мешки, по умолчанию 25 кг',
}

export const TYPE_COLORS: Record<StoneType, string> = {
  fraction: '#2563eb',
  sieve: '#059669',
}

export function defaultName(type: StoneType): string {
  return type === 'fraction' ? 'Фракционный камень' : 'Сито'
}
