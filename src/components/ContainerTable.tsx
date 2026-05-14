'use client'

import { useState } from 'react'
import type { Container } from '@/lib/types'

interface Props {
  containers: Container[]
  onAdd: (data: { weight: number; fraction: string; quantity: number }) => Promise<void>
  onUpdate: (id: string, data: { weight: number; fraction: string; quantity: number }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading: boolean
}

const FRACTIONS = ['SS', 'S', 'M', 'L', 'LL', 'LLL', 'RAW']

function AddRow({ onAdd, loading }: { onAdd: Props['onAdd']; loading: boolean }) {
  const [weight, setWeight] = useState('')
  const [fraction, setFraction] = useState('SS')
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const w = parseFloat(weight)
    const q = parseInt(quantity)
    if (!weight || isNaN(w) || w <= 0) { setError('Введите корректный вес'); return }
    if (!quantity || isNaN(q) || q < 1) { setError('Введите корректное количество'); return }
    await onAdd({ weight: w, fraction, quantity: q })
    setWeight('')
    setQuantity('')
  }

  return (
    <tr>
      <td>
        {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 4 }}>{error}</div>}
        <input
          type="number"
          placeholder="0.000"
          step="0.001"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          style={{ width: 100 }}
        />
      </td>
      <td>
        <select value={fraction} onChange={e => setFraction(e.target.value)} style={{ width: 90 }}>
          {FRACTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </td>
      <td>
        <input
          type="number"
          placeholder="1"
          min="1"
          step="1"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          style={{ width: 80 }}
        />
      </td>
      <td>
        <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" /> : '+ Добавить'}
        </button>
      </td>
    </tr>
  )
}

function EditRow({
  container,
  onUpdate,
  onCancel,
  loading,
}: {
  container: Container
  onUpdate: (id: string, data: { weight: number; fraction: string; quantity: number }) => Promise<void>
  onCancel: () => void
  loading: boolean
}) {
  const [weight, setWeight] = useState(String(container.weight))
  const [fraction, setFraction] = useState(container.fraction)
  const [quantity, setQuantity] = useState(String(container.quantity))

  async function handleSave() {
    const w = parseFloat(weight)
    const q = parseInt(quantity)
    if (isNaN(w) || w <= 0 || isNaN(q) || q < 1) return
    await onUpdate(container.id, { weight: w, fraction, quantity: q })
    onCancel()
  }

  return (
    <tr style={{ background: 'var(--bg-card2)' }}>
      <td>
        <input type="number" step="0.001" value={weight} onChange={e => setWeight(e.target.value)} style={{ width: 100 }} />
      </td>
      <td>
        <select value={fraction} onChange={e => setFraction(e.target.value)} style={{ width: 90 }}>
          {FRACTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </td>
      <td>
        <input type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: 80 }} />
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading}>Сохранить</button>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Отмена</button>
        </div>
      </td>
    </tr>
  )
}

export default function ContainerTable({ containers, onAdd, onUpdate, onDelete, loading }: Props) {
  const [editId, setEditId] = useState<string | null>(null)

  return (
    <div className="card">
      <div className="card-title">📦 Контейнеры</div>
      {containers.length === 0 && !loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>
          Нет контейнеров. Добавьте первый ниже.
        </div>
      ) : null}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Вес (кг)</th>
              <th>Фракция</th>
              <th>Кол-во</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {containers.map(c =>
              editId === c.id ? (
                <EditRow key={c.id} container={c} onUpdate={onUpdate} onCancel={() => setEditId(null)} loading={loading} />
              ) : (
                <tr key={c.id}>
                  <td className="font-mono">{c.weight.toFixed(3)}</td>
                  <td><span className="badge badge-amber">{c.fraction}</span></td>
                  <td>{c.quantity}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditId(c.id)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(c.id)} disabled={loading}>🗑</button>
                    </div>
                  </td>
                </tr>
              )
            )}
            <AddRow onAdd={onAdd} loading={loading} />
          </tbody>
        </table>
      </div>
    </div>
  )
}
