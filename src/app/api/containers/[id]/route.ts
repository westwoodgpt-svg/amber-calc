import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { STONE_TYPES, TYPE_DEFAULT_PACK_WEIGHT, type StoneType, defaultName } from '@/lib/constants'

interface Params { params: { id: string } }

function toPositiveNumber(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) && num > 0 ? num : null
}

function toShare(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) && num >= 0 ? num : null
}

export async function PUT(request: Request, { params }: Params) {
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

    const packWeight = toPositiveNumber(body.packWeight)
    if (packWeight === null) {
      return NextResponse.json({ error: 'Вес упаковки должен быть числом > 0' }, { status: 400 })
    }

    const rawConfirmed = body.weightConfirmed
    const weightConfirmed = typeof rawConfirmed === 'boolean' ? rawConfirmed : false

    const item = await prisma.container.update({
      where: { id: params.id },
      data: {
        name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : defaultName(type),
        type,
        share,
        packWeight,
        weightConfirmed,
        balance: Number.isFinite(Number(body.balance)) ? Number(body.balance) : 0,
        // Legacy fields
        category: type,
        fraction: null,
        weight: packWeight,
        quantity: 1,
      },
    })

    return NextResponse.json(item)
  } catch {
    return NextResponse.json({ error: 'Не удалось обновить позицию' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await prisma.container.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Не удалось удалить позицию' }, { status: 500 })
  }
}
