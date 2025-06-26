ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'default' NOT NULL;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "org_id" text;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "org_id" text;
