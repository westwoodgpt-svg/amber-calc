'use client'

import { useState } from 'react'
import type { Calculation } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/constants'

interface Props {
  calc: Calculation
  onClose: () => void
  onDelete?: (id: string) => void
}

export default function HistoryModal({ calc, onClose, onDelete }: Props) {
  const { result } = calc
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
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-title">
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📋 {calc.name}
          </span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={deleting}
              title="Удалить расчёт"
            >
              {deleting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🗑 Удалить'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="result-stats" style={{ marginBottom: 16 }}>
          <div className="stat-item">
            <div className="stat-label">Цель</div>
            <div className="stat-value" style={{ fontSize: 18 }}>
              {calc.targetWeight.toFixed(3)}<span className="stat-unit"> кг</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Итого</div>
            <div className="stat-value green" style={{ fontSize: 18 }}>
              {calc.totalWeight.toFixed(3)}<span className="stat-unit"> кг</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Перевес</div>
            <div className={`stat-value ${calc.overweight > 0.001 ? 'red' : 'green'}`} style={{ fontSize: 18 }}>
              {calc.overweight > 0.001 ? '+' : ''}{calc.overweight.toFixed(3)}<span className="stat-unit"> кг</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {calc.category && (
            <span>Вид: <strong style={{ color: 'var(--text)' }}>{calc.category}</strong></span>
          )}
          {calc.fraction && (
            <span>Фракция: <strong style={{ color: 'var(--text)' }}>{calc.fraction}</strong></span>
          )}
          <span>Смешивание: <strong style={{ color: 'var(--text)' }}>{calc.allowMixing ? 'да' : 'нет'}</strong></span>
          <span>
            {new Date(calc.createdAt).toLocaleString('ru-RU', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>

        {/* Desktop table */}
        <div className="table-wrap desktop-only">
          <table>
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Вид</th>
                <th>Фракция</th>
                <th className="text-right">Вес (кг)</th>
                <th className="text-right">Кол-во</th>
                <th className="text-right">Сумма (кг)</th>
              </tr>
            </thead>
            <tbody>
              {result.selectedContainers.map(c => {
                const color = CATEGORY_COLORS[c.category] ?? '#6b7280'
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>
                      <span className="cat-badge" style={{ background: color + '22', color, borderColor: color + '44' }}>
                        {c.category}
                      </span>
                    </td>
                    <td>{c.fraction ? <span className="frac-badge">{c.fraction}</span> : '—'}</td>
                    <td className="text-right font-mono">{c.weight.toFixed(3)}</td>
                    <td className="text-right">{c.quantityUsed}</td>
                    <td className="text-right font-mono">{(c.weight * c.quantityUsed).toFixed(3)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mobile-cards mobile-only">
          {result.selectedContainers.map(c => {
            const color = CATEGORY_COLORS[c.category] ?? '#6b7280'
            return (
              <div key={c.id} className="container-card">
                <div className="container-card-header">
                  <span className="container-card-name">{c.name}</span>
                  <span className="frac-badge">{c.quantityUsed} шт</span>
                </div>
                <div className="container-card-meta">
                  <span className="cat-badge" style={{ background: color + '22', color, borderColor: color + '44' }}>
                    {c.category}
                  </span>
                  {c.fraction && <span className="frac-badge">{c.fraction}</span>}
                </div>
                <div className="container-card-row">
                  <span>Вес: <strong>{c.weight.toFixed(3)} кг</strong></span>
                  <span>Сумма: <strong>{(c.weight * c.quantityUsed).toFixed(3)} кг</strong></span>
                </div>
              </div>
            )
          })}
        </div>

        {calc.overweight > 0.001 && (
          <div className="alert alert-info mt-4">
            <strong>Разница для будущей поставки:</strong> +{calc.overweight.toFixed(3)} кг
          </div>
        )}
      </div>
    </div>
  )
}
