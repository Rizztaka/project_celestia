-- CreateTable
CREATE TABLE "NikkeAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commanderName" TEXT,
    "commanderLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NikkeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NikkeCharacter" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "characterKey" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "limitBreak" INTEGER NOT NULL,
    "coreEnhance" INTEGER NOT NULL,
    "skill1" INTEGER NOT NULL,
    "skill2" INTEGER NOT NULL,
    "burstSkill" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NikkeCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NikkeEquipment" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "manufacturer" TEXT,
    "level" INTEGER NOT NULL,
    "isOverload" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NikkeEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NikkeAccount_userId_key" ON "NikkeAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NikkeCharacter_accountId_characterKey_key" ON "NikkeCharacter"("accountId", "characterKey");

-- AddForeignKey
ALTER TABLE "NikkeAccount" ADD CONSTRAINT "NikkeAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NikkeCharacter" ADD CONSTRAINT "NikkeCharacter_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "NikkeAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NikkeEquipment" ADD CONSTRAINT "NikkeEquipment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "NikkeCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
