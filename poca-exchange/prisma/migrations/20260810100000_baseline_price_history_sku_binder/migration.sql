-- Baseline migration.
--
-- `price_history`, `global_sku_mapping` and `user_binder_cards` were added to
-- schema.prisma and pushed to the database with `prisma db push`, so they exist
-- in Postgres but had no migration file. This backfills the missing history so
-- the migrations directory replays into an exact copy of the live schema.
--
-- Marked as already applied via `prisma migrate resolve --applied` on the
-- existing database — the statements below only ever run on a fresh database
-- or a shadow database.

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "market" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cardId" TEXT NOT NULL,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_sku_mapping" (
    "id" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "skuUrl" TEXT,
    "lastChecked" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cardId" TEXT NOT NULL,

    CONSTRAINT "global_sku_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_binder_cards" (
    "id" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,

    CONSTRAINT "user_binder_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_history_cardId_idx" ON "price_history"("cardId");

-- CreateIndex
CREATE INDEX "price_history_market_idx" ON "price_history"("market");

-- CreateIndex
CREATE INDEX "price_history_createdAt_idx" ON "price_history"("createdAt");

-- CreateIndex
CREATE INDEX "global_sku_mapping_cardId_idx" ON "global_sku_mapping"("cardId");

-- CreateIndex
CREATE INDEX "global_sku_mapping_market_idx" ON "global_sku_mapping"("market");

-- CreateIndex
CREATE UNIQUE INDEX "global_sku_mapping_cardId_market_sku_key" ON "global_sku_mapping"("cardId", "market", "sku");

-- CreateIndex
CREATE INDEX "user_binder_cards_userId_idx" ON "user_binder_cards"("userId");

-- CreateIndex
CREATE INDEX "user_binder_cards_cardId_idx" ON "user_binder_cards"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "user_binder_cards_userId_cardId_key" ON "user_binder_cards"("userId", "cardId");

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "photo_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_sku_mapping" ADD CONSTRAINT "global_sku_mapping_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "photo_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_binder_cards" ADD CONSTRAINT "user_binder_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_binder_cards" ADD CONSTRAINT "user_binder_cards_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "photo_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
