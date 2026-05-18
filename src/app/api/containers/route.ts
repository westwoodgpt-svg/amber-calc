import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { STONE_TYPES, TYPE_DEFAULT_PACK_WEIGHT, type StoneType, defaultName } from '@/lib/constants'

function toPositiveNumber(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

function toShare(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) && num >= 0 ? num : null
}

export async function GET() {
  try {
    const items = await prisma.container.findMany({ orderBy: { createdAt: 'asc' } })
    return NextResponse.json(items)
  } catch {
    return NextResponse.json({ error: 'Не удалось загрузить позиции' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const type = body.type as StoneType

    if (!STONE_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Недопустимый тип позиции' }, { status: 400 })
    }

    const share = toShare(body.share)
    if (share === null) {
      return NextResponse.json({ error: 'Доля должна быть числом >= 0' }, { status: 400 })
    }

    const packWeight = toPositiveNumber(body.packWeight) ?? TYPE_DEFAULT_PACK_WEIGHT[type]
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : defaultName(type)

    const item = await prisma.container.create({
      data: {
        name,
        type,
        share,
        packWeight,
        weightConfirmed: false,
        balance: 0,
        // Legacy fields
        category: type,
        fraction: null,
        weight: packWeight,
        quantity: 1,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Не удалось создать позицию' }, { status: 500 })
  }
}
