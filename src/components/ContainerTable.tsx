'use client'

import { useState } from 'react'
import type { Container } from '@/lib/types'
import { CATEGORIES, FRACTIONS, CATEGORIES_WITH_FRACTION, CATEGORY_COLORS, autoName } from '@/lib/constants'

interface Props {
  containers: Container[]
  onAdd: (data: Omit<Container, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onUpdate: (id: string, data: Omit<Container, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading: boolean
  flashIds?: Set<string>
}

function useFractionOptions(category: string) {
  const hasFraction = CATEGORIES_WITH_FRACTION.includes(category as never)
  if (!hasFraction) return ['без фракции', 'несортированный']
  return FRACTIONS
}

// ── Inline form (add or edit) ────────────────────────────────────────────────
interface FormState {
  name: string
  category: string
  fraction: string
  weight: string
  quantity: string
  nameEdited: boolean
}

function useContainerForm(initial?: Partial<Container>) {
  const initCategory = initial?.category ?? 'фракционный'
  const initFraction = initial?.fraction ?? '+8 мм'
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? autoName(initCategory, initFraction),
    category: initCategory,
    fraction: initFraction,
    weight: initial?.weight ? String(initial.weight) : '',
    quantity: initial?.quantity ? String(initial.quantity) : '',
    nameEdited: !!initial?.name,
  })

  function update(field: keyof FormState, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if ((field === 'category' || field === 'fraction') && !prev.nameEdited) {
        const cat = field === 'category' ? (value as string) : prev.category
        const frac = field === 'fraction' ? (value as string) : prev.fraction
        next.name = autoName(cat, frac)
      }
      return next
    })
  }

  return { form, update }
}

// ── Add row (bottom of table / card stack) ───────────────────────────────────
function AddForm({ onAdd, loading }: { onAdd: Props['onAdd']; loading: boolean }) {
  const { form, update } = useContainerForm()
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const fractionOptions = useFractionOptions(form.category)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const w = parseFloat(form.weight)
    const q = parseInt(form.quantity)
    if (!form.weight || isNaN(w) || w <= 0) { setError('Введите корректный вес'); return }
    if (!form.quantity || isNaN(q) || q < 1) { setError('Введите корректное количество'); return }
    await onAdd({
      name: form.name.trim() || autoName(form.category, form.fraction),
      category: form.category,
      fraction: form.fraction || null,
      weight: w,
      quantity: q,
    })
    setOpen(false)
    update('weight', '')
    update('quantity', '')
    update('nameEdited', false)
  }

  if (!open) {
    return (
      <div className="add-trigger">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          + Добавить позицию
        </button>
      </div>
    )
  }

  return (
    <div className="add-form-panel">
      <div className="add-form-title">Новая позиция</div>
      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
      <div className="form-grid-2">
        <div className="form-group">
          <label>Вид сырья</label>
          <select value={form.category} onChange={e => update('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Фракция</label>
          <select value={form.fraction} onChange={e => update('fraction', e.target.value)}>
            {fractionOptions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Вес контейнера (кг)</label>
          <input
            type="number" step="0.001" min="0.001" placeholder="0.000"
            value={form.weight} onChange={e => update('weight', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Количество</label>
          <input
            type="number" min="1" step="1" placeholder="1"
            value={form.quantity} onChange={e => update('quantity', e.target.value)}
          />
        </div>
      </div>
      <div className="form-group" style={{ marginTop: 8 }}>
        <label>Наименование <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(авто или своё)</span></label>
        <input
          type="text" placeholder="Автогенерация…"
          value={form.name}
          onChange={e => { update('name', e.target.value); update('nameEdited', e.target.value !== autoName(form.category, form.fraction)) }}
        />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" /> : '✓ Добавить'}
        </button>
        <button className="btn btn-ghost" onClick={() => setOpen(false)}>Отмена</button>
      </div>
    </div>
  )
}

// ── Edit modal ───────────────────────────────────────────────────────────────
function EditModal({
  container, onUpdate, onCancel, loading,
}: { container: Container; onUpdate: Props['onUpdate']; onCancel: () => void; loading: boolean }) {
  const { form, update } = useContainerForm(container)
  const fractionOptions = useFractionOptions(form.category)

  async function handleSave() {
    const w = parseFloat(form.weight)
    const q = parseInt(form.quantity)
    if (isNaN(w) || w <= 0 || isNaN(q) || q < 1) return
    await onUpdate(container.id, {
      name: form.name.trim() || autoName(form.category, form.fraction),
      category: form.category,
      fraction: form.fraction || null,
      weight: w,
      quantity: q,
    })
    onCancel()
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal">
        <div className="modal-title">
          <span>✏️ Редактировать позицию</span>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>✕</button>
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <label>Вид сырья</label>
            <select value={form.category} onChange={e => update('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Фракция</label>
            <select value={form.fraction} onChange={e => update('fraction', e.target.value)}>
              {fractionOptions.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Вес (кг)</label>
            <input type="number" step="0.001" min="0.001"
              value={form.weight} onChange={e => update('weight', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Количество</label>
            <input type="number" min="1" step="1"
              value={form.quantity} onChange={e => update('quantity', e.target.value)} />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 8 }}>
          <label>Наименование</label>
          <input type="text" value={form.name}
            onChange={e => { update('name', e.target.value); update('nameEdited', true) }} />
        </div>
        <div className="form-actions" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" /> : '💾 Сохранить'}
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>Отмена</button>
        </div>
      </div>
    </div>
  )
}

// ── Category badge ───────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? '#6b7280'
  return (
    <span className="cat-badge" style={{ background: color + '22', color, borderColor: color + '44' }}>
      {category}
    </span>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ContainerTable({ containers, onAdd, onUpdate, onDelete, loading, flashIds }: Props) {
  const [editId, setEditId] = useState<string | null>(null)
  const editContainer = containers.find(c => c.id === editId)

  return (
    <div className="card">
      <div className="card-title">
        📦 Склад контейнеров
        {flashIds && flashIds.size > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--green)', fontWeight: 500, animation: 'fadeIn 0.3s ease' }}>
            ✓ остатки обновлены
          </span>
        )}
      </div>

      {containers.length === 0 ? (
        <div className="empty-state" style={{ padding: '32px 0' }}>
          <div className="empty-state-icon">📭</div>
          <div>Позиций нет. Добавьте первую ниже.</div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-wrap desktop-only">
            <table>
              <thead>
                <tr>
                  <th>Наименование</th>
                  <th>Вид</th>
                  <th>Фракция</th>
                  <th className="text-right">Вес (кг)</th>
                  <th className="text-right">Кол-во</th>
                  <th className="text-right">Итого (кг)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {containers.map(c => (
                  <tr key={c.id} className={flashIds?.has(c.id) ? 'row-flash' : ''}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td><CategoryBadge category={c.category} /></td>
                    <td>{c.fraction ? <span className="frac-badge">{c.fraction}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td className="text-right font-mono">{c.weight.toFixed(3)}</td>
                    <td className="text-right font-mono" style={flashIds?.has(c.id) ? { color: 'var(--amber)', fontWeight: 700 } : {}}>
                      {c.quantity}
                    </td>
                    <td className="text-right font-mono">{(c.weight * c.quantity).toFixed(3)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditId(c.id)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => onDelete(c.id)} disabled={loading}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mobile-cards mobile-only">
            {containers.map(c => (
              <div key={c.id} className={`container-card${flashIds?.has(c.id) ? ' card-flash' : ''}`}>
                <div className="container-card-header">
                  <span className="container-card-name">{c.name}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditId(c.id)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(c.id)} disabled={loading}>🗑</button>
                  </div>
                </div>
                <div className="container-card-meta">
                  <CategoryBadge category={c.category} />
                  {c.fraction && <span className="frac-badge">{c.fraction}</span>}
                </div>
                <div className="container-card-row">
                  <span>Вес: <strong className="font-mono">{c.weight.toFixed(3)} кг</strong></span>
                  <span>Кол-во: <strong style={flashIds?.has(c.id) ? { color: 'var(--amber)' } : {}}>{c.quantity}</strong></span>
                  <span>Итого: <strong className="font-mono">{(c.weight * c.quantity).toFixed(3)} кг</strong></span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <hr className="section-divider" />
      <AddForm onAdd={onAdd} loading={loading} />

      {editContainer && (
        <EditModal
          container={editContainer}
          onUpdate={onUpdate}
          onCancel={() => setEditId(null)}
          loading={loading}
        />
      )}
    </div>
  )
}
