'use client'

import { useEffect, useState } from 'react'
import type { Item } from '@/lib/types'
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants'

const CATEGORIES = [
  { type: 'VES' as const, label: 'Вес (весовая сортировка)', totalLot: 9974, packWeight: 10 },
  { type: 'SITO' as const, label: 'Сито (несортированный фракционный)', totalLot: 100000, packWeight: 25 },
  { type: 'LAK' as const, label: 'Чёрный лак', totalLot: 26, packWeight: 10 },
]

export default function LotPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/items')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setItems)
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <>
        <h1 className="page-title">📦 Состав лота</h1>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">📦 Состав лота 2026</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        Состав лота определяет доли каждой позиции внутри категории. Распределение рассчитывается автоматически
        по формуле: <strong>Доля = Вес_позиции / Итого_по_категории</strong>.
        Шаг 1/5 = отгружаемая часть за одну из 5 отгрузок.
      </div>

      {CATEGORIES.map(({ type, label, totalLot, packWeight }) => {
        const catItems = items.filter((i) => i.type === type).sort((a, b) => b.lotKg - a.lotKg)
        const color = TYPE_COLORS[type]

        return (
          <div key={type} className="card" style={{ marginBottom: 16 }}>
            <div className="card-title" style={{ color }}>
              {label}
              <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>
                {catItems.length} позиций · лот {totalLot.toLocaleString('ru')} кг · упаковка {packWeight} кг
              </span>
            </div>

            {/* Desktop */}
            <div className="table-wrap table-container desktop-only" style={{ fontSize: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Артикул</th>
                    <th>Наименование</th>
                    <th className="text-right">Лот, кг</th>
                    <th className="text-right">Доля, %</th>
                    <th className="text-right">1/5 лота, кг</th>
                    <th className="text-right">Уп. в 1/5</th>
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item) => {
                    const share = item.lotKg / totalLot
                    const perShip = (totalLot / 5) * share
                    const packs = Math.ceil(perShip / packWeight)
                    return (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{item.article}</td>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td className="text-right font-mono">{item.lotKg.toLocaleString('ru')}</td>
                        <td className="text-right font-mono">{(share * 100).toFixed(4)}</td>
                        <td className="text-right font-mono">{perShip.toFixed(3)}</td>
                        <td className="text-right font-mono">{packs}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700 }}>
                    <td colSpan={2}>Итого</td>
                    <td className="text-right font-mono">{totalLot.toLocaleString('ru')}</td>
                    <td className="text-right font-mono">100.0000</td>
                    <td className="text-right font-mono">{(totalLot / 5).toFixed(1)}</td>
                    <td className="text-right font-mono">
                      {catItems.reduce((s, i) => s + Math.ceil((totalLot / 5) * (i.lotKg / totalLot) / packWeight), 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile */}
            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {catItems.map((item) => {
                const share = item.lotKg / totalLot
                const perShip = (totalLot / 5) * share
                return (
                  <div key={item.id} className="container-card" style={{ fontSize: 13 }}>
                    <div className="container-card-header">
                      <span className="container-card-name" style={{ fontSize: 13 }}>{item.name}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{item.article}</span>
                    </div>
                    <div className="container-card-row" style={{ marginTop: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Лот</span>
                      <span className="font-mono">{item.lotKg.toLocaleString('ru')} кг ({(share * 100).toFixed(3)}%)</span>
                    </div>
                    <div className="container-card-row">
                      <span style={{ color: 'var(--text-muted)' }}>За 1 отгрузку</span>
                      <span className="font-mono">{perShip.toFixed(2)} кг</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
