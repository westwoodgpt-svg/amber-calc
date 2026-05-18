'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ContainerTable from '@/components/ContainerTable'
import CalculationResult from '@/components/CalculationResult'
import type { CalculateResponse, DistributionConfigView, Item } from '@/lib/types'

export default function CalculatorPage() {
  const [items, setItems] = useState<Item[]>([])
  const [distribution, setDistribution] = useState<DistributionConfigView | null>(null)
  const [totalWeight, setTotalWeight] = useState('')
  const [result, setResult] = useState<CalculateResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingItems, setSavingItems] = useState(false)
  const [calculating, setCalculating] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [itemsRes, distRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/distribution'),
      ])
      if (!itemsRes.ok || !distRes.ok) throw new Error()
      const [itemsJson, distJson] = await Promise.all([itemsRes.json(), distRes.json()])
      setItems(itemsJson)
      setDistribution(distJson)
    } catch {
      setError('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const sharedItemIds = useMemo(() => new Set(distribution?.items.map((row) => row.itemId) ?? []), [distribution])
  const missingDistribution = useMemo(() => items.filter((item) => !sharedItemIds.has(item.id)), [items, sharedItemIds])
  const unconfirmedDistributed = useMemo(
    () => (distribution?.items ?? []).filter((row) => !row.item.weightConfirmed),
    [distribution],
  )
  const invalidPackWeight = useMemo(
    () => (distribution?.items ?? []).filter((row) => !Number.isFinite(row.item.packWeight) || row.item.packWeight <= 0),
    [distribution],
  )
  const shareSum = useMemo(
    () => (distribution?.items ?? []).reduce((sum, row) => sum + row.share, 0),
    [distribution],
  )
  const isShareSumValid = Math.abs(shareSum - 1) <= 0.001

  const hasBlockingErrors =
    !distribution ||
    distribution.items.length === 0 ||
    !isShareSumValid ||
    unconfirmedDistributed.length > 0 ||
    invalidPackWeight.length > 0

  async function addItem(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    setSavingItems(true)
    setError('')
    try {
      const res = await fetch('/api/items', {
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
      setSavingItems(false)
    }
  }

  async function updateItem(id: string, data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    setSavingItems(true)
    setError('')
    try {
      const res = await fetch(`/api/items/${id}`, {
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
      setDistribution((prev) => prev ? {
        ...prev,
        items: prev.items.map((row) => row.itemId === id ? { ...row, item: json } : row),
      } : prev)
    } catch {
      setError('Ошибка при обновлении')
    } finally {
      setSavingItems(false)
    }
  }

  async function deleteItem(id: string) {
    setSavingItems(true)
    setError('')
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((item) => item.id !== id))
      setDistribution((prev) => prev ? { ...prev, items: prev.items.filter((row) => row.itemId !== id) } : prev)
    } catch {
      setError('Ошибка при удалении')
    } finally {
      setSavingItems(false)
    }
  }

  async function calculate() {
    setError('')
    setResult(null)

    const parsed = Number(totalWeight)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Введите корректный общий вес')
      return
    }

    if (hasBlockingErrors) {
      setError('Исправьте ошибки в распределении и позициях перед расчётом')
      return
    }

    setCalculating(true)
    try {
      const res = await fetch('/api/calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalWeight: parsed }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Ошибка при расчёте')
        return
      }
      setResult(json)
      await loadAll()
    } catch {
      setError('Ошибка при расчёте')
    } finally {
      setCalculating(false)
    }
  }

  return (
    <>
      <h1 className="page-title">Калькулятор распределения камня</h1>

      {error && <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>{error} <span style={{ float: 'right' }}>×</span></div>}

      <div className="card">
        <div className="card-title">Параметры расчёта</div>

        <div className="form-grid-3">
          <div className="form-group">
            <label>Общий вес клиента (кг)</label>
            <input type="number" min="0.01" step="0.01" value={totalWeight} onChange={(e) => setTotalWeight(e.target.value)} />
          </div>
        </div>

        <div className={`alert ${isShareSumValid ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 12, marginBottom: 0 }}>
          Сумма долей: {(shareSum * 100).toFixed(2)}% {isShareSumValid ? '✓' : '(должно быть 100% ±0.1%)'}
        </div>

        {missingDistribution.length > 0 && (
          <div className="alert alert-info" style={{ marginTop: 12, marginBottom: 0 }}>
            Позиции без доли не участвуют в расчёте: {missingDistribution.map((item) => item.name).join(', ')}.
          </div>
        )}

        {unconfirmedDistributed.length > 0 && (
          <div className="alert alert-error" style={{ marginTop: 12, marginBottom: 0 }}>
            Неподтверждённые позиции в распределении: {unconfirmedDistributed.map((row) => row.item.name).join(', ')}.
          </div>
        )}

        {invalidPackWeight.length > 0 && (
          <div className="alert alert-error" style={{ marginTop: 12, marginBottom: 0 }}>
            Некорректный packWeight у позиций: {invalidPackWeight.map((row) => row.item.name).join(', ')}.
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary btn-lg" onClick={calculate} disabled={loading || calculating || items.length === 0 || hasBlockingErrors}>
            {calculating ? <><span className="spinner" />&nbsp;Считаю...</> : 'Рассчитать и сохранить'}
          </button>
        </div>
      </div>

      {result && <CalculationResult result={result} calculationId={result.calculationId} createdAt={result.createdAt} warnings={result.warnings} />}

      <ContainerTable
        items={items}
        sharedItemIds={sharedItemIds}
        onAdd={addItem}
        onUpdate={updateItem}
        onDelete={deleteItem}
        loading={savingItems}
      />
    </>
  )
}
