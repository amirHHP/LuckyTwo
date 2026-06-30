import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runMatchmakingEngine } from "@/lib/matching";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const searchingUsers = await prisma.user.findMany({
      where: { isSearching: true },
      select: {
        id: true,
        firstName: true,
        email: true,
        gender: true,
        mbtiType: true,
        zones: true,
        searchingSince: true,
        isVerified: true,
        selfieStatus: true,
      },
    });

    const matches = await prisma.match.findMany({
      include: {
        male: { select: { id: true, firstName: true, email: true, mbtiType: true } },
        female: { select: { id: true, firstName: true, email: true, mbtiType: true } },
        cafe: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      searchingUsers,
      matches,
    });
  } catch (error: any) {
    console.error("Fetch matching dashboard error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const result = await runMatchmakingEngine();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Trigger matchmaking engine error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
