-- Additive only. Existing inventories intentionally retain unknown provenance.
CREATE TYPE "GenshinImportSection" AS ENUM ('characters', 'weapons', 'artifacts', 'materials');
CREATE TABLE "genshin_import_sections" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "section" "GenshinImportSection" NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "entryCount" INTEGER NOT NULL,
    CONSTRAINT "genshin_import_sections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "genshin_import_sections_accountId_section_key" ON "genshin_import_sections"("accountId", "section");
ALTER TABLE "genshin_import_sections" ADD CONSTRAINT "genshin_import_sections_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "genshin_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
