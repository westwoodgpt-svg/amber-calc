import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { baseShareMap } from '@/lib/constants'
import { validateDistribution } from '@/lib/calculateShipment'

type DistributionEntry = { itemId: string; share: number; enabled: boolean }

function buildInitialEntries(items: Array<{ id: string; name: string }>): DistributionEntry[] {
  const raw = items.map((item) => {
    const share = Number(baseShareMap[item.name] ?? 0)
    const validShare = Number.isFinite(share) && share > 0 ? share : 0
    return {
      itemId: item.id,
      share: validShare,
      enabled: validShare > 0,
    }
  })

  const enabled = raw.filter((entry) => entry.enabled)
  const sum = enabled.reduce((acc, entry) => acc + entry.share, 0)
  if (sum > 0) {
    for (const entry of raw) {
      if (!entry.enabled) continue
      entry.share = entry.share / sum
    }
  }

  return raw
}

async function getOrCreateActiveConfig() {
  const existing = await prisma.distributionConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  if (existing) return existing

  const config = await prisma.distributionConfig.create({
    data: {
      name: 'Основное распределение',
      isActive: true,
    },
  })

  const items = await prisma.item.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true } })
  if (items.length > 0) {
    const entries = buildInitialEntries(items)
    await prisma.distributionItem.createMany({
      data: entries.map((entry) => ({
        configId: config.id,
        itemId: entry.itemId,
        share: entry.share,
        enabled: entry.enabled,
      })),
    })
  }

  return config
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
        const row = entry as { itemId?: unknown; share?: unknown; enabled?: unknown }
        return {
          itemId: String(row.itemId ?? ''),
          share: Number(row.share),
          enabled: Boolean(row.enabled),
        }
      })
      .filter((entry) => entry.itemId && Number.isFinite(entry.share) && entry.share >= 0)

    const uniqueIds = new Set(parsed.map((entry) => entry.itemId))
    if (uniqueIds.size !== parsed.length) {
      return NextResponse.json({ error: 'В распределении есть дубли позиций' }, { status: 400 })
    }

    const enabledEntries = parsed.filter((entry) => entry.enabled)
    if (enabledEntries.some((entry) => entry.share <= 0)) {
      return NextResponse.json({ error: 'Для включённых позиций доля должна быть > 0' }, { status: 400 })
    }

    const { valid, sum } = validateDistribution(
      enabledEntries.map((entry) => ({ itemId: entry.itemId, share: entry.share })),
      0.001,
    )
    if (!valid) {
      return NextResponse.json({ error: `Сумма долей включённых позиций должна быть 1 ±0.001 (сейчас ${sum})` }, { status: 400 })
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
            share: entry.enabled ? entry.share : 0,
            enabled: entry.enabled,
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
