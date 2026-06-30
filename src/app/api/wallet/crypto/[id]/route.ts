import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { fetchPaymentStatus, isMockMode } from "@/lib/cryptoPayments";
import { syncDepositStatus } from "@/lib/walletDeposit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { id } = await params;
    const deposit = await prisma.cryptoDeposit.findUnique({
      where: { id },
      include: { user: { select: { walletBalance: true } } },
    });

    if (!deposit || deposit.userId !== auth.user.id) {
      return NextResponse.json({ error: "پرداخت یافت نشد" }, { status: 404 });
    }

    if (deposit.status === "PENDING" || deposit.status === "CONFIRMING") {
      if (deposit.expiresAt < new Date()) {
        await prisma.cryptoDeposit.update({
          where: { id },
          data: { status: "EXPIRED" },
        });
        deposit.status = "EXPIRED";
      } else if (deposit.externalId) {
        const externalStatus = await fetchPaymentStatus(deposit.externalId);
        const { status } = await syncDepositStatus(id, externalStatus);
        deposit.status = status;
        deposit.externalStatus = externalStatus;
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { walletBalance: true },
    });

    return NextResponse.json({
      deposit: {
        id: deposit.id,
        amountCents: deposit.amountCents,
        payCurrency: deposit.payCurrency,
        payAmount: deposit.payAmount,
        payAddress: deposit.payAddress,
        status: deposit.status,
        externalStatus: deposit.externalStatus,
        expiresAt: deposit.expiresAt,
        completedAt: deposit.completedAt,
        isMock: isMockMode,
      },
      balance: user?.walletBalance ?? auth.user.walletBalance,
    });
  } catch (error: unknown) {
    console.error("Crypto deposit status error:", error);
    const message = error instanceof Error ? error.message : "خطای سرور";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
