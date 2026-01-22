BEGIN;

CREATE TEMP TABLE desired_columns (
  template_id text,
  id text,
  title text,
  sort_order integer
) ON COMMIT DROP;

INSERT INTO desired_columns (template_id, id, title, sort_order)
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
  ('hemkop_default', 'ovrigt', 'Övrigt', 17);

INSERT INTO "public"."store_template_columns" ("template_id", "id", "title", "sort_order")
SELECT "template_id", "id", "title", "sort_order"
FROM desired_columns
ON CONFLICT ("template_id", "id") DO UPDATE
SET "title" = EXCLUDED."title",
    "sort_order" = EXCLUDED."sort_order";

DELETE FROM "public"."store_template_columns" AS stc
WHERE stc."template_id" IN ('willys_default', 'hemkop_default')
  AND NOT EXISTS (
    SELECT 1
    FROM desired_columns dc
    WHERE dc."template_id" = stc."template_id"
      AND dc."id" = stc."id"
  );

INSERT INTO "public"."list_columns" ("id", "list_id", "title", "sort_order")
SELECT dc."id", gl."id", dc."title", dc."sort_order"
FROM "public"."grocery_lists" gl
JOIN desired_columns dc ON dc."template_id" = gl."store_template_id"
LEFT JOIN "public"."list_columns" lc
  ON lc."list_id" = gl."id" AND lc."id" = dc."id"
WHERE gl."store_template_id" IN ('willys_default', 'hemkop_default')
  AND lc."id" IS NULL
ON CONFLICT ("list_id", "id") DO NOTHING;

UPDATE "public"."list_items" li
SET "column_id" = 'asiatiskt'
FROM "public"."grocery_lists" gl
WHERE li."list_id" = gl."id"
  AND gl."store_template_id" = 'willys_default'
  AND li."column_id" = 'allvarldensmat';

UPDATE "public"."list_items" li
SET "column_id" = 'mejeri'
FROM "public"."grocery_lists" gl
WHERE li."list_id" = gl."id"
  AND gl."store_template_id" = 'hemkop_default'
  AND li."column_id" = 'agg';

UPDATE "public"."list_columns" lc
SET "title" = dc."title",
    "sort_order" = dc."sort_order"
FROM desired_columns dc,
     "public"."grocery_lists" gl
WHERE lc."list_id" = gl."id"
  AND gl."store_template_id" IN ('willys_default', 'hemkop_default')
  AND dc."template_id" = gl."store_template_id"
  AND dc."id" = lc."id";

DELETE FROM "public"."list_columns" lc
USING "public"."grocery_lists" gl
WHERE lc."list_id" = gl."id"
  AND gl."store_template_id" IN ('willys_default', 'hemkop_default')
  AND NOT EXISTS (
    SELECT 1
    FROM desired_columns dc
    WHERE dc."template_id" = gl."store_template_id"
      AND dc."id" = lc."id"
  );

COMMIT;
