import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSimulatedTime } from "@/lib/timeMock";
import { createSession } from "@/lib/session";
import { ACTIVITY, logUserActivity } from "@/lib/activity";
import { hashPassword, validatePassword } from "@/lib/password";
import { toSafeUser } from "@/lib/safeUser";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "آدرس ایمیل نامعتبر است" },
        { status: 400 }
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: "این ایمیل قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const simulatedTime = await getSimulatedTime();

    const user = existing
      ? await prisma.user.update({
          where: { email },
          data: { passwordHash },
        })
      : await prisma.user.create({
          data: { email, passwordHash },
        });

    if (!existing) {
      await logUserActivity({
        userId: user.id,
        type: ACTIVITY.ACCOUNT_CREATED,
        title: "ثبت‌نام در سیستم",
        detail: `ایمیل: ${email}`,
        createdAt: user.createdAt,
      });
    }

    await createSession(user.id);

    await logUserActivity({
      userId: user.id,
      type: ACTIVITY.LOGIN,
      title: "ورود به حساب",
      createdAt: simulatedTime,
    });

    return NextResponse.json({
      success: true,
      message: "ثبت‌نام با موفقیت انجام شد",
      user: toSafeUser(user),
    });
  } catch (error: unknown) {
    console.error("Register error:", error);
    const message = error instanceof Error ? error.message : "خطای سرور";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
