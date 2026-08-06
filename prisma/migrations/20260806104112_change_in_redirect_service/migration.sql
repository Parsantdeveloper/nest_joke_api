/*
  Warnings:

  - You are about to drop the column `new_slug` on the `Redirect` table. All the data in the column will be lost.
  - You are about to drop the column `prev_slug` on the `Redirect` table. All the data in the column will be lost.
  - Added the required column `from_path` to the `Redirect` table without a default value. This is not possible if the table is not empty.
  - Added the required column `to_path` to the `Redirect` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Redirect` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Redirect" DROP CONSTRAINT "Redirect_jokeId_fkey";

-- AlterTable
ALTER TABLE "Redirect" DROP COLUMN "new_slug",
DROP COLUMN "prev_slug",
ADD COLUMN     "from_path" TEXT NOT NULL,
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 308,
ADD COLUMN     "to_path" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
