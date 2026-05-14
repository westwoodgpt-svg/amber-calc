import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const calculations = await prisma.calculation.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(calculations)
  } catch {
    return NextResponse.json({ error: 'Не удалось загрузить историю' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, targetWeight, category, fraction, allowMixing, result, totalWeight, overweight } = body

    if (!name || !targetWeight || !result) {
      return NextResponse.json({ error: 'Обязательные поля: name, targetWeight, result' }, { status: 400 })
    }

    const selectedContainers: Array<{ id: string; quantityUsed: number }> =
      result?.selectedContainers ?? []

    // Atomic: save calculation + deduct stock
    const calculation = await prisma.$transaction(async (tx) => {
      const calc = await tx.calculation.create({
        data: {
          name: String(name),
          targetWeight: Number(targetWeight),
          category: category ? String(category) : null,
          fraction: fraction ? String(fraction) : null,
          allowMixing: Boolean(allowMixing),
          result,
          totalWeight: Number(totalWeight),
          overweight: Number(overweight),
        },
      })

      // Deduct used quantities from stock
      for (const item of selectedContainers) {
        const container = await tx.container.findUnique({ where: { id: item.id } })
        if (container) {
          const newQty = Math.max(0, container.quantity - item.quantityUsed)
          await tx.container.update({
            where: { id: item.id },
            data: { quantity: newQty },
          })
        }
      }

      return calc
    })

    return NextResponse.json(calculation, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Не удалось сохранить расчёт' }, { status: 500 })
  }
}
