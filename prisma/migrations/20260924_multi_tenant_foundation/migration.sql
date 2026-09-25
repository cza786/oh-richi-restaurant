-- Multi-Tenant Foundation Database Migration for Supabase / PostgreSQL
-- Target entities: profiles, restaurants, restaurant_members, branches (restaurant_locations), categories (menu_categories), products (menu_items), product_variants (item_variations), product_option_groups (combo_groups), product_options (combo_choices, addons), orders, order_items, order_item_options (order_item_addons)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "profiles_user_id_key" ON "profiles"("user_id");

-- 2. Restaurants Table
CREATE TABLE IF NOT EXISTS "restaurants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "website" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "restaurants_slug_key" ON "restaurants"("slug");

-- 3. Restaurant Members Table (Multi-tenant staff & owners)
CREATE TABLE IF NOT EXISTS "restaurant_members" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF', -- SUPER_ADMIN, OWNER, MANAGER, STAFF
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_members_restaurant_id_user_id_key" ON "restaurant_members"("restaurant_id", "user_id");
CREATE INDEX IF NOT EXISTS "restaurant_members_restaurant_id_idx" ON "restaurant_members"("restaurant_id");
CREATE INDEX IF NOT EXISTS "restaurant_members_user_id_idx" ON "restaurant_members"("user_id");

-- 4. Branches (Restaurant Locations Table)
CREATE TABLE IF NOT EXISTS "restaurant_locations" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_locations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "restaurant_locations_restaurant_id_idx" ON "restaurant_locations"("restaurant_id");

-- 5. Categories (Menu Categories Table)
CREATE TABLE IF NOT EXISTS "menu_categories" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "menu_categories_restaurant_id_idx" ON "menu_categories"("restaurant_id");

-- 6. Products (Menu Items Table)
CREATE TABLE IF NOT EXISTS "menu_items" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "base_price" DECIMAL(10,2) NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "menu_items_restaurant_id_idx" ON "menu_items"("restaurant_id");
CREATE INDEX IF NOT EXISTS "menu_items_category_id_idx" ON "menu_items"("category_id");

-- 7. Product Variants (Item Variations Table)
CREATE TABLE IF NOT EXISTS "item_variations" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_difference" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "sku" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_variations_pkey" PRIMARY KEY ("id")
);

-- 8. Product Option Groups (Combo Groups Table)
CREATE TABLE IF NOT EXISTS "combo_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_selection" INTEGER NOT NULL DEFAULT 1,
    "max_selection" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combo_groups_pkey" PRIMARY KEY ("id")
);

-- 9. Product Options (Combo Choices & Addons Tables)
CREATE TABLE IF NOT EXISTS "combo_choices" (
    "id" TEXT NOT NULL,
    "combo_group_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "variation_id" TEXT,
    "additional_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combo_choices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "addons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addons_pkey" PRIMARY KEY ("id")
);

-- 10. Orders Table
CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL,
    "short_id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "customer_email" TEXT,
    "table_id" TEXT,
    "order_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "special_instructions" TEXT,
    "delivery_address" TEXT,
    "delivery_latitude" DOUBLE PRECISION,
    "delivery_longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "orders_short_id_key" ON "orders"("short_id");
CREATE INDEX IF NOT EXISTS "orders_restaurant_id_idx" ON "orders"("restaurant_id");

-- 11. Order Items Table
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "variation_id" TEXT,
    "spice_level_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- 12. Order Item Options (Order Item Addons Table)
CREATE TABLE IF NOT EXISTS "order_item_addons" (
    "order_item_id" TEXT NOT NULL,
    "addon_id" TEXT NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "order_item_addons_pkey" PRIMARY KEY ("order_item_id", "addon_id")
);

-- Foreign Key Constraints
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_user_id_fkey";
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "restaurant_members" DROP CONSTRAINT IF EXISTS "restaurant_members_restaurant_id_fkey";
ALTER TABLE "restaurant_members" ADD CONSTRAINT "restaurant_members_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "restaurant_members" DROP CONSTRAINT IF EXISTS "restaurant_members_user_id_fkey";
ALTER TABLE "restaurant_members" ADD CONSTRAINT "restaurant_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "restaurant_locations" DROP CONSTRAINT IF EXISTS "restaurant_locations_restaurant_id_fkey";
ALTER TABLE "restaurant_locations" ADD CONSTRAINT "restaurant_locations_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "menu_categories" DROP CONSTRAINT IF EXISTS "menu_categories_restaurant_id_fkey";
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "menu_items" DROP CONSTRAINT IF EXISTS "menu_items_restaurant_id_fkey";
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_restaurant_id_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
