import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { isMockMode } from "@/lib/cryptoPayments";
import { syncDepositStatus } from "@/lib/walletDeposit";

export async function POST(request: NextRequest) {
  if (!isMockMode) {
    return NextResponse.json({ error: "فقط در حالت آزمایشی" }, { status: 403 });
  }

  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { depositId } = await request.json();
    if (!depositId) {
      return NextResponse.json({ error: "شناسه پرداخت الزامی است" }, { status: 400 });
    }

    const deposit = await prisma.cryptoDeposit.findUnique({ where: { id: depositId } });
    if (!deposit || deposit.userId !== auth.user.id) {
      return NextResponse.json({ error: "پرداخت یافت نشد" }, { status: 404 });
    }

    const { status, credited } = await syncDepositStatus(depositId, "finished");

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { walletBalance: true },
    });

    return NextResponse.json({
      success: true,
      status,
      credited,
      balance: user?.walletBalance,
      message: credited
        ? `${deposit.amountTomans.toLocaleString()} تومان به کیف پول اضافه شد`
        : "وضعیت پرداخت به‌روز شد",
    });
  } catch (error: unknown) {
    console.error("Crypto simulate error:", error);
    const message = error instanceof Error ? error.message : "خطای سرور";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
