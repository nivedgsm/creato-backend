-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "googleDriveLink" TEXT,
ADD COLUMN     "payoutPer100kViews" DOUBLE PRECISION,
ADD COLUMN     "totalBudget" DOUBLE PRECISION;
