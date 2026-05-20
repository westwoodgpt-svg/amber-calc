import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/orders/copy-year
 * Body: { fromYear: number, toYear: number }
 * Copies all CompanyOrder rows from fromYear to toYear (skip if already exists).
 * Also copies CompanyExclusion rows.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const fromYear = Number(body.fromYear)
    const toYear = Number(body.toYear)

    if (!fromYear || !toYear || fromYear === toYear) {
      return NextResponse.json({ error: 'Укажите fromYear и toYear (разные годы)' }, { status: 400 })
    }

    const sourceOrders = await prisma.companyOrder.findMany({ where: { year: fromYear } })
    if (sourceOrders.length === 0) {
      return NextResponse.json({ error: `Нет заявок за ${fromYear} год` }, { status: 404 })
    }

    let copied = 0
    let skipped = 0
    for (const order of sourceOrders) {
      const exists = await prisma.companyOrder.findUnique({
        where: { companyName_year: { companyName: order.companyName, year: toYear } },
      })
      if (exists) { skipped++; continue }
      await prisma.companyOrder.create({
        data: {
          companyName: order.companyName,
          year: toYear,
          vesKg: order.vesKg,
          sitoKg: order.sitoKg,
          lakKg: order.lakKg,
        },
      })
      copied++
    }

    // Copy exclusions too
    const sourceExclusions = await prisma.companyExclusion.findMany({ where: { year: fromYear } })
    let copiedExcl = 0
    for (const ex of sourceExclusions) {
      const exists = await prisma.companyExclusion.findUnique({
        where: { companyName_year_itemId: { companyName: ex.companyName, year: toYear, itemId: ex.itemId } },
      })
      if (!exists) {
        await prisma.companyExclusion.create({
          data: { companyName: ex.companyName, year: toYear, itemId: ex.itemId },
        })
        copiedExcl++
      }
    }

    return NextResponse.json({ copied, skipped, copiedExclusions: copiedExcl, fromYear, toYear })
  } catch (e) {
    console.error('POST /api/orders/copy-year', e)
    return NextResponse.json({ error: 'Ошибка копирования' }, { status: 500 })
  }
}
