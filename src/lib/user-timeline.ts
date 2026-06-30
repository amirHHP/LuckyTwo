import { prisma } from "./db";
import { ACTIVITY, logUserActivity } from "./activity";
import { formatUsd } from "./wallet";

const MATCH_STATUS_LABELS: Record<string, string> = {
  SEARCHING: "در حال جستجو",
  PAYMENT_PENDING: "در انتظار پرداخت",
  SCHEDULE_PENDING: "در انتظار زمان‌بندی",
  SCHEDULE_CONFIRMED: "زمان‌بندی تأیید شد",
  COMPLETED: "تکمیل شده",
  NO_SHOW: "عدم حضور",
  REFUNDED: "بازپرداخت شده",
  CANCELLED: "لغو شده",
};

function formatFaDate(date: Date): string {
  return date.toLocaleString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function ensureUserActivitiesBackfilled(userId: string): Promise<void> {
  const count = await prisma.userActivity.count({ where: { userId } });
  if (count > 0) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sessions: { orderBy: { createdAt: "asc" } },
      matchesAsMale: { include: { cafe: true, female: { select: { firstName: true } } } },
      matchesAsFemale: { include: { cafe: true, male: { select: { firstName: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
      cryptoDeposits: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!user) return;

  await logUserActivity({
    userId,
    type: ACTIVITY.ACCOUNT_CREATED,
    title: "ثبت‌نام در سیستم",
    detail: `ایمیل: ${user.email}`,
    createdAt: user.createdAt,
  });

  for (const session of user.sessions) {
    await logUserActivity({
      userId,
      type: ACTIVITY.LOGIN,
      title: "ورود به حساب",
      createdAt: session.createdAt,
    });
  }

  if (user.firstName) {
    await logUserActivity({
      userId,
      type: ACTIVITY.PROFILE_UPDATED,
      title: "تکمیل اطلاعات پروفایل",
      detail: `نام: ${user.firstName}، سن: ${user.age ?? "—"}، جنسیت: ${user.gender === "MALE" ? "پسر" : user.gender === "FEMALE" ? "دختر" : "—"}`,
      createdAt: user.createdAt,
    });
  }

  if (user.selfieUrl) {
    await logUserActivity({
      userId,
      type: ACTIVITY.SELFIE_UPLOADED,
      title: "بارگذاری سلفی",
      metadata: { selfieUrl: user.selfieUrl },
      createdAt: user.updatedAt,
    });
  }

  if (user.selfieStatus === "APPROVED") {
    await logUserActivity({
      userId,
      type: ACTIVITY.SELFIE_APPROVED,
      title: "تأیید سلفی توسط ادمین",
      createdAt: user.updatedAt,
    });
  } else if (user.selfieStatus === "REJECTED") {
    await logUserActivity({
      userId,
      type: ACTIVITY.SELFIE_REJECTED,
      title: "رد سلفی توسط ادمین",
      createdAt: user.updatedAt,
    });
  }

  if (user.mbtiType) {
    await logUserActivity({
      userId,
      type: ACTIVITY.QUIZ_COMPLETED,
      title: "تکمیل تست شخصیت MBTI",
      detail: `نتیجه: ${user.mbtiType}`,
      createdAt: user.updatedAt,
    });
  }

  if (user.clothing) {
    await logUserActivity({
      userId,
      type: ACTIVITY.CLOTHING_UPDATED,
      title: "ثبت توضیحات پوشش",
      detail: user.clothing,
      createdAt: user.updatedAt,
    });
  }

  for (const match of user.matchesAsMale) {
    await logUserActivity({
      userId,
      type: ACTIVITY.MATCH_CREATED,
      title: "ایجاد قرار ملاقات",
      detail: `با ${match.female.firstName ?? "کاربر"} در ${match.cafe?.name ?? "کافه"} — سازگاری ${match.compatibilityScore}%`,
      metadata: { matchId: match.id, role: "male" },
      createdAt: match.createdAt,
    });

    if (match.timeSlotSelected) {
      await logUserActivity({
        userId,
        type: ACTIVITY.SCHEDULE_PROPOSED,
        title: "پیشنهاد زمان قرار",
        detail: formatFaDate(new Date(match.timeSlotSelected)),
        metadata: { matchId: match.id },
        createdAt: match.updatedAt,
      });
    }

    if (match.status === "SCHEDULE_CONFIRMED") {
      await logUserActivity({
        userId,
        type: ACTIVITY.SCHEDULE_CONFIRMED,
        title: "تأیید نهایی زمان قرار",
        detail: match.timeSlotSelected ? formatFaDate(new Date(match.timeSlotSelected)) : undefined,
        metadata: { matchId: match.id },
        createdAt: match.updatedAt,
      });
    }

    if (match.status === "CANCELLED") {
      await logUserActivity({
        userId,
        type: ACTIVITY.MATCH_CANCELLED,
        title: "لغو قرار ملاقات",
        metadata: { matchId: match.id },
        createdAt: match.updatedAt,
      });
    }
  }

  for (const match of user.matchesAsFemale) {
    await logUserActivity({
      userId,
      type: ACTIVITY.MATCH_CREATED,
      title: "ایجاد قرار ملاقات",
      detail: `با ${match.male.firstName ?? "کاربر"} در ${match.cafe?.name ?? "کافه"} — سازگاری ${match.compatibilityScore}%`,
      metadata: { matchId: match.id, role: "female" },
      createdAt: match.createdAt,
    });

    if (match.status === "SCHEDULE_CONFIRMED") {
      await logUserActivity({
        userId,
        type: ACTIVITY.SCHEDULE_CONFIRMED,
        title: "تأیید نهایی زمان قرار",
        detail: match.timeSlotSelected ? formatFaDate(new Date(match.timeSlotSelected)) : undefined,
        metadata: { matchId: match.id },
        createdAt: match.updatedAt,
      });
    }

    if (match.status === "CANCELLED") {
      await logUserActivity({
        userId,
        type: ACTIVITY.MATCH_CANCELLED,
        title: "لغو قرار ملاقات",
        metadata: { matchId: match.id },
        createdAt: match.updatedAt,
      });
    }
  }

  for (const message of user.messages) {
    await logUserActivity({
      userId,
      type: ACTIVITY.MESSAGE_SENT,
      title: "ارسال پیام در چت",
      detail: message.text.length > 80 ? `${message.text.slice(0, 80)}…` : message.text,
      metadata: { matchId: message.matchId, messageId: message.id },
      createdAt: message.createdAt,
    });
  }

  for (const deposit of user.cryptoDeposits) {
    await logUserActivity({
      userId,
      type: ACTIVITY.CRYPTO_DEPOSIT_CREATED,
      title: "ایجاد درخواست شارژ کریپتو",
      detail: `${formatUsd(deposit.amountCents)} (${deposit.payCurrency})`,
      metadata: { depositId: deposit.id },
      createdAt: deposit.createdAt,
    });

    if (deposit.status === "COMPLETED" && deposit.completedAt) {
      await logUserActivity({
        userId,
        type: ACTIVITY.CRYPTO_DEPOSIT_COMPLETED,
        title: "تکمیل شارژ کریپتو",
        detail: `${formatUsd(deposit.amountCents)} به کیف پول اضافه شد`,
        metadata: { depositId: deposit.id },
        createdAt: deposit.completedAt,
      });
    } else if (deposit.status === "FAILED" || deposit.status === "EXPIRED") {
      await logUserActivity({
        userId,
        type: ACTIVITY.CRYPTO_DEPOSIT_FAILED,
        title: deposit.status === "EXPIRED" ? "انقضای درخواست شارژ کریپتو" : "ناموفق بودن شارژ کریپتو",
        metadata: { depositId: deposit.id },
        createdAt: deposit.updatedAt,
      });
    }
  }

  if (user.isSearching && user.searchingSince) {
    await logUserActivity({
      userId,
      type: ACTIVITY.SEARCH_STARTED,
      title: "شروع جستجوی قرار",
      detail: "کاربر در صف مچ‌میکینگ قرار دارد",
      createdAt: user.searchingSince,
    });
  }
}

export async function getUserTimeline(userId: string) {
  await ensureUserActivitiesBackfilled(userId);

  return prisma.userActivity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export { MATCH_STATUS_LABELS };
