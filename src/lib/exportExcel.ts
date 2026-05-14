import * as XLSX from 'xlsx'
import type { Calculation } from './types'

export function exportHistoryToExcel(calculations: Calculation[]) {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Summary ────────────────────────────────────────────────────────
  const summaryRows: (string | number)[][] = [
    ['Название', 'Дата', 'Целевой вес (кг)', 'Итого (кг)', 'Перевес (кг)', 'Вид сырья', 'Фракция', 'Смешивание', 'Контейнеров'],
  ]

  for (const calc of calculations) {
    const date = new Date(calc.createdAt).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    summaryRows.push([
      calc.name,
      date,
      Number(calc.targetWeight.toFixed(3)),
      Number(calc.totalWeight.toFixed(3)),
      Number(calc.overweight.toFixed(3)),
      calc.category ?? '—',
      calc.fraction ?? '—',
      calc.allowMixing ? 'да' : 'нет',
      calc.result.selectedContainers.reduce((s, c) => s + c.quantityUsed, 0),
    ])
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)

  // Column widths for summary
  wsSummary['!cols'] = [
    { wch: 30 }, // Название
    { wch: 18 }, // Дата
    { wch: 18 }, // Целевой вес
    { wch: 12 }, // Итого
    { wch: 14 }, // Перевес
    { wch: 22 }, // Вид
    { wch: 14 }, // Фракция
    { wch: 14 }, // Смешивание
    { wch: 14 }, // Контейнеров
  ]

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка')

  // ── Sheet 2: Detail (one row per container per calculation) ─────────────────
  const detailRows: (string | number)[][] = [
    ['Расчёт', 'Дата', 'Наименование', 'Вид сырья', 'Фракция', 'Вес контейнера (кг)', 'Количество', 'Сумма (кг)'],
  ]

  for (const calc of calculations) {
    const date = new Date(calc.createdAt).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    for (const c of calc.result.selectedContainers) {
      detailRows.push([
        calc.name,
        date,
        c.name,
        c.category,
        c.fraction ?? '—',
        Number(c.weight.toFixed(3)),
        c.quantityUsed,
        Number((c.weight * c.quantityUsed).toFixed(3)),
      ])
    }
  }

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows)

  wsDetail['!cols'] = [
    { wch: 30 }, // Расчёт
    { wch: 18 }, // Дата
    { wch: 30 }, // Наименование
    { wch: 22 }, // Вид
    { wch: 14 }, // Фракция
    { wch: 22 }, // Вес
    { wch: 12 }, // Кол-во
    { wch: 12 }, // Сумма
  ]

  XLSX.utils.book_append_sheet(wb, wsDetail, 'Детализация')

  // ── Download ─────────────────────────────────────────────────────────────────
  const date = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .replace(/\./g, '-')
  XLSX.writeFile(wb, `Янтарь_история_${date}.xlsx`)
}
