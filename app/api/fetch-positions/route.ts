import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

export async function GET() {
  try {
    const genePositions = await prisma.genePosition.findMany();

    return NextResponse.json(genePositions);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
