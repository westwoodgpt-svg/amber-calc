'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ContainerTable from '@/components/ContainerTable'
import CalculationResult from '@/components/CalculationResult'
import type { Item, CalculationResult as Res } from '@/lib/types'
import { validateShares } from '@/lib/calculateShipment'

export default function CalculatorPage() {
  const [items, setItems] = useState<Item[]>([])
  const [totalWeight, setTotalWeight] = useState('')
  const [result, setResult] = useState<Res | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/containers')
      if (!res.ok) throw new Error()
      setItems(await res.json())
    } catch {
      setError('Не удалось загрузить позиции')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  async function handleAdd(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    setTableLoading(true)
    setError('')
    try {
      const res = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Ошибка при добавлении')
        return
      }
      setItems((prev) => [...prev, json])
    } catch {
      setError('Ошибка при добавлении')
    } finally {
      setTableLoading(false)
    }
  }

  async function handleUpdate(id: string, data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    setTableLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/containers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Ошибка при обновлении')
        return
      }
      setItems((prev) => prev.map((item) => (item.id === id ? json : item)))
    } catch {
      setError('Ошибка при обновлении')
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
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch {
      setError('Ошибка при удалении')
    } finally {
      setTableLoading(false)
    }
  }

  async function handleCalculate() {
    setError('')
    setResult(null)
    setSaved(false)

    const parsedWeight = Number(totalWeight)
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setError('Введите корректный общий вес')
      return
    }

    const { valid, sum } = validateShares(items)
    if (!valid) {
      setError(`Сумма долей должна быть равна 1 (сейчас ${sum})`)
      return
    }

    setCalculating(true)
    try {
      const balance: Record<string, number> = {}
      for (const item of items) {
        balance[item.id] = item.balance
      }

      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalWeight: parsedWeight, balance }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Ошибка при расчёте')
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
          result,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Ошибка при сохранении')
        return
      }

      setSaved(true)
      await loadItems()
    } catch {
      setError('Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const shareStatus = useMemo(() => validateShares(items), [items])
  const unconfirmedCount = useMemo(() => items.filter((item) => !item.weightConfirmed).length, [items])

  return (
    <>
      <h1 className="page-title">Калькулятор распределения камня</h1>

      {error && (
        <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
          {error} <span style={{ float: 'right', opacity: 0.6 }}>×</span>
        </div>
      )}

      <div className="card">
        <div className="card-title">Параметры расчёта</div>

        <div className="form-grid-3">
          <div className="form-group">
            <label>Общий вес клиента (кг)</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={totalWeight}
              onChange={(e) => {
                setTotalWeight(e.target.value)
                setResult(null)
                setSaved(false)
              }}
              inputMode="decimal"
            />
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 13 }}>
          <div style={{ color: shareStatus.valid ? 'var(--green)' : 'var(--red)' }}>
            Сумма долей: {shareStatus.sum.toFixed(3)} {shareStatus.valid ? '✓' : '(должна быть 1.000)'}
          </div>
          <div style={{ color: unconfirmedCount === 0 ? 'var(--green)' : 'var(--red)' }}>
            Неподтверждённый вес: {unconfirmedCount}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button className="btn btn-primary btn-lg" onClick={handleCalculate} disabled={calculating || loading || items.length === 0}>
            {calculating ? <><span className="spinner" />&nbsp;Считаю...</> : 'Рассчитать'}
          </button>
          {items.length === 0 && !loading && (
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              Добавьте позиции ассортимента
            </p>
          )}
        </div>
      </div>

      {result && <CalculationResult result={result} onSave={handleSave} saving={saving} saved={saved} />}

      <ContainerTable items={items} onAdd={handleAdd} onUpdate={handleUpdate} onDelete={handleDelete} loading={tableLoading} />
    </>
  )
}
