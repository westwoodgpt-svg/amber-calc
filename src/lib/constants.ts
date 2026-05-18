import type { ItemType } from '@prisma/client'

export const ITEM_TYPES: ItemType[] = ['fraction', 'sieve']

export const TYPE_DEFAULT_PACK_WEIGHT: Record<ItemType, number> = {
  fraction: 10,
  sieve: 25,
}

export const TYPE_LABELS: Record<ItemType, string> = {
  fraction: 'Фракционный',
  sieve: 'Сито',
}

export const TYPE_EXPORT_LABELS: Record<ItemType, string> = {
  fraction: 'Фракция',
  sieve: 'Сито',
}

export const TYPE_DESCRIPTIONS: Record<ItemType, string> = {
  fraction: 'Коробки, по умолчанию 10 кг',
  sieve: 'Мешки, по умолчанию 25 кг',
}

export const TYPE_COLORS: Record<ItemType, string> = {
  fraction: '#2563eb',
  sieve: '#059669',
}

export function defaultName(type: ItemType): string {
  return type === 'fraction' ? 'Фракционный камень' : 'Сито'
}
