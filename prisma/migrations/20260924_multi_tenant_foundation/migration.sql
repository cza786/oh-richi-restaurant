-- Establish the multi-tenant keys missing from the original schema.
-- This migration alters the tables created by 20260708095125_init instead of
-- attempting to recreate them with CREATE TABLE IF NOT EXISTS.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT;
UPDATE "users" AS app_user
SET "role" = legacy_role."name"
FROM "user_roles" AS assignment
JOIN "roles" AS legacy_role ON legacy_role."id" = assignment."role_id"
WHERE assignment."user_id" = app_user."id"
  AND (app_user."role" IS NULL OR btrim(app_user."role") = '');
UPDATE "users" AS app_user
SET "role" = 'SUPER_ADMIN'
WHERE EXISTS (
  SELECT 1
  FROM "user_roles" AS assignment
  JOIN "roles" AS legacy_role ON legacy_role."id" = assignment."role_id"
  WHERE assignment."user_id" = app_user."id"
    AND lower(replace(legacy_role."name", '_', '')) = 'superadmin'
);
UPDATE "users"
SET "role" = 'SUPER_ADMIN'
WHERE lower(replace("role", '_', '')) = 'superadmin';
UPDATE "users" SET "role" = 'LEGACY_USER' WHERE "role" IS NULL OR btrim("role") = '';
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'SUPER_ADMIN';
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;

ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "slug" TEXT;
UPDATE "restaurants"
SET "slug" = lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr("id", 1, 8)
WHERE "slug" IS NULL OR btrim("slug") = '';
ALTER TABLE "restaurants" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "restaurants_slug_key" ON "restaurants"("slug");

ALTER TABLE "menu_categories" ADD COLUMN IF NOT EXISTS "restaurant_id" TEXT;
UPDATE "menu_categories" AS category
SET "restaurant_id" = location."restaurant_id"
FROM "restaurant_locations" AS location
WHERE category."location_id" = location."id" AND category."restaurant_id" IS NULL;
ALTER TABLE "menu_categories" ALTER COLUMN "restaurant_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "menu_categories_restaurant_id_idx" ON "menu_categories"("restaurant_id");
ALTER TABLE "menu_categories" DROP CONSTRAINT IF EXISTS "menu_categories_restaurant_id_fkey";
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "restaurant_id" TEXT;
UPDATE "menu_items" AS item
SET "restaurant_id" = category."restaurant_id"
FROM "menu_categories" AS category
WHERE item."category_id" = category."id" AND item."restaurant_id" IS NULL;
ALTER TABLE "menu_items" ALTER COLUMN "restaurant_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "menu_items_restaurant_id_idx" ON "menu_items"("restaurant_id");
CREATE INDEX IF NOT EXISTS "menu_items_category_id_idx" ON "menu_items"("category_id");
ALTER TABLE "menu_items" DROP CONSTRAINT IF EXISTS "menu_items_restaurant_id_fkey";
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "restaurant_id" TEXT;
UPDATE "orders" AS orders
SET "restaurant_id" = location."restaurant_id"
FROM "restaurant_locations" AS location
WHERE orders."location_id" = location."id" AND orders."restaurant_id" IS NULL;
ALTER TABLE "orders" ALTER COLUMN "restaurant_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "orders_restaurant_id_idx" ON "orders"("restaurant_id");
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_restaurant_id_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "user_agent" TEXT,
  "ip_address" TEXT,
  "is_revoked" BOOLEAN NOT NULL DEFAULT false,
  "revoked_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_hash_key" ON "sessions"("token_hash");
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_fkey";
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
