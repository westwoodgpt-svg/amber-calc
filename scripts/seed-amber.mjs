// seed-amber.mjs — full reseed from Excel data
// Run: DATABASE_URL="..." node scripts/seed-amber.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Items ────────────────────────────────────────────────────────────────────
// VES = weight-sorted fractions, packWeight=10 kg (boxes)
// SITO = sieve, packWeight=25 kg (bags)
// LAK = black lacquer, packWeight=10 kg (boxes)

const VES_ITEMS = [
  // 50-100 гр
  { article: '9911205КМ', name: 'ВЕС 50-100гр 2с КМ', lotKg: 6 },
  { article: '9911205КП', name: 'ВЕС 50-100гр 2с КП', lotKg: 6 },
  { article: '9911205ПМ', name: 'ВЕС 50-100гр 2с ПМ', lotKg: 10 },
  { article: '9911205ПП', name: 'ВЕС 50-100гр 2с ПП', lotKg: 10 },
  { article: '9911305КМ', name: 'ВЕС 50-100гр 3с КМ', lotKg: 40 },
  { article: '9911305КП', name: 'ВЕС 50-100гр 3с КП', lotKg: 40 },
  { article: '9911305ПМ', name: 'ВЕС 50-100гр 3с ПМ', lotKg: 60 },
  { article: '9911305ПП', name: 'ВЕС 50-100гр 3с ПП', lotKg: 60 },
  { article: '9911405КП', name: 'ВЕС 50-100гр 4с КП', lotKg: 4 },
  { article: '9911405ПП', name: 'ВЕС 50-100гр 4с ПП', lotKg: 20 },
  // 20-50 гр
  { article: '9911102КМ', name: 'ВЕС 20-50гр 1с КМ', lotKg: 10 },
  { article: '9911102КП', name: 'ВЕС 20-50гр 1с КП', lotKg: 2 },
  { article: '9911102ПМ', name: 'ВЕС 20-50гр 1с ПМ', lotKg: 10 },
  { article: '9911102ПП', name: 'ВЕС 20-50гр 1с ПП', lotKg: 6 },
  { article: '9911202КМ', name: 'ВЕС 20-50гр 2с КМ', lotKg: 20 },
  { article: '9911202КП', name: 'ВЕС 20-50гр 2с КП', lotKg: 20 },
  { article: '9911202ПМ', name: 'ВЕС 20-50гр 2с ПМ', lotKg: 40 },
  { article: '9911202ПП', name: 'ВЕС 20-50гр 2с ПП', lotKg: 40 },
  { article: '9911302КМ', name: 'ВЕС 20-50гр 3с КМ', lotKg: 40 },
  { article: '9911302КП', name: 'ВЕС 20-50гр 3с КП', lotKg: 60 },
  { article: '9911302ПМ', name: 'ВЕС 20-50гр 3с ПМ', lotKg: 100 },
  { article: '9911302ПП', name: 'ВЕС 20-50гр 3с ПП', lotKg: 200 },
  { article: '9911402КП', name: 'ВЕС 20-50гр 4с КП', lotKg: 30 },
  { article: '9911402ПП', name: 'ВЕС 20-50гр 4с ПП', lotKg: 40 },
  // 10-20 гр
  { article: '9911101КМ', name: 'ВЕС 10-20гр 1с КМ', lotKg: 105 },
  { article: '9911101КП', name: 'ВЕС 10-20гр 1с КП', lotKg: 49 },
  { article: '9911101ПМ', name: 'ВЕС 10-20гр 1с ПМ', lotKg: 119 },
  { article: '9911101ПП', name: 'ВЕС 10-20гр 1с ПП', lotKg: 77 },
  { article: '9911201КМ', name: 'ВЕС 10-20гр 2с КМ', lotKg: 154 },
  { article: '9911201КП', name: 'ВЕС 10-20гр 2с КП', lotKg: 140 },
  { article: '9911201ПМ', name: 'ВЕС 10-20гр 2с ПМ', lotKg: 350 },
  { article: '9911201ПП', name: 'ВЕС 10-20гр 2с ПП', lotKg: 371 },
  { article: '9911301КМ', name: 'ВЕС 10-20гр 3с КМ', lotKg: 105 },
  { article: '9911301КП', name: 'ВЕС 10-20гр 3с КП', lotKg: 147 },
  { article: '9911301ПМ', name: 'ВЕС 10-20гр 3с ПМ', lotKg: 490 },
  { article: '9911301ПП', name: 'ВЕС 10-20гр 3с ПП', lotKg: 910 },
  { article: '9911401КП', name: 'ВЕС 10-20гр 4с КП', lotKg: 28 },
  { article: '9911401ПП', name: 'ВЕС 10-20гр 4с ПП', lotKg: 280 },
  // 5-10 гр
  { article: '9911100КМ', name: 'ВЕС 5-10гр 1с КМ', lotKg: 49 },
  { article: '9911100КП', name: 'ВЕС 5-10гр 1с КП', lotKg: 35 },
  { article: '9911100ПМ', name: 'ВЕС 5-10гр 1с ПМ', lotKg: 91 },
  { article: '9911100ПП', name: 'ВЕС 5-10гр 1с ПП', lotKg: 98 },
  { article: '9911200КМ', name: 'ВЕС 5-10гр 2с КМ', lotKg: 119 },
  { article: '9911200КП', name: 'ВЕС 5-10гр 2с КП', lotKg: 133 },
  { article: '9911200ПМ', name: 'ВЕС 5-10гр 2с ПМ', lotKg: 455 },
  { article: '9911200ПП', name: 'ВЕС 5-10гр 2с ПП', lotKg: 518 },
  { article: '9911300КМ', name: 'ВЕС 5-10гр 3с КМ', lotKg: 105 },
  { article: '9911300КП', name: 'ВЕС 5-10гр 3с КП', lotKg: 231 },
  { article: '9911300ПМ', name: 'ВЕС 5-10гр 3с ПМ', lotKg: 581 },
  { article: '9911300ПП', name: 'ВЕС 5-10гр 3с ПП', lotKg: 2590 },
  { article: '9911400КП', name: 'ВЕС 5-10гр 4с КП', lotKg: 35 },
  { article: '9911400ПП', name: 'ВЕС 5-10гр 4с ПП', lotKg: 735 },
]

const SITO_ITEMS = [
  { article: '9911416', name: 'Сито Поделочный 2,5-5гр', lotKg: 2000 },
  { article: '9922416', name: 'Сито Несортированный +16мм', lotKg: 4800 },
  { article: '9922414', name: 'Сито Несортированный +14мм', lotKg: 6600 },
  { article: '9922411', name: 'Сито Несортированный +11,5мм', lotKg: 17200 },
  { article: '9922407', name: 'Сито Несортированный +8-11,5мм', lotKg: 29000 },
  { article: '9922404', name: 'Сито Несортированный +4-8мм', lotKg: 27400 },
  { article: '9942404', name: 'Сито Несортированный -4мм', lotKg: 13000 },
]

const LAK_ITEMS = [
  { article: '9932402', name: 'Лак черный 20-50гр', lotKg: 4 },
  { article: '9932401', name: 'Лак черный 10-20гр', lotKg: 7 },
  { article: '9932400', name: 'Лак черный 5-10гр', lotKg: 11 },
  { article: '9932416', name: 'Лак черный 2-5гр', lotKg: 4 },
]

// ─── Company annual orders 2026 ───────────────────────────────────────────────
// vesKg / sitoKg / lakKg — from Excel Расчёт 110 т рабочий.xlsx
const COMPANY_ORDERS = [
  { companyName: 'ООО Балтийская волна',         vesKg: 400,   sitoKg: 0,     lakKg: 0 },
  { companyName: 'ООО Сувениры балтики',          vesKg: 205,   sitoKg: 0,     lakKg: 0 },
  { companyName: 'ИП Лебедев',                   vesKg: 80,    sitoKg: 6000,  lakKg: 0 },
  { companyName: 'ИП Васильев',                  vesKg: 612,   sitoKg: 1000,  lakKg: 0 },
  { companyName: 'ИП Стрельник',                 vesKg: 100,   sitoKg: 0,     lakKg: 0 },
  { companyName: 'ООО Балтийские узоры',          vesKg: 25,    sitoKg: 0,     lakKg: 0 },
  { companyName: 'ИП Хамитов',                   vesKg: 35,    sitoKg: 1000,  lakKg: 0 },
  { companyName: 'ИП Астапенко',                 vesKg: 120,   sitoKg: 0,     lakKg: 0 },
  { companyName: 'ООО Гор-мебель',               vesKg: 360,   sitoKg: 0,     lakKg: 0 },
  { companyName: 'ООО Амбер лайн',               vesKg: 800,   sitoKg: 0,     lakKg: 0 },
  { companyName: 'ИП Шавкунов',                  vesKg: 40,    sitoKg: 5000,  lakKg: 0 },
  { companyName: 'ИП Зайцева',                   vesKg: 95,    sitoKg: 1000,  lakKg: 0 },
  { companyName: 'ИП Печников',                  vesKg: 487.5, sitoKg: 2000,  lakKg: 0 },
  { companyName: 'Амберекс',                     vesKg: 75,    sitoKg: 1000,  lakKg: 5 },
  { companyName: 'ИП Галямов',                   vesKg: 40,    sitoKg: 5000,  lakKg: 0 },
  { companyName: 'ИП Амбервест',                 vesKg: 250,   sitoKg: 1000,  lakKg: 0 },
  { companyName: 'ИП Моисеенко',                 vesKg: 300,   sitoKg: 5000,  lakKg: 0 },
  { companyName: 'ИП Пушкарева',                 vesKg: 500,   sitoKg: 1000,  lakKg: 0 },
  { companyName: 'ООО Гран',                     vesKg: 0,     sitoKg: 2000,  lakKg: 0 },
  { companyName: 'ООО Фоменко групп (ТК Прайд)', vesKg: 0,     sitoKg: 5000,  lakKg: 0 },
  { companyName: 'ООО Янтарная волна',            vesKg: 0,     sitoKg: 4800,  lakKg: 0 },
  { companyName: 'ООО Янтарный мастер',           vesKg: 0,     sitoKg: 3000,  lakKg: 0 },
  { companyName: 'ООО Амбертим',                 vesKg: 0,     sitoKg: 6000,  lakKg: 0 },
  { companyName: 'Баграт амбер',                 vesKg: 3000,  sitoKg: 5000,  lakKg: 0 },
  { companyName: 'ИП Денисенко',                 vesKg: 300,   sitoKg: 1000,  lakKg: 0 },
]

async function main() {
  console.log('Clearing existing data…')
  await prisma.calculationHistory.deleteMany()
  await prisma.calculationItem.deleteMany()
  await prisma.calculation.deleteMany()
  await prisma.companyOrder.deleteMany()
  await prisma.item.deleteMany()

  console.log('Seeding items…')

  // VES items — packWeight 10 kg
  for (const it of VES_ITEMS) {
    await prisma.item.create({
      data: { ...it, type: 'VES', packWeight: 10, weightConfirmed: true },
    })
  }

  // SITO items — packWeight 25 kg
  for (const it of SITO_ITEMS) {
    await prisma.item.create({
      data: { ...it, type: 'SITO', packWeight: 25, weightConfirmed: true },
    })
  }

  // LAK items — packWeight 10 kg
  for (const it of LAK_ITEMS) {
    await prisma.item.create({
      data: { ...it, type: 'LAK', packWeight: 10, weightConfirmed: true },
    })
  }

  const totalItems = VES_ITEMS.length + SITO_ITEMS.length + LAK_ITEMS.length
  console.log(`  Created ${totalItems} items (${VES_ITEMS.length} VES, ${SITO_ITEMS.length} SITO, ${LAK_ITEMS.length} LAK)`)

  console.log('Seeding company orders…')
  for (const order of COMPANY_ORDERS) {
    await prisma.companyOrder.create({
      data: { ...order, year: 2026 },
    })
  }
  console.log(`  Created ${COMPANY_ORDERS.length} company orders`)

  console.log('Done ✓')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
