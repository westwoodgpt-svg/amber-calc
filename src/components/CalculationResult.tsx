'use client'

import type { CalculationResult as Res, CalculationWarning } from '@/lib/types'
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants'
import { exportShipmentToExcel } from '@/lib/exportExcel'

interface Props {
  result: Res
  companyName: string
  calculationId?: string
  createdAt?: string
  warnings?: CalculationWarning[]
  allowPartialPack?: boolean
}

export default function CalculationResult({ result, companyName, calculationId, createdAt, warnings = [], allowPartialPack = false }: Props) {
  const { items, totals } = result

  return (
    <div className="result-card">
      <div className="card-title" style={{ marginBottom: 14 }}>Результат расчёта</div>

      <div style={{ marginBottom: 10, color: 'var(--text-muted)' }}>
        Компания: <strong style={{ color: 'var(--text)' }}>{companyName}</strong>
        {allowPartialPack && (
          <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--amber)', background: 'var(--amber-dim, #ff990022)', borderRadius: 4, padding: '2px 7px' }}>
            открытый мешок
          </span>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 12 }}>
          {warnings.map((w) => <div key={w.itemId ?? w.code}>{w.message}</div>)}
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
          <div className="stat-label">Факт</div>
          <div className="stat-value green">{totals.totalActual.toFixed(2)}<span className="stat-unit"> кг</span></div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Отклонение</div>
          <div className={`stat-value ${totals.totalDelta > 0 ? 'red' : 'green'}`}>
            {totals.totalDelta > 0 ? '+' : ''}{totals.totalDelta.toFixed(2)}<span className="stat-unit"> кг</span>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="table-wrap table-container desktop-only">
        <table>
          <thead>
            <tr>
              <th>Наименование</th>
              <th>Тип</th>
              <th className="text-right">Доля (%)</th>
              <th className="text-right">Расч. вес</th>
              <th className="text-right">Скорректир.</th>
              <th className="text-right">Упаковка</th>
              <th className="text-right">Кол-во</th>
              <th className="text-right">Факт</th>
              <th className="text-right">Откл.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const color = TYPE_COLORS[row.type]
              return (
                <tr key={row.itemId}>
                  <td style={{ fontWeight: 500 }}>
                    {row.name}
                    {row.isPartial && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--amber)', fontWeight: 400 }}>
                        (неполный)
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="cat-badge" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>
                      {TYPE_LABELS[row.type]}
                    </span>
                  </td>
                  <td className="text-right font-mono">{(row.share * 100).toFixed(2)}</td>
                  <td className="text-right font-mono">{row.calcWeight.toFixed(2)}</td>
                  <td className="text-right font-mono">{row.adjustedWeight.toFixed(2)}</td>
                  <td className="text-right font-mono">{row.packWeight.toFixed(3)}</td>
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

      {/* Mobile cards */}
      <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        {items.map((row) => {
          const color = TYPE_COLORS[row.type]
          return (
            <div key={row.itemId} className="container-card">
              <div className="container-card-header">
                <span className="container-card-name">
                  {row.name}
                  {row.isPartial && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--amber)', fontWeight: 400 }}>
                      (неполный)
                    </span>
                  )}
                </span>
                <span className="cat-badge" style={{ background: `${color}22`, color, borderColor: `${color}55`, flexShrink: 0 }}>
                  {TYPE_LABELS[row.type]}
                </span>
              </div>
              <div className="container-card-row" style={{ marginTop: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Доля</span>
                <strong className="font-mono">{(row.share * 100).toFixed(2)}%</strong>
              </div>
              <div className="container-card-row">
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Расч. вес</span>
                <span className="font-mono">{row.calcWeight.toFixed(2)} кг</span>
              </div>
              <div className="container-card-row">
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Скорректированный</span>
                <span className="font-mono">{row.adjustedWeight.toFixed(2)} кг</span>
              </div>
              <div className="container-card-row">
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Упаковка × кол-во</span>
                <span className="font-mono">{row.packWeight.toFixed(3)} кг × {row.packs}</span>
              </div>
              <div className="container-card-row" style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
                <span style={{ fontWeight: 600 }}>Факт</span>
                <strong className="font-mono" style={{ color: 'var(--green)' }}>{row.factWeight.toFixed(2)} кг</strong>
              </div>
              <div className="container-card-row">
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Отклонение</span>
                <span className="font-mono" style={{ color: row.delta > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>
                  {row.delta > 0 ? '+' : ''}{row.delta.toFixed(2)} кг
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="form-actions" style={{ marginTop: 14 }}>
        <button
          className="btn btn-primary"
          onClick={() => exportShipmentToExcel(result, companyName, createdAt ? new Date(createdAt) : new Date())}
        >
          📥 Экспорт в Excel
        </button>
      </div>

      {calculationId && (
        <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>
          ID расчёта: {calculationId}
        </div>
      )}
    </div>
  )
}
