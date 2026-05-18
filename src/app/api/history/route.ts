import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const calculations = await prisma.calculation.findMany({
      where: {
        status: 'COMPLETED',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { item: true },
          orderBy: { id: 'asc' },
        },
      },
    })
    return NextResponse.json(calculations)
  } catch (error) {
    console.error('GET /api/history failed', error)
    return NextResponse.json({ error: 'Не удалось загрузить историю' }, { status: 500 })
  }
}

