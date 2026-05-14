'use client'

import { useState, useEffect, useCallback } from 'react'
import ContainerTable from '@/components/ContainerTable'
import CalculationResult from '@/components/CalculationResult'
import type { Container, CalculationResult as Res } from '@/lib/types'

const FRACTIONS = ['SS', 'S', 'M', 'L', 'LL', 'LLL', 'RAW']

export default function CalculatorPage() {
  const [containers, setContainers] = useState<Container[]>([])
  const [targetWeight, setTargetWeight] = useState('')
  const [fraction, setFraction] = useState('SS')
  const [allowMixing, setAllowMixing] = useState(false)
  const [result, setResult] = useState<(Res & { fraction?: string | null; allowMixing?: boolean }) | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadContainers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/containers')
      if (!res.ok) throw new Error()
      setContainers(await res.json())
    } catch {
      setError('Не удалось загрузить контейнеры')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadContainers() }, [loadContainers])

  async function handleAdd(data: { weight: number; fraction: string; quantity: number }) {
    setTableLoading(true)
    setError('')
    try {
      const res = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setContainers(prev => [...prev, json])
    } catch {
      setError('Ошибка при добавлении контейнера')
    } finally {
      setTableLoading(false)
    }
  }

  async function handleUpdate(id: string, data: { weight: number; fraction: string; quantity: number }) {
    setTableLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/containers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setContainers(prev => prev.map(c => c.id === id ? json : c))
    } catch {
      setError('Ошибка при обновлении контейнера')
    } finally {
      setTableLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setTableLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/containers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setContainers(prev => prev.filter(c => c.id !== id))
    } catch {
      setError('Ошибка при удалении контейнера')
    } finally {
      setTableLoading(false)
    }
  }

  async function handleCalculate() {
    setError('')
    setResult(null)
    setSaved(false)
    const tw = parseFloat(targetWeight)
    if (!targetWeight || isNaN(tw) || tw <= 0) {
      setError('Введите корректный целевой вес')
      return
    }
    if (!allowMixing && !fraction) {
      setError('Выберите фракцию или включите смешивание')
      return
    }
    setCalculating(true)
    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetWeight: tw, fraction: allowMixing ? null : fraction, allowMixing }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      if (json.selectedContainers.length === 0) {
        setError('Не удалось подобрать контейнеры. Проверьте наличие контейнеров нужной фракции.')
        return
      }
      setResult(json)
    } catch {
      setError('Ошибка при расчёте')
    } finally {
      setCalculating(false)
    }
  }

  async function handleSave(name: string) {
    if (!result) return
    setSaving(true)
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          targetWeight: result.targetWeight,
          fraction: result.fraction ?? null,
          allowMixing: result.allowMixing ?? false,
          result,
          totalWeight: result.totalWeight,
          overweight: result.overweight,
        }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
    } catch {
      setError('Ошибка при сохранении расчёта')
    } finally {
      setSaving(false)
    }
  }

  const availableFractions = [...new Set(containers.map(c => c.fraction))].sort()

  return (
    <>
      <h1 className="page-title">🟡 Калькулятор подбора контейнеров</h1>

      {error && (
        <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
          {error}
        </div>
      )}

      {/* Params */}
      <div className="card">
        <div className="card-title">⚙️ Параметры расчёта</div>
        <div className="form-row" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ maxWidth: 200 }}>
            <label>Целевой вес (кг)</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              placeholder="0.000"
              value={targetWeight}
              onChange={e => { setTargetWeight(e.target.value); setResult(null); setSaved(false) }}
            />
          </div>
          {!allowMixing && (
            <div className="form-group" style={{ maxWidth: 160 }}>
              <label>Фракция</label>
              <select value={fraction} onChange={e => { setFraction(e.target.value); setResult(null); setSaved(false) }}>
                {(availableFractions.length > 0 ? availableFractions : FRACTIONS).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="toggle-wrap" style={{ marginBottom: 20 }}>
          <label className="toggle">
            <input
              type="checkbox"
              checked={allowMixing}
              onChange={e => { setAllowMixing(e.target.checked); setResult(null); setSaved(false) }}
            />
            <span className="toggle-slider" />
          </label>
          <span className="toggle-label">
            Разрешить смешивание фракций
            {allowMixing && <span style={{ marginLeft: 6, color: 'var(--amber)', fontSize: 12 }}>(все фракции)</span>}
          </span>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleCalculate}
          disabled={calculating || containers.length === 0}
          style={{ minWidth: 160 }}
        >
          {calculating ? <><span className="spinner" /> Рассчитываю...</> : '🔢 Рассчитать'}
        </button>
        {containers.length === 0 && !loading && (
          <span style={{ marginLeft: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            Сначала добавьте контейнеры
          </span>
        )}
      </div>

      {result && (
        <CalculationResult result={result} onSave={handleSave} saving={saving} saved={saved} />
      )}

      <ContainerTable
        containers={containers}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        loading={tableLoading}
      />
    </>
  )
}
