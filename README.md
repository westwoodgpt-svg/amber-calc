# Amber Calc вЂ” Distribution Calculator

Production-ready Next.js app for stone shipment distribution by shares with package rounding and cumulative balance compensation.

## Stack

- Frontend + API: Next.js 14 (App Router)
- DB: PostgreSQL + Prisma ORM
- Deploy: Vercel

## Environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required variable:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB"
```

Startup guard is enabled: if `DATABASE_URL` is missing, the server fails fast with an explicit error.

## Local Run

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

## Architecture

- `Item`: reference catalog (`name`, `type`, `packWeight`, `weightConfirmed`)
- `DistributionConfig` + `DistributionItem`: share configuration separated from catalog
- `Calculation` + `CalculationItem`: persisted calculation output
- `CalculationHistory`: delta ledger for balance

Balance is computed as:

```text
balance[itemId] = sum(CalculationHistory.delta)
```

Only non-deleted `COMPLETED` calculations are included.

## API

- `GET/POST /api/items`
- `PUT/DELETE /api/items/:id`
- `GET/PUT /api/distribution`
- `POST /api/calculation`
- `GET /api/calculation/:id`
- `GET /api/history`
- `GET/DELETE /api/history/:id`

## Validation Rules

Before calculation:

- share sum must be `1 В± 0.001`
- `packWeight > 0`
- items without `weightConfirmed` are excluded with warnings
- items missing in distribution are excluded with warnings

## Excel Export

Workbook is import-safe for 1C / BI / SQL (flat tables, no merged cells, no decorative styles):

- Sheet `РћС‚РіСЂСѓР·РєР°` with strict columns and numeric values (2 decimals as numbers)
- Sheet `РЎРІРѕРґРєР°` with `РџРѕРєР°Р·Р°С‚РµР»СЊ | Р—РЅР°С‡РµРЅРёРµ`
- Final `РРўРћР“Рћ` row in shipment sheet with sums for `calcWeight`, `factWeight`, `delta`

## Deploy (Vercel)

- Push to `main` triggers auto-deploy.
- Ensure `DATABASE_URL` exists in Vercel project environment variables.

