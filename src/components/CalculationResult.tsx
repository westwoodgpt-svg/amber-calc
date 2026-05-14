'use client'

import { useState } from 'react'
import type { CalculationResult as Res } from '@/lib/types'

interface Props {
  result: Res & { fraction?: string | null; allowMixing?: boolean }
  onSave: (name: string) => Promise<void>
  saving: boolean
  saved: boolean
}

export default function CalculationResult({ result, onSave, saving, saved }: Props) {
  const [name, setName] = useState('')

  const {
    selectedContainers,
    totalWeight,
    targetWeight,
    overweight,
    feasible,
  } = result

  const futureDelivery = overweight > 0 ? overweight : null

  return (
    <div className="result-card">
      <div className="card-title" style={{ marginBottom: 16 }}>
        ✅ Результат расчёта
        {!feasible && (
          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
            (приблизительно — точное решение не найдено)
          </span>
        )}
      </div>

      <div className="result-stats">
        <div className="stat-item">
          <div className="stat-label">Целевой вес</div>
          <div className="stat-value">{targetWeight.toFixed(3)} кг</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Итого</div>
          <div className="stat-value green">{totalWeight.toFixed(3)} кг</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Перевес</div>
          <div className={`stat-value ${overweight > 0 ? 'red' : 'green'}`}>
            +{overweight.toFixed(3)} кг
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Контейнеров</div>
          <div className="stat-value">
            {selectedContainers.reduce((s, c) => s + c.quantityUsed, 0)}
          </div>
        </div>
      </div>

      {futureDelivery !== null && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <strong>Разница для будущей поставки:</strong> +{futureDelivery.toFixed(3)} кг — будет учтена в следующем заказе
        </div>
      )}

      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table>
          <thead>
            <tr>
              <th>Фракция</th>
              <th>Вес (кг)</th>
              <th>Кол-во</th>
              <th>Сумма (кг)</th>
            </tr>
          </thead>
          <tbody>
            {selectedContainers.map(c => (
              <tr key={c.id}>
                <td><span className="badge badge-amber">{c.fraction}</span></td>
                <td className="font-mono">{c.weight.toFixed(3)}</td>
                <td>{c.quantityUsed}</td>
                <td className="font-mono">{(c.weight * c.quantityUsed).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!saved ? (
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 2 }}>
            <label>Название расчёта</label>
            <input
              type="text"
              placeholder="например: Партия #42"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => name.trim() && onSave(name.trim())}
            disabled={!name.trim() || saving}
            style={{ marginBottom: 1 }}
          >
            {saving ? <span className="spinner" /> : '💾 Сохранить в историю'}
          </button>
        </div>
      ) : (
        <div className="alert alert-success mb-0">Расчёт сохранён в историю</div>
      )}
    </div>
  )
}
