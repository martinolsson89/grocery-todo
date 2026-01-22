CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."stores" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."store_templates" (
    "id" "text" NOT NULL,
    "store_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "store_templates_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."store_templates" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."store_template_columns" (
    "template_id" "text" NOT NULL,
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "store_template_columns_pkey" PRIMARY KEY ("template_id", "id")
);

ALTER TABLE "public"."store_template_columns" OWNER TO "postgres";

INSERT INTO "public"."stores" ("id", "name")
VALUES
    ('willys', 'Willys'),
    ('hemkop', 'Hemköp')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "public"."store_templates" ("id", "store_id", "name")
VALUES
    ('willys_default', 'willys', 'Default'),
    ('hemkop_default', 'hemkop', 'Default')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "public"."store_template_columns" ("template_id", "id", "title", "sort_order")
VALUES
    ('willys_default', 'frukt_gront', 'Frukt & Grönt', 0),
    ('willys_default', 'brod', 'Bröd', 1),
    ('willys_default', 'fika', 'Fika', 2),
    ('willys_default', 'chark', 'Chark', 3),
    ('willys_default', 'ost_palagg', 'Ost/skinka/pålägg', 4),
    ('willys_default', 'protein', 'Protein (Färskt)', 5),
    ('willys_default', 'mejeri', 'Mejeri', 6),
    ('willys_default', 'frysvaror', 'Frysvaror', 7),
    ('willys_default', 'asiatiskt', 'Asiatiskt', 8),
    ('willys_default', 'tacohyllan', 'Tacohyllan', 9),
    ('willys_default', 'skafferi', 'Skafferi', 10),
    ('willys_default', 'dryck', 'Dryck', 11),
    ('willys_default', 'snacks', 'Snacks', 12),
    ('willys_default', 'stadvaror', 'Städvaror', 13),
    ('willys_default', 'barn', 'Barn', 14),
    ('willys_default', 'hygien', 'Hygien', 15),
    ('willys_default', 'frys_bar_glass', 'Frys (bär/glass)', 16),
    ('willys_default', 'ovrigt', 'Övrigt', 17),
    ('hemkop_default', 'frukt_gront', 'Frukt & Grönt', 0),
    ('hemkop_default', 'brod', 'Bröd', 1),
    ('hemkop_default', 'fika', 'Fika', 2),
    ('hemkop_default', 'chark', 'Chark', 3),
    ('hemkop_default', 'ost_palagg', 'Ost/skinka/pålägg', 4),
    ('hemkop_default', 'protein', 'Protein (Färskt)', 5),
    ('hemkop_default', 'tacohyllan', 'Tacohyllan', 6),
    ('hemkop_default', 'frysvaror', 'Frysvaror', 7),
    ('hemkop_default', 'mejeri', 'Mejeri', 8),
    ('hemkop_default', 'dryck', 'Dryck', 9),
    ('hemkop_default', 'snacks', 'Snacks', 10),
    ('hemkop_default', 'skafferi', 'Skafferi', 11),
    ('hemkop_default', 'asiatiskt', 'Asiatiskt', 12),
    ('hemkop_default', 'frys_bar_glass', 'Frys (bär/glass)', 13),
    ('hemkop_default', 'barn', 'Barn', 14),
    ('hemkop_default', 'hygien', 'Hygien', 15),
    ('hemkop_default', 'stadvaror', 'Städvaror', 16),
    ('hemkop_default', 'ovrigt', 'Övrigt', 17)
ON CONFLICT ("template_id", "id") DO NOTHING;

ALTER TABLE "public"."store_templates"
    ADD CONSTRAINT "store_templates_store_id_fkey"
    FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;

ALTER TABLE "public"."store_template_columns"
    ADD CONSTRAINT "store_template_columns_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "public"."store_templates"("id") ON DELETE CASCADE;

ALTER TABLE "public"."grocery_lists"
    ADD COLUMN IF NOT EXISTS "store_template_id" "text";

UPDATE "public"."grocery_lists"
SET "store_template_id" = CASE
    WHEN "store" = 'hemkop' THEN 'hemkop_default'
    ELSE 'willys_default'
END
WHERE "store_template_id" IS NULL;

ALTER TABLE "public"."grocery_lists"
    ALTER COLUMN "store_template_id" SET NOT NULL;

ALTER TABLE "public"."grocery_lists"
    ADD CONSTRAINT "grocery_lists_store_template_id_fkey"
    FOREIGN KEY ("store_template_id") REFERENCES "public"."store_templates"("id") ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS "idx_grocery_lists_store_template_id" ON "public"."grocery_lists" USING "btree" ("store_template_id");

CREATE OR REPLACE FUNCTION "public"."seed_list_columns_from_template"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "public"."list_columns" ("id", "list_id", "title", "sort_order")
  SELECT "id", NEW."id", "title", "sort_order"
  FROM "public"."store_template_columns"
  WHERE "template_id" = NEW."store_template_id"
  ORDER BY "sort_order"
  ON CONFLICT ("list_id", "id") DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "seed_list_columns_from_template" ON "public"."grocery_lists";

CREATE TRIGGER "seed_list_columns_from_template"
AFTER INSERT ON "public"."grocery_lists"
FOR EACH ROW
EXECUTE FUNCTION "public"."seed_list_columns_from_template"();

CREATE POLICY "Allow all access to stores" ON "public"."stores" USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to store_templates" ON "public"."store_templates" USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to store_template_columns" ON "public"."store_template_columns" USING (true) WITH CHECK (true);

ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."store_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."store_template_columns" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."store_template_columns";
ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."store_templates";

GRANT ALL ON TABLE "public"."stores" TO "anon";
GRANT ALL ON TABLE "public"."stores" TO "authenticated";
GRANT ALL ON TABLE "public"."stores" TO "service_role";

GRANT ALL ON TABLE "public"."store_templates" TO "anon";
GRANT ALL ON TABLE "public"."store_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."store_templates" TO "service_role";

GRANT ALL ON TABLE "public"."store_template_columns" TO "anon";
GRANT ALL ON TABLE "public"."store_template_columns" TO "authenticated";
GRANT ALL ON TABLE "public"."store_template_columns" TO "service_role";

