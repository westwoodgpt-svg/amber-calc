import { NextResponse } from 'next/server'
import type { ItemType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ITEM_TYPES, defaultName } from '@/lib/constants'

interface Params { params: { id: string } }

function isItemType(value: unknown): value is ItemType {
  return typeof value === 'string' && ITEM_TYPES.includes(value as ItemType)
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const body: Record<string, unknown> = await request.json()
    const rawType = body.type
    if (!isItemType(rawType)) {
      return NextResponse.json({ error: 'Недопустимый тип позиции' }, { status: 400 })
    }
    const type: ItemType = rawType

    const packWeight = Number(body.packWeight)
    if (!Number.isFinite(packWeight) || packWeight <= 0) {
      return NextResponse.json({ error: 'Вес упаковки должен быть больше 0' }, { status: 400 })
    }

    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : defaultName(type)
    const weightConfirmed = Boolean(body.weightConfirmed)

    const item = await prisma.item.update({
      where: { id: params.id },
      data: {
        name,
        type,
        packWeight,
        weightConfirmed,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('PUT /api/items/:id failed', error)
    return NextResponse.json({ error: 'Не удалось обновить позицию' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await prisma.item.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/items/:id failed', error)
    return NextResponse.json({ error: 'Не удалось удалить позицию' }, { status: 500 })
  }
}
