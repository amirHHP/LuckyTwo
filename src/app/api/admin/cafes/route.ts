import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { serializeCafe, validateCafeInput } from "@/lib/cafe";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const cafes = await prisma.cafe.findMany({
      orderBy: [{ zone: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      success: true,
      cafes: cafes.map(serializeCafe),
    });
  } catch (error: unknown) {
    console.error("Fetch cafes error:", error);
    const message = error instanceof Error ? error.message : "خطای سرور";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const body = await request.json();
    const validation = validateCafeInput(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, zone, address, lat, lng, description, features, isVerified } = validation.data;

    const cafe = await prisma.cafe.create({
      data: {
        name,
        zone,
        address,
        lat,
        lng,
        description,
        features: JSON.stringify(features),
        isVerified,
      },
    });

    return NextResponse.json({
      success: true,
      message: "کافه با موفقیت اضافه شد",
      cafe: serializeCafe(cafe),
    });
  } catch (error: unknown) {
    console.error("Create cafe error:", error);
    const message = error instanceof Error ? error.message : "خطای سرور";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
