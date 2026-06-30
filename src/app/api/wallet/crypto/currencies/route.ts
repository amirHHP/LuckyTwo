import { NextResponse } from "next/server";
import { SUPPORTED_CURRENCIES, isMockMode, tomansToUsd } from "@/lib/cryptoPayments";

export async function GET() {
  return NextResponse.json({
    currencies: SUPPORTED_CURRENCIES,
    isMock: isMockMode,
    tomanPerUsd: Number(process.env.TOMAN_PER_USD || "50000"),
    minDeposit: 50000,
    exampleUsd: tomansToUsd(200000),
  });
}
