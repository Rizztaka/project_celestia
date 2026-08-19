-- CreateTable
CREATE TABLE "spiral_abyss_runs" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "chamber" INTEGER NOT NULL,
    "half" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,
    "team" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spiral_abyss_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spiral_abyss_runs_accountId_cycleId_floor_chamber_half_key" ON "spiral_abyss_runs"("accountId", "cycleId", "floor", "chamber", "half");

-- AddForeignKey
ALTER TABLE "spiral_abyss_runs" ADD CONSTRAINT "spiral_abyss_runs_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "genshin_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
