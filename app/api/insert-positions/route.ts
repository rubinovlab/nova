import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

export async function POST(req: NextRequest) {
  const { genePositions } = await req.json();
  console.log("Received gene positions:", genePositions);

  try {
    const insertPromises = genePositions.map((gene: any) => {
      // Log the gene data before attempting to insert it into the database
      console.log("Inserting gene data:", gene);

      return prisma.genePosition.create({
        data: {
          geneID: gene.geneID, // Log this field to check for undefined
          chromosome: gene.chromosome, // Log this field to check for undefined
          start: gene.start, // Log this field to check for undefined
          end: gene.end, // Log this field to check for undefined
        },
      });
    });

    await Promise.all(insertPromises);
    return NextResponse.json({ message: "Data inserted successfully" });
  } catch (error) {
    console.error("Error occurred during insertion:", error);

    // Optional: You can log additional error information, like stack trace
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }

    return NextResponse.json(
      { error: "Data insertion failed" },
      { status: 500 }
    );
  }
}
