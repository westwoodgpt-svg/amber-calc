import type { ItemType } from '@prisma/client'

export const ITEM_TYPES: ItemType[] = ['VES', 'SITO', 'LAK']

export const TYPE_DEFAULT_PACK_WEIGHT: Record<ItemType, number> = {
  VES: 10,
  SITO: 25,
  LAK: 10,
}

export const TYPE_LABELS: Record<ItemType, string> = {
  VES: 'Вес',
  SITO: 'Сито',
  LAK: 'Лак',
}

export const TYPE_EXPORT_LABELS: Record<ItemType, string> = {
  VES: 'Вес',
  SITO: 'Сито',
  LAK: 'Лак',
}

export const TYPE_DESCRIPTIONS: Record<ItemType, string> = {
  VES: 'Фракционный весовой, коробки ~10 кг',
  SITO: 'Сито (несортированный), мешки ~25 кг',
  LAK: 'Чёрный лак, коробки ~10 кг',
}

export const TYPE_COLORS: Record<ItemType, string> = {
  VES: '#2563eb',
  SITO: '#059669',
  LAK: '#7c3aed',
}

export function sanitizeFilenamePart(input: string): string {
  const clean = input
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9а-яА-Я_-]/g, '')
  return clean || 'company'
}
