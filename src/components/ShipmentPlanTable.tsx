'use client'

import type { PlannedShipmentItem } from '@/lib/types'
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants'

interface Props {
  items: PlannedShipmentItem[]
}

export default function ShipmentPlanTable({ items }: Props) {
  if (items.length === 0) {
    return <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>Нет позиций</div>
  }

  // Group by type for summary
  const byType = items.reduce<Record<string, PlannedShipmentItem[]>>((acc, it) => {
    ;(acc[it.type] ??= []).push(it)
    return acc
  }, {})

  return (
    <div style={{ marginTop: 8 }}>
      {/* Category summary */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        {Object.entries(byType).map(([type, rows]) => {
          const color = TYPE_COLORS[type as keyof typeof TYPE_COLORS]
          const totalFact = rows.reduce((s, r) => s + r.factWeight, 0)
          const totalCalc = rows.reduce((s, r) => s + r.calcWeight, 0)
          return (
            <div
              key={type}
              style={{
                background: `${color}18`,
                border: `1px solid ${color}44`,
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 13,
              }}
            >
              <span style={{ color, fontWeight: 600 }}>{TYPE_LABELS[type as keyof typeof TYPE_LABELS]}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                {totalFact.toLocaleString('ru', { maximumFractionDigits: 2 })} кг
                {' '}/ цель {totalCalc.toLocaleString('ru', { maximumFractionDigits: 2 })} кг
              </span>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="table-wrap table-container desktop-only" style={{ fontSize: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Артикул</th>
              <th>Наименование</th>
              <th>Тип</th>
              <th className="text-right">Доля%</th>
              <th className="text-right">Расч.вес</th>
              <th className="text-right">Скорр.</th>
              <th className="text-right">Уп. кг</th>
              <th className="text-right">Кол-во</th>
              <th className="text-right">Факт</th>
              <th className="text-right">Δ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const color = TYPE_COLORS[row.type]
              return (
                <tr key={row.itemId}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{row.article}</td>
                  <td style={{ fontWeight: 500 }}>
                    {row.name}
                    {row.isPartial && (
                      <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--amber)' }}>(неполн.)</span>
                    )}
                  </td>
                  <td>
                    <span
                      className="cat-badge"
                      style={{ background: `${color}22`, color, borderColor: `${color}55`, fontSize: 11 }}
                    >
                      {TYPE_LABELS[row.type]}
                    </span>
                  </td>
                  <td className="text-right font-mono">{(row.share * 100).toFixed(3)}</td>
                  <td className="text-right font-mono">{row.calcWeight.toFixed(3)}</td>
                  <td className="text-right font-mono">{row.adjustedWeight.toFixed(3)}</td>
                  <td className="text-right font-mono">{row.packWeight}</td>
                  <td className="text-right font-mono">{row.packs}</td>
                  <td className="text-right font-mono">{row.factWeight.toFixed(2)}</td>
                  <td
                    className="text-right font-mono"
                    style={{ color: row.delta > 0 ? 'var(--red)' : row.delta < 0 ? 'var(--green)' : undefined }}
                  >
                    {row.delta > 0 ? '+' : ''}{row.delta.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((row) => {
          const color = TYPE_COLORS[row.type]
          return (
            <div key={row.itemId} className="container-card" style={{ fontSize: 13 }}>
              <div className="container-card-header">
                <span className="container-card-name" style={{ fontSize: 13 }}>
                  {row.name}
                  {row.isPartial && (
                    <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--amber)' }}>(неполн.)</span>
                  )}
                </span>
                <span
                  className="cat-badge"
                  style={{ background: `${color}22`, color, borderColor: `${color}55`, fontSize: 11, flexShrink: 0 }}
                >
                  {TYPE_LABELS[row.type]}
                </span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {row.article}
              </div>
              <div className="container-card-row" style={{ marginTop: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Уп. × кол-во</span>
                <span className="font-mono">{row.packWeight} кг × {row.packs}</span>
              </div>
              <div className="container-card-row" style={{ borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 4 }}>
                <span style={{ fontWeight: 600 }}>Факт</span>
                <strong className="font-mono" style={{ color: 'var(--green)' }}>{row.factWeight.toFixed(2)} кг</strong>
              </div>
              <div className="container-card-row">
                <span style={{ color: 'var(--text-muted)' }}>Δ</span>
                <span
                  className="font-mono"
                  style={{ color: row.delta > 0 ? 'var(--red)' : row.delta < 0 ? 'var(--green)' : undefined }}
                >
                  {row.delta > 0 ? '+' : ''}{row.delta.toFixed(2)} кг
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
