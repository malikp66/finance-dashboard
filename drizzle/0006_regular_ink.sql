DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'accounts' AND column_name = 'orgId'
    ) THEN
        ALTER TABLE "accounts" RENAME COLUMN "orgId" TO "org_id";
    END IF;
END$$;
--> statement-breakpoint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'orgId'
    ) THEN
        ALTER TABLE "categories" RENAME COLUMN "orgId" TO "org_id";
    END IF;
END$$;
