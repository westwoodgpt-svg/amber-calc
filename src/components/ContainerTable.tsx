'use client'

import { useMemo, useState } from 'react'
import type { Item } from '@/lib/types'
import { STONE_TYPES, TYPE_COLORS, TYPE_DEFAULT_PACK_WEIGHT, TYPE_DESCRIPTIONS, TYPE_LABELS, type StoneType, defaultName } from '@/lib/constants'

interface Props {
  items: Item[]
  onAdd: (data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onUpdate: (id: string, data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading: boolean
}

interface FormState {
  name: string
  type: StoneType
  share: string
  packWeight: string
  weightConfirmed: boolean
  balance: string
}

function TypeBadge({ type }: { type: StoneType }) {
  const color = TYPE_COLORS[type]
  return (
    <span className="cat-badge" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>
      {TYPE_LABELS[type]}
    </span>
  )
}

function toPayload(form: FormState): Omit<Item, 'id' | 'createdAt' | 'updatedAt'> | null {
  const share = Number(form.share)
  const packWeight = Number(form.packWeight)
  const balance = Number(form.balance)

  if (!form.name.trim()) return null
  if (!Number.isFinite(share) || share < 0) return null
  if (!Number.isFinite(packWeight) || packWeight <= 0) return null
  if (!Number.isFinite(balance)) return null

  return {
    name: form.name.trim(),
    type: form.type,
    share,
    packWeight,
    weightConfirmed: form.weightConfirmed,
    balance,
  }
}

function useForm(initial?: Item) {
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? defaultName('fraction'),
    type: (initial?.type as StoneType | undefined) ?? 'fraction',
    share: initial ? String(initial.share) : '0.5',
    packWeight: initial ? String(initial.packWeight) : String(TYPE_DEFAULT_PACK_WEIGHT.fraction),
    weightConfirmed: initial?.weightConfirmed ?? false,
    balance: initial ? String(initial.balance) : '0',
  })

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => {
      if (field === 'type') {
        const nextType = value as StoneType
        const next = {
          ...prev,
          type: nextType,
          packWeight: String(TYPE_DEFAULT_PACK_WEIGHT[nextType]),
        }
        if (!prev.name.trim() || prev.name === defaultName(prev.type)) {
          next.name = defaultName(nextType)
        }
        return next
      }
      return { ...prev, [field]: value }
    })
  }

  return { form, update, setForm }
}

function AddForm({ onAdd, loading }: { onAdd: Props['onAdd']; loading: boolean }) {
  const { form, update, setForm } = useForm()
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const payload = toPayload({ ...form, weightConfirmed: false, balance: '0' })
    if (!payload) {
      setError('Проверьте имя, долю и вес упаковки')
      return
    }
    await onAdd({ ...payload, weightConfirmed: false, balance: 0 })
    setForm({
      name: defaultName(form.type),
      type: form.type,
      share: form.share,
      packWeight: String(TYPE_DEFAULT_PACK_WEIGHT[form.type]),
      weightConfirmed: false,
      balance: '0',
    })
    setError('')
  }

  return (
    <form className="add-form-panel" onSubmit={handleAdd}>
      <div className="add-form-title">Новая позиция</div>
      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="form-grid-3">
        <div className="form-group">
          <label>Тип</label>
          <select value={form.type} onChange={(e) => update('type', e.target.value as StoneType)}>
            {STONE_TYPES.map((type) => (
              <option key={type} value={type}>{TYPE_LABELS[type]}</option>
            ))}
          </select>
          <small style={{ color: 'var(--text-muted)' }}>{TYPE_DESCRIPTIONS[form.type]}</small>
        </div>
        <div className="form-group">
          <label>Доля (%)</label>
          <input type="number" min="0" step="0.0001" value={form.share} onChange={(e) => update('share', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Вес упаковки (кг)</label>
          <input type="number" min="0.001" step="0.001" value={form.packWeight} onChange={(e) => update('packWeight', e.target.value)} />
        </div>
      </div>
      <div className="form-group" style={{ marginTop: 8 }}>
        <label>Наименование</label>
        <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Добавить'}
        </button>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
        При создании вес всегда считается неподтверждённым. Подтвердите его в строке позиции.
      </div>
    </form>
  )
}

function EditModal({ item, onUpdate, onClose, loading }: { item: Item; onUpdate: Props['onUpdate']; onClose: () => void; loading: boolean }) {
  const { form, update } = useForm(item)
  const [error, setError] = useState('')

  async function handleSave() {
    const payload = toPayload(form)
    if (!payload) {
      setError('Проверьте имя, долю, вес упаковки и баланс')
      return
    }
    await onUpdate(item.id, payload)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-title">
          <span>Редактировать позицию</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
        <div className="form-grid-3">
          <div className="form-group">
            <label>Тип</label>
            <select value={form.type} onChange={(e) => update('type', e.target.value as StoneType)}>
              {STONE_TYPES.map((type) => (
                <option key={type} value={type}>{TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Доля</label>
            <input type="number" min="0" step="0.0001" value={form.share} onChange={(e) => update('share', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Вес упаковки (кг)</label>
            <input type="number" min="0.001" step="0.001" value={form.packWeight} onChange={(e) => update('packWeight', e.target.value)} />
          </div>
        </div>
        <div className="form-grid-2" style={{ marginTop: 8 }}>
          <div className="form-group">
            <label>Наименование</label>
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Текущий баланс (кг)</label>
            <input type="number" step="0.001" value={form.balance} onChange={(e) => update('balance', e.target.value)} />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={form.weightConfirmed}
            onChange={(e) => update('weightConfirmed', e.target.checked)}
          />
          Вес подтверждён
        </label>
        <div className="form-actions" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Сохранить'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  )
}

export default function ContainerTable({ items, onAdd, onUpdate, onDelete, loading }: Props) {
  const [editId, setEditId] = useState<string | null>(null)
  const editItem = useMemo(() => items.find((item) => item.id === editId) ?? null, [items, editId])

  return (
    <div className="card">
      <div className="card-title">Позиции ассортимента</div>

      {items.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <div className="empty-state-icon">📦</div>
          <div>Добавьте позиции для расчёта.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Тип</th>
                <th className="text-right">Доля</th>
                <th className="text-right">Упаковка (кг)</th>
                <th className="text-right">Баланс (кг)</th>
                <th>Вес подтверждён</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td><TypeBadge type={item.type} /></td>
                  <td className="text-right font-mono">{item.share.toFixed(4)}</td>
                  <td className="text-right font-mono">{item.packWeight.toFixed(3)}</td>
                  <td className="text-right font-mono">{item.balance.toFixed(3)}</td>
                  <td style={{ color: item.weightConfirmed ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {item.weightConfirmed ? 'Да' : 'Нет'}
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
      )}

      <hr className="section-divider" />
      <AddForm onAdd={onAdd} loading={loading} />

      {editItem && (
        <EditModal
          item={editItem}
          onUpdate={onUpdate}
          onClose={() => setEditId(null)}
          loading={loading}
        />
      )}
    </div>
  )
}
