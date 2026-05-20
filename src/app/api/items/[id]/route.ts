import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params { params: { id: string } }

// Items are managed via seed — this route exists for admin overrides only
export async function PUT(request: Request, { params }: Params) {
  try {
    const body: Record<string, unknown> = await request.json()
    const packWeight = body.packWeight !== undefined ? Number(body.packWeight) : undefined
    const lotKg = body.lotKg !== undefined ? Number(body.lotKg) : undefined
    const weightConfirmed = body.weightConfirmed !== undefined ? Boolean(body.weightConfirmed) : undefined

    const item = await prisma.item.update({
      where: { id: params.id },
      data: {
        ...(packWeight !== undefined && { packWeight }),
        ...(lotKg !== undefined && { lotKg }),
        ...(weightConfirmed !== undefined && { weightConfirmed }),
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
