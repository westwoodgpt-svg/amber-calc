'use client'

import type { CalculationResult as Res, CalculationWarning } from '@/lib/types'
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants'
import { exportShipmentToExcel } from '@/lib/exportExcel'

interface Props {
  result: Res
  calculationId?: string
  createdAt?: string
  warnings?: CalculationWarning[]
}

export default function CalculationResult({ result, calculationId, createdAt, warnings = [] }: Props) {
  const { items, totals } = result

  return (
    <div className="result-card">
      <div className="card-title" style={{ marginBottom: 14 }}>Результат расчёта</div>

      {warnings.length > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 12 }}>
          {warnings.map((warning) => warning.message).join(' ')}
        </div>
      )}

      <div className="result-stats">
        <div className="stat-item">
          <div className="stat-label">Запрошено</div>
          <div className="stat-value">{totals.totalRequested.toFixed(2)}<span className="stat-unit"> кг</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Расчётный вес</div>
          <div className="stat-value">{totals.totalCalcWeight.toFixed(2)}<span className="stat-unit"> кг</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Фактический вес</div>
          <div className="stat-value green">{totals.totalActual.toFixed(2)}<span className="stat-unit"> кг</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Отклонение</div>
          <div className={`stat-value ${totals.totalDelta > 0 ? 'red' : 'green'}`}>
            {totals.totalDelta > 0 ? '+' : ''}{totals.totalDelta.toFixed(2)}<span className="stat-unit"> кг</span>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Наименование</th>
              <th>Тип</th>
              <th className="text-right">Доля (%)</th>
              <th className="text-right">Расчётный вес</th>
              <th className="text-right">Скорректированный</th>
              <th className="text-right">Упаковка</th>
              <th className="text-right">Кол-во</th>
              <th className="text-right">Факт</th>
              <th className="text-right">Отклонение</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const color = TYPE_COLORS[row.type]
              return (
                <tr key={row.itemId}>
                  <td style={{ fontWeight: 500 }}>{row.name}</td>
                  <td><span className="cat-badge" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>{TYPE_LABELS[row.type]}</span></td>
                  <td className="text-right font-mono">{(row.share * 100).toFixed(2)}</td>
                  <td className="text-right font-mono">{row.calcWeight.toFixed(2)}</td>
                  <td className="text-right font-mono">{row.adjustedWeight.toFixed(2)}</td>
                  <td className="text-right font-mono">{row.packWeight.toFixed(2)}</td>
                  <td className="text-right font-mono">{row.packs}</td>
                  <td className="text-right font-mono">{row.factWeight.toFixed(2)}</td>
                  <td className="text-right font-mono" style={{ color: row.delta > 0 ? 'var(--red)' : 'var(--green)' }}>
                    {row.delta > 0 ? '+' : ''}{row.delta.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="form-actions" style={{ marginTop: 14 }}>
        <button className="btn btn-primary" onClick={() => exportShipmentToExcel(result, createdAt ? new Date(createdAt) : new Date())}>
          Экспорт в Excel
        </button>
      </div>

      {calculationId && (
        <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>
          Расчёт сохранён в историю: {calculationId}
        </div>
      )}
    </div>
  )
}
