-- AlterTable
ALTER TABLE "photo_cards" ADD COLUMN     "clickCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "outbound_clicks" (
    "id" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cardId" TEXT NOT NULL,

    CONSTRAINT "outbound_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outbound_clicks_cardId_idx" ON "outbound_clicks"("cardId");

-- CreateIndex
CREATE INDEX "outbound_clicks_market_idx" ON "outbound_clicks"("market");

-- AddForeignKey
ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "photo_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
