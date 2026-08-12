-- CreateEnum
CREATE TYPE "reaction_type" AS ENUM ('부럽다', '레전드', '영롱하다', '미쳤다', '리스펙', '나도갖고싶다');

-- CreateEnum
CREATE TYPE "reaction_target_type" AS ENUM ('VAULT_CARD', 'POST');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('HOF_EXPOSURE', 'DAILY_REACTION_SUMMARY', 'TRADE_MATCH');

-- CreateEnum
CREATE TYPE "bundle_match_status" AS ENUM ('PENDING', 'ROOM_OPENED', 'DISMISSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "trade_room_status" AS ENUM ('OPEN', 'AGREED', 'SHIPPED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "collector_index" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "manner_score" DOUBLE PRECISION NOT NULL DEFAULT 36.5;

-- CreateTable
CREATE TABLE "badges" (
    "badge_id" TEXT NOT NULL,
    "badge_name" TEXT NOT NULL,
    "badge_icon" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("badge_id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "type" "reaction_type" NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_type" "reaction_target_type" NOT NULL DEFAULT 'VAULT_CARD',
    "vault_card_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "payload" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_matches" (
    "id" TEXT NOT NULL,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "a_to_b_count" INTEGER NOT NULL,
    "b_to_a_count" INTEGER NOT NULL,
    "match_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "bundle_match_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundle_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_rooms" (
    "id" TEXT NOT NULL,
    "bundle_match_id" TEXT,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "status" "trade_room_status" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "trade_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_items" (
    "id" TEXT NOT NULL,
    "trade_room_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "offered_by_user_id" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "badges_badge_name_key" ON "badges"("badge_name");

-- CreateIndex
CREATE INDEX "user_badges_user_id_idx" ON "user_badges"("user_id");

-- CreateIndex
CREATE INDEX "user_badges_badge_id_idx" ON "user_badges"("badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "reactions_vault_card_id_idx" ON "reactions"("vault_card_id");

-- CreateIndex
CREATE INDEX "reactions_user_id_idx" ON "reactions"("user_id");

-- CreateIndex
CREATE INDEX "reactions_type_idx" ON "reactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_user_id_vault_card_id_type_key" ON "reactions"("user_id", "vault_card_id", "type");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "bundle_matches_user_b_id_idx" ON "bundle_matches"("user_b_id");

-- CreateIndex
CREATE INDEX "bundle_matches_status_idx" ON "bundle_matches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_matches_user_a_id_user_b_id_key" ON "bundle_matches"("user_a_id", "user_b_id");

-- CreateIndex
CREATE INDEX "trade_rooms_user_a_id_idx" ON "trade_rooms"("user_a_id");

-- CreateIndex
CREATE INDEX "trade_rooms_user_b_id_idx" ON "trade_rooms"("user_b_id");

-- CreateIndex
CREATE INDEX "trade_rooms_bundle_match_id_idx" ON "trade_rooms"("bundle_match_id");

-- CreateIndex
CREATE INDEX "trade_rooms_status_idx" ON "trade_rooms"("status");

-- CreateIndex
CREATE INDEX "trade_items_trade_room_id_idx" ON "trade_items"("trade_room_id");

-- CreateIndex
CREATE INDEX "trade_items_card_id_idx" ON "trade_items"("card_id");

-- CreateIndex
CREATE INDEX "trade_items_offered_by_user_id_idx" ON "trade_items"("offered_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trade_items_trade_room_id_card_id_offered_by_user_id_key" ON "trade_items"("trade_room_id", "card_id", "offered_by_user_id");

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("badge_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_vault_card_id_fkey" FOREIGN KEY ("vault_card_id") REFERENCES "user_binder_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_matches" ADD CONSTRAINT "bundle_matches_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_matches" ADD CONSTRAINT "bundle_matches_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_rooms" ADD CONSTRAINT "trade_rooms_bundle_match_id_fkey" FOREIGN KEY ("bundle_match_id") REFERENCES "bundle_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_rooms" ADD CONSTRAINT "trade_rooms_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_rooms" ADD CONSTRAINT "trade_rooms_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_trade_room_id_fkey" FOREIGN KEY ("trade_room_id") REFERENCES "trade_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "photo_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_offered_by_user_id_fkey" FOREIGN KEY ("offered_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
