import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CATEGORIES, FRACTIONS, autoName } from '@/lib/constants'

export async function GET() {
  try {
    const containers = await prisma.container.findMany({ orderBy: { createdAt: 'asc' } })
    return NextResponse.json(containers)
  } catch {
    return NextResponse.json({ error: 'Не удалось загрузить контейнеры' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { category, fraction, weight, quantity } = body

    if (!category || !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Недопустимая категория' }, { status: 400 })
    }
    if (fraction && !FRACTIONS.includes(fraction)) {
      return NextResponse.json({ error: 'Недопустимая фракция' }, { status: 400 })
    }
    if (typeof weight !== 'number' || weight <= 0) {
      return NextResponse.json({ error: 'Вес должен быть положительным числом' }, { status: 400 })
    }
    if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: 'Количество должно быть целым положительным числом' }, { status: 400 })
    }

    const name = body.name?.trim() || autoName(category, fraction ?? null)

    const container = await prisma.container.create({
      data: { name, category, fraction: fraction ?? null, weight, quantity },
    })
    return NextResponse.json(container, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Не удалось создать контейнер' }, { status: 500 })
  }
}
