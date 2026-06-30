import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { getUserTimeline } from "@/lib/user-timeline";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        age: true,
        gender: true,
        occupation: true,
        height: true,
        clothing: true,
        selfieUrl: true,
        selfieStatus: true,
        isVerified: true,
        mbtiType: true,
        interests: true,
        zones: true,
        walletBalance: true,
        isSearching: true,
        searchingSince: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        matchesAsMale: {
          include: {
            female: { select: { id: true, firstName: true, email: true } },
            cafe: { select: { name: true, zone: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        matchesAsFemale: {
          include: {
            male: { select: { id: true, firstName: true, email: true } },
            cafe: { select: { name: true, zone: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        cryptoDeposits: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user || user.role === "admin") {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    const { otpCode: _, otpExpiresAt: __, ...safeUser } = user as typeof user & {
      otpCode?: string | null;
      otpExpiresAt?: Date | null;
    };

    const activities = await getUserTimeline(id);

    return NextResponse.json({
      success: true,
      user: safeUser,
      activities,
    });
  } catch (error: unknown) {
    console.error("Fetch user profile error:", error);
    const message = error instanceof Error ? error.message : "خطای سرور";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
