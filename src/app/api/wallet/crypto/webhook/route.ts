import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyNowPaymentsWebhook } from "@/lib/cryptoPayments";
import { syncDepositStatus } from "@/lib/walletDeposit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-nowpayments-sig");

    if (!verifyNowPaymentsWebhook(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const orderId = body.order_id as string;
    const paymentStatus = body.payment_status as string;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    const deposit = await prisma.cryptoDeposit.findUnique({ where: { id: orderId } });
    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    await syncDepositStatus(orderId, paymentStatus);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Crypto webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
