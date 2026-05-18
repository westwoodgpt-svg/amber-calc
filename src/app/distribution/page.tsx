'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DistributionConfigView, Item } from '@/lib/types'
import { TYPE_LABELS, baseShareMap } from '@/lib/constants'

interface DistributionRowState {
  itemId: string
  name: string
  type: Item['type']
  enabled: boolean
  share: number
}

function normalizeBase(rows: DistributionRowState[]): DistributionRowState[] {
  const enabled = rows.filter((row) => row.enabled)
  const sum = enabled.reduce((acc, row) => acc + row.share, 0)
  if (sum <= 0) return rows

  return rows.map((row) => (
    row.enabled
      ? { ...row, share: Number((row.share / sum).toFixed(4)) }
      : row
  ))
}

export default function DistributionPage() {
  const [items, setItems] = useState<Item[]>([])
  const [config, setConfig] = useState<DistributionConfigView | null>(null)
  const [rows, setRows] = useState<DistributionRowState[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [itemsRes, distRes] = await Promise.all([fetch('/api/items'), fetch('/api/distribution')])
      if (!itemsRes.ok || !distRes.ok) throw new Error()
      const itemsJson: Item[] = await itemsRes.json()
      const distJson: DistributionConfigView = await distRes.json()

      setItems(itemsJson)
      setConfig(distJson)
      setName(distJson.name)

      const distMap = new Map(distJson.items.map((row) => [row.itemId, row]))

      const initialRows = itemsJson.map((item) => {
        const existing = distMap.get(item.id)
        if (existing) {
          return {
            itemId: item.id,
            name: item.name,
            type: item.type,
            enabled: existing.enabled,
            share: existing.share,
          }
        }

        const base = Number(baseShareMap[item.name] ?? 0)
        return {
          itemId: item.id,
          name: item.name,
          type: item.type,
          enabled: base > 0,
          share: base > 0 ? base : 0,
        }
      })

      setRows(normalizeBase(initialRows))
    } catch {
      setError('Не удалось загрузить настройки распределения')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const enabledRows = useMemo(() => rows.filter((row) => row.enabled), [rows])
  const totalShare = useMemo(() => enabledRows.reduce((acc, row) => acc + row.share, 0), [enabledRows])
  const isShareValid = Math.abs(totalShare - 1) <= 0.001

  function updateShare(itemId: string, newValue: number) {
    const nextValue = Number.isFinite(newValue) && newValue >= 0 ? newValue : 0
    setRows((prev) => prev.map((row) => row.itemId === itemId ? { ...row, share: nextValue } : row))
  }

  function toggleEnabled(itemId: string, checked: boolean) {
    setRows((prev) => prev.map((row) => {
      if (row.itemId !== itemId) return row
      if (!checked) {
        return { ...row, enabled: false, share: 0 }
      }
      const fallback = Number(baseShareMap[row.name] ?? 0)
      return { ...row, enabled: true, share: row.share > 0 ? row.share : fallback }
    }))
  }

  async function save() {
    setError('')
    setSuccess('')

    if (enabledRows.length === 0) {
      setError('Добавьте хотя бы одну включённую позицию в распределение')
      return
    }

    if (enabledRows.some((row) => !Number.isFinite(row.share) || row.share <= 0)) {
      setError('Для включённых позиций доля должна быть числом > 0')
      return
    }

    if (!isShareValid) {
      setError(`Сумма долей должна быть 1 ±0.001. Сейчас: ${totalShare.toFixed(4)}`)
      return
    }

    setSaving(true)
    try {
      const entries = rows.map((row) => ({
        itemId: row.itemId,
        enabled: row.enabled,
        share: row.enabled ? row.share : 0,
      }))

      const res = await fetch('/api/distribution', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || 'Основное распределение', entries }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Ошибка сохранения')
        return
      }
      setConfig(json)
      setSuccess('Распределение сохранено')
    } catch {
      setError('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <h1 className="page-title">Настройка распределения</h1>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">Настройка распределения</h1>

      {error && <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>{error}</div>}
      {success && <div className="alert alert-success" onClick={() => setSuccess('')} style={{ cursor: 'pointer' }}>{success}</div>}

      <div className="card">
        <div className="card-title">Активная конфигурация</div>
        <div className="form-group" style={{ maxWidth: 420 }}>
          <label>Название</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="table-wrap table-container desktop-only" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Участвует</th>
                <th>Наименование</th>
                <th>Тип</th>
                <th className="text-right">Доля</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.itemId}>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) => toggleEnabled(row.itemId, e.target.checked)}
                      style={{ width: 18, height: 18, minHeight: 18 }}
                    />
                  </td>
                  <td>{row.name}</td>
                  <td>{TYPE_LABELS[row.type]}</td>
                  <td className="text-right" style={{ minWidth: 140 }}>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={Number.isFinite(row.share) ? row.share : 0}
                      onChange={(e) => updateShare(row.itemId, Number(e.target.value))}
                      disabled={!row.enabled}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-only" style={{ marginTop: 12 }}>
          {rows.map((row) => (
            <div key={row.itemId} className="container-card">
              <div className="container-card-header">
                <span className="container-card-name">{row.name}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={row.enabled} onChange={(e) => toggleEnabled(row.itemId, e.target.checked)} />
                  участвует
                </label>
              </div>
              <div className="container-card-meta">
                <span className="frac-badge">{TYPE_LABELS[row.type]}</span>
              </div>
              <div className="form-group">
                <label>Доля</label>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={Number.isFinite(row.share) ? row.share : 0}
                  onChange={(e) => updateShare(row.itemId, Number(e.target.value))}
                  disabled={!row.enabled}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, color: isShareValid ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
          Сумма долей (включённые): {(totalShare * 100).toFixed(2)}% {isShareValid ? '✓' : '(должно быть 100%)'}
        </div>

        <div className="form-actions" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : 'Сохранить распределение'}</button>
        </div>

        <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 13 }}>
          Конфигурация ID: {config?.id}
        </div>
      </div>
    </>
  )
}
