import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { clothing } = await request.json();

    if (clothing === undefined) {
      return NextResponse.json({ error: "توضیحات پوشش الزامی است" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: { clothing },
    });

    return NextResponse.json({
      success: true,
      message: "توضیحات پوشش با موفقیت بروزرسانی شد",
      user,
    });
  } catch (error: any) {
    console.error("Clothing update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
