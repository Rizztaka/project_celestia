-- CreateTable
CREATE TABLE "daily_companion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resinAmount" INTEGER NOT NULL DEFAULT 0,
    "resinUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commissionsDone" BOOLEAN NOT NULL DEFAULT false,
    "teapotClaimed" BOOLEAN NOT NULL DEFAULT false,
    "transformerClaimed" BOOLEAN NOT NULL DEFAULT false,
    "dailyResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_companion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_companion_userId_key" ON "daily_companion"("userId");

-- AddForeignKey
ALTER TABLE "daily_companion" ADD CONSTRAINT "daily_companion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
