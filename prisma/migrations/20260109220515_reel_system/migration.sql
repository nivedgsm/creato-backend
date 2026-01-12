/*
  Warnings:

  - You are about to drop the column `highestSlabAchieved` on the `ReelSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncedAt` on the `ReelSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `totalEarned` on the `ReelSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `videoPlays` on the `ReelSubmission` table. All the data in the column will be lost.
  - The `status` column on the `ReelSubmission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[igMediaId]` on the table `ReelSubmission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `ReelSubmission` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReelStatus" AS ENUM ('PENDING', 'TRACKING', 'PAID', 'REJECTED');

-- DropIndex
DROP INDEX "ReelSubmission_campaignId_creatorId_igMediaId_key";

-- AlterTable
ALTER TABLE "ReelSubmission" DROP COLUMN "highestSlabAchieved",
DROP COLUMN "lastSyncedAt",
DROP COLUMN "totalEarned",
DROP COLUMN "videoPlays",
ADD COLUMN     "earnings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "igMediaId" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ReelStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "ReelSubmission_igMediaId_key" ON "ReelSubmission"("igMediaId");
