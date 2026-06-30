import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { ACTIVITY, logUserActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const pendingUsers = await prisma.user.findMany({
      where: {
        selfieStatus: "PENDING",
        selfieUrl: { not: null },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, users: pendingUsers });
  } catch (error: any) {
    console.error("Fetch pending selfies error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "شناسه کاربر و اقدام الزامی است" }, { status: 400 });
    }

    let status = "PENDING";
    let isVerified = false;

    if (action === "approve") {
      status = "APPROVED";
      isVerified = true;
    } else if (action === "reject") {
      status = "REJECTED";
      isVerified = false;
    } else {
      return NextResponse.json({ error: "اقدام نامعتبر" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        selfieStatus: status,
        isVerified,
      },
    });

    await logUserActivity({
      userId,
      type: action === "approve" ? ACTIVITY.SELFIE_APPROVED : ACTIVITY.SELFIE_REJECTED,
      title: action === "approve" ? "تأیید سلفی توسط ادمین" : "رد سلفی توسط ادمین",
      metadata: { adminId: auth.user.id },
    });

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "سلفی کاربر تایید شد" : "سلفی کاربر رد شد",
      user,
    });
  } catch (error: any) {
    console.error("Action selfie error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
