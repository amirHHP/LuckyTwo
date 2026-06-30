/** Wallet balances and match fees are stored in USD cents (100 = $1.00). */

export const MALE_MATCH_FEE_CENTS = 100;
export const FEMALE_NO_SHOW_PENALTY_CENTS = 50;
export const MIN_DEPOSIT_CENTS = 100;

/** Upfront fee when starting a match search (females match for free). */
export function getMatchFeeCents(gender: string | null | undefined): number {
  return gender === "MALE" ? MALE_MATCH_FEE_CENTS : 0;
}

/** Whether the user can start a new match search. */
export function canStartMatching(
  gender: string | null | undefined,
  walletBalance: number
): boolean {
  if (gender === "MALE") return walletBalance >= MALE_MATCH_FEE_CENTS;
  return walletBalance >= 0;
}

export function formatUsd(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = abs / 100;
  const formatted =
    abs % 100 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
  return negative ? `-${formatted}` : formatted;
}

export function centsToUsd(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
