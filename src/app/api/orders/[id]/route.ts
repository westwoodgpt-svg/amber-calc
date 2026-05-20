import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : undefined
    const vesKg = body.vesKg !== undefined ? Number(body.vesKg) : undefined
    const sitoKg = body.sitoKg !== undefined ? Number(body.sitoKg) : undefined
    const lakKg = body.lakKg !== undefined ? Number(body.lakKg) : undefined

    const order = await prisma.companyOrder.update({
      where: { id: params.id },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(vesKg !== undefined && { vesKg }),
        ...(sitoKg !== undefined && { sitoKg }),
        ...(lakKg !== undefined && { lakKg }),
      },
    })
    return NextResponse.json(order)
  } catch {
    return NextResponse.json({ error: 'Ошибка обновления заявки' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.companyOrder.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Ошибка удаления заявки' }, { status: 500 })
  }
}
