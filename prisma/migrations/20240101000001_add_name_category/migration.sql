-- AlterTable containers: add name and category, make fraction nullable
ALTER TABLE "containers" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "containers" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'сырец';
ALTER TABLE "containers" ALTER COLUMN "fraction" DROP NOT NULL;

-- AlterTable calculations: add category
ALTER TABLE "calculations" ADD COLUMN IF NOT EXISTS "category" TEXT;
