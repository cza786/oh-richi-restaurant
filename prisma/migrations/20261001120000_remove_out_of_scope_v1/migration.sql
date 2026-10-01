-- Remove modules excluded from the Door2Door V1 ERD scope.
-- This migration is intentionally destructive for the listed non-MVP tables.

-- V1 permits Super Admin accounts only. Remove legacy staff/customer users
-- before dropping the old role-assignment tables.
DELETE FROM "users" WHERE "role" <> 'SUPER_ADMIN';

DROP TABLE IF EXISTS "order_discounts" CASCADE;
DROP TABLE IF EXISTS "promotion_redemptions" CASCADE;
DROP TABLE IF EXISTS "promotion_items" CASCADE;
DROP TABLE IF EXISTS "promotion_categories" CASCADE;
DROP TABLE IF EXISTS "promotions" CASCADE;
DROP TABLE IF EXISTS "coupon_redemptions" CASCADE;
DROP TABLE IF EXISTS "coupon_items" CASCADE;
DROP TABLE IF EXISTS "coupon_categories" CASCADE;
DROP TABLE IF EXISTS "coupons" CASCADE;
DROP TABLE IF EXISTS "discount_settings" CASCADE;
DROP TABLE IF EXISTS "reward_redemption_logs" CASCADE;
DROP TABLE IF EXISTS "reward_redemptions" CASCADE;
DROP TABLE IF EXISTS "rewards" CASCADE;
DROP TABLE IF EXISTS "loyalty_transactions" CASCADE;
DROP TABLE IF EXISTS "loyalty_accounts" CASCADE;
DROP TABLE IF EXISTS "loyalty_rules" CASCADE;
DROP TABLE IF EXISTS "otp_tokens" CASCADE;
DROP TABLE IF EXISTS "profiles" CASCADE;
DROP TABLE IF EXISTS "restaurant_members" CASCADE;

DROP TABLE IF EXISTS "order_item_addons" CASCADE;
DROP TABLE IF EXISTS "item_combo_groups" CASCADE;
DROP TABLE IF EXISTS "combo_choices" CASCADE;
DROP TABLE IF EXISTS "combo_groups" CASCADE;
DROP TABLE IF EXISTS "item_spice_levels" CASCADE;
DROP TABLE IF EXISTS "spice_levels" CASCADE;
DROP TABLE IF EXISTS "item_addons" CASCADE;
DROP TABLE IF EXISTS "addons" CASCADE;
DROP TABLE IF EXISTS "item_variations" CASCADE;
DROP TABLE IF EXISTS "pricing_options" CASCADE;
DROP TABLE IF EXISTS "pricing_groups" CASCADE;

DROP TABLE IF EXISTS "restaurant_tables" CASCADE;
DROP TABLE IF EXISTS "report_automations" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "role_permissions" CASCADE;
DROP TABLE IF EXISTS "user_roles" CASCADE;
DROP TABLE IF EXISTS "permissions" CASCADE;
DROP TABLE IF EXISTS "roles" CASCADE;

ALTER TABLE "orders"
  DROP COLUMN IF EXISTS "customer_id",
  DROP COLUMN IF EXISTS "table_id",
  DROP COLUMN IF EXISTS "discount_amount",
  DROP COLUMN IF EXISTS "points_earned",
  DROP COLUMN IF EXISTS "points_redeemed",
  DROP COLUMN IF EXISTS "reward_discount_amount",
  DROP COLUMN IF EXISTS "reward_redemption_id";

ALTER TABLE "order_items"
  DROP COLUMN IF EXISTS "variation_id",
  DROP COLUMN IF EXISTS "spice_level_id";
