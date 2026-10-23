-- AlterTable
ALTER TABLE "genshin_characters" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dataSource" TEXT NOT NULL DEFAULT 'manual',
ALTER COLUMN "ascension" DROP NOT NULL;

-- AlterTable
ALTER TABLE "genshin_weapons" ALTER COLUMN "ascension" DROP NOT NULL,
ALTER COLUMN "locked" DROP NOT NULL;

-- AlterTable
ALTER TABLE "genshin_artifacts" ADD COLUMN     "mainStatValue" DOUBLE PRECISION,
ALTER COLUMN "locked" DROP NOT NULL;

-- CreateTable
CREATE TABLE "genshin_hoyolab_connections" (
    "userId" TEXT NOT NULL,
    "encryptedSession" TEXT,
    "generation" INTEGER NOT NULL DEFAULT 1,
    "roles" JSONB NOT NULL DEFAULT '[]',
    "selectedUid" TEXT,
    "selectedServer" TEXT,
    "state" TEXT NOT NULL DEFAULT 'disconnected',
    "syncedAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "notes" JSONB,
    "leaseId" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "lastError" TEXT,
    "lastAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genshin_hoyolab_connections_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "genshin_hoyolab_connections_nextSyncAt_idx" ON "genshin_hoyolab_connections"("nextSyncAt");

-- AddForeignKey
ALTER TABLE "genshin_hoyolab_connections" ADD CONSTRAINT "genshin_hoyolab_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Credentials are accessible only through the authenticated application backend.
ALTER TABLE "genshin_hoyolab_connections" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "genshin_hoyolab_connections" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "genshin_hoyolab_connections" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "genshin_hoyolab_connections" FROM authenticated;
  END IF;
END $$;
