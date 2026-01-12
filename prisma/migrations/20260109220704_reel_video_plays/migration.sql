/*
  Warnings:

  - You are about to drop the column `views` on the `ReelSubmission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ReelSubmission" DROP COLUMN "views",
ADD COLUMN     "videoPlays" INTEGER NOT NULL DEFAULT 0;
