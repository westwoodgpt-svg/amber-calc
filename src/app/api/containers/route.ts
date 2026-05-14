import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const containers = await prisma.container.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(containers)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch containers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { weight, fraction, quantity } = body

    if (!weight || !fraction || !quantity) {
      return NextResponse.json({ error: 'weight, fraction and quantity are required' }, { status: 400 })
    }
    if (typeof weight !== 'number' || weight <= 0) {
      return NextResponse.json({ error: 'weight must be a positive number' }, { status: 400 })
    }
    if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 })
    }

    const container = await prisma.container.create({
      data: { weight, fraction: String(fraction), quantity },
    })
    return NextResponse.json(container, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create container' }, { status: 500 })
  }
}
