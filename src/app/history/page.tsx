'use client'

import { useState, useEffect, useCallback } from 'react'
import HistoryModal from '@/components/HistoryModal'
import type { Calculation } from '@/lib/types'

export default function HistoryPage() {
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Calculation | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/history')
      if (!res.ok) throw new Error()
      setCalculations(await res.json())
    } catch { setError('Не удалось загрузить историю') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <>
        <h1 className="page-title">📋 История расчётов</h1>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">📋 История расчётов</h1>
      {error && <div className="alert alert-error">{error}</div>}

      {calculations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>История пуста</div>
          <div>Выполните расчёт и сохраните его, чтобы он появился здесь.</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Всего расчётов: {calculations.length}
          </div>
          {calculations.map(calc => (
            <div key={calc.id} className="history-item" onClick={() => setSelected(calc)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>{calc.name}</div>
                <div className="history-meta">
                  <span>🎯 {calc.targetWeight.toFixed(3)} кг</span>
                  <span>✅ {calc.totalWeight.toFixed(3)} кг</span>
                  <span style={{ color: calc.overweight > 0.001 ? 'var(--red)' : 'var(--green)' }}>
                    +{calc.overweight.toFixed(3)} кг
                  </span>
                  {calc.category && (
                    <span style={{ background: 'var(--amber-light)', color: '#92400e', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                      {calc.category}
                    </span>
                  )}
                  {calc.fraction && <span>{calc.fraction}</span>}
                  {calc.allowMixing && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>смешанные</span>}
                  <span>🕐 {new Date(calc.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 18, paddingLeft: 8, flexShrink: 0 }}>›</div>
            </div>
          ))}
        </>
      )}
      {selected && <HistoryModal calc={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
