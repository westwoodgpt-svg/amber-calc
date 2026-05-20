import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('GET /api/items failed', error)
    return NextResponse.json({ error: 'Не удалось загрузить позиции' }, { status: 500 })
  }
}
