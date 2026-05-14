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

    const calculation = await prisma.calculation.create({
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
    return NextResponse.json(calculation, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Не удалось сохранить расчёт' }, { status: 500 })
  }
}
