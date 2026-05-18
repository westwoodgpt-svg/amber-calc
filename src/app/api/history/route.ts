import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { CalculationResult } from '@/lib/types'

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
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const result = body.result as CalculationResult | undefined

    if (!name || !result || !Array.isArray(result.items) || !result.totals) {
      return NextResponse.json({ error: 'Обязательные поля: name, result' }, { status: 400 })
    }

    const targetWeight = Number(result.totals.totalRequested)
    const totalWeight = Number(result.totals.totalActual)
    const overweight = Number(result.totals.totalDelta)

    if (![targetWeight, totalWeight, overweight].every(Number.isFinite)) {
      return NextResponse.json({ error: 'Некорректные итоговые значения расчёта' }, { status: 400 })
    }

    const calculation = await prisma.$transaction(async (tx) => {
      const calc = await tx.calculation.create({
        data: {
          name,
          targetWeight,
          category: null,
          fraction: null,
          allowMixing: false,
          result: result as unknown as Prisma.InputJsonValue,
          totalWeight,
          overweight,
        },
      })

      for (const row of result.items) {
        if (!row?.id) continue
        await tx.container.update({
          where: { id: row.id },
          data: { balance: Number(row.newBalance) || 0 },
        })
      }

      return calc
    })

    return NextResponse.json(calculation, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Не удалось сохранить расчёт' }, { status: 500 })
  }
}
