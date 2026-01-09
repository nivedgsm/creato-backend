-- CreateEnum
CREATE TYPE "ApplicationRequirement" AS ENUM ('OPEN', 'VERIFIED_ONLY');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "applicationRequirement" "ApplicationRequirement" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "CreatorProfile" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;
