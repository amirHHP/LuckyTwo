import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  SUPPORTED_CURRENCIES,
  createCryptoPayment,
  isMockMode,
} from "@/lib/cryptoPayments";

const MIN_DEPOSIT = 50000;
const DEPOSIT_EXPIRY_HOURS = 1;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { amount, currency } = await request.json();
    const amountTomans = parseInt(amount, 10);

    if (!amountTomans || amountTomans < MIN_DEPOSIT) {
      return NextResponse.json(
        { error: `حداقل مبلغ شارژ ${MIN_DEPOSIT.toLocaleString()} تومان است` },
        { status: 400 }
      );
    }

    const payCurrency = currency || "usdttrc20";
    const supported = SUPPORTED_CURRENCIES.find((c) => c.code === payCurrency);
    if (!supported) {
      return NextResponse.json({ error: "ارز دیجیتال پشتیبانی نمی‌شود" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + DEPOSIT_EXPIRY_HOURS * 60 * 60 * 1000);

    const deposit = await prisma.cryptoDeposit.create({
      data: {
        userId: auth.user.id,
        amountTomans,
        payCurrency,
        payAmount: 0,
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const callbackUrl = `${appUrl}/api/wallet/crypto/webhook`;

    const payment = await createCryptoPayment(
      amountTomans,
      payCurrency,
      deposit.id,
      callbackUrl
    );

    const updated = await prisma.cryptoDeposit.update({
      where: { id: deposit.id },
      data: {
        externalId: payment.paymentId,
        externalStatus: payment.status,
        payAddress: payment.payAddress,
        payAmount: payment.payAmount,
      },
    });

    return NextResponse.json({
      deposit: {
        id: updated.id,
        amountTomans: updated.amountTomans,
        payCurrency: updated.payCurrency,
        payAmount: updated.payAmount,
        payAddress: updated.payAddress,
        status: updated.status,
        expiresAt: updated.expiresAt,
        isMock: isMockMode,
      },
      currency: supported,
    });
  } catch (error: unknown) {
    console.error("Crypto deposit create error:", error);
    const message = error instanceof Error ? error.message : "خطای سرور";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
