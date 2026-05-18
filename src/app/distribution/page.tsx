'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DistributionConfigView, Item } from '@/lib/types'
import { TYPE_LABELS } from '@/lib/constants'

interface RowState {
  item: Item
  included: boolean
  share: string
}

export default function DistributionPage() {
  const [items, setItems] = useState<Item[]>([])
  const [config, setConfig] = useState<DistributionConfigView | null>(null)
  const [rows, setRows] = useState<RowState[]>([])
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

      const map = new Map(distJson.items.map((row) => [row.itemId, row.share]))
      setRows(itemsJson.map((item) => ({
        item,
        included: map.has(item.id),
        share: map.has(item.id) ? String(map.get(item.id)) : '',
      })))
    } catch {
      setError('Не удалось загрузить настройки распределения')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sum = useMemo(() => rows.reduce((acc, row) => acc + (row.included ? Number(row.share || 0) : 0), 0), [rows])

  function updateRow(itemId: string, patch: Partial<RowState>) {
    setRows((prev) => prev.map((row) => row.item.id === itemId ? { ...row, ...patch } : row))
  }

  async function save() {
    setError('')
    setSuccess('')

    const entries = rows
      .filter((row) => row.included)
      .map((row) => ({ itemId: row.item.id, share: Number(row.share) }))

    if (entries.length === 0) {
      setError('Добавьте хотя бы одну позицию в распределение')
      return
    }

    if (entries.some((entry) => !Number.isFinite(entry.share) || entry.share <= 0)) {
      setError('Для включённых позиций доля должна быть числом > 0')
      return
    }

    const calcSum = entries.reduce((acc, entry) => acc + entry.share, 0)
    if (Math.abs(calcSum - 1) > 0.0001) {
      setError(`Сумма долей должна быть ровно 1. Сейчас: ${calcSum.toFixed(4)}`)
      return
    }

    setSaving(true)
    try {
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
        <div className="form-group" style={{ maxWidth: 380 }}>
          <label>Название</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="table-wrap" style={{ marginTop: 12 }}>
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
                <tr key={row.item.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.included}
                      onChange={(e) => updateRow(row.item.id, { included: e.target.checked })}
                      style={{ width: 18, height: 18, minHeight: 18 }}
                    />
                  </td>
                  <td>{row.item.name}</td>
                  <td>{TYPE_LABELS[row.item.type]}</td>
                  <td className="text-right" style={{ minWidth: 140 }}>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={row.share}
                      onChange={(e) => updateRow(row.item.id, { share: e.target.value })}
                      disabled={!row.included}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, color: Math.abs(sum - 1) <= 0.0001 ? 'var(--green)' : 'var(--red)' }}>
          Сумма долей: {sum.toFixed(4)} {Math.abs(sum - 1) <= 0.0001 ? '✓' : '(должна быть 1.0000)'}
        </div>

        <div className="form-actions" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : 'Сохранить распределение'}</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Правила</div>
        <ul style={{ paddingLeft: 18, color: 'var(--text-muted)' }}>
          <li>Новая позиция не участвует в расчёте, пока не добавлена в распределение.</li>
          <li>Сумма долей должна быть равна 1.</li>
          <li>Позиции с неподтверждённым весом будут блокировать расчёт.</li>
        </ul>
      </div>
    </>
  )
}
