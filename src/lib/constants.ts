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

export const baseShareMap: Record<string, number> = {
  'Фракция 5-10': 0.12,
  'Фракция 10-20': 0.18,
  'Фракция 20-40': 0.16,
  'Фракция 40-60': 0.14,
  'Фракция 60-80': 0.1,
  'Сито 1': 0.1,
  'Сито 2': 0.1,
  'Сито 3': 0.1,
}

export function defaultName(type: ItemType): string {
  return type === 'fraction' ? 'Фракционный камень' : 'Сито'
}

export function sanitizeFilenamePart(input: string): string {
  const clean = input
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9а-яА-Я_-]/g, '')
  return clean || 'company'
}
