import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Returns company names that have annual orders for the given year
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = Number(searchParams.get('year') ?? 2026)
    const orders = await prisma.companyOrder.findMany({
      where: { year },
      select: { companyName: true },
      orderBy: { companyName: 'asc' },
    })
    return NextResponse.json(orders.map((o) => o.companyName))
  } catch (error) {
    console.error('GET /api/companies failed', error)
    return NextResponse.json([], { status: 500 })
  }
}
