-- AddColumn to users table for Stripe billing
ALTER TABLE "users" ADD COLUMN "tier" TEXT DEFAULT 'FREE';
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" TEXT UNIQUE;
ALTER TABLE "users" ADD COLUMN "subscription_id" TEXT UNIQUE;
ALTER TABLE "users" ADD COLUMN "subscription_status" TEXT;
ALTER TABLE "users" ADD COLUMN "subscription_expires_at" TIMESTAMP(3);
