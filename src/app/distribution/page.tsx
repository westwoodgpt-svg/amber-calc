'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DistributionConfigView, Item } from '@/lib/types'
import { TYPE_LABELS, baseShareMap } from '@/lib/constants'

// ── helpers ──────────────────────────────────────────────────────────────────
function toPercentStr(decimal: number): string {
  return (decimal * 100).toFixed(2)
}

function parsePercent(s: string): number {
  const n = parseFloat(s)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

interface LocalRow {
  itemId: string
  name: string
  type: Item['type']
  enabled: boolean
}

// ── component ─────────────────────────────────────────────────────────────────
export default function DistributionPage() {
  const [rows, setRows] = useState<LocalRow[]>([])
  // shares stored as percentage strings (e.g. "12.50") — avoids controlled-input "0." issue
  const [shares, setShares] = useState<Record<string, string>>({})
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [itemsRes, distRes] = await Promise.all([fetch('/api/items'), fetch('/api/distribution')])
      if (!itemsRes.ok || !distRes.ok) throw new Error()
      const itemsJson: Item[] = await itemsRes.json()
      const distJson: DistributionConfigView = await distRes.json()

      setName(distJson.name)
      const distMap = new Map(distJson.items.map((r) => [r.itemId, r]))

      const newRows: LocalRow[] = []
      const newShares: Record<string, string> = {}

      for (const item of itemsJson) {
        const existing = distMap.get(item.id)
        const baseDecimal = Number(baseShareMap[item.name] ?? 0)

        newRows.push({
          itemId: item.id,
          name: item.name,
          type: item.type,
          enabled: existing ? existing.enabled : baseDecimal > 0,
        })

        newShares[item.id] = existing
          ? toPercentStr(existing.share)
          : toPercentStr(baseDecimal)
      }

      setRows(newRows)
      setShares(newShares)
    } catch {
      setError('Не удалось загрузить настройки распределения')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const enabledRows = useMemo(() => rows.filter((r) => r.enabled), [rows])

  const percentSum = useMemo(
    () => enabledRows.reduce((s, r) => s + parsePercent(shares[r.itemId] ?? '0'), 0),
    [enabledRows, shares],
  )

  const isShareValid = Math.abs(percentSum - 100) <= 0.1

  function updateShare(itemId: string, val: string) {
    // Allow only digits and single dot
    if (!/^\d*\.?\d*$/.test(val)) return
    setShares((prev) => ({ ...prev, [itemId]: val }))
    setSuccess('')
  }

  function toggleEnabled(itemId: string, checked: boolean) {
    setRows((prev) => prev.map((r) => r.itemId === itemId ? { ...r, enabled: checked } : r))
    if (!checked) setShares((prev) => ({ ...prev, [itemId]: '0' }))
    setSuccess('')
  }

  function normalize() {
    if (percentSum <= 0) return
    const factor = 100 / percentSum
    setShares((prev) => {
      const next = { ...prev }
      for (const r of enabledRows) {
        next[r.itemId] = (parsePercent(prev[r.itemId] ?? '0') * factor).toFixed(2)
      }
      return next
    })
  }

  async function save() {
    setError('')
    setSuccess('')

    if (enabledRows.length === 0) {
      setError('Включите хотя бы одну позицию в распределение')
      return
    }
    if (!isShareValid) {
      setError(`Сумма долей: ${percentSum.toFixed(2)}% — нажмите «Нормализовать» или исправьте вручную`)
      return
    }

    const entries = rows.map((r) => ({
      itemId: r.itemId,
      enabled: r.enabled,
      share: r.enabled ? parsePercent(shares[r.itemId] ?? '0') / 100 : 0,
    }))

    setSaving(true)
    try {
      const res = await fetch('/api/distribution', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || 'Основное распределение', entries }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Ошибка сохранения'); return }
      setSuccess('Распределение сохранено ✓')
    } catch {
      setError('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <h1 className="page-title">⚖️ Настройка распределения</h1>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">⚖️ Настройка распределения</h1>

      {error && (
        <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
          {error} <span style={{ float: 'right', opacity: 0.7 }}>✕</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success" onClick={() => setSuccess('')} style={{ cursor: 'pointer' }}>
          {success}
        </div>
      )}

      <div className="card">
        <div className="card-title">Активная конфигурация</div>

        <div className="form-group" style={{ maxWidth: 400, marginBottom: 16 }}>
          <label>Название конфигурации</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Основное распределение" />
        </div>

        {rows.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <div className="empty-state-icon">📋</div>
            <div>Нет позиций. Сначала добавьте их на странице Калькулятора.</div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="table-wrap table-container desktop-only">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Вкл.</th>
                    <th>Наименование</th>
                    <th>Тип</th>
                    <th className="text-right" style={{ minWidth: 160 }}>Доля, %</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.itemId} style={{ opacity: row.enabled ? 1 : 0.45 }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) => toggleEnabled(row.itemId, e.target.checked)}
                          style={{ width: 18, height: 18, minHeight: 18, cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{row.name}</td>
                      <td>
                        <span className="frac-badge">{TYPE_LABELS[row.type]}</span>
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={shares[row.itemId] ?? '0'}
                            onChange={(e) => updateShare(row.itemId, e.target.value)}
                            disabled={!row.enabled}
                            style={{ width: 90, textAlign: 'right', fontFamily: 'monospace' }}
                          />
                          <span style={{ color: 'var(--text-muted)', minWidth: 14, fontSize: 13 }}>%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mobile-only">
              {rows.map((row) => (
                <div
                  key={row.itemId}
                  className="container-card"
                  style={{ opacity: row.enabled ? 1 : 0.5 }}
                >
                  <div className="container-card-header">
                    <span className="container-card-name">{row.name}</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(e) => toggleEnabled(row.itemId, e.target.checked)}
                      />
                      <span style={{ fontSize: 13 }}>участвует</span>
                    </label>
                  </div>
                  <div className="container-card-meta">
                    <span className="frac-badge">{TYPE_LABELS[row.type]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      Доля, %
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={shares[row.itemId] ?? '0'}
                      onChange={(e) => updateShare(row.itemId, e.target.value)}
                      disabled={!row.enabled}
                      style={{ width: 100, textAlign: 'right', fontFamily: 'monospace' }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sum indicator */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 15,
                fontWeight: 700,
                color: isShareValid ? 'var(--green)' : 'var(--red)',
              }}>
                Сумма: {percentSum.toFixed(2)}% {isShareValid ? '✓' : '(нужно 100%)'}
              </span>
              {!isShareValid && enabledRows.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={normalize}>
                  Нормализовать до 100%
                </button>
              )}
            </div>
          </>
        )}

        <div className="form-actions" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={save} disabled={saving || rows.length === 0}>
            {saving ? <span className="spinner" /> : '💾 Сохранить распределение'}
          </button>
        </div>
      </div>
    </>
  )
}
