import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params {
  params: { id: string }
}

export async function PUT(request: Request, { params }: Params) {
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

    const container = await prisma.container.update({
      where: { id: params.id },
      data: { weight, fraction: String(fraction), quantity },
    })
    return NextResponse.json(container)
  } catch {
    return NextResponse.json({ error: 'Failed to update container' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await prisma.container.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete container' }, { status: 500 })
  }
}
