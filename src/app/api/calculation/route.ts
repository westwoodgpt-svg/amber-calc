import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeCategory } from '@/lib/calculateShipment'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
    const shipmentNumber = Number(body.shipmentNumber ?? 1)
    const year = Number(body.year ?? 2026)

    if (!companyName) {
      return NextResponse.json({ error: 'Введите название компании' }, { status: 400 })
    }
    if (shipmentNumber < 1 || shipmentNumber > 5 || !Number.isInteger(shipmentNumber)) {
      return NextResponse.json({ error: 'Номер отгрузки должен быть от 1 до 5' }, { status: 400 })
    }

    const [order, items] = await Promise.all([
      prisma.companyOrder.findUnique({
        where: { companyName_year: { companyName, year } },
      }),
      prisma.item.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] }),
    ])

    if (!order) {
      return NextResponse.json(
        { error: `Заявка компании «${companyName}» на ${year} год не найдена. Добавьте её на странице «Заявки».` },
        { status: 400 },
      )
    }

    // Check this shipment number hasn't been executed yet
    const alreadyDone = await prisma.calculation.findFirst({
      where: { companyName, shipmentNumber, status: 'COMPLETED', deletedAt: null },
    })
    if (alreadyDone) {
      return NextResponse.json(
        { error: `Отгрузка №${shipmentNumber} для «${companyName}» уже выполнена (ID: ${alreadyDone.id})` },
        { status: 400 },
      )
    }

    const isPartial = shipmentNumber === 5

    const vesItems = items.filter((i) => i.type === 'VES')
    const sitoItems = items.filter((i) => i.type === 'SITO')
    const lakItems = items.filter((i) => i.type === 'LAK')

    // Load per-company balance from prior shipments
    const allActiveItemIds = items.map((i) => i.id)
    const balanceRows = await prisma.calculationHistory.groupBy({
      by: ['itemId'],
      where: {
        itemId: { in: allActiveItemIds },
        calculation: { status: 'COMPLETED', deletedAt: null, companyName },
      },
      _sum: { delta: true },
    })

    const balance: Record<string, number> = {}
    for (const row of balanceRows) {
      balance[row.itemId] = Number(row._sum.delta ?? 0)
    }

    const perShipVes = order.vesKg / 5
    const perShipSito = order.sitoKg / 5
    const perShipLak = order.lakKg / 5

    const vesResult = order.vesKg > 0 ? computeCategory(perShipVes, vesItems, balance, isPartial) : null
    const sitoResult = order.sitoKg > 0 ? computeCategory(perShipSito, sitoItems, balance, isPartial) : null
    const lakResult = order.lakKg > 0 ? computeCategory(perShipLak, lakItems, balance, isPartial) : null

    const allItems = [
      ...(vesResult?.items ?? []),
      ...(sitoResult?.items ?? []),
      ...(lakResult?.items ?? []),
    ]

    const totalRequested = Number(
      ((vesResult?.targetKg ?? 0) + (sitoResult?.targetKg ?? 0) + (lakResult?.targetKg ?? 0)).toFixed(2),
    )
    const totalActual = Number(
      ((vesResult?.totalActual ?? 0) + (sitoResult?.totalActual ?? 0) + (lakResult?.totalActual ?? 0)).toFixed(2),
    )
    const totalDelta = Number(
      ((vesResult?.totalDelta ?? 0) + (sitoResult?.totalDelta ?? 0) + (lakResult?.totalDelta ?? 0)).toFixed(2),
    )

    const calculation = await prisma.$transaction(async (tx) => {
      const calc = await tx.calculation.create({
        data: {
          status: 'COMPLETED',
          companyName,
          totalWeight: totalRequested,
          totalActual,
          totalDelta,
          allowPartialPack: isPartial,
          shipmentNumber,
        },
      })

      if (allItems.length > 0) {
        await tx.calculationItem.createMany({
          data: allItems.map((row) => ({
            calculationId: calc.id,
            itemId: row.itemId,
            calcWeight: row.calcWeight,
            adjustedWeight: row.adjustedWeight,
            packs: row.packs,
            factWeight: row.factWeight,
            delta: row.delta,
          })),
        })

        await tx.calculationHistory.createMany({
          data: allItems.map((row) => ({
            calculationId: calc.id,
            itemId: row.itemId,
            delta: row.delta,
          })),
        })
      }

      return calc
    })

    const priorCount = await prisma.calculation.count({
      where: { companyName, status: 'COMPLETED', deletedAt: null, id: { not: calculation.id } },
    })

    return NextResponse.json({
      calculationId: calculation.id,
      createdAt: calculation.createdAt,
      companyName,
      shipmentNumber,
      priorOrderCount: priorCount,
      warnings: [],
      items: allItems,
      totals: { totalRequested, totalCalcWeight: totalRequested, totalActual, totalDelta },
    })
  } catch (error) {
    console.error('POST /api/calculation failed', error)
    return NextResponse.json({ error: 'Ошибка при расчёте' }, { status: 500 })
  }
}
