import * as XLSX from 'xlsx'
import type { Calculation } from './types'
import { TYPE_LABELS } from './constants'

export function exportHistoryToExcel(calculations: Calculation[]) {
  const wb = XLSX.utils.book_new()

  const summaryRows: (string | number)[][] = [
    ['Название', 'Дата', 'Запрошено (кг)', 'Факт (кг)', 'Δ (кг)', 'Упаковок'],
  ]

  for (const calc of calculations) {
    const date = new Date(calc.createdAt).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const rows = Array.isArray((calc.result as { items?: unknown })?.items)
      ? (calc.result as { items: Array<{ packs: number }> }).items
      : []

    const packs = rows.reduce((sum, row) => sum + row.packs, 0)

    summaryRows.push([
      calc.name,
      date,
      Number(calc.targetWeight.toFixed(3)),
      Number(calc.totalWeight.toFixed(3)),
      Number(calc.overweight.toFixed(3)),
      packs,
    ])
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary['!cols'] = [
    { wch: 36 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
  ]

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка')

  const detailRows: (string | number)[][] = [
    ['Расчёт', 'Дата', 'Позиция', 'Тип', 'Доля', 'Теория (кг)', 'С учётом баланса (кг)', 'Упаковок', 'Факт (кг)', 'Δ (кг)', 'Новый баланс (кг)'],
  ]

  for (const calc of calculations) {
    const date = new Date(calc.createdAt).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const rows = Array.isArray((calc.result as { items?: unknown })?.items)
      ? (calc.result as { items: Array<{ name: string; type: 'fraction' | 'sieve'; share: number; calcWeight: number; adjustedWeight: number; packs: number; factWeight: number; delta: number; newBalance: number }> }).items
      : []

    for (const row of rows) {
      detailRows.push([
        calc.name,
        date,
        row.name,
        TYPE_LABELS[row.type],
        Number(row.share.toFixed(4)),
        Number(row.calcWeight.toFixed(3)),
        Number(row.adjustedWeight.toFixed(3)),
        row.packs,
        Number(row.factWeight.toFixed(3)),
        Number(row.delta.toFixed(3)),
        Number(row.newBalance.toFixed(3)),
      ])
    }
  }

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows)
  wsDetail['!cols'] = [
    { wch: 32 },
    { wch: 20 },
    { wch: 28 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
    { wch: 16 },
  ]

  XLSX.utils.book_append_sheet(wb, wsDetail, 'Детализация')

  const date = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\./g, '-')
  XLSX.writeFile(wb, `История_распределений_${date}.xlsx`)
}
