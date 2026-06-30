import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    const users = await prisma.user.findMany({
      where: {
        role: "user",
        ...(q
          ? {
              OR: [
                { email: { contains: q } },
                { firstName: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        age: true,
        gender: true,
        occupation: true,
        selfieUrl: true,
        selfieStatus: true,
        isVerified: true,
        mbtiType: true,
        walletBalance: true,
        isSearching: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: unknown) {
    console.error("Fetch users error:", error);
    const message = error instanceof Error ? error.message : "خطای سرور";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
