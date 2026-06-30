import { NextResponse } from "next/server";
import { SUPPORTED_CURRENCIES, isMockMode } from "@/lib/cryptoPayments";
import { MIN_DEPOSIT_CENTS } from "@/lib/wallet";

export async function GET() {
  return NextResponse.json({
    currencies: SUPPORTED_CURRENCIES,
    isMock: isMockMode,
    minDeposit: MIN_DEPOSIT_CENTS / 100,
    minDepositCents: MIN_DEPOSIT_CENTS,
  });
}
