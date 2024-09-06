import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

export async function POST(req: NextRequest) {
  const { grexes } = await req.json();
  try {
    const insertPromises = grexes.map((grex: any) =>
      prisma.grex.create({
        data: {
          geneId: grex.geneId,
          grex: grex.grex,
          grexes: grex.grexes,
        },
      })
    );

    await Promise.all(insertPromises);
    return NextResponse.json({
      message: "Data inserted successfully",
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
