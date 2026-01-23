BEGIN;

CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."categories" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."store_template_category_order" (
    "template_id" "text" NOT NULL,
    "category_id" "text" NOT NULL,
    "sort_order" integer NOT NULL,
    CONSTRAINT "store_template_category_order_pkey" PRIMARY KEY ("template_id", "category_id")
);

ALTER TABLE "public"."store_template_category_order" OWNER TO "postgres";

ALTER TABLE "public"."store_template_category_order"
    ADD CONSTRAINT "store_template_category_order_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "public"."store_templates"("id") ON DELETE CASCADE;

ALTER TABLE "public"."store_template_category_order"
    ADD CONSTRAINT "store_template_category_order_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;

ALTER TABLE "public"."list_items"
    ADD COLUMN IF NOT EXISTS "category_id" "text";

INSERT INTO "public"."categories" ("id", "title")
SELECT DISTINCT ON ("id") "id", "title"
FROM (
    SELECT "id", "title", 1 AS "priority"
    FROM "public"."store_template_columns"
    UNION ALL
    SELECT "id", "title", 2 AS "priority"
    FROM "public"."list_columns"
) "source"
WHERE "id" IS NOT NULL
ORDER BY "id", "priority"
ON CONFLICT ("id") DO UPDATE
SET "title" = EXCLUDED."title";

INSERT INTO "public"."store_template_category_order" ("template_id", "category_id", "sort_order")
SELECT "template_id", "id", "sort_order"
FROM "public"."store_template_columns"
ON CONFLICT ("template_id", "category_id") DO UPDATE
SET "sort_order" = EXCLUDED."sort_order";

UPDATE "public"."list_items"
SET "category_id" = "column_id"
WHERE "category_id" IS NULL;

ALTER TABLE "public"."list_items"
    ADD CONSTRAINT "list_items_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS "idx_store_template_category_order_template_id_sort_order"
    ON "public"."store_template_category_order" USING "btree" ("template_id", "sort_order");

CREATE INDEX IF NOT EXISTS "idx_list_items_category_id"
    ON "public"."list_items" USING "btree" ("list_id", "category_id");

CREATE POLICY "Allow all access to categories" ON "public"."categories" USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to store_template_category_order" ON "public"."store_template_category_order" USING (true) WITH CHECK (true);

ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."store_template_category_order" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."categories";
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."store_template_category_order";

GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";

GRANT ALL ON TABLE "public"."store_template_category_order" TO "anon";
GRANT ALL ON TABLE "public"."store_template_category_order" TO "authenticated";
GRANT ALL ON TABLE "public"."store_template_category_order" TO "service_role";

CREATE OR REPLACE FUNCTION "public"."get_list_render"("list_id" "text")
RETURNS "jsonb"
LANGUAGE "sql"
STABLE
AS $$
WITH "list_row" AS (
    SELECT "id", "store_template_id"
    FROM "public"."grocery_lists"
    WHERE "id" = $1
),
"template_categories" AS (
    SELECT "stco"."category_id", "stco"."sort_order"
    FROM "public"."store_template_category_order" "stco"
    JOIN "list_row" "lr" ON "lr"."store_template_id" = "stco"."template_id"
),
"extra_categories" AS (
    SELECT DISTINCT "li"."category_id"
    FROM "public"."list_items" "li"
    JOIN "list_row" "lr" ON "lr"."id" = "li"."list_id"
    WHERE NOT EXISTS (
        SELECT 1
        FROM "template_categories" "tc"
        WHERE "tc"."category_id" = "li"."category_id"
    )
),
"all_categories" AS (
    SELECT "tc"."category_id", "tc"."sort_order", true AS "in_template"
    FROM "template_categories" "tc"
    UNION ALL
    SELECT "ec"."category_id",
           1000000 + row_number() OVER (ORDER BY "c"."title", "ec"."category_id") AS "sort_order",
           false AS "in_template"
    FROM "extra_categories" "ec"
    JOIN "public"."categories" "c" ON "c"."id" = "ec"."category_id"
)
SELECT jsonb_build_object(
    'list_id', "lr"."id",
    'store_template_id', "lr"."store_template_id",
    'categories', COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', "c"."id",
                    'title', "c"."title",
                    'sort_order', "ac"."sort_order",
                    'in_template', "ac"."in_template",
                    'items', COALESCE(
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'id', "li"."id",
                                    'text', "li"."text",
                                    'checked', "li"."checked",
                                    'sort_order', "li"."sort_order"
                                )
                                ORDER BY "li"."sort_order", "li"."created_at"
                            )
                            FROM "public"."list_items" "li"
                            WHERE "li"."list_id" = "lr"."id"
                              AND "li"."category_id" = "c"."id"
                        ),
                        '[]'::"jsonb"
                    )
                )
                ORDER BY "ac"."sort_order", "c"."title"
            )
            FROM "all_categories" "ac"
            JOIN "public"."categories" "c" ON "c"."id" = "ac"."category_id"
        ),
        '[]'::"jsonb"
    )
)
FROM "list_row" "lr";
$$;

ALTER FUNCTION "public"."get_list_render"("text") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_list_render"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_list_render"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_list_render"("text") TO "service_role";

COMMIT;
