-- Prepare existing multi-tenant marketplace tables for case-insensitive global search.
-- This migration is additive: it does not alter data, tables, or tenant relationships.

-- pg_trgm is supported by Supabase and makes ILIKE/Prisma `contains` searches
-- scalable for both prefix and infix matching.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Only active stores participate in marketplace search.
CREATE INDEX IF NOT EXISTS "restaurants_active_name_trgm_idx"
  ON "restaurants"
  USING GIN (lower("name") extensions.gin_trgm_ops)
  WHERE "is_active" = true;

-- Category names are searched through menu items. This does not change the
-- existing category -> restaurant relationship or duplicate category data.
CREATE INDEX IF NOT EXISTS "menu_categories_name_trgm_idx"
  ON "menu_categories"
  USING GIN (lower("name") extensions.gin_trgm_ops);

-- Keep the searchable product set limited to active, currently available items.
-- restaurant_id remains indexed separately by the existing tenant index and FK.
CREATE INDEX IF NOT EXISTS "menu_items_searchable_name_trgm_idx"
  ON "menu_items"
  USING GIN (lower("name") extensions.gin_trgm_ops)
  WHERE "is_active" = true AND "is_available" = true;

CREATE INDEX IF NOT EXISTS "menu_items_searchable_description_trgm_idx"
  ON "menu_items"
  USING GIN (lower(coalesce("description", '')) extensions.gin_trgm_ops)
  WHERE "is_active" = true AND "is_available" = true;
