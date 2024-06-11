/*
  Warnings:

  - The primary key for the `Gene` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropIndex
DROP INDEX "Gene_geneId_key";

-- DropIndex
DROP INDEX "Gene_geneSymbol_key";

-- AlterTable
ALTER TABLE "Gene" DROP CONSTRAINT "Gene_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Gene_pkey" PRIMARY KEY ("id");
