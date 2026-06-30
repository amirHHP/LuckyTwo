import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "مبلغ نامعتبر است" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        walletBalance: auth.user.walletBalance + parseInt(amount),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${parseInt(amount).toLocaleString()} تومان با موفقیت به کیف پول اضافه شد`,
      balance: updatedUser.walletBalance,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Wallet deposit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
