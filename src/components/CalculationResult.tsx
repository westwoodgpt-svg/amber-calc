'use client'

import { useState } from 'react'
import type { CalculationResult as Res } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/constants'

interface Props {
  result: Res & { category?: string | null; fraction?: string | null; allowMixing?: boolean }
  onSave: (name: string) => Promise<void>
  saving: boolean
  saved: boolean
}

export default function CalculationResult({ result, onSave, saving, saved }: Props) {
  const [name, setName] = useState('')
  const { selectedContainers, totalWeight, targetWeight, overweight, feasible } = result

  return (
    <div className="result-card">
      <div className="card-title" style={{ marginBottom: 16 }}>
        ✅ Результат подбора
        {!feasible && (
          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
            (приблизительно)
          </span>
        )}
      </div>

      <div className="result-stats">
        <div className="stat-item">
          <div className="stat-label">Целевой вес</div>
          <div className="stat-value">{targetWeight.toFixed(3)}<span className="stat-unit"> кг</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Итого</div>
          <div className="stat-value green">{totalWeight.toFixed(3)}<span className="stat-unit"> кг</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Перевес</div>
          <div className={`stat-value ${overweight > 0.001 ? 'red' : 'green'}`}>
            {overweight > 0.001 ? '+' : ''}{overweight.toFixed(3)}<span className="stat-unit"> кг</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Контейнеров</div>
          <div className="stat-value">
            {selectedContainers.reduce((s, c) => s + c.quantityUsed, 0)}
          </div>
        </div>
      </div>

      {overweight > 0.001 && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <strong>Разница для будущей поставки:</strong>{' '}
          +{overweight.toFixed(3)} кг — учтите при следующем заказе
        </div>
      )}

      {/* Desktop table */}
      <div className="table-wrap desktop-only" style={{ marginBottom: 20 }}>
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
            {selectedContainers.map(c => {
              const color = CATEGORY_COLORS[c.category] ?? '#6b7280'
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td><span className="cat-badge" style={{ background: color + '22', color, borderColor: color + '44' }}>{c.category}</span></td>
                  <td>{c.fraction ? <span className="frac-badge">{c.fraction}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
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
      <div className="mobile-cards mobile-only" style={{ marginBottom: 16 }}>
        {selectedContainers.map(c => {
          const color = CATEGORY_COLORS[c.category] ?? '#6b7280'
          return (
            <div key={c.id} className="container-card">
              <div className="container-card-header">
                <span className="container-card-name">{c.name}</span>
                <span className="frac-badge">{c.quantityUsed} шт</span>
              </div>
              <div className="container-card-meta">
                <span className="cat-badge" style={{ background: color + '22', color, borderColor: color + '44' }}>{c.category}</span>
                {c.fraction && <span className="frac-badge">{c.fraction}</span>}
              </div>
              <div className="container-card-row">
                <span>Вес: <strong className="font-mono">{c.weight.toFixed(3)} кг</strong></span>
                <span>Сумма: <strong className="font-mono">{(c.weight * c.quantityUsed).toFixed(3)} кг</strong></span>
              </div>
            </div>
          )
        })}
      </div>

      {!saved ? (
        <div className="save-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Название расчёта</label>
            <input type="text" placeholder="например: Партия №42" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => name.trim() && onSave(name.trim())}
            disabled={!name.trim() || saving}
          >
            {saving ? <span className="spinner" /> : '💾 Сохранить'}
          </button>
        </div>
      ) : (
        <div className="alert alert-success mb-0">
          ✅ Сохранено в историю — остатки на складе обновлены ↓
        </div>
      )}
    </div>
  )
}
