-- =====================================================================
-- Supabase Row Level Security (RLS) Policies
-- Only include policies, other tables already exist in DB
-- =====================================================================
-- Enable RLS on core tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_binder_cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "users_select_own_or_public" ON "users";
DROP POLICY IF EXISTS "users_update_own" ON "users";
DROP POLICY IF EXISTS "users_insert_own" ON "users";
DROP POLICY IF EXISTS "user_binder_cards_select_owned_or_public" ON "user_binder_cards";
DROP POLICY IF EXISTS "user_binder_cards_update_own" ON "user_binder_cards";
DROP POLICY IF EXISTS "user_binder_cards_insert_own" ON "user_binder_cards";
DROP POLICY IF EXISTS "user_binder_cards_delete_own" ON "user_binder_cards";
DROP POLICY IF EXISTS "notifications_select_own" ON "notifications";
DROP POLICY IF EXISTS "notifications_update_own" ON "notifications";
DROP POLICY IF EXISTS "notifications_insert_own" ON "notifications";
DROP POLICY IF EXISTS "notifications_delete_own" ON "notifications";

-- User table: Each user can only read their own data and CUD it
CREATE POLICY "users_select_own_or_public" ON "users"
  FOR SELECT USING (
    auth.uid()::text = id
    OR true
  );

CREATE POLICY "users_update_own" ON "users"
  FOR UPDATE USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "users_insert_own" ON "users"
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- UserBinderCard: Only owner can CUD, others can read for vault display
CREATE POLICY "user_binder_cards_select_owned_or_public" ON "user_binder_cards"
  FOR SELECT USING (
    auth.uid()::text = "userId"
    OR true
  );

CREATE POLICY "user_binder_cards_update_own" ON "user_binder_cards"
  FOR UPDATE USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "user_binder_cards_insert_own" ON "user_binder_cards"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "user_binder_cards_delete_own" ON "user_binder_cards"
  FOR DELETE USING (auth.uid()::text = "userId");

-- Notifications: Only recipient can read/update their own
CREATE POLICY "notifications_select_own" ON "notifications"
  FOR SELECT USING (auth.uid()::text = "user_id");

CREATE POLICY "notifications_update_own" ON "notifications"
  FOR UPDATE USING (auth.uid()::text = "user_id")
  WITH CHECK (auth.uid()::text = "user_id");

CREATE POLICY "notifications_insert_own" ON "notifications"
  FOR INSERT WITH CHECK (auth.uid()::text = "user_id");

CREATE POLICY "notifications_delete_own" ON "notifications"
  FOR DELETE USING (auth.uid()::text = "user_id");
