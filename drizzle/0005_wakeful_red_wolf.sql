DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'accounts' AND column_name = 'org_id'
    ) THEN
        ALTER TABLE "accounts" RENAME COLUMN "org_id" TO "orgId";
    END IF;
END$$;
--> statement-breakpoint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'categories' AND column_name = 'org_id'
    ) THEN
        ALTER TABLE "categories" RENAME COLUMN "org_id" TO "orgId";
    END IF;
END$$;
