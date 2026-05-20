'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CompanyOrder } from '@/lib/types'
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants'

interface EditRow {
  id?: string
  companyName: string
  vesKg: string
  sitoKg: string
  lakKg: string
}

const YEAR = 2026

export default function OrdersPage() {
  const [orders, setOrders] = useState<CompanyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<EditRow | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newRow, setNewRow] = useState<EditRow>({ companyName: '', vesKg: '0', sitoKg: '0', lakKg: '0' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders?year=${YEAR}`)
      if (!res.ok) throw new Error()
      setOrders(await res.json())
    } catch {
      setError('Не удалось загрузить заявки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function saveEdit() {
    if (!editRow || !editId) return
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await fetch(`/api/orders/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: editRow.companyName.trim(),
          vesKg: Number(editRow.vesKg),
          sitoKg: Number(editRow.sitoKg),
          lakKg: Number(editRow.lakKg),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Ошибка сохранения'); return }
      setOrders((prev) => prev.map((o) => o.id === editId ? json : o))
      setEditId(null); setEditRow(null)
      setSuccess('Заявка обновлена ✓')
    } catch { setError('Ошибка соединения') }
    finally { setSaving(false) }
  }

  async function addOrder() {
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: newRow.companyName.trim(),
          vesKg: Number(newRow.vesKg),
          sitoKg: Number(newRow.sitoKg),
          lakKg: Number(newRow.lakKg),
          year: YEAR,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Ошибка добавления'); return }
      setOrders((prev) => [...prev, json].sort((a, b) => a.companyName.localeCompare(b.companyName, 'ru')))
      setShowAdd(false)
      setNewRow({ companyName: '', vesKg: '0', sitoKg: '0', lakKg: '0' })
      setSuccess('Заявка добавлена ✓')
    } catch { setError('Ошибка соединения') }
    finally { setSaving(false) }
  }

  async function deleteOrder(id: string, name: string) {
    if (!confirm(`Удалить заявку «${name}»?`)) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setOrders((prev) => prev.filter((o) => o.id !== id))
      setSuccess('Заявка удалена')
    } catch { setError('Ошибка удаления') }
    finally { setSaving(false) }
  }

  function startEdit(order: CompanyOrder) {
    setEditId(order.id)
    setEditRow({
      id: order.id,
      companyName: order.companyName,
      vesKg: String(order.vesKg),
      sitoKg: String(order.sitoKg),
      lakKg: String(order.lakKg),
    })
    setShowAdd(false)
  }

  function cancelEdit() { setEditId(null); setEditRow(null) }

  const totalVes = orders.reduce((s, o) => s + o.vesKg, 0)
  const totalSito = orders.reduce((s, o) => s + o.sitoKg, 0)
  const totalLak = orders.reduce((s, o) => s + o.lakKg, 0)

  if (loading) {
    return (
      <>
        <h1 className="page-title">📋 Заявки на {YEAR} год</h1>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title">📋 Заявки на {YEAR} год</h1>

      {error && (
        <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
          {error} <span style={{ float: 'right', opacity: 0.6 }}>✕</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success" onClick={() => setSuccess('')} style={{ cursor: 'pointer' }}>
          {success}
        </div>
      )}

      {/* Totals */}
      <div className="card">
        <div className="card-title">Итого по всем компаниям</div>
        <div className="result-stats">
          <div className="stat-item">
            <div className="stat-label" style={{ color: TYPE_COLORS.VES }}>ВЕС</div>
            <div className="stat-value">{totalVes.toLocaleString('ru')}<span className="stat-unit"> кг</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>лот 9 974 кг</div>
          </div>
          <div className="stat-item">
            <div className="stat-label" style={{ color: TYPE_COLORS.SITO }}>СИТО</div>
            <div className="stat-value">{totalSito.toLocaleString('ru')}<span className="stat-unit"> кг</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>лот 100 000 кг</div>
          </div>
          <div className="stat-item">
            <div className="stat-label" style={{ color: TYPE_COLORS.LAK }}>ЛАК</div>
            <div className="stat-value">{totalLak.toLocaleString('ru')}<span className="stat-unit"> кг</span></div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>лот 26 кг</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Компаний</div>
            <div className="stat-value">{orders.length}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div className="card-title" style={{ margin: 0 }}>Компании</div>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowAdd(true); setEditId(null) }}>
            + Добавить
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary, #ffffff08)' }}>
            <div className="form-grid-3" style={{ marginBottom: 10 }}>
              <div className="form-group">
                <label>Компания</label>
                <input
                  value={newRow.companyName}
                  onChange={(e) => setNewRow((p) => ({ ...p, companyName: e.target.value }))}
                  placeholder="Название компании"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label style={{ color: TYPE_COLORS.VES }}>ВЕС, кг</label>
                <input type="number" min="0" step="0.5" value={newRow.vesKg} onChange={(e) => setNewRow((p) => ({ ...p, vesKg: e.target.value }))} />
              </div>
              <div className="form-group">
                <label style={{ color: TYPE_COLORS.SITO }}>СИТО, кг</label>
                <input type="number" min="0" step="100" value={newRow.sitoKg} onChange={(e) => setNewRow((p) => ({ ...p, sitoKg: e.target.value }))} />
              </div>
              <div className="form-group">
                <label style={{ color: TYPE_COLORS.LAK }}>ЛАК, кг</label>
                <input type="number" min="0" step="0.5" value={newRow.lakKg} onChange={(e) => setNewRow((p) => ({ ...p, lakKg: e.target.value }))} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary btn-sm" onClick={addOrder} disabled={saving || !newRow.companyName.trim()}>
                {saving ? <span className="spinner" /> : '✓ Сохранить'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Отмена</button>
            </div>
          </div>
        )}

        {/* Desktop */}
        <div className="table-wrap table-container desktop-only">
          <table>
            <thead>
              <tr>
                <th>Компания</th>
                <th className="text-right" style={{ color: TYPE_COLORS.VES }}>ВЕС, кг</th>
                <th className="text-right" style={{ color: TYPE_COLORS.SITO }}>СИТО, кг</th>
                <th className="text-right" style={{ color: TYPE_COLORS.LAK }}>ЛАК, кг</th>
                <th className="text-right">Итого</th>
                <th style={{ width: 100 }} />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 500 }}>
                    {editId === order.id ? (
                      <input
                        value={editRow?.companyName ?? ''}
                        onChange={(e) => setEditRow((p) => p ? { ...p, companyName: e.target.value } : p)}
                        style={{ width: '100%' }}
                      />
                    ) : order.companyName}
                  </td>
                  <td className="text-right font-mono">
                    {editId === order.id ? (
                      <input type="number" min="0" step="0.5" value={editRow?.vesKg ?? '0'}
                        onChange={(e) => setEditRow((p) => p ? { ...p, vesKg: e.target.value } : p)}
                        style={{ width: 90, textAlign: 'right' }} />
                    ) : order.vesKg > 0 ? order.vesKg.toLocaleString('ru') : '—'}
                  </td>
                  <td className="text-right font-mono">
                    {editId === order.id ? (
                      <input type="number" min="0" step="100" value={editRow?.sitoKg ?? '0'}
                        onChange={(e) => setEditRow((p) => p ? { ...p, sitoKg: e.target.value } : p)}
                        style={{ width: 90, textAlign: 'right' }} />
                    ) : order.sitoKg > 0 ? order.sitoKg.toLocaleString('ru') : '—'}
                  </td>
                  <td className="text-right font-mono">
                    {editId === order.id ? (
                      <input type="number" min="0" step="0.5" value={editRow?.lakKg ?? '0'}
                        onChange={(e) => setEditRow((p) => p ? { ...p, lakKg: e.target.value } : p)}
                        style={{ width: 90, textAlign: 'right' }} />
                    ) : order.lakKg > 0 ? order.lakKg.toLocaleString('ru') : '—'}
                  </td>
                  <td className="text-right font-mono" style={{ fontWeight: 600 }}>
                    {(order.vesKg + order.sitoKg + order.lakKg).toLocaleString('ru')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {editId === order.id ? (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>
                            {saving ? <span className="spinner" /> : '✓'}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>✕</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => startEdit(order)}>✏️</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                            onClick={() => deleteOrder(order.id, order.companyName)}>🗑</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="mobile-only" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map((order) => (
            <div key={order.id} className="container-card">
              <div className="container-card-header">
                <span className="container-card-name">{order.companyName}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(order)}>✏️</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }}
                    onClick={() => deleteOrder(order.id, order.companyName)}>🗑</button>
                </div>
              </div>
              {editId === order.id && editRow ? (
                <div style={{ marginTop: 8 }}>
                  {(['vesKg', 'sitoKg', 'lakKg'] as const).map((field) => (
                    <div key={field} className="form-group" style={{ marginBottom: 8 }}>
                      <label style={{ color: TYPE_COLORS[field === 'vesKg' ? 'VES' : field === 'sitoKg' ? 'SITO' : 'LAK'] }}>
                        {TYPE_LABELS[field === 'vesKg' ? 'VES' : field === 'sitoKg' ? 'SITO' : 'LAK']}, кг
                      </label>
                      <input type="number" min="0" value={editRow[field]}
                        onChange={(e) => setEditRow((p) => p ? { ...p, [field]: e.target.value } : p)} />
                    </div>
                  ))}
                  <div className="form-actions">
                    <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>✓ Сохранить</button>
                    <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Отмена</button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {order.vesKg > 0 && (
                    <span className="cat-badge" style={{ background: `${TYPE_COLORS.VES}22`, color: TYPE_COLORS.VES, borderColor: `${TYPE_COLORS.VES}55` }}>
                      Вес {order.vesKg.toLocaleString('ru')} кг
                    </span>
                  )}
                  {order.sitoKg > 0 && (
                    <span className="cat-badge" style={{ background: `${TYPE_COLORS.SITO}22`, color: TYPE_COLORS.SITO, borderColor: `${TYPE_COLORS.SITO}55` }}>
                      Сито {order.sitoKg.toLocaleString('ru')} кг
                    </span>
                  )}
                  {order.lakKg > 0 && (
                    <span className="cat-badge" style={{ background: `${TYPE_COLORS.LAK}22`, color: TYPE_COLORS.LAK, borderColor: `${TYPE_COLORS.LAK}55` }}>
                      Лак {order.lakKg.toLocaleString('ru')} кг
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {orders.length === 0 && !showAdd && (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="empty-state-icon">📋</div>
            <div>Нет заявок. Нажмите «+ Добавить» чтобы создать первую.</div>
          </div>
        )}
      </div>
    </>
  )
}
