'use client'

import { useState } from 'react'
import type { HistoryCalculation } from '@/lib/types'
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants'
import { exportCalculationHistoryToExcel } from '@/lib/exportExcel'

interface Props {
  calc: HistoryCalculation
  onClose: () => void
  onDelete?: (id: string) => void
}

export default function HistoryModal({ calc, onClose, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Удалить этот расчёт из истории?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/history/${calc.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      onDelete?.(calc.id)
      onClose()
    } catch {
      alert('Не удалось удалить расчёт')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-title">
          <span>{calc.companyName || '—'} — {new Date(calc.createdAt).toLocaleString('ru-RU')}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => exportCalculationHistoryToExcel(calc)}>Excel</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>{deleting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Удалить'}</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="result-stats" style={{ marginBottom: 16 }}>
          <div className="stat-item"><div className="stat-label">Запрошено</div><div className="stat-value">{calc.totalWeight.toFixed(2)}<span className="stat-unit"> кг</span></div></div>
          <div className="stat-item"><div className="stat-label">Факт</div><div className="stat-value green">{calc.totalActual.toFixed(2)}<span className="stat-unit"> кг</span></div></div>
          <div className="stat-item"><div className="stat-label">Отклонение</div><div className={`stat-value ${calc.totalDelta > 0 ? 'red' : 'green'}`}>{calc.totalDelta > 0 ? '+' : ''}{calc.totalDelta.toFixed(2)}<span className="stat-unit"> кг</span></div></div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Позиция</th>
                <th>Тип</th>
                <th className="text-right">Расчётный вес</th>
                <th className="text-right">Скорректированный</th>
                <th className="text-right">Упаковок</th>
                <th className="text-right">Факт</th>
                <th className="text-right">Δ</th>
              </tr>
            </thead>
            <tbody>
              {calc.items.map((row) => {
                const color = TYPE_COLORS[row.item.type]
                return (
                  <tr key={row.id}>
                    <td>{row.item.name}</td>
                    <td><span className="cat-badge" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>{TYPE_LABELS[row.item.type]}</span></td>
                    <td className="text-right font-mono">{row.calcWeight.toFixed(2)}</td>
                    <td className="text-right font-mono">{row.adjustedWeight.toFixed(2)}</td>
                    <td className="text-right font-mono">{row.packs}</td>
                    <td className="text-right font-mono">{row.factWeight.toFixed(2)}</td>
                    <td className="text-right font-mono">{row.delta.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

