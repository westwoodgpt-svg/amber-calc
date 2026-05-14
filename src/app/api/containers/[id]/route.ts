import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CATEGORIES, FRACTIONS, autoName } from '@/lib/constants'

interface Params { params: { id: string } }

export async function PUT(request: Request, { params }: Params) {
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

    const container = await prisma.container.update({
      where: { id: params.id },
      data: { name, category, fraction: fraction ?? null, weight, quantity },
    })
    return NextResponse.json(container)
  } catch {
    return NextResponse.json({ error: 'Не удалось обновить контейнер' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await prisma.container.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Не удалось удалить контейнер' }, { status: 500 })
  }
}
