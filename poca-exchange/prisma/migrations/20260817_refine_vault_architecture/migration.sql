-- Remove priceKrw field from PhotoCard (consolidate to USD-only)
ALTER TABLE "photo_cards" DROP COLUMN IF EXISTS "price_krw";

-- Create Tag table for normalized user-created tags
CREATE TABLE IF NOT EXISTS "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for autocomplete/search
CREATE INDEX IF NOT EXISTS "tags_name_idx" ON "tags"("name");
CREATE INDEX IF NOT EXISTS "tags_created_at_idx" ON "tags"("created_at");

-- Create UserBinderCardTag table for N:M relationship
CREATE TABLE IF NOT EXISTS "user_binder_card_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_binder_card_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_binder_card_tags_user_binder_card_id_fkey"
        FOREIGN KEY ("user_binder_card_id")
        REFERENCES "user_binder_cards"("id") ON DELETE CASCADE,

    CONSTRAINT "user_binder_card_tags_tag_id_fkey"
        FOREIGN KEY ("tag_id")
        REFERENCES "tags"("id") ON DELETE CASCADE
);

-- Create unique constraint for (userBinderCardId, tagId) pair
CREATE UNIQUE INDEX IF NOT EXISTS "user_binder_card_tags_unique_idx"
    ON "user_binder_card_tags"("user_binder_card_id", "tag_id");

-- Create indexes for efficient joins
CREATE INDEX IF NOT EXISTS "user_binder_card_tags_user_binder_card_id_idx"
    ON "user_binder_card_tags"("user_binder_card_id");
CREATE INDEX IF NOT EXISTS "user_binder_card_tags_tag_id_idx"
    ON "user_binder_card_tags"("tag_id");

-- Create or alter SmartBinderRule table
-- If the table doesn't exist yet, create it; otherwise add the column
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'smart_binder_rules') THEN
        -- Create SmartBinderRule table
        CREATE TABLE "smart_binder_rules" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "user_id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "system_filters" JSONB NOT NULL DEFAULT '{}',
            "custom_tag_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
            "display_mode" TEXT NOT NULL DEFAULT 'GRID',
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL
        );

        CREATE INDEX "smart_binder_rules_user_id_idx" ON "smart_binder_rules"("user_id");
    ELSE
        -- Table exists, check if column exists and rename if needed
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'smart_binder_rules'
                   AND column_name = 'customTagFilters') THEN
            ALTER TABLE "smart_binder_rules" RENAME COLUMN "customTagFilters" TO "custom_tag_ids";
        END IF;

        -- Add custom_tag_ids column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'smart_binder_rules'
                       AND column_name = 'custom_tag_ids') THEN
            ALTER TABLE "smart_binder_rules" ADD COLUMN "custom_tag_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
        END IF;
    END IF;
END $$;
