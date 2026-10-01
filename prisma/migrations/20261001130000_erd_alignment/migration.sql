-- Align the persisted model with the Door2Door V1 ERD while preserving core data.

-- Restaurant fields replace the temporary branch and delivery-settings models.
ALTER TABLE "restaurants"
  ADD COLUMN "cover_image_url" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "whatsapp" TEXT,
  ADD COLUMN "is_open" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "opening_time" TEXT,
  ADD COLUMN "closing_time" TEXT,
  ADD COLUMN "delivery_radius_km" DECIMAL(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN "minimum_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "restaurants" AS restaurant
SET
  "address" = COALESCE(NULLIF(concat_ws(', ', location."address_line1", location."address_line2", location."city", location."state", location."postal_code", location."country"), ''), 'Address unavailable'),
  "phone" = COALESCE(location."phone", ''),
  "delivery_radius_km" = COALESCE(settings."delivery_radius", 0),
  "minimum_order_amount" = COALESCE(settings."minimum_order_amount", 0),
  "delivery_fee" = COALESCE(settings."base_delivery_fee", 0)
FROM "restaurant_locations" AS location
LEFT JOIN "delivery_settings" AS settings ON settings."location_id" = location."id"
WHERE location."id" = (
  SELECT first_location."id"
  FROM "restaurant_locations" AS first_location
  WHERE first_location."restaurant_id" = restaurant."id"
  ORDER BY first_location."created_at", first_location."id"
  LIMIT 1
);

UPDATE "restaurants" SET "address" = 'Address unavailable' WHERE "address" IS NULL;
UPDATE "restaurants" SET "phone" = '' WHERE "phone" IS NULL;
ALTER TABLE "restaurants" ALTER COLUMN "address" SET NOT NULL;
ALTER TABLE "restaurants" ALTER COLUMN "phone" SET NOT NULL;
ALTER TABLE "restaurants" DROP COLUMN "website";

-- Catalog fields and media.
ALTER TABLE "menu_categories" ADD COLUMN "image_url" TEXT;
ALTER TABLE "menu_categories" DROP COLUMN "description";
ALTER TABLE "menu_categories" DROP COLUMN "location_id" CASCADE;
CREATE UNIQUE INDEX "menu_categories_restaurant_id_name_key" ON "menu_categories"("restaurant_id", "name");

ALTER TABLE "menu_items" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "menu_items" DROP CONSTRAINT IF EXISTS "menu_items_category_id_fkey";
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "product_options" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "product_options_product_id_idx" ON "product_options"("product_id");
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "option_items" (
  "id" TEXT NOT NULL,
  "option_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price_delta" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "option_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "option_items_option_id_idx" ON "option_items"("option_id");
ALTER TABLE "option_items" ADD CONSTRAINT "option_items_option_id_fkey"
  FOREIGN KEY ("option_id") REFERENCES "product_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "product_images" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "image_url" TEXT NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "product_images" ("id", "product_id", "image_url", "is_primary", "sort_order", "updated_at")
SELECT 'primary-' || "id", "id", "image_url", true, 0, CURRENT_TIMESTAMP
FROM "menu_items"
WHERE "image_url" IS NOT NULL AND btrim("image_url") <> '';

-- Guest customers are data records only; they have no authentication fields.
CREATE TABLE "customers" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "whatsapp" TEXT,
  "address" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- Backfill one immutable guest record per existing order before enforcing the FK.
INSERT INTO "customers" ("id", "name", "phone", "address", "latitude", "longitude", "notes", "created_at", "updated_at")
SELECT
  'guest-' || "id",
  COALESCE(NULLIF("customer_name", ''), 'Guest'),
  COALESCE("customer_phone", ''),
  COALESCE(NULLIF("delivery_address", ''), 'Address unavailable'),
  "delivery_latitude",
  "delivery_longitude",
  "special_instructions",
  "created_at",
  "updated_at"
FROM "orders";

ALTER TABLE "orders" ADD COLUMN "customer_id" TEXT;
UPDATE "orders" SET "customer_id" = 'guest-' || "id";
ALTER TABLE "orders" ALTER COLUMN "customer_id" SET NOT NULL;
ALTER TABLE "orders" RENAME COLUMN "short_id" TO "order_number";
ALTER TABLE "orders" RENAME COLUMN "subtotal" TO "sub_total";
ALTER TABLE "orders" ADD COLUMN "payment_method" TEXT NOT NULL DEFAULT 'cod';
ALTER TABLE "orders" ADD COLUMN "address" TEXT;
ALTER TABLE "orders" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN "customer_note" TEXT;
ALTER TABLE "orders" ADD COLUMN "admin_note" TEXT;
UPDATE "orders"
SET
  "status" = CASE upper("status")
    WHEN 'ACCEPTED' THEN 'confirmed'
    WHEN 'COMPLETED' THEN 'delivered'
    WHEN 'OUT_FOR_DELIVERY' THEN 'out_for_delivery'
    WHEN 'CONFIRMED' THEN 'confirmed'
    WHEN 'PREPARING' THEN 'preparing'
    WHEN 'READY' THEN 'ready'
    WHEN 'DELIVERED' THEN 'delivered'
    WHEN 'CANCELLED' THEN 'cancelled'
    ELSE 'pending'
  END,
  "payment_status" = CASE upper("payment_status")
    WHEN 'PAID' THEN 'paid'
    WHEN 'FAILED' THEN 'failed'
    WHEN 'REFUNDED' THEN 'failed'
    ELSE 'pending'
  END,
  "address" = COALESCE(NULLIF("delivery_address", ''), 'Address unavailable'),
  "latitude" = "delivery_latitude",
  "longitude" = "delivery_longitude",
  "customer_note" = "special_instructions";
ALTER TABLE "orders" ALTER COLUMN "address" SET NOT NULL;
ALTER TABLE "orders"
  DROP COLUMN "location_id" CASCADE,
  DROP COLUMN "customer_name",
  DROP COLUMN "customer_phone",
  DROP COLUMN "customer_email",
  DROP COLUMN "order_type",
  DROP COLUMN "tax_amount",
  DROP COLUMN "special_instructions",
  DROP COLUMN "delivery_address",
  DROP COLUMN "delivery_latitude",
  DROP COLUMN "delivery_longitude";
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_restaurant_id_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_status_check"
  CHECK ("status" IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'));
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_method_check"
  CHECK ("payment_method" IN ('cod', 'online'));
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_status_check"
  CHECK ("payment_status" IN ('pending', 'paid', 'failed'));
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- Order item snapshots ensure historical orders never change with the catalog.
ALTER TABLE "order_items" RENAME COLUMN "item_id" TO "product_id";
ALTER TABLE "order_items" RENAME COLUMN "subtotal" TO "total_price";
ALTER TABLE "order_items" ADD COLUMN "product_name" TEXT;
ALTER TABLE "order_items" ADD COLUMN "product_image" TEXT;
UPDATE "order_items" AS order_item
SET
  "product_name" = product."name",
  "product_image" = product."image_url"
FROM "menu_items" AS product
WHERE product."id" = order_item."product_id";
UPDATE "order_items" SET "product_name" = 'Archived product' WHERE "product_name" IS NULL;
ALTER TABLE "order_items" ALTER COLUMN "product_name" SET NOT NULL;
ALTER TABLE "order_items" DROP COLUMN "notes";
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_item_id_fkey";
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

CREATE TABLE "order_item_options" (
  "id" TEXT NOT NULL,
  "order_item_id" TEXT NOT NULL,
  "option_id" TEXT NOT NULL,
  "option_item_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price_delta" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "order_item_options_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "order_item_options_order_item_id_idx" ON "order_item_options"("order_item_id");
ALTER TABLE "order_item_options" ADD CONSTRAINT "order_item_options_order_item_id_fkey"
  FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_item_options" ADD CONSTRAINT "order_item_options_option_id_fkey"
  FOREIGN KEY ("option_id") REFERENCES "product_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "order_item_options" ADD CONSTRAINT "order_item_options_option_item_id_fkey"
  FOREIGN KEY ("option_item_id") REFERENCES "option_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_status_history" RENAME COLUMN "changed_by_id" TO "created_by";
ALTER TABLE "order_status_history" RENAME COLUMN "notes" TO "note";
UPDATE "order_status_history"
SET "status" = CASE upper("status")
  WHEN 'ACCEPTED' THEN 'confirmed'
  WHEN 'COMPLETED' THEN 'delivered'
  WHEN 'OUT_FOR_DELIVERY' THEN 'out_for_delivery'
  WHEN 'CONFIRMED' THEN 'confirmed'
  WHEN 'PREPARING' THEN 'preparing'
  WHEN 'READY' THEN 'ready'
  WHEN 'DELIVERED' THEN 'delivered'
  WHEN 'CANCELLED' THEN 'cancelled'
  ELSE 'pending'
END;
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_status_check"
  CHECK ("status" IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'));
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history"("order_id");

-- Delivery zones are restaurant-owned in the multi-tenant model.
ALTER TABLE "delivery_zones" ADD COLUMN "restaurant_id" TEXT;
UPDATE "delivery_zones" AS zone
SET "restaurant_id" = location."restaurant_id"
FROM "restaurant_locations" AS location
WHERE location."id" = zone."location_id";
DELETE FROM "delivery_zones" WHERE "restaurant_id" IS NULL;
ALTER TABLE "delivery_zones" ALTER COLUMN "restaurant_id" SET NOT NULL;
ALTER TABLE "delivery_zones" RENAME COLUMN "coordinates" TO "polygon";
ALTER TABLE "delivery_zones" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "delivery_zones"
  DROP COLUMN "location_id" CASCADE,
  DROP COLUMN "postal_code",
  DROP COLUMN "minimum_order";
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_restaurant_id_fkey"
  FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "delivery_zones_restaurant_id_idx" ON "delivery_zones"("restaurant_id");

ALTER TABLE "payments" RENAME COLUMN "payment_method" TO "method";
ALTER TABLE "payments" RENAME COLUMN "transaction_reference" TO "transaction_id";
UPDATE "payments"
SET
  "method" = CASE upper("method") WHEN 'ONLINE' THEN 'online' WHEN 'CARD' THEN 'online' ELSE 'cod' END,
  "status" = CASE upper("status") WHEN 'PAID' THEN 'paid' WHEN 'FAILED' THEN 'failed' WHEN 'REFUNDED' THEN 'failed' ELSE 'pending' END;
ALTER TABLE "payments" ADD CONSTRAINT "payments_method_check" CHECK ("method" IN ('cod', 'online'));
ALTER TABLE "payments" ADD CONSTRAINT "payments_status_check" CHECK ("status" IN ('pending', 'paid', 'failed'));
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

CREATE TABLE "settings" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

CREATE TABLE "media" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "entity_type" TEXT,
  "entity_id" TEXT,
  "url" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "media_entity_type_entity_id_idx" ON "media"("entity_type", "entity_id");

DROP TABLE "delivery_settings";
DROP TABLE "restaurant_locations";
