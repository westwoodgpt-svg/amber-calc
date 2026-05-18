import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateShipment, validateShares } from '@/lib/calculateShipment'
import { STONE_TYPES, type StoneType } from '@/lib/constants'
import type { Item } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const totalWeight = typeof body.totalWeight === 'number' ? body.totalWeight : Number(body.totalWeight)

    if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
      return NextResponse.json({ error: 'Общий вес должен быть положительным числом' }, { status: 400 })
    }

    const rows = await prisma.container.findMany({ orderBy: { createdAt: 'asc' } })
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Список позиций пуст' }, { status: 400 })
    }

    const items: Item[] = rows.map((row) => {
      const type = STONE_TYPES.includes(row.type as StoneType) ? (row.type as StoneType) : 'fraction'
      return {
        id: row.id,
        name: row.name,
        type,
        share: row.share,
        packWeight: row.packWeight,
        weightConfirmed: row.weightConfirmed,
        balance: row.balance,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }
    })

    const unconfirmed = items.filter((item) => !item.weightConfirmed)
    if (unconfirmed.length > 0) {
      return NextResponse.json(
        {
          error: `Подтвердите вес для всех позиций. Не подтверждено: ${unconfirmed.map((i) => i.name).join(', ')}`,
        },
        { status: 400 },
      )
    }

    const { valid, sum } = validateShares(items)
    if (!valid) {
      return NextResponse.json(
        { error: `Сумма долей должна быть равна 1 (текущая сумма: ${sum})` },
        { status: 400 },
      )
    }

    const balanceFromRequest = typeof body.balance === 'object' && body.balance ? body.balance : {}
    const balance: Record<string, number> = {}
    for (const item of items) {
      const raw = (balanceFromRequest as Record<string, unknown>)[item.id]
      const parsed = Number(raw)
      balance[item.id] = Number.isFinite(parsed) ? parsed : item.balance
    }

    const result = calculateShipment({
      totalWeight,
      items,
      balance,
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Ошибка при расчёте' }, { status: 500 })
  }
}
