import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = Number(searchParams.get('year') ?? 2026)
    const orders = await prisma.companyOrder.findMany({
      where: { year },
      orderBy: { companyName: 'asc' },
    })
    return NextResponse.json(orders)
  } catch {
    return NextResponse.json({ error: 'Ошибка загрузки заявок' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
    const year = Number(body.year ?? 2026)
    const vesKg = Number(body.vesKg ?? 0)
    const sitoKg = Number(body.sitoKg ?? 0)
    const lakKg = Number(body.lakKg ?? 0)

    if (!companyName) {
      return NextResponse.json({ error: 'Введите название компании' }, { status: 400 })
    }
    if (vesKg < 0 || sitoKg < 0 || lakKg < 0) {
      return NextResponse.json({ error: 'Количество не может быть отрицательным' }, { status: 400 })
    }

    const order = await prisma.companyOrder.upsert({
      where: { companyName_year: { companyName, year } },
      create: { companyName, year, vesKg, sitoKg, lakKg },
      update: { vesKg, sitoKg, lakKg },
    })
    return NextResponse.json(order)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
