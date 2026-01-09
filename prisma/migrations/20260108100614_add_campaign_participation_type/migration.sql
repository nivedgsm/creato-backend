-- CreateEnum
CREATE TYPE "CampaignParticipationType" AS ENUM ('OPEN', 'APPROVAL_REQUIRED');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "participationType" "CampaignParticipationType" NOT NULL DEFAULT 'APPROVAL_REQUIRED';
