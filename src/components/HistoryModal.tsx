'use client'

import type { Calculation } from '@/lib/types'

interface Props {
  calc: Calculation
  onClose: () => void
}

export default function HistoryModal({ calc, onClose }: Props) {
  const { result } = calc

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-title">
          <span>📋 {calc.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="result-stats" style={{ marginBottom: 16 }}>
          <div className="stat-item">
            <div className="stat-label">Целевой вес</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{calc.targetWeight.toFixed(3)} кг</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Итого</div>
            <div className="stat-value green" style={{ fontSize: 18 }}>{calc.totalWeight.toFixed(3)} кг</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Перевес</div>
            <div className={`stat-value ${calc.overweight > 0 ? 'red' : 'green'}`} style={{ fontSize: 18 }}>
              +{calc.overweight.toFixed(3)} кг
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
          {calc.fraction && <span>Фракция: <strong style={{ color: 'var(--text)' }}>{calc.fraction}</strong></span>}
          <span>Смешивание: <strong style={{ color: 'var(--text)' }}>{calc.allowMixing ? 'да' : 'нет'}</strong></span>
          <span>Дата: <strong style={{ color: 'var(--text)' }}>{new Date(calc.createdAt).toLocaleString('ru-RU')}</strong></span>
        </div>

        <div style={{ overflowX: 'auto' }}>
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
              {result.selectedContainers.map(c => (
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

        {calc.overweight > 0 && (
          <div className="alert alert-info mt-4">
            <strong>Разница для будущей поставки:</strong> +{calc.overweight.toFixed(3)} кг
          </div>
        )}
      </div>
    </div>
  )
}
