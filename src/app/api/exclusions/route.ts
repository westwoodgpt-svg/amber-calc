import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** GET /api/exclusions?company=X&year=2026 — list excluded item IDs for a company */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const company = (searchParams.get('company') ?? '').trim()
  const year = Number(searchParams.get('year') ?? 2026)
  if (!company) return NextResponse.json([], { status: 200 })

  const rows = await prisma.companyExclusion.findMany({
    where: { companyName: company, year },
    select: { id: true, itemId: true },
  })
  return NextResponse.json(rows)
}

/** POST /api/exclusions — add an exclusion  { companyName, year, itemId } */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const companyName = String(body.companyName ?? '').trim()
    const year = Number(body.year ?? 2026)
    const itemId = String(body.itemId ?? '').trim()
    if (!companyName || !itemId) {
      return NextResponse.json({ error: 'Обязательные поля: companyName, itemId' }, { status: 400 })
    }
    const row = await prisma.companyExclusion.upsert({
      where: { companyName_year_itemId: { companyName, year, itemId } },
      create: { companyName, year, itemId },
      update: {},
    })
    return NextResponse.json(row)
  } catch (e) {
    console.error('POST /api/exclusions', e)
    return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 })
  }
}

/** DELETE /api/exclusions — remove an exclusion { companyName, year, itemId } */
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const companyName = String(body.companyName ?? '').trim()
    const year = Number(body.year ?? 2026)
    const itemId = String(body.itemId ?? '').trim()
    await prisma.companyExclusion.deleteMany({ where: { companyName, year, itemId } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/exclusions', e)
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 })
  }
}
