/*
  Warnings:

  - A unique constraint covering the columns `[from_path]` on the table `Redirect` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Redirect_from_path_key" ON "Redirect"("from_path");
