import * as XLSX from 'xlsx'
import type { PlannedShipment, HistoryCalculation } from './types'
import { TYPE_EXPORT_LABELS, sanitizeFilenamePart } from './constants'

function round2(value: number): number {
  return Number(value.toFixed(2))
}

export function exportShipmentToExcel(
  shipment: PlannedShipment,
  companyName: string,
  calculatedAt = new Date(),
) {
  const wb = XLSX.utils.book_new()

  const rows: (string | number)[][] = [
    ['Артикул', 'Наименование', 'Тип', 'Доля (%)', 'Расч. вес (кг)', 'Скорр. вес (кг)', 'Уп. (кг)', 'Кол-во', 'Факт (кг)', 'Δ (кг)'],
  ]

  for (const row of shipment.items) {
    rows.push([
      row.article,
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

  rows.push([
    '', 'ИТОГО', '', '',
    round2(shipment.items.reduce((s, r) => s + r.calcWeight, 0)),
    '',
    '',
    '',
    round2(shipment.totalActual),
    round2(shipment.totalDelta),
  ])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 14 }, { wch: 28 }, { wch: 8 }, { wch: 10 }, { wch: 14 },
    { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 10 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, `Отгрузка_${shipment.number}`)

  const summary: (string | number)[][] = [
    ['Показатель', 'Значение'],
    ['Компания', companyName || '—'],
    ['Номер отгрузки', shipment.number],
    ['Цель (ВЕС)', shipment.targetVesKg],
    ['Цель (СИТО)', shipment.targetSitoKg],
    ['Цель (ЛАК)', shipment.targetLakKg],
    ['Факт', round2(shipment.totalActual)],
    ['Δ', round2(shipment.totalDelta)],
    ['Дата расчёта', calculatedAt.toISOString()],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary['!cols'] = [{ wch: 24 }, { wch: 24 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка')

  const date = calculatedAt.toISOString().slice(0, 10)
  const safeCompany = sanitizeFilenamePart(companyName || 'company')
  XLSX.writeFile(wb, `Отгрузка_${shipment.number}_${safeCompany}_${date}.xlsx`)
}

export function exportCalculationHistoryToExcel(calc: HistoryCalculation) {
  // Build a PlannedShipment-like object for export
  const items = calc.items.map((row) => ({
    itemId: row.itemId,
    name: row.item.name,
    article: row.item.article,
    type: row.item.type,
    packWeight: row.item.packWeight,
    lotKg: row.item.lotKg,
    share: calc.totalWeight > 0 ? row.calcWeight / calc.totalWeight : 0,
    calcWeight: row.calcWeight,
    adjustedWeight: row.adjustedWeight,
    packs: row.packs,
    factWeight: row.factWeight,
    delta: row.delta,
    isPartial: calc.allowPartialPack,
  }))

  const shipment: PlannedShipment = {
    number: calc.shipmentNumber,
    status: 'executed',
    allowPartialPack: calc.allowPartialPack,
    calculationId: calc.id,
    createdAt: calc.createdAt,
    targetVesKg: 0,
    targetSitoKg: 0,
    targetLakKg: 0,
    totalTarget: calc.totalWeight,
    totalActual: calc.totalActual,
    totalDelta: calc.totalDelta,
    items,
  }

  exportShipmentToExcel(shipment, calc.companyName, new Date(calc.createdAt))
}
