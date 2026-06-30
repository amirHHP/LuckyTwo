import { prisma } from "./db";

export type ActivityInput = {
  userId: string;
  type: string;
  title: string;
  detail?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
};

export async function logUserActivity(input: ActivityInput): Promise<void> {
  try {
    await prisma.userActivity.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        detail: input.detail ?? null,
        metadata: JSON.stringify(input.metadata ?? {}),
        createdAt: input.createdAt ?? new Date(),
      },
    });
  } catch (error) {
    console.error("Activity log error:", error);
  }
}

export const ACTIVITY = {
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  LOGIN: "LOGIN",
  PROFILE_UPDATED: "PROFILE_UPDATED",
  SELFIE_UPLOADED: "SELFIE_UPLOADED",
  SELFIE_APPROVED: "SELFIE_APPROVED",
  SELFIE_REJECTED: "SELFIE_REJECTED",
  QUIZ_COMPLETED: "QUIZ_COMPLETED",
  SEARCH_STARTED: "SEARCH_STARTED",
  MATCH_CREATED: "MATCH_CREATED",
  SCHEDULE_PROPOSED: "SCHEDULE_PROPOSED",
  SCHEDULE_CONFIRMED: "SCHEDULE_CONFIRMED",
  MATCH_CANCELLED: "MATCH_CANCELLED",
  MATCH_COMPLETED: "MATCH_COMPLETED",
  MATCH_NO_SHOW: "MATCH_NO_SHOW",
  NO_SHOW_PENALTY: "NO_SHOW_PENALTY",
  WALLET_DEPOSIT: "WALLET_DEPOSIT",
  CRYPTO_DEPOSIT_CREATED: "CRYPTO_DEPOSIT_CREATED",
  CRYPTO_DEPOSIT_COMPLETED: "CRYPTO_DEPOSIT_COMPLETED",
  CRYPTO_DEPOSIT_FAILED: "CRYPTO_DEPOSIT_FAILED",
  MESSAGE_SENT: "MESSAGE_SENT",
  CLOTHING_UPDATED: "CLOTHING_UPDATED",
} as const;
