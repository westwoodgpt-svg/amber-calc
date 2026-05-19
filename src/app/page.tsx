'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ContainerTable from '@/components/ContainerTable'
import CalculationResult from '@/components/CalculationResult'
import type { CalculateResponse, DistributionConfigView, Item } from '@/lib/types'

export default function CalculatorPage() {
  const [items, setItems] = useState<Item[]>([])
  const [distribution, setDistribution] = useState<DistributionConfigView | null>(null)
  const [totalWeight, setTotalWeight] = useState('')
  const [allowPartialPack, setAllowPartialPack] = useState(false)
  const [result, setResult] = useState<CalculateResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingItems, setSavingItems] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [knownCompanies, setKnownCompanies] = useState<string[]>([])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [itemsRes, distRes, companiesRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/distribution'),
        fetch('/api/companies'),
      ])
      if (!itemsRes.ok || !distRes.ok) throw new Error()
      const [itemsJson, distJson] = await Promise.all([itemsRes.json(), distRes.json()])
      setItems(itemsJson)
      setDistribution(distJson)
      if (companiesRes.ok) setKnownCompanies(await companiesRes.json())
    } catch {
      setError('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── derived state ──────────────────────────────────────────────────────────
  const enabledDistRows = useMemo(
    () => (distribution?.items ?? []).filter((r) => r.enabled),
    [distribution],
  )
  const sharedItemIds = useMemo(
    () => new Set(enabledDistRows.map((r) => r.itemId)),
    [enabledDistRows],
  )

  const shareSum = useMemo(
    () => enabledDistRows.reduce((s, r) => s + r.share, 0),
    [enabledDistRows],
  )
  const isShareSumValid = Math.abs(shareSum - 1) <= 0.001

  const unconfirmedInDist = useMemo(
    () => enabledDistRows.filter((r) => !r.item.weightConfirmed),
    [enabledDistRows],
  )

  const hasBlockingErrors =
    !distribution ||
    enabledDistRows.length === 0 ||
    !isShareSumValid ||
    unconfirmedInDist.length > 0

  // ── CRUD ───────────────────────────────────────────────────────────────────
  async function addItem(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    setSavingItems(true); setError('')
    try {
      const res = await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Ошибка при добавлении'); return }
      setItems((prev) => [...prev, json])
    } catch { setError('Ошибка при добавлении') }
    finally { setSavingItems(false) }
  }

  async function updateItem(id: string, data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    setSavingItems(true); setError('')
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Ошибка при обновлении'); return }
      setItems((prev) => prev.map((item) => item.id === id ? json : item))
      setDistribution((prev) => prev
        ? { ...prev, items: prev.items.map((r) => r.itemId === id ? { ...r, item: json } : r) }
        : prev)
    } catch { setError('Ошибка при обновлении') }
    finally { setSavingItems(false) }
  }

  async function deleteItem(id: string) {
    setSavingItems(true); setError('')
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((item) => item.id !== id))
      setDistribution((prev) => prev ? { ...prev, items: prev.items.filter((r) => r.itemId !== id) } : prev)
    } catch { setError('Ошибка при удалении') }
    finally { setSavingItems(false) }
  }

  // ── Calculate ──────────────────────────────────────────────────────────────
  async function runCalculation(company: string) {
    setError(''); setResult(null)
    const parsed = Number(totalWeight)
    if (!Number.isFinite(parsed) || parsed <= 0) { setError('Введите корректный общий вес'); return }
    if (!company.trim()) { setError('Введите название компании'); return }
    if (hasBlockingErrors) { setError('Исправьте ошибки перед расчётом'); return }

    setCalculating(true)
    try {
      const res = await fetch('/api/calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalWeight: parsed, companyName: company.trim(), allowPartialPack }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Ошибка при расчёте'); return }
      setResult(json)
      setCompanyModalOpen(false)
      setCompanyName('')
      // refresh known companies so the new name appears in autocomplete
      fetch('/api/companies').then((r) => r.ok ? r.json() : []).then(setKnownCompanies)
    } catch { setError('Ошибка при расчёте') }
    finally { setCalculating(false) }
  }

  function onCalculateClick() {
    const parsed = Number(totalWeight)
    if (!Number.isFinite(parsed) || parsed <= 0) { setError('Введите корректный общий вес'); return }
    if (hasBlockingErrors) {
      if (!distribution || enabledDistRows.length === 0) {
        setError('Настройте распределение долей на странице «Распределение»')
      } else if (!isShareSumValid) {
        setError(`Сумма долей в распределении: ${(shareSum * 100).toFixed(2)}% (нужно 100%). Исправьте на странице «Распределение»`)
      } else if (unconfirmedInDist.length > 0) {
        setError(`Подтвердите вес упаковки: ${unconfirmedInDist.map((r) => r.item.name).join(', ')}`)
      }
      return
    }
    setCompanyModalOpen(true)
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <h1 className="page-title">🟡 Калькулятор распределения</h1>

      {error && (
        <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
          {error} <span style={{ float: 'right', opacity: 0.6 }}>✕</span>
        </div>
      )}

      {/* Параметры */}
      <div className="card">
        <div className="card-title">⚙️ Параметры расчёта</div>

        <div className="form-grid-3" style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label>Общий вес отгрузки (кг)</label>
            <input
              type="number" min="0.01" step="0.01" inputMode="decimal"
              value={totalWeight}
              onChange={(e) => { setTotalWeight(e.target.value); setResult(null) }}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Open-bag toggle */}
        <div className="toggle-wrap" style={{ marginBottom: 12 }}>
          <label className="toggle">
            <input
              type="checkbox"
              checked={allowPartialPack}
              onChange={(e) => { setAllowPartialPack(e.target.checked); setResult(null) }}
            />
            <span className="toggle-slider" />
          </label>
          <span className="toggle-label">
            Открыть последний мешок/коробку
            {allowPartialPack && (
              <span style={{ marginLeft: 6, color: 'var(--amber)', fontSize: 12 }}>
                (точный вес, частичная упаковка)
              </span>
            )}
          </span>
        </div>

        {/* Distribution status summary */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className={`alert ${isShareSumValid && enabledDistRows.length > 0 ? 'alert-success' : 'alert-info'}`}
              style={{ marginBottom: 0, padding: '8px 14px' }}>
              {enabledDistRows.length === 0
                ? '⚠️ Распределение не настроено — перейдите на страницу «Распределение»'
                : isShareSumValid
                  ? `✓ Распределение: ${enabledDistRows.length} позиций, сумма долей 100%`
                  : `⚠️ Сумма долей: ${(shareSum * 100).toFixed(2)}% — исправьте на странице «Распределение»`}
            </div>
            {unconfirmedInDist.length > 0 && (
              <div className="alert alert-error" style={{ marginBottom: 0, padding: '8px 14px' }}>
                ⚠️ Не подтверждён вес: {unconfirmedInDist.map((r) => r.item.name).join(', ')} — подтвердите в таблице ниже
              </div>
            )}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <CalculationResult
          result={result}
          companyName={result.companyName}
          calculationId={result.calculationId}
          createdAt={result.createdAt}
          warnings={result.warnings}
          allowPartialPack={allowPartialPack}
          priorOrderCount={result.priorOrderCount}
        />
      )}

      {/* Items table */}
      <ContainerTable
        items={items}
        sharedItemIds={sharedItemIds}
        onAdd={addItem}
        onUpdate={updateItem}
        onDelete={deleteItem}
        loading={savingItems}
      />

      {/* Sticky calculate button */}
      <div className="sticky-action-bar">
        <button
          className="btn btn-primary btn-lg"
          onClick={onCalculateClick}
          disabled={loading || calculating || !totalWeight}
        >
          {calculating
            ? <><span className="spinner" />&nbsp;Считаю...</>
            : '🔢 Рассчитать'}
        </button>
      </div>

      {/* Company name modal */}
      {companyModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCompanyModalOpen(false) }}>
          <div className="modal">
            <div className="modal-title">
              <span>Введите название компании</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setCompanyModalOpen(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>Компания / клиент</label>
              <input
                list="company-suggestions"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Например: ООО Балтия"
                onKeyDown={(e) => e.key === 'Enter' && companyName.trim() && runCalculation(companyName)}
                autoFocus
              />
              {knownCompanies.length > 0 && (
                <datalist id="company-suggestions">
                  {knownCompanies.map((name) => <option key={name} value={name} />)}
                </datalist>
              )}
              {companyName.trim() && knownCompanies.includes(companyName.trim()) && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  ↩ Баланс по «{companyName.trim()}» будет учтён из предыдущих расчётов этой компании
                </div>
              )}
              {companyName.trim() && !knownCompanies.includes(companyName.trim()) && (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  Новая компания — баланс начнётся с нуля
                </div>
              )}
            </div>
            <div className="form-actions" style={{ marginTop: 16 }}>
              <button
                className="btn btn-primary"
                onClick={() => runCalculation(companyName)}
                disabled={calculating || !companyName.trim()}
              >
                {calculating ? <span className="spinner" /> : '🔢 Рассчитать'}
              </button>
              <button className="btn btn-ghost" onClick={() => setCompanyModalOpen(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
