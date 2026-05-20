import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { planAllShipments } from '@/lib/calculateShipment'
import type { CalcItem } from '@/lib/calculateShipment'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const company = (searchParams.get('company') ?? '').trim()
    const year = Number(searchParams.get('year') ?? 2026)

    if (!company) {
      return NextResponse.json({ error: 'Укажите компанию' }, { status: 400 })
    }

    const [order, items, executedCalcs, exclusionRows] = await Promise.all([
      prisma.companyOrder.findUnique({ where: { companyName_year: { companyName: company, year } } }),
      prisma.item.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] }),
      prisma.calculation.findMany({
        where: { companyName: company, status: 'COMPLETED', deletedAt: null },
        orderBy: { shipmentNumber: 'asc' },
        include: {
          items: { include: { item: true } },
          histories: true,
        },
      }),
      prisma.companyExclusion.findMany({ where: { companyName: company, year } }),
    ])

    if (!order) {
      return NextResponse.json({ error: 'Заявка для этой компании не найдена' }, { status: 404 })
    }

    const vesItems: CalcItem[] = items
      .filter((i) => i.type === 'VES')
      .map((i) => ({ id: i.id, name: i.name, article: i.article, type: i.type, packWeight: i.packWeight, lotKg: i.lotKg }))

    const sitoItems: CalcItem[] = items
      .filter((i) => i.type === 'SITO')
      .map((i) => ({ id: i.id, name: i.name, article: i.article, type: i.type, packWeight: i.packWeight, lotKg: i.lotKg }))

    const lakItems: CalcItem[] = items
      .filter((i) => i.type === 'LAK')
      .map((i) => ({ id: i.id, name: i.name, article: i.article, type: i.type, packWeight: i.packWeight, lotKg: i.lotKg }))

    // Compute actual balance from all executed calculations
    const executedBalance: Record<string, number> = {}
    const executedShipmentNumbers = new Set<number>()

    for (const calc of executedCalcs) {
      executedShipmentNumbers.add(calc.shipmentNumber)
      for (const hist of calc.histories) {
        executedBalance[hist.itemId] = (executedBalance[hist.itemId] ?? 0) + hist.delta
      }
    }

    const excludedIds = new Set(exclusionRows.map((e) => e.itemId))

    const shipmentPlans = planAllShipments(
      vesItems,
      sitoItems,
      lakItems,
      order.vesKg,
      order.sitoKg,
      order.lakKg,
      executedBalance,
      executedShipmentNumbers,
      excludedIds,
    )

    // Overlay executed shipment actual data
    for (const plan of shipmentPlans) {
      if (plan.status === 'executed') {
        const calc = executedCalcs.find((c) => c.shipmentNumber === plan.number)
        if (calc) {
          plan.calculationId = calc.id
          plan.createdAt = calc.createdAt.toISOString()
          plan.allowPartialPack = calc.allowPartialPack
          // Override totals with actual saved values
          plan.totalActual = calc.totalActual
          plan.totalDelta = calc.totalDelta
          // Override items with actual saved values
          plan.items = calc.items.map((ci) => ({
            itemId: ci.itemId,
            name: ci.item.name,
            article: ci.item.article,
            type: ci.item.type,
            packWeight: ci.item.packWeight,
            lotKg: ci.item.lotKg,
            share: 0,  // will recompute below
            calcWeight: ci.calcWeight,
            adjustedWeight: ci.adjustedWeight,
            packs: ci.packs,
            factWeight: ci.factWeight,
            delta: ci.delta,
            isPartial: calc.allowPartialPack,
          }))
          // Recompute shares for display
          const vesTotal = vesItems.reduce((s, i) => s + i.lotKg, 0)
          const sitoTotal = sitoItems.reduce((s, i) => s + i.lotKg, 0)
          const lakTotal = lakItems.reduce((s, i) => s + i.lotKg, 0)
          const itemById = new Map(items.map((i) => [i.id, i]))
          for (const row of plan.items) {
            const it = itemById.get(row.itemId)
            if (!it) continue
            const total = it.type === 'VES' ? vesTotal : it.type === 'SITO' ? sitoTotal : lakTotal
            row.share = total > 0 ? it.lotKg / total : 0
          }
        }
      }
    }

    return NextResponse.json({
      order,
      executedCount: executedShipmentNumbers.size,
      shipments: shipmentPlans,
      exclusions: exclusionRows.map((e) => ({ id: e.id, itemId: e.itemId })),
    })
  } catch (error) {
    console.error('GET /api/plan failed', error)
    return NextResponse.json({ error: 'Ошибка при расчёте плана' }, { status: 500 })
  }
}
