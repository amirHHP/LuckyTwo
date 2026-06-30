import crypto from "crypto";

export const SUPPORTED_CURRENCIES = [
  { code: "usdttrc20", label: "USDT (TRC20)", icon: "₮" },
  { code: "btc", label: "Bitcoin", icon: "₿" },
  { code: "eth", label: "Ethereum", icon: "Ξ" },
  { code: "trx", label: "TRON", icon: "◎" },
] as const;

export type PayCurrency = (typeof SUPPORTED_CURRENCIES)[number]["code"];

const TOMAN_PER_USD = Number(process.env.TOMAN_PER_USD || "50000");
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;
const NOWPAYMENTS_API_URL =
  process.env.NOWPAYMENTS_API_URL || "https://api.nowpayments.io/v1";

export const isMockMode = !NOWPAYMENTS_API_KEY;

export function tomansToUsd(tomans: number): number {
  return tomans / TOMAN_PER_USD;
}

function mockUsdRates(): Record<string, number> {
  return { usdttrc20: 1, btc: 95000, eth: 3500, trx: 0.12 };
}

function generateMockAddress(currency: string): string {
  const hex = crypto.randomBytes(20).toString("hex");
  if (currency === "btc") return `bc1q${hex.slice(0, 38)}`;
  if (currency === "eth") return `0x${hex}`;
  if (currency === "usdttrc20" || currency === "trx") return `T${hex.slice(0, 33).toUpperCase()}`;
  return hex;
}

export interface CreatePaymentResult {
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  status: string;
  isMock: boolean;
}

export async function createCryptoPayment(
  amountTomans: number,
  payCurrency: string,
  orderId: string,
  callbackUrl: string
): Promise<CreatePaymentResult> {
  const usdAmount = tomansToUsd(amountTomans);

  if (isMockMode) {
    const rates = mockUsdRates();
    const rate = rates[payCurrency] ?? 1;
    const payAmount =
      payCurrency === "usdttrc20"
        ? Math.round(usdAmount * 100) / 100
        : Math.round((usdAmount / rate) * 1e8) / 1e8;

    return {
      paymentId: `mock_${orderId}`,
      payAddress: generateMockAddress(payCurrency),
      payAmount,
      payCurrency,
      status: "waiting",
      isMock: true,
    };
  }

  const res = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": NOWPAYMENTS_API_KEY!,
    },
    body: JSON.stringify({
      price_amount: usdAmount,
      price_currency: "usd",
      pay_currency: payCurrency,
      order_id: orderId,
      order_description: `LuckyTwo wallet top-up ${amountTomans} Tomans`,
      ipn_callback_url: callbackUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Payment provider error: ${err}`);
  }

  const data = await res.json();
  return {
    paymentId: String(data.payment_id),
    payAddress: data.pay_address,
    payAmount: data.pay_amount,
    payCurrency: data.pay_currency,
    status: data.payment_status,
    isMock: false,
  };
}

export async function fetchPaymentStatus(externalId: string): Promise<string> {
  if (externalId.startsWith("mock_")) return "waiting";

  const res = await fetch(`${NOWPAYMENTS_API_URL}/payment/${externalId}`, {
    headers: { "x-api-key": NOWPAYMENTS_API_KEY! },
  });

  if (!res.ok) return "unknown";
  const data = await res.json();
  return data.payment_status;
}

export function isPaymentComplete(status: string): boolean {
  return ["finished", "confirmed"].includes(status);
}

export function isPaymentFailed(status: string): boolean {
  return ["failed", "refunded", "expired"].includes(status);
}

export function mapExternalStatus(status: string): string {
  if (isPaymentComplete(status)) return "COMPLETED";
  if (status === "confirming" || status === "sending" || status === "partially_paid")
    return "CONFIRMING";
  if (isPaymentFailed(status)) return "FAILED";
  if (status === "expired") return "EXPIRED";
  return "PENDING";
}

export function verifyNowPaymentsWebhook(
  body: Record<string, unknown>,
  signature: string | null
): boolean {
  if (!NOWPAYMENTS_IPN_SECRET || !signature) return isMockMode;
  const sorted = sortObject(body);
  const hmac = crypto.createHmac("sha512", NOWPAYMENTS_IPN_SECRET);
  hmac.update(JSON.stringify(sorted));
  return hmac.digest("hex") === signature;
}

function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const val = obj[key];
      acc[key] =
        val && typeof val === "object" && !Array.isArray(val)
          ? sortObject(val as Record<string, unknown>)
          : val;
      return acc;
    }, {});
}
