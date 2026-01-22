BEGIN;

INSERT INTO "public"."store_template_columns" ("template_id", "id", "title", "sort_order")
SELECT "template_id", 'allvarldensmat', "title", "sort_order"
FROM "public"."store_template_columns"
WHERE "template_id" = 'willys_default'
  AND "id" = 'asiatiskt'
ON CONFLICT ("template_id", "id") DO NOTHING;

INSERT INTO "public"."list_columns" ("id", "list_id", "title", "sort_order")
SELECT 'allvarldensmat', "list_id", "title", "sort_order"
FROM "public"."list_columns"
WHERE "id" = 'asiatiskt'
  AND "list_id" IN (
    SELECT "id" FROM "public"."grocery_lists" WHERE "store_template_id" = 'willys_default'
  )
ON CONFLICT ("list_id", "id") DO NOTHING;

UPDATE "public"."list_items"
SET "column_id" = 'allvarldensmat'
WHERE "column_id" = 'asiatiskt'
  AND "list_id" IN (
    SELECT "id" FROM "public"."grocery_lists" WHERE "store_template_id" = 'willys_default'
  );

DELETE FROM "public"."list_columns"
WHERE "id" = 'asiatiskt'
  AND "list_id" IN (
    SELECT "id" FROM "public"."grocery_lists" WHERE "store_template_id" = 'willys_default'
  );

DELETE FROM "public"."store_template_columns"
WHERE "template_id" = 'willys_default'
  AND "id" = 'asiatiskt';

COMMIT;
