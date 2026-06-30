import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getSimulatedTime } from "@/lib/timeMock";
import { ACTIVITY, logUserActivity } from "@/lib/activity";
import {
  FEMALE_NO_SHOW_PENALTY_CENTS,
  MALE_MATCH_FEE_CENTS,
  formatUsd,
} from "@/lib/wallet";

const NO_SHOW_GRACE_MS = 30 * 60 * 1000;

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

      await logUserActivity({
        userId,
        type: ACTIVITY.SCHEDULE_PROPOSED,
        title: "پیشنهاد زمان قرار",
        detail: new Date(selectedSlot).toLocaleString("fa-IR"),
        metadata: { matchId },
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

      await logUserActivity({
        userId,
        type: ACTIVITY.SCHEDULE_CONFIRMED,
        title: "تأیید نهایی زمان قرار",
        detail: match.timeSlotSelected
          ? new Date(match.timeSlotSelected).toLocaleString("fa-IR")
          : undefined,
        metadata: { matchId },
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
            data: { walletBalance: { increment: MALE_MATCH_FEE_CENTS } },
          });
        }
      } else if (isFemale && match.malePaid) {
        await prisma.user.update({
          where: { id: match.maleId },
          data: { walletBalance: { increment: MALE_MATCH_FEE_CENTS } },
        });
      }

      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          status: "CANCELLED",
        },
      });

      await logUserActivity({
        userId,
        type: ACTIVITY.MATCH_CANCELLED,
        title: "لغو قرار ملاقات",
        detail: isForfeited ? "لغو در وضعیت قفل‌شده" : "بازگشت هزینه",
        metadata: { matchId },
      });

      return NextResponse.json({
        success: true,
        message: isForfeited
          ? isMale
            ? "قرار لغو شد. به علت لغو در وضعیت قفل‌شده، هزینه شما سوخت شد."
            : "قرار لغو شد و هزینه آقا بازگردانده شد."
          : "قرار لغو شد و هزینه‌ها بازگردانده شد.",
        match: updatedMatch,
      });
    }

    if (action === "complete_match") {
      if (match.status !== "SCHEDULE_CONFIRMED" || !match.timeSlotSelected) {
        return NextResponse.json({ error: "قرار هنوز تأیید نشده است" }, { status: 400 });
      }

      const simulatedTime = await getSimulatedTime();
      if (simulatedTime.getTime() < new Date(match.timeSlotSelected).getTime()) {
        return NextResponse.json({ error: "هنوز زمان قرار نرسیده است" }, { status: 400 });
      }

      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: { status: "COMPLETED" },
      });

      await logUserActivity({
        userId,
        type: ACTIVITY.MATCH_COMPLETED,
        title: "تکمیل قرار ملاقات",
        metadata: { matchId },
      });

      return NextResponse.json({
        success: true,
        message: "قرار با موفقیت تکمیل شد.",
        match: updatedMatch,
      });
    }

    if (action === "report_no_show") {
      if (!isMale) {
        return NextResponse.json({ error: "فقط آقا می‌تواند عدم حضور را گزارش کند" }, { status: 403 });
      }
      if (match.status !== "SCHEDULE_CONFIRMED" || !match.timeSlotSelected) {
        return NextResponse.json({ error: "قرار هنوز تأیید نشده است" }, { status: 400 });
      }

      const simulatedTime = await getSimulatedTime();
      const scheduledAt = new Date(match.timeSlotSelected).getTime();
      if (simulatedTime.getTime() < scheduledAt + NO_SHOW_GRACE_MS) {
        return NextResponse.json(
          { error: "حداقل ۳۰ دقیقه بعد از زمان قرار می‌توانید عدم حضور را گزارش کنید" },
          { status: 400 }
        );
      }

      const female = await prisma.user.findUnique({ where: { id: match.femaleId } });
      if (!female) {
        return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
      }

      const newBalance = female.walletBalance - FEMALE_NO_SHOW_PENALTY_CENTS;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: match.femaleId },
          data: { walletBalance: newBalance },
        }),
        prisma.match.update({
          where: { id: matchId },
          data: { status: "NO_SHOW" },
        }),
      ]);

      await logUserActivity({
        userId: match.femaleId,
        type: ACTIVITY.NO_SHOW_PENALTY,
        title: "جریمه عدم حضور در قرار",
        detail: `${formatUsd(FEMALE_NO_SHOW_PENALTY_CENTS)} از کیف پول کسر شد — موجودی: ${formatUsd(newBalance)}`,
        metadata: { matchId },
      });

      await logUserActivity({
        userId,
        type: ACTIVITY.MATCH_NO_SHOW,
        title: "گزارش عدم حضور در قرار",
        metadata: { matchId },
      });

      return NextResponse.json({
        success: true,
        message: "عدم حضور ثبت شد و جریمه به کیف پول خانم اعمال شد.",
      });
    }

    return NextResponse.json({ error: "اقدام نامعتبر" }, { status: 400 });
  } catch (error: any) {
    console.error("Scheduling error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
