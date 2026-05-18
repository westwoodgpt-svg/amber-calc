-- New normalized entities
CREATE TYPE IF NOT EXISTS "ItemType" AS ENUM ('fraction', 'sieve');
CREATE TYPE IF NOT EXISTS "CalculationStatus" AS ENUM ('COMPLETED');

CREATE TABLE IF NOT EXISTS "Item" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "ItemType" NOT NULL,
  "packWeight" DOUBLE PRECISION NOT NULL,
  "defaultPacks" INTEGER NOT NULL DEFAULT 0,
  "weightConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "defaultPacks" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "DistributionConfig" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DistributionConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DistributionItem" (
  "id" TEXT NOT NULL,
  "configId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "share" DOUBLE PRECISION NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "DistributionItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DistributionItem" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "DistributionItem_configId_itemId_key" ON "DistributionItem"("configId", "itemId");

CREATE TABLE IF NOT EXISTS "Calculation" (
  "id" TEXT NOT NULL,
  "status" "CalculationStatus" NOT NULL DEFAULT 'COMPLETED',
  "companyName" TEXT NOT NULL DEFAULT '',
  "totalWeight" DOUBLE PRECISION NOT NULL,
  "totalActual" DOUBLE PRECISION NOT NULL,
  "totalDelta" DOUBLE PRECISION NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "status" "CalculationStatus" NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "companyName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "CalculationItem" (
  "id" TEXT NOT NULL,
  "calculationId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "calcWeight" DOUBLE PRECISION NOT NULL,
  "adjustedWeight" DOUBLE PRECISION NOT NULL,
  "packs" INTEGER NOT NULL,
  "factWeight" DOUBLE PRECISION NOT NULL,
  "delta" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "CalculationItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CalculationHistory" (
  "id" TEXT NOT NULL,
  "calculationId" TEXT,
  "itemId" TEXT NOT NULL,
  "delta" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalculationHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CalculationHistory" ADD COLUMN IF NOT EXISTS "calculationId" TEXT;

DO $$ BEGIN
  ALTER TABLE "DistributionItem" ADD CONSTRAINT "DistributionItem_configId_fkey"
    FOREIGN KEY ("configId") REFERENCES "DistributionConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DistributionItem" ADD CONSTRAINT "DistributionItem_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CalculationItem" ADD CONSTRAINT "CalculationItem_calculationId_fkey"
    FOREIGN KEY ("calculationId") REFERENCES "Calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CalculationItem" ADD CONSTRAINT "CalculationItem_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CalculationHistory" ADD CONSTRAINT "CalculationHistory_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CalculationHistory" ADD CONSTRAINT "CalculationHistory_calculationId_fkey"
    FOREIGN KEY ("calculationId") REFERENCES "Calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
