import { NextResponse } from 'next/server'
import type { ItemType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ITEM_TYPES, TYPE_DEFAULT_PACK_WEIGHT, defaultName } from '@/lib/constants'

function isItemType(value: unknown): value is ItemType {
  return typeof value === 'string' && ITEM_TYPES.includes(value as ItemType)
}

export async function GET() {
  try {
    const items = await prisma.item.findMany({ orderBy: { createdAt: 'asc' } })
    return NextResponse.json(items)
  } catch (error) {
    console.error('GET /api/items failed', error)
    return NextResponse.json({ error: 'Не удалось загрузить позиции' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body: Record<string, unknown> = await request.json()
    const rawType = body.type
    if (!isItemType(rawType)) {
      return NextResponse.json({ error: 'Недопустимый тип позиции' }, { status: 400 })
    }
    const type: ItemType = rawType

    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : defaultName(type)
    const rawPack = Number(body.packWeight)
    const packWeight = Number.isFinite(rawPack) && rawPack > 0 ? rawPack : TYPE_DEFAULT_PACK_WEIGHT[type]

    const item = await prisma.item.create({
      data: {
        name,
        type,
        packWeight,
        weightConfirmed: false,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('POST /api/items failed', error)
    return NextResponse.json({ error: 'Не удалось создать позицию' }, { status: 500 })
  }
}
