import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params {
  params: { id: string }
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const calculation = await prisma.calculation.findUnique({
      where: { id: params.id },
    })
    if (!calculation) {
      return NextResponse.json({ error: 'Calculation not found' }, { status: 404 })
    }
    return NextResponse.json(calculation)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch calculation' }, { status: 500 })
  }
}
