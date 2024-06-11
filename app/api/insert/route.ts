import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        },
      })
    );

    await Promise.all(insertPromises);
    return NextResponse.json({ message: "Data inserted successfully" });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
