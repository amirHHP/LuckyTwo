import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { serializeCafe, validateCafeInput } from "@/lib/cafe";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { id } = await context.params;
    const existing = await prisma.cafe.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "کافه یافت نشد" }, { status: 404 });
    }

    const body = await request.json();
    const validation = validateCafeInput(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, zone, address, lat, lng, description, features, isVerified } = validation.data;

    const cafe = await prisma.cafe.update({
      where: { id },
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
      message: "کافه با موفقیت ویرایش شد",
      cafe: serializeCafe(cafe),
    });
  } catch (error: unknown) {
    console.error("Update cafe error:", error);
    const message = error instanceof Error ? error.message : "خطای سرور";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { id } = await context.params;
    const existing = await prisma.cafe.findUnique({
      where: { id },
      include: { _count: { select: { matches: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "کافه یافت نشد" }, { status: 404 });
    }

    if (existing._count.matches > 0) {
      return NextResponse.json(
        { error: "این کافه در قرارهای ملاقات استفاده شده و قابل حذف نیست. می‌توانید آن را غیرفعال کنید." },
        { status: 400 }
      );
    }

    await prisma.cafe.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "کافه حذف شد",
    });
  } catch (error: unknown) {
    console.error("Delete cafe error:", error);
    const message = error instanceof Error ? error.message : "خطای سرور";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
