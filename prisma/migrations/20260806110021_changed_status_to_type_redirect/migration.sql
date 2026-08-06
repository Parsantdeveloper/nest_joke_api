/*
  Warnings:

  - You are about to drop the column `status` on the `Redirect` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RedirectType" AS ENUM ('TEMPORARY_307', 'PERMANENT_308');

-- AlterTable
ALTER TABLE "Redirect" DROP COLUMN "status",
ADD COLUMN     "type" "RedirectType" NOT NULL DEFAULT 'TEMPORARY_307';
