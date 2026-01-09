-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "requiresAdminApproval" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requiresCreatorApproval" BOOLEAN NOT NULL DEFAULT false;
