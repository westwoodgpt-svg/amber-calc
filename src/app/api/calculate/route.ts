import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { solveKnapsack } from '@/lib/knapsack'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { targetWeight, fraction, allowMixing } = body

    if (!targetWeight || typeof targetWeight !== 'number' || targetWeight <= 0) {
      return NextResponse.json({ error: 'targetWeight must be a positive number' }, { status: 400 })
    }
    if (!allowMixing && !fraction) {
      return NextResponse.json({ error: 'fraction is required when mixing is not allowed' }, { status: 400 })
    }

    // Fetch containers from DB
    const allContainers = await prisma.container.findMany()

    // Filter by fraction unless mixing is allowed
    const containers = allowMixing
      ? allContainers
      : allContainers.filter((c) => c.fraction === fraction)

    if (containers.length === 0) {
      return NextResponse.json(
        { error: 'No containers found for the selected fraction' },
        { status: 400 }
      )
    }

    const result = solveKnapsack(containers, targetWeight)

    return NextResponse.json({
      ...result,
      fraction: allowMixing ? null : fraction,
      allowMixing: !!allowMixing,
    })
  } catch {
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 })
  }
}
