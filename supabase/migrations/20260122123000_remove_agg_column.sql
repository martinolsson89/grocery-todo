BEGIN;

UPDATE "public"."list_items"
SET "column_id" = 'mejeri'
WHERE "column_id" = 'agg';

DELETE FROM "public"."list_columns" lc
USING "public"."grocery_lists" gl
WHERE lc."list_id" = gl."id"
  AND gl."store_template_id" = 'hemkop_default'
  AND lc."id" = 'agg';

DELETE FROM "public"."store_template_columns"
WHERE "template_id" = 'hemkop_default'
  AND "id" = 'agg';

UPDATE "public"."list_columns" lc
SET "title" = stc."title",
    "sort_order" = stc."sort_order"
FROM "public"."grocery_lists" gl,
     "public"."store_template_columns" stc
WHERE lc."list_id" = gl."id"
  AND gl."store_template_id" IN ('willys_default', 'hemkop_default')
  AND stc."template_id" = gl."store_template_id"
  AND stc."id" = lc."id";

COMMIT;
