import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

export async function POST(req: NextRequest) {
  const { combinedData } = await req.json();
  try {
    const insertPromises = combinedData.map((gene: any) =>
      prisma.gene.create({
        data: {
          geneId: gene.geneId,
          chromosome: gene.chromosome,
          startPosition: gene.startPosition,
          endPosition: gene.endPosition,
          phenotype: gene.phenotype,
          grex: gene.grex,
          beta: gene.beta,
          geneSymbol: gene.geneSymbol,
          pValue: gene.pValue,
          pBonferroni: -1,
          pFDR: -1,
        },
      })
    );

    await Promise.all(insertPromises);
    return NextResponse.json({ message: "Data inserted successfully" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
