import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

export async function POST(req: NextRequest, res: NextResponse) {
  const { geneId, phenotype, grex } = await req.json();

  if (!geneId || !phenotype || !grex) {
    return NextResponse.json(
      { error: "Missing required query parameters" },
      { status: 400 }
    );
  }

  try {
    const grexes = await prisma.grex.findMany({
      where: {
        geneId: geneId as string,
        grex: grex as string,
      },
    });

    const volumes = await prisma.volume.findMany({
      where: {
        phenotype: phenotype as string,
      },
    });

    return NextResponse.json({ grexes, volumes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
