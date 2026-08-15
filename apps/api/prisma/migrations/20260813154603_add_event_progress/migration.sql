-- CreateTable
CREATE TABLE "event_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventKey" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "event_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_progress_userId_eventKey_tierId_key" ON "event_progress"("userId", "eventKey", "tierId");

-- AddForeignKey
ALTER TABLE "event_progress" ADD CONSTRAINT "event_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
