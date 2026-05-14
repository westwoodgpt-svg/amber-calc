'use client'

import { useState, useEffect, useCallback } from 'react'
import ContainerTable from '@/components/ContainerTable'
import CalculationResult from '@/components/CalculationResult'
import type { Container, CalculationResult as Res } from '@/lib/types'
import { CATEGORIES, FRACTIONS } from '@/lib/constants'

type CalcResult = Res & { category?: string | null; fraction?: string | null; allowMixing?: boolean }

export default function CalculatorPage() {
  const [containers, setContainers] = useState<Container[]>([])
  const [targetWeight, setTargetWeight] = useState('')
  const [category, setCategory] = useState('фракционный')
  const [fraction, setFraction] = useState('')
  const [allowMixing, setAllowMixing] = useState(false)
  const [result, setResult] = useState<CalcResult | null>(null)
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

  // Categories and fractions that actually exist in DB
  const availableCategories = [...new Set(containers.map(c => c.category))]
    .filter(Boolean).sort()
  const availableFractions = [...new Set(
    containers
      .filter(c => !allowMixing ? c.category === category : true)
      .map(c => c.fraction)
      .filter(Boolean) as string[]
  )].sort()

  async function handleAdd(data: Omit<Container, 'id' | 'createdAt' | 'updatedAt'>) {
    setTableLoading(true); setError('')
    try {
      const res = await fetch('/api/containers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setContainers(prev => [...prev, json])
    } catch { setError('Ошибка при добавлении') }
    finally { setTableLoading(false) }
  }

  async function handleUpdate(id: string, data: Omit<Container, 'id' | 'createdAt' | 'updatedAt'>) {
    setTableLoading(true); setError('')
    try {
      const res = await fetch(`/api/containers/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setContainers(prev => prev.map(c => c.id === id ? json : c))
    } catch { setError('Ошибка при обновлении') }
    finally { setTableLoading(false) }
  }

  async function handleDelete(id: string) {
    setTableLoading(true); setError('')
    try {
      const res = await fetch(`/api/containers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setContainers(prev => prev.filter(c => c.id !== id))
    } catch { setError('Ошибка при удалении') }
    finally { setTableLoading(false) }
  }

  async function handleCalculate() {
    setError(''); setResult(null); setSaved(false)
    const tw = parseFloat(targetWeight)
    if (!targetWeight || isNaN(tw) || tw <= 0) {
      setError('Введите корректный целевой вес'); return
    }
    if (!allowMixing && !category) {
      setError('Выберите вид сырья или включите смешивание'); return
    }
    setCalculating(true)
    try {
      const body = {
        targetWeight: tw,
        category: allowMixing ? null : category,
        // Send fraction only when a specific fraction is chosen
        fraction: (allowMixing || !fraction) ? null : fraction,
        allowMixing,
      }
      const res = await fetch('/api/calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      if (!json.selectedContainers?.length) {
        setError('Не найдено подходящих контейнеров. Проверьте склад.'); return
      }
      setResult(json)
    } catch { setError('Ошибка при расчёте') }
    finally { setCalculating(false) }
  }

  async function handleSave(name: string) {
    if (!result) return
    setSaving(true)
    try {
      const res = await fetch('/api/history', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          targetWeight: result.targetWeight,
          category: result.category ?? null,
          fraction: result.fraction ?? null,
          allowMixing: result.allowMixing ?? false,
          result,
          totalWeight: result.totalWeight,
          overweight: result.overweight,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Ошибка при сохранении')
        return
      }
      setSaved(true)
      // Refresh stock after deduction
      await loadContainers()
    } catch { setError('Ошибка при сохранении') }
    finally { setSaving(false) }
  }

  const catOptions = availableCategories.length > 0 ? availableCategories : [...CATEGORIES]
  const fracOptions = availableFractions.length > 0 ? availableFractions :
    [...FRACTIONS].filter(f => f !== 'без фракции' && f !== 'несортированный')

  return (
    <>
      <h1 className="page-title">🟡 Калькулятор подбора янтаря</h1>

      {error && (
        <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
          {error} <span style={{ float: 'right', opacity: 0.6 }}>✕</span>
        </div>
      )}

      <div className="card">
        <div className="card-title">⚙️ Параметры расчёта</div>

        <div className="toggle-wrap" style={{ marginBottom: 20 }}>
          <label className="toggle">
            <input type="checkbox" checked={allowMixing}
              onChange={e => { setAllowMixing(e.target.checked); setResult(null); setSaved(false) }} />
            <span className="toggle-slider" />
          </label>
          <span className="toggle-label">
            Смешивание категорий и фракций
            {allowMixing && <span style={{ marginLeft: 6, color: 'var(--amber)', fontSize: 12 }}>(все позиции склада)</span>}
          </span>
        </div>

        <div className="form-grid-3">
          <div className="form-group">
            <label>Целевой вес (кг)</label>
            <input
              type="number" step="0.001" min="0.001" placeholder="0.000"
              value={targetWeight}
              onChange={e => { setTargetWeight(e.target.value); setResult(null); setSaved(false) }}
              inputMode="decimal"
            />
          </div>
          {!allowMixing && (
            <>
              <div className="form-group">
                <label>Вид сырья</label>
                <select value={category}
                  onChange={e => { setCategory(e.target.value); setFraction(''); setResult(null); setSaved(false) }}>
                  {catOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Фракция <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(необязательно)</span></label>
                <select value={fraction}
                  onChange={e => { setFraction(e.target.value); setResult(null); setSaved(false) }}>
                  <option value="">— любая —</option>
                  {fracOptions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleCalculate}
            disabled={calculating || containers.length === 0}
          >
            {calculating
              ? <><span className="spinner" />&nbsp;Подбираю...</>
              : '🔢 Рассчитать подбор'}
          </button>
          {containers.length === 0 && !loading && (
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              Сначала добавьте позиции на склад
            </p>
          )}
        </div>
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
