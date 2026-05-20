'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CompanyOrder, Item } from '@/lib/types'
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants'

interface EditRow {
  id?: string
  companyName: string
  vesKg: string
  sitoKg: string
  lakKg: string
}

interface Exclusion { id: string; itemId: string }

const CURRENT_YEAR = 2026

export default function OrdersPage() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [orders, setOrders] = useState<CompanyOrder[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editRow, setEditRow] = useState<EditRow | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newRow, setNewRow] = useState<EditRow>({ companyName: '', vesKg: '0', sitoKg: '0', lakKg: '0' })

  // Exclusions: company name → exclusion list
  const [exclusions, setExclusions] = useState<Record<string, Exclusion[]>>({})
  const [openExcl, setOpenExcl] = useState<string | null>(null) // which company's exclusion panel is open
  const [savingExcl, setSavingExcl] = useState(false)

  // Year copy
  const [copyingYear, setCopyingYear] = useState(false)

  const load = useCallback(async (yr: number) => {
    setLoading(true)
    try {
      const [ordersRes, itemsRes] = await Promise.all([
        fetch(`/api/orders?year=${yr}`),
        fetch('/api/items'),
      ])
      if (!ordersRes.ok || !itemsRes.ok) throw new Error()
      setOrders(await ordersRes.json())
      setAllItems(await itemsRes.json())
    } catch {
      setError('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(year) }, [load, year])

  async function loadExclusions(companyName: string) {
    if (exclusions[companyName]) return // already loaded
    const res = await fetch(`/api/exclusions?company=${encodeURIComponent(companyName)}&year=${year}`)
    if (res.ok) {
      const rows: Exclusion[] = await res.json()
      setExclusions((p) => ({ ...p, [companyName]: rows }))
    }
  }

  async function toggleExclusion(companyName: string, itemId: string, currentlyExcluded: boolean) {
    setSavingExcl(true)
    try {
      if (currentlyExcluded) {
        // Remove exclusion
        await fetch('/api/exclusions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName, year, itemId }),
        })
        setExclusions((p) => ({
          ...p,
          [companyName]: (p[companyName] ?? []).filter((e) => e.itemId !== itemId),
        }))
      } else {
        // Add exclusion
        const res = await fetch('/api/exclusions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName, year, itemId }),
        })
        if (res.ok) {
          const row: Exclusion = await res.json()
          setExclusions((p) => ({
            ...p,
            [companyName]: [...(p[companyName] ?? []), row],
          }))
        }
      }
    } finally {
      setSavingExcl(false)
    }
  }

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
          year,
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
    if (!confirm(`Удалить заявку «${name}» за ${year} год?`)) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setOrders((prev) => prev.filter((o) => o.id !== id))
      setSuccess('Заявка удалена')
    } catch { setError('Ошибка удаления') }
    finally { setSaving(false) }
  }

  async function copyToNextYear() {
    const toYear = year + 1
    if (!confirm(`Скопировать все ${orders.length} заявок из ${year} в ${toYear} год?\n(Уже существующие в ${toYear} пропускаются)`)) return
    setCopyingYear(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/orders/copy-year', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromYear: year, toYear }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Ошибка копирования'); return }
      setSuccess(`Скопировано в ${toYear}: ${json.copied} заявок, пропущено ${json.skipped}, исключений ${json.copiedExclusions} ✓`)
    } catch { setError('Ошибка соединения') }
    finally { setCopyingYear(false) }
  }

  function startEdit(order: CompanyOrder) {
    setEditId(order.id)
    setEditRow({ id: order.id, companyName: order.companyName, vesKg: String(order.vesKg), sitoKg: String(order.sitoKg), lakKg: String(order.lakKg) })
    setShowAdd(false)
  }
  function cancelEdit() { setEditId(null); setEditRow(null) }

  const totalVes = orders.reduce((s, o) => s + o.vesKg, 0)
  const totalSito = orders.reduce((s, o) => s + o.sitoKg, 0)
  const totalLak = orders.reduce((s, o) => s + o.lakKg, 0)

  const vesItems = allItems.filter((i) => i.type === 'VES')
  const sitoItems = allItems.filter((i) => i.type === 'SITO')
  const lakItems = allItems.filter((i) => i.type === 'LAK')

  if (loading) return (
    <>
      <h1 className="page-title">📋 Заявки</h1>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <span className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    </>
  )

  return (
    <>
      <h1 className="page-title">📋 Заявки</h1>

      {error && <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>{error} <span style={{ float: 'right', opacity: 0.6 }}>✕</span></div>}
      {success && <div className="alert alert-success" onClick={() => setSuccess('')} style={{ cursor: 'pointer' }}>{success}</div>}

      {/* Year selector + copy-year */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, margin: 0 }}>
            <label style={{ whiteSpace: 'nowrap' }}>Год:</label>
            <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setOpenExcl(null); setExclusions({}) }} style={{ width: 100 }}>
              {[2025, 2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={copyToNextYear}
            disabled={copyingYear || orders.length === 0}
            title={`Скопировать все заявки из ${year} в ${year + 1}`}
          >
            {copyingYear ? <span className="spinner" /> : `📋 Скопировать в ${year + 1} год`}
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="card">
        <div className="card-title">Итого {orders.length} компаний за {year} год</div>
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

      {/* Companies list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="card-title" style={{ margin: 0 }}>Компании — {year} год</div>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowAdd(true); setEditId(null) }}>+ Добавить</button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
            <div className="form-grid-3" style={{ marginBottom: 10 }}>
              <div className="form-group">
                <label>Компания</label>
                <input value={newRow.companyName} onChange={(e) => setNewRow((p) => ({ ...p, companyName: e.target.value }))} placeholder="Название" autoFocus />
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
              <button className="btn btn-primary btn-sm" onClick={addOrder} disabled={saving || !newRow.companyName.trim()}>{saving ? <span className="spinner" /> : '✓ Сохранить'}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Отмена</button>
            </div>
          </div>
        )}

        {/* Desktop table */}
        <div className="table-wrap table-container desktop-only">
          <table>
            <thead>
              <tr>
                <th>Компания</th>
                <th className="text-right" style={{ color: TYPE_COLORS.VES }}>ВЕС, кг</th>
                <th className="text-right" style={{ color: TYPE_COLORS.SITO }}>СИТО, кг</th>
                <th className="text-right" style={{ color: TYPE_COLORS.LAK }}>ЛАК, кг</th>
                <th className="text-right">Итого</th>
                <th style={{ width: 130 }} />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <>
                  <tr key={order.id}>
                    <td style={{ fontWeight: 500 }}>
                      {editId === order.id
                        ? <input value={editRow?.companyName ?? ''} onChange={(e) => setEditRow((p) => p ? { ...p, companyName: e.target.value } : p)} style={{ width: '100%' }} />
                        : order.companyName}
                    </td>
                    {(['vesKg', 'sitoKg', 'lakKg'] as const).map((f) => (
                      <td key={f} className="text-right font-mono">
                        {editId === order.id
                          ? <input type="number" min="0" step={f === 'sitoKg' ? '100' : '0.5'} value={editRow?.[f] ?? '0'} onChange={(e) => setEditRow((p) => p ? { ...p, [f]: e.target.value } : p)} style={{ width: 90, textAlign: 'right' }} />
                          : order[f] > 0 ? order[f].toLocaleString('ru') : '—'}
                      </td>
                    ))}
                    <td className="text-right font-mono" style={{ fontWeight: 600 }}>{(order.vesKg + order.sitoKg + order.lakKg).toLocaleString('ru')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        {editId === order.id ? (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>{saving ? <span className="spinner" /> : '✓'}</button>
                            <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>✕</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-ghost btn-sm" title="Редактировать заявку" onClick={() => startEdit(order)}>✏️</button>
                            <button
                              className="btn btn-ghost btn-sm"
                              title="Исключить позиции"
                              style={{ color: openExcl === order.companyName ? 'var(--amber)' : undefined }}
                              onClick={() => {
                                if (openExcl === order.companyName) { setOpenExcl(null) }
                                else { setOpenExcl(order.companyName); loadExclusions(order.companyName) }
                              }}
                            >🚫</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteOrder(order.id, order.companyName)}>🗑</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Exclusions panel */}
                  {openExcl === order.companyName && (
                    <tr key={`${order.id}-excl`}>
                      <td colSpan={6} style={{ background: 'var(--bg)', padding: 0 }}>
                        <ExclusionsPanel
                          companyName={order.companyName}
                          year={year}
                          vesItems={vesItems}
                          sitoItems={sitoItems}
                          lakItems={lakItems}
                          companyOrder={order}
                          excluded={exclusions[order.companyName] ?? []}
                          saving={savingExcl}
                          onToggle={(itemId, isExcluded) => toggleExclusion(order.companyName, itemId, isExcluded)}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mobile-only" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map((order) => (
            <div key={order.id}>
              <div className="container-card">
                <div className="container-card-header">
                  <span className="container-card-name">{order.companyName}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(order)}>✏️</button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: openExcl === order.companyName ? 'var(--amber)' : undefined }}
                      onClick={() => {
                        if (openExcl === order.companyName) { setOpenExcl(null) }
                        else { setOpenExcl(order.companyName); loadExclusions(order.companyName) }
                      }}
                    >🚫</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteOrder(order.id, order.companyName)}>🗑</button>
                  </div>
                </div>
                {editId === order.id && editRow ? (
                  <div style={{ marginTop: 8 }}>
                    {(['vesKg', 'sitoKg', 'lakKg'] as const).map((f) => (
                      <div key={f} className="form-group" style={{ marginBottom: 8 }}>
                        <label style={{ color: TYPE_COLORS[f === 'vesKg' ? 'VES' : f === 'sitoKg' ? 'SITO' : 'LAK'] }}>
                          {TYPE_LABELS[f === 'vesKg' ? 'VES' : f === 'sitoKg' ? 'SITO' : 'LAK']}, кг
                        </label>
                        <input type="number" min="0" value={editRow[f]} onChange={(e) => setEditRow((p) => p ? { ...p, [f]: e.target.value } : p)} />
                      </div>
                    ))}
                    <div className="form-actions">
                      <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>✓ Сохранить</button>
                      <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {order.vesKg > 0 && <span className="cat-badge" style={{ background: `${TYPE_COLORS.VES}22`, color: TYPE_COLORS.VES, borderColor: `${TYPE_COLORS.VES}55`, fontSize: 12 }}>Вес {order.vesKg.toLocaleString('ru')} кг</span>}
                    {order.sitoKg > 0 && <span className="cat-badge" style={{ background: `${TYPE_COLORS.SITO}22`, color: TYPE_COLORS.SITO, borderColor: `${TYPE_COLORS.SITO}55`, fontSize: 12 }}>Сито {order.sitoKg.toLocaleString('ru')} кг</span>}
                    {order.lakKg > 0 && <span className="cat-badge" style={{ background: `${TYPE_COLORS.LAK}22`, color: TYPE_COLORS.LAK, borderColor: `${TYPE_COLORS.LAK}55`, fontSize: 12 }}>Лак {order.lakKg.toLocaleString('ru')} кг</span>}
                  </div>
                )}
              </div>
              {openExcl === order.companyName && (
                <ExclusionsPanel
                  companyName={order.companyName}
                  year={year}
                  vesItems={vesItems}
                  sitoItems={sitoItems}
                  lakItems={lakItems}
                  companyOrder={order}
                  excluded={exclusions[order.companyName] ?? []}
                  saving={savingExcl}
                  onToggle={(itemId, isExcluded) => toggleExclusion(order.companyName, itemId, isExcluded)}
                />
              )}
            </div>
          ))}
        </div>

        {orders.length === 0 && !showAdd && (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="empty-state-icon">📋</div>
            <div>Нет заявок за {year} год. Нажмите «+ Добавить» или скопируйте из другого года.</div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Exclusions Panel ──────────────────────────────────────────────────────────
interface ExclusionsPanelProps {
  companyName: string
  year: number
  vesItems: Item[]
  sitoItems: Item[]
  lakItems: Item[]
  companyOrder: CompanyOrder
  excluded: Exclusion[]
  saving: boolean
  onToggle: (itemId: string, isCurrentlyExcluded: boolean) => void
}

function ExclusionsPanel({ companyName, vesItems, sitoItems, lakItems, companyOrder, excluded, saving, onToggle }: ExclusionsPanelProps) {
  const excludedSet = new Set(excluded.map((e) => e.itemId))

  // Only show categories the company actually orders
  const categoriesToShow = [
    ...(companyOrder.vesKg > 0 ? [{ type: 'VES' as const, items: vesItems }] : []),
    ...(companyOrder.sitoKg > 0 ? [{ type: 'SITO' as const, items: sitoItems }] : []),
    ...(companyOrder.lakKg > 0 ? [{ type: 'LAK' as const, items: lakItems }] : []),
  ]

  const excludedCount = excluded.length

  return (
    <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>🚫 Исключения из отгрузки</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {companyName}</span>
        {excludedCount > 0 && (
          <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
            {excludedCount} исключено
          </span>
        )}
        {saving && <span className="spinner" />}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Снимите галочку с позиций, которые не нужно отгружать этой компании. Их доля будет пропорционально перераспределена между остальными.
      </div>

      {categoriesToShow.map(({ type, items }) => {
        const color = TYPE_COLORS[type]
        return (
          <div key={type} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {TYPE_LABELS[type]} ({items.length} поз.)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '4px 12px' }}>
              {items.map((item) => {
                const isExcluded = excludedSet.has(item.id)
                return (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      padding: '3px 0',
                      opacity: isExcluded ? 0.5 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!isExcluded}
                      onChange={() => onToggle(item.id, isExcluded)}
                      disabled={saving}
                      style={{ width: 14, height: 14, minHeight: 'unset', flex: 'none' }}
                    />
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{item.article}</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>{item.lotKg}кг</span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {categoriesToShow.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Нет категорий для исключения (заявка на все категории = 0).</div>
      )}
    </div>
  )
}
