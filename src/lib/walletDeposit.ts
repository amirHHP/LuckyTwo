import { prisma } from "@/lib/db";
import { mapExternalStatus } from "@/lib/cryptoPayments";
import { ACTIVITY, logUserActivity } from "@/lib/activity";
import { formatUsd } from "@/lib/wallet";

export async function completeCryptoDeposit(depositId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const deposit = await tx.cryptoDeposit.findUnique({ where: { id: depositId } });
    if (!deposit || deposit.status === "COMPLETED") return false;

    await tx.user.update({
      where: { id: deposit.userId },
      data: { walletBalance: { increment: deposit.amountCents } },
    });

    await tx.cryptoDeposit.update({
      where: { id: depositId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    return true;
  }).then(async (credited) => {
    if (credited) {
      const deposit = await prisma.cryptoDeposit.findUnique({ where: { id: depositId } });
      if (deposit) {
        await logUserActivity({
          userId: deposit.userId,
          type: ACTIVITY.CRYPTO_DEPOSIT_COMPLETED,
          title: "تکمیل شارژ کریپتو",
          detail: `${formatUsd(deposit.amountCents)} به کیف پول اضافه شد`,
          metadata: { depositId },
        });
      }
    }
    return credited;
  });
}

export async function syncDepositStatus(
  depositId: string,
  externalStatus: string
): Promise<{ status: string; credited: boolean }> {
  const mapped = mapExternalStatus(externalStatus);

  const deposit = await prisma.cryptoDeposit.findUnique({ where: { id: depositId } });
  if (!deposit) return { status: "FAILED", credited: false };

  if (deposit.status === "COMPLETED") {
    return { status: "COMPLETED", credited: false };
  }

  if (mapped === "COMPLETED") {
    const credited = await completeCryptoDeposit(depositId);
    return { status: "COMPLETED", credited };
  }

  if (mapped === "FAILED" || mapped === "EXPIRED") {
    await prisma.cryptoDeposit.update({
      where: { id: depositId },
      data: { status: mapped, externalStatus },
    });
    await logUserActivity({
      userId: deposit.userId,
      type: ACTIVITY.CRYPTO_DEPOSIT_FAILED,
      title: mapped === "EXPIRED" ? "انقضای درخواست شارژ کریپتو" : "ناموفق بودن شارژ کریپتو",
      metadata: { depositId },
    });
    return { status: mapped, credited: false };
  }

  await prisma.cryptoDeposit.update({
    where: { id: depositId },
    data: { status: mapped, externalStatus },
  });
  return { status: mapped, credited: false };
}
