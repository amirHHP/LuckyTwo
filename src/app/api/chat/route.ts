import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSimulatedTime } from "@/lib/timeMock";
import { requireUser } from "@/lib/session";
import { ACTIVITY, logUserActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json({ error: "شناسه قرار الزامی است" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: "قرار یافت نشد" }, { status: 404 });
    }

    if (match.maleId !== auth.user.id && match.femaleId !== auth.user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    if (match.status !== "SCHEDULE_CONFIRMED" || !match.timeSlotSelected) {
      return NextResponse.json({ error: "قرار ملاقات هنوز هماهنگ و قفل نشده است" }, { status: 400 });
    }

    const simulatedTime = await getSimulatedTime();
    const dateScheduled = new Date(match.timeSlotSelected);

    const chatStart = dateScheduled.getTime() - 2 * 60 * 60 * 1000;
    const chatEnd = dateScheduled.getTime() + 2 * 60 * 60 * 1000;
    const simulatedTimeMs = simulatedTime.getTime();

    // If chat has expired (T+2h)
    if (simulatedTimeMs > chatEnd) {
      await prisma.message.deleteMany({
        where: { matchId },
      });
      return NextResponse.json({
        error: "این اتاق گفتگوی موقت منقضی شده و تاریخچه آن برای حفظ حریم خصوصی کاملاً پاک شده است.",
        chatExpired: true,
      }, { status: 403 });
    }

    // If chat is not open yet (before T-2h)
    if (simulatedTimeMs < chatStart) {
      return NextResponse.json({
        error: "اتاق گفتگو هنوز باز نشده است. چت موقت از ۲ ساعت قبل از زمان قرار فعال می‌شود.",
        chatNotOpen: true,
      }, { status: 403 });
    }

    // Chat is active: Fetch messages
    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { firstName: true, gender: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      messages,
      simulatedTime,
      chatExpiresAt: new Date(chatEnd).toISOString(),
    });
  } catch (error: any) {
    console.error("Fetch chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { matchId, text } = await request.json();

    if (!matchId || !text) {
      return NextResponse.json({ error: "پارامترهای ارسالی نامعتبر است" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: "قرار یافت نشد" }, { status: 404 });
    }

    if (match.maleId !== auth.user.id && match.femaleId !== auth.user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const simulatedTime = await getSimulatedTime();
    const dateScheduled = new Date(match.timeSlotSelected!);

    const chatStart = dateScheduled.getTime() - 2 * 60 * 60 * 1000;
    const chatEnd = dateScheduled.getTime() + 2 * 60 * 60 * 1000;
    const simulatedTimeMs = simulatedTime.getTime();

    if (simulatedTimeMs > chatEnd) {
      await prisma.message.deleteMany({ where: { matchId } });
      return NextResponse.json({ error: "زمان چت منقضی شده است" }, { status: 403 });
    }

    if (simulatedTimeMs < chatStart) {
      return NextResponse.json({ error: "چت هنوز شروع نشده است" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        matchId,
        senderId: auth.user.id,
        text,
        createdAt: simulatedTime,
      },
    });

    await logUserActivity({
      userId: auth.user.id,
      type: ACTIVITY.MESSAGE_SENT,
      title: "ارسال پیام در چت",
      detail: text.length > 80 ? `${text.slice(0, 80)}…` : text,
      metadata: { matchId, messageId: message.id },
      createdAt: simulatedTime,
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error("Post message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
