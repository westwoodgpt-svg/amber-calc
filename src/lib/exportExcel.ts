import * as XLSX from 'xlsx'
import type { CalculationResult, HistoryCalculation } from './types'
import { TYPE_EXPORT_LABELS } from './constants'

function round2(value: number): number {
  return Number(value.toFixed(2))
}

export function exportShipmentToExcel(result: CalculationResult, calculatedAt = new Date()) {
  const wb = XLSX.utils.book_new()

  const shipmentRows: (string | number)[][] = [
    [
      'Наименование',
      'Тип',
      'Доля (%)',
      'Расчётный вес (кг)',
      'Скорректированный вес (кг)',
      'Упаковка (кг)',
      'Кол-во упаковок',
      'Фактический вес (кг)',
      'Отклонение (кг)',
    ],
  ]

  for (const row of result.items) {
    shipmentRows.push([
      row.name,
      TYPE_EXPORT_LABELS[row.type],
      round2(row.share * 100),
      round2(row.calcWeight),
      round2(row.adjustedWeight),
      round2(row.packWeight),
      row.packs,
      round2(row.factWeight),
      round2(row.delta),
    ])
  }

  shipmentRows.push([
    'ИТОГО:',
    '',
    '',
    round2(result.totals.totalCalcWeight),
    '',
    '',
    '',
    round2(result.totals.totalActual),
    round2(result.totals.totalDelta),
  ])

  const wsShipment = XLSX.utils.aoa_to_sheet(shipmentRows)
  wsShipment['!cols'] = [
    { wch: 28 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsShipment, 'Отгрузка')

  const summaryRows: (string | number)[][] = [
    ['Показатель', 'Значение'],
    ['Общий запрошенный вес', round2(result.totals.totalRequested)],
    ['Фактический вес', round2(result.totals.totalActual)],
    ['Общее отклонение', round2(result.totals.totalDelta)],
    ['Дата расчёта', calculatedAt.toISOString()],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка')

  const date = calculatedAt.toISOString().slice(0, 19).replace(/[:T]/g, '-')
  XLSX.writeFile(wb, `shipment_${date}.xlsx`)
}

export function exportCalculationHistoryToExcel(calc: HistoryCalculation) {
  const result: CalculationResult = {
    items: calc.items.map((row) => ({
      itemId: row.itemId,
      name: row.item.name,
      type: row.item.type,
      share: calc.totalWeight > 0 ? row.calcWeight / calc.totalWeight : 0,
      packWeight: row.item.packWeight,
      calcWeight: row.calcWeight,
      adjustedWeight: row.adjustedWeight,
      packs: row.packs,
      factWeight: row.factWeight,
      delta: row.delta,
      newBalance: row.delta,
    })),
    totals: {
      totalRequested: calc.totalWeight,
      totalCalcWeight: calc.items.reduce((sum, row) => sum + row.calcWeight, 0),
      totalActual: calc.totalActual,
      totalDelta: calc.totalDelta,
    },
  }

  exportShipmentToExcel(result, new Date(calc.createdAt))
}

