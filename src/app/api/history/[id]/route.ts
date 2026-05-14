import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params { params: { id: string } }

export async function GET(_request: Request, { params }: Params) {
  try {
    const calculation = await prisma.calculation.findUnique({ where: { id: params.id } })
    if (!calculation) {
      return NextResponse.json({ error: 'Расчёт не найден' }, { status: 404 })
    }
    return NextResponse.json(calculation)
  } catch {
    return NextResponse.json({ error: 'Ошибка при получении расчёта' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await prisma.calculation.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Не удалось удалить расчёт' }, { status: 500 })
  }
}
