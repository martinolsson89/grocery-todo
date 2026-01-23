


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."delete_old_lists"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  deleted_count integer;
begin
  delete from public.grocery_lists
  where created_at < now() - interval '30 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;


ALTER FUNCTION "public"."delete_old_lists"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."seed_list_columns_from_template"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."grocery_lists" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "store" "text" DEFAULT 'willys'::"text",
    "store_template_id" "text" NOT NULL,
    CONSTRAINT "grocery_lists_store_check" CHECK (("store" = ANY (ARRAY['willys'::"text", 'hemkop'::"text"])))
);


ALTER TABLE "public"."grocery_lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."list_columns" (
    "id" "text" NOT NULL,
    "list_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."list_columns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."list_items" (
    "id" "text" NOT NULL,
    "list_id" "text" NOT NULL,
    "column_id" "text" NOT NULL,
    "text" "text" NOT NULL,
    "checked" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."list_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "text" NOT NULL,
    "list_id" "text" NOT NULL,
    "title" "text",
    "url" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ingredients" "text"[],
    "instructions" "text",
    "yields" "text",
    "total_time" integer,
    "image_url" "text",
    "host" "text",
    CONSTRAINT "recipes_total_time_nonnegative" CHECK ((("total_time" IS NULL) OR ("total_time" >= 0)))
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_template_columns" (
    "template_id" "text" NOT NULL,
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."store_template_columns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_templates" (
    "id" "text" NOT NULL,
    "store_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."store_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stores" OWNER TO "postgres";


ALTER TABLE ONLY "public"."grocery_lists"
    ADD CONSTRAINT "grocery_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."list_columns"
    ADD CONSTRAINT "list_columns_pkey" PRIMARY KEY ("list_id", "id");



ALTER TABLE ONLY "public"."list_items"
    ADD CONSTRAINT "list_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_template_columns"
    ADD CONSTRAINT "store_template_columns_pkey" PRIMARY KEY ("template_id", "id");



ALTER TABLE ONLY "public"."store_templates"
    ADD CONSTRAINT "store_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_grocery_lists_store_template_id" ON "public"."grocery_lists" USING "btree" ("store_template_id");



CREATE INDEX "idx_list_columns_list_id" ON "public"."list_columns" USING "btree" ("list_id");



CREATE INDEX "idx_list_items_column_id" ON "public"."list_items" USING "btree" ("list_id", "column_id");



CREATE INDEX "idx_list_items_list_id" ON "public"."list_items" USING "btree" ("list_id");



CREATE INDEX "recipes_list_id_idx" ON "public"."recipes" USING "btree" ("list_id");



CREATE OR REPLACE TRIGGER "seed_list_columns_from_template" AFTER INSERT ON "public"."grocery_lists" FOR EACH ROW EXECUTE FUNCTION "public"."seed_list_columns_from_template"();



CREATE OR REPLACE TRIGGER "update_grocery_lists_updated_at" BEFORE UPDATE ON "public"."grocery_lists" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_list_items_updated_at" BEFORE UPDATE ON "public"."list_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_recipes_updated_at" BEFORE UPDATE ON "public"."recipes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."grocery_lists"
    ADD CONSTRAINT "grocery_lists_store_template_id_fkey" FOREIGN KEY ("store_template_id") REFERENCES "public"."store_templates"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."list_columns"
    ADD CONSTRAINT "list_columns_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."grocery_lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."list_items"
    ADD CONSTRAINT "list_items_list_id_column_id_fkey" FOREIGN KEY ("list_id", "column_id") REFERENCES "public"."list_columns"("list_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."list_items"
    ADD CONSTRAINT "list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."grocery_lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."grocery_lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."store_template_columns"
    ADD CONSTRAINT "store_template_columns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."store_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."store_templates"
    ADD CONSTRAINT "store_templates_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



CREATE POLICY "Allow all access to grocery_lists" ON "public"."grocery_lists" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all access to list_columns" ON "public"."list_columns" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all access to list_items" ON "public"."list_items" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all access to store_template_columns" ON "public"."store_template_columns" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all access to store_templates" ON "public"."store_templates" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all access to stores" ON "public"."stores" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on recipes" ON "public"."recipes" USING (true) WITH CHECK (true);



ALTER TABLE "public"."grocery_lists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."list_columns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."list_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."store_template_columns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."store_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."list_columns";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."list_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."recipes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."store_template_columns";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."store_templates";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































REVOKE ALL ON FUNCTION "public"."delete_old_lists"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_old_lists"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_old_lists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_old_lists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_list_columns_from_template"() TO "anon";
GRANT ALL ON FUNCTION "public"."seed_list_columns_from_template"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_list_columns_from_template"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."grocery_lists" TO "anon";
GRANT ALL ON TABLE "public"."grocery_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."grocery_lists" TO "service_role";



GRANT ALL ON TABLE "public"."list_columns" TO "anon";
GRANT ALL ON TABLE "public"."list_columns" TO "authenticated";
GRANT ALL ON TABLE "public"."list_columns" TO "service_role";



GRANT ALL ON TABLE "public"."list_items" TO "anon";
GRANT ALL ON TABLE "public"."list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."list_items" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."store_template_columns" TO "anon";
GRANT ALL ON TABLE "public"."store_template_columns" TO "authenticated";
GRANT ALL ON TABLE "public"."store_template_columns" TO "service_role";



GRANT ALL ON TABLE "public"."store_templates" TO "anon";
GRANT ALL ON TABLE "public"."store_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."store_templates" TO "service_role";



GRANT ALL ON TABLE "public"."stores" TO "anon";
GRANT ALL ON TABLE "public"."stores" TO "authenticated";
GRANT ALL ON TABLE "public"."stores" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































