BEGIN;

UPDATE "public"."list_items"
SET "category_id" = "column_id"
WHERE "category_id" IS NULL;

ALTER TABLE "public"."list_items"
    ALTER COLUMN "category_id" SET NOT NULL;

ALTER TABLE "public"."list_items"
    DROP CONSTRAINT IF EXISTS "list_items_list_id_column_id_fkey";

DROP INDEX IF EXISTS "idx_list_items_column_id";

ALTER TABLE "public"."list_items"
    DROP COLUMN IF EXISTS "column_id";

DROP TRIGGER IF EXISTS "seed_list_columns_from_template" ON "public"."grocery_lists";
DROP FUNCTION IF EXISTS "public"."seed_list_columns_from_template"();

ALTER PUBLICATION "supabase_realtime" DROP TABLE ONLY "public"."list_columns";
DROP TABLE IF EXISTS "public"."list_columns";

ALTER PUBLICATION "supabase_realtime" DROP TABLE ONLY "public"."store_template_columns";
DROP TABLE IF EXISTS "public"."store_template_columns";

ALTER TABLE "public"."grocery_lists"
    DROP CONSTRAINT IF EXISTS "grocery_lists_store_check";

ALTER TABLE "public"."grocery_lists"
    DROP COLUMN IF EXISTS "store";

COMMIT;
