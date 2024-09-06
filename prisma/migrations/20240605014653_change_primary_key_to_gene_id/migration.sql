-- CreateTable
CREATE TABLE "Gene" (
    "geneId" TEXT NOT NULL,
    "chromosome" TEXT NOT NULL,
    "startPosition" INTEGER NOT NULL,
    "endPosition" INTEGER NOT NULL,
    "pValue" DOUBLE PRECISION NOT NULL,
    "beta" DOUBLE PRECISION NOT NULL,
    "geneSymbol" TEXT NOT NULL,
    "grex" TEXT NOT NULL,
    "phenotype" TEXT NOT NULL,

    CONSTRAINT "Gene_pkey" PRIMARY KEY ("geneId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gene_geneId_key" ON "Gene"("geneId");
