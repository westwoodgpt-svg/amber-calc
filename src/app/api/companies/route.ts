import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await prisma.calculation.findMany({
      where: { status: 'COMPLETED', deletedAt: null },
      select: { companyName: true },
      distinct: ['companyName'],
      orderBy: { companyName: 'asc' },
    })
    const names = rows.map((r) => r.companyName).filter(Boolean)
    return NextResponse.json(names)
  } catch (error) {
    console.error('GET /api/companies failed', error)
    return NextResponse.json([], { status: 500 })
  }
}
