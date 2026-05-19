'use client'

import { useMemo, useState } from 'react'
import type { Item } from '@/lib/types'
import type { ItemType } from '@prisma/client'
import {
  ITEM_TYPES,
  TYPE_COLORS,
  TYPE_DEFAULT_PACK_WEIGHT,
  TYPE_DESCRIPTIONS,
  TYPE_LABELS,
  defaultName,
} from '@/lib/constants'

interface Props {
  items: Item[]
  sharedItemIds: Set<string>
  onAdd: (data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onUpdate: (id: string, data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading: boolean
}

interface FormState {
  name: string
  type: ItemType
  packWeight: string
}

// ── helpers ──────────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: ItemType }) {
  const color = TYPE_COLORS[type]
  return (
    <span className="cat-badge" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>
      {TYPE_LABELS[type]}
    </span>
  )
}

function useItemForm(initial?: Item) {
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? defaultName('fraction'),
    type: initial?.type ?? 'fraction',
    packWeight: initial ? String(initial.packWeight) : String(TYPE_DEFAULT_PACK_WEIGHT.fraction),
  })

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => {
      if (field === 'type') {
        const nextType = value as ItemType
        return {
          ...prev,
          type: nextType,
          packWeight: String(TYPE_DEFAULT_PACK_WEIGHT[nextType]),
          name: !prev.name || prev.name === defaultName(prev.type) ? defaultName(nextType) : prev.name,
        }
      }
      return { ...prev, [field]: value }
    })
  }

  return { form, update, setForm }
}

function parsePayload(form: FormState): Omit<Item, 'id' | 'createdAt' | 'updatedAt'> | null {
  const packWeight = Number(form.packWeight)
  if (!form.name.trim()) return null
  if (!Number.isFinite(packWeight) || packWeight <= 0) return null
  return { name: form.name.trim(), type: form.type, packWeight, defaultPacks: 0, weightConfirmed: false }
}

// ── Add form ─────────────────────────────────────────────────────────────────
function AddForm({ loading, onAdd }: { loading: boolean; onAdd: Props['onAdd'] }) {
  const { form, update, setForm } = useItemForm()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const payload = parsePayload(form)
    if (!payload) { setError('Проверьте наименование и вес упаковки'); return }
    await onAdd({ ...payload, weightConfirmed: false })
    setForm({ name: defaultName(form.type), type: form.type, packWeight: String(TYPE_DEFAULT_PACK_WEIGHT[form.type]) })
    setError('')
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="add-trigger">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Добавить позицию</button>
      </div>
    )
  }

  return (
    <form className="add-form-panel" onSubmit={submit}>
      <div className="add-form-title">Новая позиция</div>
      {error && <div className="alert alert-error" style={{ marginBottom: 10 }}>{error}</div>}
      <div className="form-grid-3">
        <div className="form-group">
          <label>Тип</label>
          <select value={form.type} onChange={(e) => update('type', e.target.value as ItemType)}>
            {ITEM_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>{TYPE_DESCRIPTIONS[form.type]}</small>
        </div>
        <div className="form-group">
          <label>Наименование</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Название позиции" />
        </div>
        <div className="form-group">
          <label>Упаковка (кг)</label>
          <input
            type="number" min="0.001" step="0.001"
            value={form.packWeight} onChange={(e) => update('packWeight', e.target.value)}
          />
        </div>
      </div>
      <div className="alert alert-info" style={{ marginTop: 10, marginBottom: 0, fontSize: 13 }}>
        После создания подтвердите вес в таблице, чтобы позиция участвовала в расчёте.
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : '✓ Добавить'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Отмена</button>
      </div>
    </form>
  )
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ item, loading, onUpdate, onClose }: {
  item: Item; loading: boolean; onUpdate: Props['onUpdate']; onClose: () => void
}) {
  const { form, update } = useItemForm(item)
  const [confirmed, setConfirmed] = useState(item.weightConfirmed)
  const [error, setError] = useState('')

  async function save() {
    const payload = parsePayload(form)
    if (!payload) { setError('Проверьте наименование и вес упаковки'); return }
    await onUpdate(item.id, { ...payload, weightConfirmed: confirmed })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-title">
          <span>✏️ Редактировать позицию</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: 10 }}>{error}</div>}
        <div className="form-grid-3">
          <div className="form-group">
            <label>Тип</label>
            <select value={form.type} onChange={(e) => update('type', e.target.value as ItemType)}>
              {ITEM_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Наименование</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Упаковка (кг)</label>
            <input type="number" min="0.001" step="0.001"
              value={form.packWeight} onChange={(e) => update('packWeight', e.target.value)} />
          </div>
        </div>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14, cursor: 'pointer' }}>
          <input
            type="checkbox" checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ width: 20, height: 20, minHeight: 20 }}
          />
          <span style={{ fontSize: 14 }}>
            Вес упаковки подтверждён {confirmed
              ? <span style={{ color: 'var(--green)' }}>(позиция участвует в расчёте)</span>
              : <span style={{ color: 'var(--red)' }}>(позиция исключена из расчёта)</span>}
          </span>
        </label>
        <div className="form-actions" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={save} disabled={loading}>
            {loading ? <span className="spinner" /> : '💾 Сохранить'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ContainerTable({ items, sharedItemIds, onAdd, onUpdate, onDelete, loading }: Props) {
  const [editId, setEditId] = useState<string | null>(null)
  const editItem = useMemo(() => items.find((item) => item.id === editId) ?? null, [items, editId])

  async function confirmWeight(item: Item) {
    await onUpdate(item.id, {
      name: item.name,
      type: item.type,
      packWeight: item.packWeight,
      defaultPacks: item.defaultPacks,
      weightConfirmed: true,
    })
  }

  return (
    <div className="card">
      <div className="card-title">📦 Справочник позиций</div>

      {items.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <div className="empty-state-icon">📦</div>
          <div>Добавьте первую позицию ниже.</div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-wrap table-container desktop-only">
            <table>
              <thead>
                <tr>
                  <th>Наименование</th>
                  <th>Тип</th>
                  <th className="text-right">Упаковка (кг)</th>
                  <th>Вес подтверждён</th>
                  <th>В распределении</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td><TypeBadge type={item.type} /></td>
                    <td className="text-right font-mono">{item.packWeight.toFixed(3)}</td>
                    <td>
                      {item.weightConfirmed ? (
                        <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ Да</span>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ borderColor: 'var(--amber)', color: 'var(--amber)', fontSize: 12 }}
                          onClick={() => confirmWeight(item)}
                          disabled={loading}
                        >
                          Подтвердить
                        </button>
                      )}
                    </td>
                    <td style={{ color: sharedItemIds.has(item.id) ? 'var(--green)' : 'var(--text-muted)' }}>
                      {sharedItemIds.has(item.id) ? '✓ Да' : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditId(item.id)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id)} disabled={loading}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mobile-only">
            {items.map((item) => {
              const color = TYPE_COLORS[item.type]
              return (
                <div key={item.id} className="container-card">
                  <div className="container-card-header">
                    <span className="container-card-name">{item.name}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditId(item.id)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id)} disabled={loading}>🗑</button>
                    </div>
                  </div>
                  <div className="container-card-meta">
                    <span className="cat-badge" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>
                      {TYPE_LABELS[item.type]}
                    </span>
                    {sharedItemIds.has(item.id) && (
                      <span className="frac-badge" style={{ fontSize: 11 }}>в распределении</span>
                    )}
                  </div>
                  <div className="container-card-row">
                    <span>Упаковка: <strong className="font-mono">{item.packWeight.toFixed(3)} кг</strong></span>
                    <span>
                      Вес:{' '}
                      {item.weightConfirmed ? (
                        <strong style={{ color: 'var(--green)' }}>подтверждён ✓</strong>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ borderColor: 'var(--amber)', color: 'var(--amber)', fontSize: 12, minHeight: 30, padding: '4px 10px' }}
                          onClick={() => confirmWeight(item)}
                          disabled={loading}
                        >
                          Подтвердить
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <hr className="section-divider" />
      <AddForm loading={loading} onAdd={onAdd} />

      {editItem && (
        <EditModal item={editItem} loading={loading} onUpdate={onUpdate} onClose={() => setEditId(null)} />
      )}
    </div>
  )
}
