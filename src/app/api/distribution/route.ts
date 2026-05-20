// Distribution config replaced by lot-based calculation (see /api/plan and /app/lot)
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ error: 'Распределение теперь вычисляется из состава лота. Используйте /api/plan.' }, { status: 410 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Не используется' }, { status: 410 })
}
