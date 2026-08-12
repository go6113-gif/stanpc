-- CreateTable
CREATE TABLE "price_reports" (
    "id" TEXT NOT NULL,
    "reportedPrice" INTEGER NOT NULL,
    "sourceUrl" TEXT,
    "reporterComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cardId" TEXT NOT NULL,

    CONSTRAINT "price_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_reports_cardId_idx" ON "price_reports"("cardId");

-- AddForeignKey
ALTER TABLE "price_reports" ADD CONSTRAINT "price_reports_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "photo_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
