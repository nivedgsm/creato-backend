-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CREATOR', 'BRAND', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CREATOR';
