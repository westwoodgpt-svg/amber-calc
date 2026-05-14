import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { solveKnapsack } from '@/lib/knapsack'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { targetWeight, category, fraction, allowMixing } = body

    if (typeof targetWeight !== 'number' || targetWeight <= 0) {
      return NextResponse.json({ error: 'Целевой вес должен быть положительным числом' }, { status: 400 })
    }
    if (!allowMixing && !category) {
      return NextResponse.json({ error: 'Выберите категорию или включите смешивание' }, { status: 400 })
    }

    const allContainers = await prisma.container.findMany()

    let containers = allContainers
    if (!allowMixing) {
      containers = allContainers.filter((c) => {
        if (c.category !== category) return false
        if (fraction) return c.fraction === fraction
        return true
      })
    }

    if (containers.length === 0) {
      return NextResponse.json(
        { error: 'Контейнеры с заданными параметрами не найдены. Проверьте наличие позиций на складе.' },
        { status: 400 }
      )
    }

    // Exclude depleted containers
    const available = containers.filter((c) => c.quantity > 0)
    if (available.length === 0) {
      return NextResponse.json(
        { error: 'Все контейнеры данной категории уже израсходованы. Пополните склад.' },
        { status: 400 }
      )
    }
    containers = available

    const result = solveKnapsack(containers, targetWeight)

    return NextResponse.json({
      ...result,
      category: allowMixing ? null : category,
      fraction: allowMixing ? null : (fraction ?? null),
      allowMixing: !!allowMixing,
    })
  } catch {
    return NextResponse.json({ error: 'Ошибка при расчёте' }, { status: 500 })
  }
}
