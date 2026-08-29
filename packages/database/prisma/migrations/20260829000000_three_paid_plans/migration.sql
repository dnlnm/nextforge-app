-- Subscription plans: replace the TRIAL plan with three paid plans
-- (STARTER, PRO, MAX). Free "Trial" is now a 14-day trial period applied on
-- top of whichever plan is selected, tracked by status = TRIALING.
--
-- Postgres does not implement `ALTER TYPE ... DROP VALUE` on Supabase, so we
-- create a replacement enum type, migrate the column (mapping TRIAL -> STARTER),
-- then drop the old type and rename the new one into place.

-- CreateEnum
CREATE TYPE "SubscriptionPlan_new" AS ENUM ('STARTER', 'PRO', 'MAX');

-- AlterColumn (drop default while the old type is still in place)
ALTER TABLE "OrganizationSubscription" ALTER COLUMN "plan" DROP DEFAULT;

-- Existing TRIAL rows become STARTER (paid-plan default).
ALTER TABLE "OrganizationSubscription" ALTER COLUMN "plan" TYPE "SubscriptionPlan_new"
  USING (CASE WHEN "plan"::text = 'TRIAL' THEN 'STARTER'::"SubscriptionPlan_new"
              ELSE "plan"::text::"SubscriptionPlan_new" END);

-- New organisations default to STARTER.
ALTER TABLE "OrganizationSubscription" ALTER COLUMN "plan" SET DEFAULT 'STARTER';

-- Drop old type and rename the replacement into place.
DROP TYPE "SubscriptionPlan";
ALTER TYPE "SubscriptionPlan_new" RENAME TO "SubscriptionPlan";