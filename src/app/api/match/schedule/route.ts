import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const userId = auth.user.id;
    const { matchId, action, selectedSlot } = await request.json();

    if (!matchId || !action) {
      return NextResponse.json({ error: "شناسه قرار و اقدام الزامی هستند" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { male: true, female: true },
    });

    if (!match) {
      return NextResponse.json({ error: "قرار یافت نشد" }, { status: 404 });
    }

    const isMale = match.maleId === userId;
    const isFemale = match.femaleId === userId;

    if (!isMale && !isFemale) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    if (action === "select_slot_male") {
      if (!isMale) {
        return NextResponse.json({ error: "فقط کاربر آقا می‌تواند زمان را پیشنهاد دهد" }, { status: 403 });
      }
      if (!selectedSlot) {
        return NextResponse.json({ error: "زمان انتخابی الزامی است" }, { status: 400 });
      }

      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          timeSlotSelected: new Date(selectedSlot),
        },
      });

      return NextResponse.json({
        success: true,
        message: "زمان پیشنهادی با موفقیت ثبت شد و در انتظار تایید خانم است.",
        match: updatedMatch,
      });
    }

    if (action === "confirm_slot_female") {
      if (!isFemale) {
        return NextResponse.json({ error: "فقط کاربر خانم می‌تواند زمان را تایید کند" }, { status: 403 });
      }
      if (!match.timeSlotSelected) {
        return NextResponse.json({ error: "هنوز زمان پیشنهادی از طرف آقا ثبت نشده است" }, { status: 400 });
      }

      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          status: "SCHEDULE_CONFIRMED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "قرار ملاقات با موفقیت تایید و قفل شد.",
        match: updatedMatch,
      });
    }

    if (action === "cancel_match") {
      const isForfeited = match.status === "SCHEDULE_CONFIRMED";

      if (!isForfeited) {
        if (match.malePaid) {
          await prisma.user.update({
            where: { id: match.maleId },
            data: { walletBalance: { increment: 200000 } },
          });
        }
        if (match.femalePaid) {
          await prisma.user.update({
            where: { id: match.femaleId },
            data: { walletBalance: { increment: 50000 } },
          });
        }
      } else {
        const nonCancelerId = isMale ? match.femaleId : match.maleId;
        const refundAmt = isMale ? 50000 : 200000;
        
        await prisma.user.update({
          where: { id: nonCancelerId },
          data: { walletBalance: { increment: refundAmt } },
        });
      }

      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          status: "CANCELLED",
        },
      });

      return NextResponse.json({
        success: true,
        message: isForfeited
          ? "قرار لغو شد. به علت لغو در وضعیت قفل شده، هزینه شما سوخت شد."
          : "قرار لغو شد و هزینه‌ها بازگردانده شد.",
        match: updatedMatch,
      });
    }

    return NextResponse.json({ error: "اقدام نامعتبر" }, { status: 400 });
  } catch (error: any) {
    console.error("Scheduling error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
