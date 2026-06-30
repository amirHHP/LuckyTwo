import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSimulatedTime } from "@/lib/timeMock";
import { createSession } from "@/lib/session";
import { ACTIVITY, logUserActivity } from "@/lib/activity";
import { verifyPassword } from "@/lib/password";
import { toSafeUser } from "@/lib/safeUser";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "ایمیل و رمز عبور الزامی هستند" },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "آدرس ایمیل نامعتبر است" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "ایمیل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "ایمیل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    const simulatedTime = await getSimulatedTime();
    await createSession(user.id);

    await logUserActivity({
      userId: user.id,
      type: ACTIVITY.LOGIN,
      title: "ورود به حساب",
      createdAt: simulatedTime,
    });

    return NextResponse.json({
      success: true,
      message: "ورود با موفقیت انجام شد",
      user: toSafeUser(user),
    });
  } catch (error: unknown) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "خطای سرور";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
