import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { answers } = await request.json(); // answers: string[] of length 16 (each "A" or "B")

    if (!answers || !Array.isArray(answers) || answers.length !== 16) {
      return NextResponse.json(
        { error: "پاسخ به تمام ۱۶ سوال الزامی است" },
        { status: 400 }
      );
    }

    let eCount = 0, iCount = 0;
    let sCount = 0, nCount = 0;
    let tCount = 0, fCount = 0;
    let jCount = 0, pCount = 0;

    answers.forEach((ans: string, idx: number) => {
      const isA = ans === "A";
      const dimension = idx % 4;

      if (dimension === 0) {
        if (isA) eCount++; else iCount++;
      } else if (dimension === 1) {
        if (isA) sCount++; else nCount++;
      } else if (dimension === 2) {
        if (isA) tCount++; else fCount++;
      } else if (dimension === 3) {
        if (isA) jCount++; else pCount++;
      }
    });

    const mbti = [
      eCount >= iCount ? "E" : "I",
      sCount >= nCount ? "S" : "N",
      tCount >= fCount ? "T" : "F",
      jCount >= pCount ? "J" : "P"
    ].join("");

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: { mbtiType: mbti },
    });

    return NextResponse.json({
      success: true,
      mbtiType: mbti,
      user,
    });
  } catch (error: any) {
    console.error("Quiz scoring error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
