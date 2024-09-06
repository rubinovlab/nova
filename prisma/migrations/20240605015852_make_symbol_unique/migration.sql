/*
  Warnings:

  - A unique constraint covering the columns `[geneSymbol]` on the table `Gene` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Gene_geneSymbol_key" ON "Gene"("geneSymbol");
