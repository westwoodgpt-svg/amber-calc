import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { validateDistribution } from '@/lib/calculateShipment'

async function getOrCreateActiveConfig() {
  const existing = await prisma.distributionConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  if (existing) return existing

  return prisma.distributionConfig.create({
    data: {
      name: 'Основное распределение',
      isActive: true,
    },
  })
}

export async function GET() {
  try {
    const config = await getOrCreateActiveConfig()
    const full = await prisma.distributionConfig.findUnique({
      where: { id: config.id },
      include: {
        items: {
          include: { item: true },
          orderBy: { item: { createdAt: 'asc' } },
        },
      },
    })

    return NextResponse.json(full)
  } catch (error) {
    console.error('GET /api/distribution failed', error)
    return NextResponse.json({ error: 'Не удалось загрузить распределение' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const entries: unknown[] = Array.isArray(body.entries) ? body.entries : []
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Основное распределение'

    const parsed = entries
      .map((entry) => {
        const row = entry as { itemId?: unknown; share?: unknown }
        return { itemId: String(row.itemId ?? ''), share: Number(row.share) }
      })
      .filter((entry) => entry.itemId && Number.isFinite(entry.share) && entry.share > 0)

    const uniqueIds = new Set(parsed.map((entry) => entry.itemId))
    if (uniqueIds.size !== parsed.length) {
      return NextResponse.json({ error: 'В распределении есть дубли позиций' }, { status: 400 })
    }

    const { valid, sum } = validateDistribution(parsed, 0.001)
    if (!valid) {
      return NextResponse.json({ error: `Сумма долей должна быть равна 1 ±0.001 (сейчас ${sum})` }, { status: 400 })
    }

    const itemsCount = await prisma.item.count({ where: { id: { in: [...uniqueIds] } } })
    if (itemsCount !== uniqueIds.size) {
      return NextResponse.json({ error: 'В распределении есть несуществующие позиции' }, { status: 400 })
    }

    const active = await getOrCreateActiveConfig()

    const config = await prisma.$transaction(async (tx) => {
      const updated = await tx.distributionConfig.update({
        where: { id: active.id },
        data: { name, isActive: true },
      })

      await tx.distributionItem.deleteMany({ where: { configId: updated.id } })
      if (parsed.length > 0) {
        await tx.distributionItem.createMany({
          data: parsed.map((entry) => ({
            configId: updated.id,
            itemId: entry.itemId,
            share: entry.share,
          })),
        })
      }

      return tx.distributionConfig.findUniqueOrThrow({
        where: { id: updated.id },
        include: {
          items: {
            include: { item: true },
            orderBy: { item: { createdAt: 'asc' } },
          },
        },
      })
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('PUT /api/distribution failed', error)
    return NextResponse.json({ error: 'Не удалось сохранить распределение' }, { status: 500 })
  }
}

