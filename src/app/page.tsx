'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CompanyOrder, ShipmentPlanResponse, PlannedShipment } from '@/lib/types'
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants'
import ShipmentPlanTable from '@/components/ShipmentPlanTable'

export default function CalculatorPage() {
  const [companies, setCompanies] = useState<string[]>([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [order, setOrder] = useState<CompanyOrder | null>(null)
  const [plan, setPlan] = useState<ShipmentPlanResponse | null>(null)
  const [expandedShipment, setExpandedShipment] = useState<number | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Load company list
  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.ok ? r.json() : [])
      .then(setCompanies)
      .catch(() => {})
  }, [])

  const loadPlan = useCallback(async (company: string) => {
    if (!company) { setPlan(null); setOrder(null); return }
    setLoadingPlan(true)
    setError('')
    setPlan(null)
    try {
      const res = await fetch(`/api/plan?company=${encodeURIComponent(company)}`)
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Ошибка загрузки плана')
        return
      }
      const json: ShipmentPlanResponse = await res.json()
      setPlan(json)
      setOrder(json.order)
    } catch {
      setError('Ошибка соединения')
    } finally {
      setLoadingPlan(false)
    }
  }, [])

  function onCompanyChange(name: string) {
    setSelectedCompany(name)
    setSuccessMsg('')
    setError('')
    if (name) loadPlan(name)
    else { setPlan(null); setOrder(null) }
  }

  // Auto-select first company from autocomplete when user picks
  function onCompanyKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && selectedCompany.trim()) {
      loadPlan(selectedCompany.trim())
    }
  }

  async function executeShipment(shipmentNumber: number) {
    if (!selectedCompany) return
    setExecuting(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/calculation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: selectedCompany, shipmentNumber }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Ошибка выполнения'); return }
      setSuccessMsg(`Отгрузка №${shipmentNumber} для «${selectedCompany}» сохранена ✓`)
      // Reload plan to reflect actual balance
      await loadPlan(selectedCompany)
      setExpandedShipment(shipmentNumber)
    } catch {
      setError('Ошибка соединения')
    } finally {
      setExecuting(false)
    }
  }

  const nextShipment = plan ? plan.shipments.find((s) => s.status === 'planned') : null

  return (
    <>
      <h1 className="page-title">🟡 Калькулятор отгрузок</h1>

      {error && (
        <div className="alert alert-error" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
          {error} <span style={{ float: 'right', opacity: 0.6 }}>✕</span>
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success" onClick={() => setSuccessMsg('')} style={{ cursor: 'pointer' }}>
          {successMsg}
        </div>
      )}

      {/* Company selector */}
      <div className="card">
        <div className="card-title">🏢 Выбор компании</div>
        <div className="form-group" style={{ maxWidth: 420 }}>
          <label>Компания / клиент</label>
          <input
            list="company-list"
            value={selectedCompany}
            onChange={(e) => onCompanyChange(e.target.value)}
            onKeyDown={onCompanyKeyDown}
            placeholder="Начните вводить название…"
            autoFocus
          />
          {companies.length > 0 && (
            <datalist id="company-list">
              {companies.map((c) => <option key={c} value={c} />)}
            </datalist>
          )}
        </div>

        {loadingPlan && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
            <span className="spinner" /> Загружаю план…
          </div>
        )}

        {order && !loadingPlan && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Заявка на 2026 год:</span>
              {order.vesKg > 0 && (
                <span className="cat-badge" style={{ background: `${TYPE_COLORS.VES}22`, color: TYPE_COLORS.VES, borderColor: `${TYPE_COLORS.VES}55` }}>
                  {TYPE_LABELS.VES} {order.vesKg.toLocaleString('ru')} кг
                </span>
              )}
              {order.sitoKg > 0 && (
                <span className="cat-badge" style={{ background: `${TYPE_COLORS.SITO}22`, color: TYPE_COLORS.SITO, borderColor: `${TYPE_COLORS.SITO}55` }}>
                  {TYPE_LABELS.SITO} {order.sitoKg.toLocaleString('ru')} кг
                </span>
              )}
              {order.lakKg > 0 && (
                <span className="cat-badge" style={{ background: `${TYPE_COLORS.LAK}22`, color: TYPE_COLORS.LAK, borderColor: `${TYPE_COLORS.LAK}55` }}>
                  {TYPE_LABELS.LAK} {order.lakKg.toLocaleString('ru')} кг
                </span>
              )}
            </div>
            {plan && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Выполнено отгрузок: <strong style={{ color: 'var(--text)' }}>{plan.executedCount} из 5</strong>
                {nextShipment && (
                  <span style={{ marginLeft: 8 }}>
                    → следующая: <strong style={{ color: 'var(--amber)' }}>отгрузка №{nextShipment.number}</strong>
                    {nextShipment.number === 5 && <span style={{ marginLeft: 4, fontSize: 11 }}>(последняя — выход в ноль)</span>}
                  </span>
                )}
                {plan.executedCount === 5 && (
                  <span style={{ marginLeft: 8, color: 'var(--green)' }}>— все 5 отгрузок выполнены ✓</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5-shipment plan */}
      {plan && !loadingPlan && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-title" style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
            📋 План 5 отгрузок
          </div>

          {plan.shipments.map((shipment) => (
            <ShipmentRow
              key={shipment.number}
              shipment={shipment}
              expanded={expandedShipment === shipment.number}
              onToggle={() => setExpandedShipment(expandedShipment === shipment.number ? null : shipment.number)}
              onExecute={() => executeShipment(shipment.number)}
              executing={executing}
            />
          ))}
        </div>
      )}

      {!selectedCompany && !loadingPlan && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div>Выберите компанию, чтобы увидеть план 5 отгрузок</div>
            <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              Все компании и их годовые заявки настраиваются на странице{' '}
              <a href="/orders" style={{ color: 'var(--amber)' }}>Заявки</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Shipment row ──────────────────────────────────────────────────────────────
interface ShipmentRowProps {
  shipment: PlannedShipment
  expanded: boolean
  onToggle: () => void
  onExecute: () => void
  executing: boolean
}

function ShipmentRow({ shipment, expanded, onToggle, onExecute, executing }: ShipmentRowProps) {
  const isExecuted = shipment.status === 'executed'
  const isFinal = shipment.number === 5

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Row header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          cursor: 'pointer',
          background: isExecuted ? 'var(--bg-secondary, #ffffff08)' : 'transparent',
        }}
      >
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: '50%',
          fontSize: 12,
          fontWeight: 700,
          background: isExecuted ? 'var(--green)' : isFinal ? 'var(--amber)' : 'var(--bg-card, #2a2a2a)',
          color: isExecuted || isFinal ? '#000' : 'var(--text)',
          flexShrink: 0,
        }}>
          {isExecuted ? '✓' : shipment.number}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600 }}>Отгрузка №{shipment.number}</span>
            {isExecuted && (
              <span style={{ fontSize: 11, background: 'var(--green-dim, #10b98122)', color: 'var(--green)', borderRadius: 4, padding: '1px 6px' }}>
                Выполнена
              </span>
            )}
            {!isExecuted && isFinal && (
              <span style={{ fontSize: 11, background: 'var(--amber-dim, #ff990022)', color: 'var(--amber)', borderRadius: 4, padding: '1px 6px' }}>
                Последняя — выход в ноль
              </span>
            )}
            {!isExecuted && !isFinal && (
              <span style={{ fontSize: 11, background: 'var(--bg-secondary, #ffffff11)', color: 'var(--text-muted)', borderRadius: 4, padding: '1px 6px' }}>
                Плановая
              </span>
            )}
            {isExecuted && shipment.createdAt && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {new Date(shipment.createdAt).toLocaleDateString('ru')}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Факт: {shipment.totalActual.toLocaleString('ru', { maximumFractionDigits: 2 })} кг
            {' '}/ цель: {shipment.totalTarget.toLocaleString('ru', { maximumFractionDigits: 2 })} кг
            {shipment.totalDelta !== 0 && (
              <span style={{ marginLeft: 6, color: shipment.totalDelta > 0 ? 'var(--red)' : 'var(--green)' }}>
                ({shipment.totalDelta > 0 ? '+' : ''}{shipment.totalDelta.toFixed(2)} Δ)
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isExecuted && (
            <button
              className="btn btn-primary btn-sm"
              onClick={(e) => { e.stopPropagation(); onExecute() }}
              disabled={executing}
            >
              {executing ? <span className="spinner" /> : `🚀 Выполнить №${shipment.number}`}
            </button>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', background: 'var(--bg-secondary, #ffffff06)' }}>
          <ShipmentPlanTable items={shipment.items} />
        </div>
      )}
    </div>
  )
}
