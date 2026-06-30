import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runMatchmakingEngine } from "@/lib/matching";
import { getSimulatedTime } from "@/lib/timeMock";
import { requireUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const user = auth.user;

    if (!user.isVerified || user.selfieStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "پروفایل شما هنوز تایید نشده است. ابتدا سلفی خود را بارگذاری کنید و منتظر تایید بمانید." },
        { status: 400 }
      );
    }

    // Determine matching fee
    const fee = user.gender === "MALE" ? 200000 : 50000;

    if (user.walletBalance < fee) {
      return NextResponse.json(
        { error: `موجودی کافی نیست. برای شروع فرآیند هماهنگی به ${fee.toLocaleString()} تومان نیاز دارید.` },
        { status: 400 }
      );
    }

    const simulatedTime = await getSimulatedTime();

    // Deduct fee and set searching state
    await prisma.user.update({
      where: { id: user.id },
      data: {
        walletBalance: user.walletBalance - fee,
        isSearching: true,
        searchingSince: simulatedTime,
      },
    });

    await runMatchmakingEngine();

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    const matched = updatedUser ? !updatedUser.isSearching : false;

    return NextResponse.json({
      success: true,
      message: matched
        ? "همسان شما پیدا شد! زمان ملاقات را انتخاب کنید."
        : "فرآیند جستجوی همسان با موفقیت آغاز شد. به محض یافتن همسان مناسب به شما اطلاع داده می‌شود.",
      feeCharged: fee,
      user: updatedUser,
      matched,
    });
  } catch (error: any) {
    console.error("Match initiate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
