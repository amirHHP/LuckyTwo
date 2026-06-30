import { NextRequest, NextResponse } from "next/server";
import { getSimulatedTime, setSimulatedTimeOffset } from "@/lib/timeMock";
import { runMatchmakingEngine } from "@/lib/matching";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const simulatedTime = await getSimulatedTime();
    
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "time_offset_hours" },
    });
    const offsetHours = setting ? parseFloat(setting.value) : 0;

    return NextResponse.json({
      success: true,
      simulatedTime: simulatedTime.toISOString(),
      actualTime: new Date().toISOString(),
      offsetHours,
    });
  } catch (error: any) {
    console.error("Fetch simulated time error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { offsetHours } = await request.json();

    if (offsetHours === undefined || isNaN(parseFloat(offsetHours))) {
      return NextResponse.json({ error: "میزان آفست ساعت نامعتبر است" }, { status: 400 });
    }

    await setSimulatedTimeOffset(parseFloat(offsetHours));
    const newSimulatedTime = await getSimulatedTime();
    const matchResult = await runMatchmakingEngine();

    return NextResponse.json({
      success: true,
      message: `آفست ساعت شبیه‌ساز با موفقیت روی ${offsetHours} ساعت تنظیم شد.`,
      simulatedTime: newSimulatedTime.toISOString(),
      offsetHours: parseFloat(offsetHours),
      matchesCreated: matchResult.matchesCreated,
    });
  } catch (error: any) {
    console.error("Update simulated time error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
