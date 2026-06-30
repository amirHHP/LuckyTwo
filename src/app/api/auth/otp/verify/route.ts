import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSimulatedTime } from "@/lib/timeMock";
import { createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const { email, otpCode } = await request.json();

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: "ایمیل و کد تایید الزامی هستند" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Verify OTP code
    if (user.otpCode !== otpCode) {
      return NextResponse.json(
        { error: "کد تأیید اشتباه است" },
        { status: 400 }
      );
    }

    const simulatedTime = await getSimulatedTime();
    if (user.otpExpiresAt && new Date(user.otpExpiresAt) < simulatedTime) {
      return NextResponse.json(
        { error: "کد تأیید منقضی شده است" },
        { status: 400 }
      );
    }

    // Clear OTP details upon successful verification
    await prisma.user.update({
      where: { email },
      data: {
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    // Create session and set cookie
    await createSession(user.id);

    // Return safe user data
    const { otpCode: _, otpExpiresAt: __, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      message: "ورود با موفقیت انجام شد",
      user: { ...safeUser, otpCode: null, otpExpiresAt: null },
    });
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
