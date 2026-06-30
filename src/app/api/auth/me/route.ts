import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Return safe user data (no OTP fields)
    const { otpCode, otpExpiresAt, ...safeUser } = user;
    return NextResponse.json({ authenticated: true, user: safeUser });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
