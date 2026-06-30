import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

import { toSafeUser } from "@/lib/safeUser";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user: toSafeUser(user) });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
