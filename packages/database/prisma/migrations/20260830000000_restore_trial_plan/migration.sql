-- Restore the standalone TRIAL plan (2-week free trial assigned at signup),
-- while keeping the paid plans STARTER, PRO and MAX. The trial plan is not
-- offered on the marketing site; new organisations default to it.
--
-- Existing organisations that never created a Stripe subscription are still
-- in their free trial window, so move them from STARTER (the previous
-- default) to TRIAL. Paying subscribers keep their paid plan.
--
-- Postgres does not implement `ALTER TYPE ... DROP VALUE` on Supabase, so we
-- swap in a replacement enum with the full value set and ordering.

-- CreateEnum
CREATE TYPE "SubscriptionPlan_new" AS ENUM ('TRIAL', 'STARTER', 'PRO', 'MAX');

-- AlterColumn (drop default while the old type is still in place)
ALTER TABLE "OrganizationSubscription" ALTER COLUMN "plan" DROP DEFAULT;

-- Switch the column to the new enum first so 'TRIAL' is a valid value below.
ALTER TABLE "OrganizationSubscription" ALTER COLUMN "plan" TYPE "SubscriptionPlan_new"
  USING "plan"::text::"SubscriptionPlan_new";

-- Unsubscribed organisations are still trialling.
UPDATE "OrganizationSubscription" SET "plan" = 'TRIAL'
  WHERE "plan"::text = 'STARTER' AND "stripeSubscriptionId" IS NULL;

-- New organisations start on the 2-week trial plan.
ALTER TABLE "OrganizationSubscription" ALTER COLUMN "plan" SET DEFAULT 'TRIAL';

-- Drop old type and rename the replacement into place.
DROP TYPE "SubscriptionPlan";
ALTER TYPE "SubscriptionPlan_new" RENAME TO "SubscriptionPlan";