-- CreateTable
CREATE TABLE "containers" (
    "id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "fraction" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "containers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetWeight" DOUBLE PRECISION NOT NULL,
    "fraction" TEXT,
    "allowMixing" BOOLEAN NOT NULL DEFAULT false,
    "result" JSONB NOT NULL,
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "overweight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculations_pkey" PRIMARY KEY ("id")
);
