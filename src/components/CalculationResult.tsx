'use client'

import { useState } from 'react'
import type { CalculationResult as Res } from '@/lib/types'
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants'

interface Props {
  result: Res
  onSave: (name: string) => Promise<void>
  saving: boolean
  saved: boolean
}

export default function CalculationResult({ result, onSave, saving, saved }: Props) {
  const [name, setName] = useState('')
  const { items, totals } = result

  return (
    <div className="result-card">
      <div className="card-title" style={{ marginBottom: 16 }}>Результат распределения</div>

      <div className="result-stats">
        <div className="stat-item">
          <div className="stat-label">Запрошено</div>
          <div className="stat-value">{totals.totalRequested.toFixed(3)}<span className="stat-unit"> кг</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Фактически</div>
          <div className="stat-value green">{totals.totalActual.toFixed(3)}<span className="stat-unit"> кг</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Отклонение</div>
          <div className={`stat-value ${totals.totalDelta > 0.001 ? 'red' : 'green'}`}>
            {totals.totalDelta > 0 ? '+' : ''}{totals.totalDelta.toFixed(3)}<span className="stat-unit"> кг</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Упаковок</div>
          <div className="stat-value">{items.reduce((sum, item) => sum + item.packs, 0)}</div>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        Разница для будущей поставки учитывается в новом балансе по каждой позиции.
      </div>

      <div className="table-wrap" style={{ marginBottom: 20 }}>
        <table>
          <thead>
            <tr>
              <th>Позиция</th>
              <th>Тип</th>
              <th className="text-right">Доля</th>
              <th className="text-right">Теория (кг)</th>
              <th className="text-right">С учётом баланса (кг)</th>
              <th className="text-right">Упаковок</th>
              <th className="text-right">Факт (кг)</th>
              <th className="text-right">Δ (кг)</th>
              <th className="text-right">Новый баланс (кг)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const color = TYPE_COLORS[item.type] ?? '#6b7280'
              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>
                    <span className="cat-badge" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>
                      {TYPE_LABELS[item.type]}
                    </span>
                  </td>
                  <td className="text-right font-mono">{item.share.toFixed(4)}</td>
                  <td className="text-right font-mono">{item.calcWeight.toFixed(3)}</td>
                  <td className="text-right font-mono">{item.adjustedWeight.toFixed(3)}</td>
                  <td className="text-right font-mono">{item.packs}</td>
                  <td className="text-right font-mono">{item.factWeight.toFixed(3)}</td>
                  <td className="text-right font-mono" style={{ color: item.delta >= 0 ? 'var(--red)' : 'var(--green)' }}>
                    {item.delta >= 0 ? '+' : ''}{item.delta.toFixed(3)}
                  </td>
                  <td className="text-right font-mono">{item.newBalance.toFixed(3)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!saved ? (
        <div className="save-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Название расчёта</label>
            <input type="text" placeholder="например: Клиент 2026-05-19" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => name.trim() && onSave(name.trim())} disabled={!name.trim() || saving}>
            {saving ? <span className="spinner" /> : 'Сохранить'}
          </button>
        </div>
      ) : (
        <div className="alert alert-success mb-0">Сохранено в историю. Баланс позиций обновлён.</div>
      )}
    </div>
  )
}
