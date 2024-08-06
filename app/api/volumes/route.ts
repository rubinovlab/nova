import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

export async function POST(req: NextRequest) {
  const { volumes } = await req.json();

  console.log(volumes);
  try {
    const insertPromises = volumes.map((volume: any) =>
      prisma.volume.create({
        data: {
          phenotype: volume.phenotype,
          volumes: volume.data,
        },
      })
    );

    await Promise.all(insertPromises);
    return NextResponse.json({
      message: "Data inserted successfully",
      data: volumes,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
