import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

interface Params { params: { id: string } }

export async function GET(_request: Request, { params }: Params) {
  try {
    const calculation = await prisma.calculation.findFirst({
      where: {
        id: params.id,
        status: 'COMPLETED',
        deletedAt: null,
      },
      include: {
        items: {
          include: { item: true },
          orderBy: { id: 'asc' },
        },
      },
    })

    if (!calculation) {
      return NextResponse.json({ error: 'Расчёт не найден' }, { status: 404 })
    }

    return NextResponse.json(calculation)
  } catch (error) {
    console.error('GET /api/calculation/:id failed', error)
    return NextResponse.json({ error: 'Ошибка при получении расчёта' }, { status: 500 })
  }
}

