import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateShipment, validateDistribution } from '@/lib/calculateShipment'
import type { CalculationWarning } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const totalWeight = Number(body.totalWeight)

    if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
      return NextResponse.json({ error: 'Общий вес должен быть положительным числом' }, { status: 400 })
    }

    const [allItems, config] = await Promise.all([
      prisma.item.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.distributionConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { item: true },
          },
        },
      }),
    ])

    if (!config || config.items.length === 0) {
      return NextResponse.json({ error: 'Нет активного распределения с долями' }, { status: 400 })
    }

    const warnings: CalculationWarning[] = []
    const distribution = config.items.map((row) => ({ itemId: row.itemId, share: row.share }))
    const { valid, sum } = validateDistribution(distribution, 0.001)
    if (!valid) {
      return NextResponse.json({ error: `Сумма долей должна быть равна 1 ±0.001 (сейчас ${sum})` }, { status: 400 })
    }

    const distributionItemIds = new Set(distribution.map((row) => row.itemId))
    for (const item of allItems) {
      if (!distributionItemIds.has(item.id)) {
        warnings.push({
          code: 'MISSING_DISTRIBUTION',
          itemId: item.id,
          message: `Позиция "${item.name}" не добавлена в распределение и исключена из расчёта`,
        })
      }
    }

    const activeRows = config.items.filter((row) => {
      if (row.item.packWeight <= 0 || !Number.isFinite(row.item.packWeight)) {
        warnings.push({
          code: 'INVALID_PACK_WEIGHT',
          itemId: row.itemId,
          message: `Позиция "${row.item.name}" имеет некорректный packWeight и исключена из расчёта`,
        })
        return false
      }

      if (!row.item.weightConfirmed) {
        warnings.push({
          code: 'UNCONFIRMED_WEIGHT',
          itemId: row.itemId,
          message: `Позиция "${row.item.name}" без подтверждения веса и исключена из расчёта`,
        })
        return false
      }

      return true
    })

    if (activeRows.length === 0) {
      return NextResponse.json(
        { error: 'Нет позиций, пригодных для расчёта после проверок', warnings },
        { status: 400 },
      )
    }

    const activeItemIds = new Set(activeRows.map((row) => row.itemId))
    for (const row of config.items) {
      if (!activeItemIds.has(row.itemId)) {
        warnings.push({
          code: 'EXCLUDED_ITEM',
          itemId: row.itemId,
          message: `Позиция "${row.item.name}" исключена из расчёта`,
        })
      }
    }

    const activeDistribution = distribution.filter((row) => activeItemIds.has(row.itemId))

    const balanceRows = await prisma.calculationHistory.groupBy({
      by: ['itemId'],
      where: {
        itemId: { in: [...activeItemIds] },
        calculation: {
          status: 'COMPLETED',
          deletedAt: null,
        },
      },
      _sum: { delta: true },
    })

    const balance: Record<string, number> = {}
    for (const row of balanceRows) {
      balance[row.itemId] = Number(row._sum.delta ?? 0)
    }

    const result = calculateShipment(
      totalWeight,
      activeRows.map((row) => row.item),
      activeDistribution,
      balance,
    )

    const calculation = await prisma.$transaction(async (tx) => {
      const calc = await tx.calculation.create({
        data: {
          status: 'COMPLETED',
          totalWeight: result.totals.totalRequested,
          totalActual: result.totals.totalActual,
          totalDelta: result.totals.totalDelta,
        },
      })

      if (result.items.length > 0) {
        await tx.calculationItem.createMany({
          data: result.items.map((row) => ({
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
          data: result.items.map((row) => ({
            calculationId: calc.id,
            itemId: row.itemId,
            delta: row.delta,
          })),
        })
      }

      return calc
    })

    return NextResponse.json({
      calculationId: calculation.id,
      createdAt: calculation.createdAt,
      warnings,
      ...result,
    })
  } catch (error) {
    console.error('POST /api/calculation failed', error)
    return NextResponse.json({ error: 'Ошибка при расчёте' }, { status: 500 })
  }
}
