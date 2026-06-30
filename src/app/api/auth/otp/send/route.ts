import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSimulatedTime } from "@/lib/timeMock";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "آدرس ایمیل نامعتبر است" },
        { status: 400 }
      );
    }

    // Generate random 6-digit OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const simulatedTime = await getSimulatedTime();
    const otpExpiresAt = new Date(simulatedTime.getTime() + 5 * 60 * 1000); // 5 min expiry

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        otpCode,
        otpExpiresAt,
      },
      create: {
        email,
        otpCode,
        otpExpiresAt,
      },
    });

    // In production: send via SMTP (Nodemailer, SendGrid, etc.)
    // For development: return the OTP in the response
    console.log(`[DEV] OTP for ${email}: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: "کد تأیید به ایمیل شما ارسال شد",
      // DEV ONLY — remove in production
      devOtp: otpCode,
    });
  } catch (error: any) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
