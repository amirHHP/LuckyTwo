import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSimulatedTime } from "@/lib/timeMock";
import { requireUser } from "@/lib/session";

const NO_SHOW_GRACE_MS = 30 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const userId = auth.user.id;

    // Find the latest active match for this user
    const match = await prisma.match.findFirst({
      where: {
        OR: [{ maleId: userId }, { femaleId: userId }],
        status: {
          in: ["SCHEDULE_PENDING", "SCHEDULE_CONFIRMED", "COMPLETED"],
        },
      },
      include: {
        male: true,
        female: true,
        cafe: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!match) {
      return NextResponse.json({ success: true, match: null });
    }

    const isMale = match.maleId === userId;
    const partner = isMale ? match.female : match.male;
    const simulatedTime = await getSimulatedTime();

    // Privacy Guard Logic:
    // Café details and partner clues are hidden until T-24 Hours before the scheduled date.
    let cafeDetails = null;
    let partnerClues = null;
    let t24Revealed = false;
    let chatActive = false;
    let canReportNoShow = false;
    let canCompleteMatch = false;

    if (match.status === "SCHEDULE_CONFIRMED" && match.timeSlotSelected) {
      const dateScheduled = new Date(match.timeSlotSelected);
      const timeDiff = dateScheduled.getTime() - simulatedTime.getTime();
      const scheduledPassed = simulatedTime.getTime() >= dateScheduled.getTime();

      // T-24 Hours reveal check
      if (timeDiff <= 24 * 60 * 60 * 1000) {
        t24Revealed = true;
        cafeDetails = {
          name: match.cafe?.name,
          address: match.cafe?.address,
          lat: match.cafe?.lat,
          lng: match.cafe?.lng,
        };
        partnerClues = {
          firstName: partner.firstName,
          age: partner.age,
          height: partner.height,
          clothing: partner.clothing || "هنوز مشخص نکرده است",
        };
      }

      // Temporary Chat window check: T-2 Hours to T+2 Hours
      const chatStart = dateScheduled.getTime() - 2 * 60 * 60 * 1000;
      const chatEnd = dateScheduled.getTime() + 2 * 60 * 60 * 1000;
      const simulatedTimeMs = simulatedTime.getTime();
      
      if (simulatedTimeMs >= chatStart && simulatedTimeMs <= chatEnd) {
        chatActive = true;
      }

      if (scheduledPassed) {
        canCompleteMatch = true;
        if (isMale && simulatedTime.getTime() >= dateScheduled.getTime() + NO_SHOW_GRACE_MS) {
          canReportNoShow = true;
        }
      }
    }

    const safeMatch = {
      id: match.id,
      status: match.status,
      compatibilityScore: match.compatibilityScore,
      timeSlotOptions: JSON.parse(match.timeSlotOptions),
      timeSlotSelected: match.timeSlotSelected,
      zone: match.cafe?.zone || "نامشخص",
      malePaid: match.malePaid,
      femalePaid: match.femalePaid,
      isMale,
      t24Revealed,
      chatActive,
      canReportNoShow,
      canCompleteMatch,
      cafeDetails,
      partnerClues,
    };

    return NextResponse.json({
      success: true,
      match: safeMatch,
    });
  } catch (error: any) {
    console.error("Fetch match status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
