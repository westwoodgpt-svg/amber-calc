// Категории сырья Калининградского янтарного комбината
export const CATEGORIES = [
  'сырец',
  'фракционный',
  'сортированный',
  'сортовой',
  'остаток сортировки',
  'raw',
] as const

export type Category = (typeof CATEGORIES)[number]

// Размерные фракции по ГОСТу / стандартам КЯК
export const FRACTIONS = [
  '+4 мм',
  '+8 мм',
  '+11.5 мм',
  '+14 мм',
  '+16 мм',
  '+23 мм',
  'без фракции',
  'несортированный',
] as const

export type Fraction = (typeof FRACTIONS)[number]

// Человекочитаемые наименования по умолчанию
export const CATEGORY_LABELS: Record<string, string> = {
  'сырец': 'Янтарь сырец',
  'фракционный': 'Янтарь фракционный',
  'сортированный': 'Янтарь сортированный',
  'сортовой': 'Янтарь сортовой',
  'остаток сортировки': 'Остаток сортировки',
  'raw': 'RAW',
}

// Категории, для которых применимы размерные фракции
export const CATEGORIES_WITH_FRACTION: Category[] = [
  'фракционный',
  'сортированный',
  'сортовой',
]

// Автогенерация наименования
export function autoName(category: string, fraction: string | null | undefined): string {
  const base = CATEGORY_LABELS[category] ?? category
  if (fraction && fraction !== 'без фракции' && fraction !== 'несортированный') {
    return `${base} ${fraction}`
  }
  return base
}

export const CATEGORY_COLORS: Record<string, string> = {
  'сырец': '#d97706',
  'фракционный': '#2563eb',
  'сортированный': '#059669',
  'сортовой': '#7c3aed',
  'остаток сортировки': '#dc2626',
  'raw': '#6b7280',
}
