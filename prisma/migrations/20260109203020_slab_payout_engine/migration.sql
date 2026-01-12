-- 1️⃣ Add new money columns WITHOUT NOT NULL
ALTER TABLE "Campaign"
ADD COLUMN "platformFee" DOUBLE PRECISION,
ADD COLUMN "creatorPool" DOUBLE PRECISION;

-- 2️⃣ Backfill existing campaigns safely
UPDATE "Campaign"
SET
  "platformFee" = 0,
  "creatorPool" = COALESCE("totalBudget", 0)
WHERE "platformFee" IS NULL;

-- 3️⃣ Make them required now that no NULLs exist
ALTER TABLE "Campaign"
ALTER COLUMN "platformFee" SET NOT NULL,
ALTER COLUMN "creatorPool" SET NOT NULL;

-- 4️⃣ totalBudget must be required
UPDATE "Campaign"
SET "totalBudget" = 0
WHERE "totalBudget" IS NULL;

ALTER TABLE "Campaign"
ALTER COLUMN "totalBudget" SET NOT NULL;

-- 5️⃣ Remove old fixed payout system
ALTER TABLE "Campaign"
DROP COLUMN IF EXISTS "payoutPer100kViews";

-- 6️⃣ Reel slab tracking
ALTER TABLE "ReelSubmission"
ADD COLUMN "highestSlabAchieved" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "totalEarned" INTEGER NOT NULL DEFAULT 0;

-- 7️⃣ Slab table
CREATE TABLE "CampaignSlab" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "views" INTEGER NOT NULL,
  "payout" INTEGER NOT NULL,
  CONSTRAINT "CampaignSlab_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CampaignSlab_campaignId_views_key"
ON "CampaignSlab"("campaignId", "views");

ALTER TABLE "CampaignSlab"
ADD CONSTRAINT "CampaignSlab_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
