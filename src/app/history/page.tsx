'use client'

import { useCallback, useEffect, useState } from 'react'
import HistoryModal from '@/components/HistoryModal'
import type { Calculation } from '@/lib/types'
import { exportHistoryToExcel } from '@/lib/exportExcel'

export default function HistoryPage() {
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Calculation | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

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

  async function handleExport() {
    setExporting(true)
    try {
      exportHistoryToExcel(calculations)
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Удалить этот расчёт из истории?')) return

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
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
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
          <div>Сохраните расчёт на странице калькулятора.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Всего: {calculations.length}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleExport} disabled={exporting}>
              {exporting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Экспорт в Excel'}
            </button>
          </div>

          {calculations.map((calc) => (
            <div key={calc.id} className="history-item" onClick={() => setSelected(calc)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 5, fontSize: 15 }}>{calc.name}</div>
                <div className="history-meta">
                  <span>Запрошено: {calc.targetWeight.toFixed(3)} кг</span>
                  <span>Факт: {calc.totalWeight.toFixed(3)} кг</span>
                  <span style={{ color: calc.overweight > 0.001 ? 'var(--red)' : 'var(--green)' }}>
                    Δ {calc.overweight > 0 ? '+' : ''}{calc.overweight.toFixed(3)} кг
                  </span>
                  <span>{new Date(calc.createdAt).toLocaleString('ru-RU')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, flexShrink: 0 }}>
                <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(calc.id, e)} disabled={deletingId === calc.id}>
                  {deletingId === calc.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🗑'}
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
              </div>
            </div>
          ))}
        </>
      )}

      {selected && (
        <HistoryModal
          calc={selected}
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
