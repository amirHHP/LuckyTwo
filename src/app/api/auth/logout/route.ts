import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    await destroySession(request);
    return NextResponse.json({ success: true, message: "با موفقیت خارج شدید" });
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
