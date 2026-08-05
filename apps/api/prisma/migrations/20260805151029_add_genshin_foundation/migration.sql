/*
  Warnings:

  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "genshin_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uid" TEXT,
    "nickname" TEXT,
    "adventureRank" INTEGER,
    "worldLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genshin_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genshin_characters" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "characterKey" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "ascension" INTEGER NOT NULL,
    "constellation" INTEGER NOT NULL,
    "talentNormal" INTEGER NOT NULL,
    "talentSkill" INTEGER NOT NULL,
    "talentBurst" INTEGER NOT NULL,
    "equippedWeaponId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genshin_characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genshin_weapons" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "weaponKey" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "ascension" INTEGER NOT NULL,
    "refinement" INTEGER NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genshin_weapons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genshin_artifacts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "setKey" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "rarity" INTEGER NOT NULL,
    "mainStatKey" TEXT NOT NULL,
    "subStats" JSONB NOT NULL DEFAULT '[]',
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "equippedCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genshin_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "genshin_accounts_userId_key" ON "genshin_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "genshin_characters_equippedWeaponId_key" ON "genshin_characters"("equippedWeaponId");

-- CreateIndex
CREATE UNIQUE INDEX "genshin_characters_accountId_characterKey_key" ON "genshin_characters"("accountId", "characterKey");

-- CreateIndex
CREATE UNIQUE INDEX "genshin_artifacts_equippedCharacterId_slotKey_key" ON "genshin_artifacts"("equippedCharacterId", "slotKey");

-- AddForeignKey
ALTER TABLE "genshin_accounts" ADD CONSTRAINT "genshin_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genshin_characters" ADD CONSTRAINT "genshin_characters_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "genshin_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genshin_characters" ADD CONSTRAINT "genshin_characters_equippedWeaponId_fkey" FOREIGN KEY ("equippedWeaponId") REFERENCES "genshin_weapons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genshin_weapons" ADD CONSTRAINT "genshin_weapons_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "genshin_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genshin_artifacts" ADD CONSTRAINT "genshin_artifacts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "genshin_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "genshin_artifacts" ADD CONSTRAINT "genshin_artifacts_equippedCharacterId_fkey" FOREIGN KEY ("equippedCharacterId") REFERENCES "genshin_characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
