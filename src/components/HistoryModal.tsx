'use client'

import { useState } from 'react'
import type { Calculation } from '@/lib/types'
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants'

interface Props {
  calc: Calculation
  onClose: () => void
  onDelete?: (id: string) => void
}

export default function HistoryModal({ calc, onClose, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false)
  const rows = Array.isArray((calc.result as { items?: unknown })?.items)
    ? (calc.result as { items: Array<{ id: string; name: string; type: 'fraction' | 'sieve'; share: number; calcWeight: number; factWeight: number; packs: number; newBalance: number }> }).items
    : []

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
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{calc.name}</span>
          <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Удалить'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="result-stats" style={{ marginBottom: 16 }}>
          <div className="stat-item">
            <div className="stat-label">Запрошено</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{calc.targetWeight.toFixed(3)}<span className="stat-unit"> кг</span></div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Факт</div>
            <div className="stat-value green" style={{ fontSize: 18 }}>{calc.totalWeight.toFixed(3)}<span className="stat-unit"> кг</span></div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Δ</div>
            <div className={`stat-value ${calc.overweight > 0.001 ? 'red' : 'green'}`} style={{ fontSize: 18 }}>
              {calc.overweight > 0 ? '+' : ''}{calc.overweight.toFixed(3)}<span className="stat-unit"> кг</span>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Позиция</th>
                <th>Тип</th>
                <th className="text-right">Доля</th>
                <th className="text-right">Теория</th>
                <th className="text-right">Факт</th>
                <th className="text-right">Упаковок</th>
                <th className="text-right">Новый баланс</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const color = TYPE_COLORS[row.type] ?? '#6b7280'
                return (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 500 }}>{row.name}</td>
                    <td><span className="cat-badge" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>{TYPE_LABELS[row.type]}</span></td>
                    <td className="text-right font-mono">{row.share.toFixed(4)}</td>
                    <td className="text-right font-mono">{row.calcWeight.toFixed(3)}</td>
                    <td className="text-right font-mono">{row.factWeight.toFixed(3)}</td>
                    <td className="text-right font-mono">{row.packs}</td>
                    <td className="text-right font-mono">{row.newBalance.toFixed(3)}</td>
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
