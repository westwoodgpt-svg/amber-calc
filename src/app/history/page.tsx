'use client'

import { useCallback, useEffect, useState } from 'react'
import HistoryModal from '@/components/HistoryModal'
import type { HistoryCalculation } from '@/lib/types'

export default function HistoryPage() {
  const [calculations, setCalculations] = useState<HistoryCalculation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<HistoryCalculation | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/history')
      if (!res.ok) throw new Error()
      setCalculations(await res.json())
    } catch {
      setError('Не удалось загрузить историю')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const isLatest = calculations.length === 0 || calculations[0].id === id
    const message = isLatest
      ? 'Удалить этот расчёт из истории?'
      : '⚠️ Этот расчёт не последний в истории.\n\nУдаление может нарушить баланс последующих расчётов — все отгрузки, сделанные после, будут пересчитаны некорректно.\n\nВсё равно удалить?'
    if (!confirm(message)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setCalculations((prev) => prev.filter((calc) => calc.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch {
      setError('Не удалось удалить расчёт')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <>
        <h1 className="page-title">История расчётов</h1>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">История расчётов</h1>
      {error && <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>{error} <span style={{ float: 'right' }}>×</span></div>}

      {calculations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>История пуста</div>
          <div>Сделайте расчёт на странице калькулятора.</div>
        </div>
      ) : (
        calculations.map((calc) => (
          <div key={calc.id} className="history-item" onClick={() => setSelected(calc)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{calc.companyName || '—'}</span>
                <span style={{ fontSize: 11, background: 'var(--bg-secondary, #ffffff11)', color: 'var(--text-muted)', borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>
                  отгрузка №{calc.shipmentNumber}
                </span>
                {calc.allowPartialPack && (
                  <span style={{ fontSize: 11, color: 'var(--amber)', background: 'var(--amber-dim, #ff990022)', borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>
                    выход в ноль
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{new Date(calc.createdAt).toLocaleString('ru-RU')}</div>
              <div className="history-meta">
                <span>Запрошено: {calc.totalWeight.toFixed(2)} кг</span>
                <span>Факт: {calc.totalActual.toFixed(2)} кг</span>
                <span style={{ color: calc.totalDelta > 0 ? 'var(--red)' : 'var(--green)' }}>
                  Δ {calc.totalDelta > 0 ? '+' : ''}{calc.totalDelta.toFixed(2)} кг
                </span>
                <span>Позиции: {calc.items.length}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, flexShrink: 0 }}>
              <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(calc.id, e)} disabled={deletingId === calc.id}>
                {deletingId === calc.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🗑'}
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
            </div>
          </div>
        ))
      )}

      {selected && (
        <HistoryModal
          calc={selected}
          isLatest={calculations.length === 0 || calculations[0].id === selected.id}
          onClose={() => setSelected(null)}
          onDelete={(id) => {
            setCalculations((prev) => prev.filter((calc) => calc.id !== id))
            setSelected(null)
          }}
        />
      )}
    </>
  )
}

