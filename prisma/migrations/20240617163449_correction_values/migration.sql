/*
  Warnings:

  - Added the required column `pBonferroni` to the `Gene` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pFDR` to the `Gene` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Gene" ADD COLUMN     "pBonferroni" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pFDR" DOUBLE PRECISION NOT NULL;
