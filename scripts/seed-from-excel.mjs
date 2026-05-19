/**
 * Seed script based on "Расчёт 110 т рабочий.xlsx"
 * Run: node scripts/seed-from-excel.mjs
 */
import { PrismaClient } from '@prisma/client'

const DB_URL = 'postgresql://neondb_owner:npg_9SNoj4gGatZi@ep-orange-wave-alpmeu56.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'

const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } })

const TOTAL_LOT = 110_000 // kg

// ── Items ──────────────────────────────────────────────────────────────────────
// Each item: { name, type, packWeight, ves }
// ves = total kg of this item in the 110-tonne lot → determines share = ves/110000
const ITEMS_DEF = [
  { name: 'Фр. весовой сортировки (+1000-5)', type: 'fraction', packWeight: 25,  ves: 9974  },
  { name: 'Поделочный 2,5-5 гр',              type: 'fraction', packWeight: 5,   ves: 2000  },
  { name: 'Несортированный +16мм',            type: 'sieve',    packWeight: 500, ves: 4800  },
  { name: 'Несортированный +14 мм',           type: 'sieve',    packWeight: 500, ves: 6600  },
  { name: 'Несортированный +11,5 мм',         type: 'sieve',    packWeight: 500, ves: 17200 },
  { name: 'Несортированный +8-11,5мм',        type: 'sieve',    packWeight: 500, ves: 29000 },
  { name: 'Несортированный +4-8мм',           type: 'sieve',    packWeight: 500, ves: 27400 },
  { name: 'Несортированный -4',               type: 'sieve',    packWeight: 500, ves: 13000 },
  { name: 'Янтарь лак черный',               type: 'fraction', packWeight: 5,   ves: 26    },
]

// Sum check
const sumVes = ITEMS_DEF.reduce((s, i) => s + i.ves, 0)
if (sumVes !== TOTAL_LOT) throw new Error(`Items sum ${sumVes} ≠ ${TOTAL_LOT}`)

// ── Company historical data ────────────────────────────────────────────────────
// vesovaya = kg from "Фр. весовой сортировки" category
// general  = kg from "Всего фракционный" (Поделочный + Несортированный) pool
// lak      = kg from "Янтарь лак черный"
const COMPANIES = [
  { name: 'ООО Балтийская волна',          vesovaya: 400,   general: 0,    lak: 0 },
  { name: 'ООО Сувениры балтики',          vesovaya: 205,   general: 0,    lak: 0 },
  { name: 'ИП Лебедев',                    vesovaya: 80,    general: 6000, lak: 0 },
  { name: 'ИП Васильев',                   vesovaya: 612,   general: 1000, lak: 0 },
  { name: 'ИП Стрельник',                  vesovaya: 100,   general: 0,    lak: 0 },
  { name: 'ООО Балтийские узоры',          vesovaya: 25,    general: 0,    lak: 0 },
  { name: 'ИП Хамитов',                    vesovaya: 35,    general: 1000, lak: 0 },
  { name: 'ИП Астапенко',                  vesovaya: 120,   general: 0,    lak: 0 },
  { name: 'ООО Гор-мебель',                vesovaya: 360,   general: 0,    lak: 0 },
  { name: 'ООО Амбер лайн',               vesovaya: 800,   general: 0,    lak: 0 },
  { name: 'ИП Шавкунов',                   vesovaya: 40,    general: 5000, lak: 0 },
  { name: 'ИП Зайцева',                    vesovaya: 95,    general: 1000, lak: 0 },
  { name: 'ИП Печников',                   vesovaya: 487.5, general: 2000, lak: 0 },
  { name: 'Амберекс',                      vesovaya: 75,    general: 1000, lak: 5 },
  { name: 'ИП Галямов',                    vesovaya: 40,    general: 5000, lak: 0 },
  { name: 'ИП Амбервест',                  vesovaya: 250,   general: 1000, lak: 0 },
  { name: 'ИП Моисеенко',                  vesovaya: 300,   general: 5000, lak: 0 },
  { name: 'ИП Пушкарева',                  vesovaya: 500,   general: 1000, lak: 0 },
  { name: 'ООО Гран',                      vesovaya: 0,     general: 2000, lak: 0 },
  { name: 'ООО Фоменко групп (ТК Прайд)', vesovaya: 0,     general: 5000, lak: 0 },
  { name: 'ООО Янтарная волна',            vesovaya: 0,     general: 4800, lak: 0 },
  { name: 'ООО Янтарный мастер',           vesovaya: 0,     general: 3000, lak: 0 },
  { name: 'ООО Амбертим',                  vesovaya: 0,     general: 6000, lak: 0 },
  { name: 'Баграт амбер',                  vesovaya: 3000,  general: 5000, lak: 0 },
  { name: 'ИП Денисенко',                  vesovaya: 300,   general: 1000, lak: 0 },
]

// "General fraction" pool proportions (Поделочный + Несортированный = 100,000 kg)
// Distribute each company's "general" amount proportionally
const GENERAL_POOL = 100_000
const GENERAL_ITEMS = [
  { itemIdx: 1, ves: 2000  }, // Поделочный
  { itemIdx: 2, ves: 4800  }, // Несортированный +16мм
  { itemIdx: 3, ves: 6600  }, // +14мм
  { itemIdx: 4, ves: 17200 }, // +11,5мм
  { itemIdx: 5, ves: 29000 }, // +8-11,5мм
  { itemIdx: 6, ves: 27400 }, // +4-8мм
  { itemIdx: 7, ves: 13000 }, // -4
]

function round2(v) { return Math.round(v * 100) / 100 }

function buildFactWeights(company) {
  const fw = new Array(ITEMS_DEF.length).fill(0)
  // Item 0: Фр. весовой
  fw[0] = company.vesovaya
  // Items 1-7: distribute "general" proportionally
  for (const g of GENERAL_ITEMS) {
    fw[g.itemIdx] = round2(company.general * (g.ves / GENERAL_POOL))
  }
  // Item 8: Лак
  fw[8] = company.lak
  return fw
}

async function main() {
  console.log('Clearing existing data...')
  await prisma.calculationHistory.deleteMany()
  await prisma.calculationItem.deleteMany()
  await prisma.calculation.deleteMany()
  await prisma.distributionItem.deleteMany()
  await prisma.distributionConfig.deleteMany()
  await prisma.item.deleteMany()

  // ── Create items ──────────────────────────────────────────────────────────
  console.log('Creating items...')
  const createdItems = []
  for (const def of ITEMS_DEF) {
    const item = await prisma.item.create({
      data: {
        name: def.name,
        type: def.type,
        packWeight: def.packWeight,
        defaultPacks: 0,
        weightConfirmed: true,
      },
    })
    createdItems.push({ ...item, ves: def.ves })
  }
  console.log(`  Created ${createdItems.length} items`)

  // ── Create distribution config ────────────────────────────────────────────
  console.log('Creating distribution config...')
  const config = await prisma.distributionConfig.create({
    data: {
      name: 'Лот 110 тонн (рабочий)',
      isActive: true,
      items: {
        create: createdItems.map((item) => ({
          itemId: item.id,
          share: round2(item.ves / TOTAL_LOT * 10000) / 10000, // 4 decimal places
          enabled: true,
        })),
      },
    },
    include: { items: true },
  })
  const shareSum = config.items.reduce((s, r) => s + r.share, 0)
  console.log(`  Config: "${config.name}", share sum = ${shareSum.toFixed(6)}`)

  // ── Create historical calculations ────────────────────────────────────────
  console.log('Creating historical calculations...')
  let calcCount = 0

  for (const company of COMPANIES) {
    const totalWeight = company.vesovaya + company.general + company.lak
    if (totalWeight === 0) continue

    const factWeights = buildFactWeights(company)

    const calcItems = []
    let totalActual = 0
    let totalDelta = 0

    for (let i = 0; i < createdItems.length; i++) {
      const item = createdItems[i]
      const share = item.ves / TOTAL_LOT
      const calcWeight = round2(totalWeight * share)
      const factWeight = factWeights[i]
      const adjustedWeight = calcWeight  // no prior balance
      const packs = factWeight > 0 ? Math.ceil(factWeight / item.packWeight) : 0
      const delta = round2(factWeight - calcWeight)

      totalActual += factWeight
      totalDelta += delta

      calcItems.push({
        itemId: item.id,
        calcWeight,
        adjustedWeight,
        packs,
        factWeight,
        delta,
      })
    }

    const calc = await prisma.calculation.create({
      data: {
        status: 'COMPLETED',
        companyName: company.name,
        totalWeight: round2(totalWeight),
        totalActual: round2(totalActual),
        totalDelta: round2(totalDelta),
      },
    })

    await prisma.calculationItem.createMany({
      data: calcItems.map((ci) => ({ calculationId: calc.id, ...ci })),
    })

    await prisma.calculationHistory.createMany({
      data: calcItems
        .filter((ci) => ci.factWeight > 0)
        .map((ci) => ({
          calculationId: calc.id,
          itemId: ci.itemId,
          delta: ci.delta,
        })),
    })

    calcCount++
    console.log(`  [${calcCount}/${COMPANIES.length}] ${company.name}: ${totalWeight} кг`)
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n=== Done ===')
  console.log(`Items:          ${await prisma.item.count()}`)
  console.log(`DistConfig:     1`)
  console.log(`Calculations:   ${await prisma.calculation.count()}`)
  console.log(`CalcItems:      ${await prisma.calculationItem.count()}`)
  console.log(`History:        ${await prisma.calculationHistory.count()}`)

  const totalShipped = COMPANIES.reduce((s, c) => s + c.vesovaya + c.general + c.lak, 0)
  console.log(`Total shipped:  ${totalShipped} kg of ${TOTAL_LOT} kg (${(totalShipped/TOTAL_LOT*100).toFixed(1)}%)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
