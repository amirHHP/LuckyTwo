import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    return NextResponse.json({ success: true, user: auth.user });
  } catch (error: any) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const body = await request.json();
    const { firstName, age, occupation, gender, interests, zones, height } = body;

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (age !== undefined) updateData.age = parseInt(age);
    if (occupation !== undefined) updateData.occupation = occupation;
    if (gender !== undefined) updateData.gender = gender;
    if (height !== undefined) updateData.height = parseInt(height);
    
    if (interests !== undefined) {
      if (Array.isArray(interests)) {
        if (interests.length !== 5) {
          return NextResponse.json({ error: "باید دقیقاً ۵ مورد انتخاب شود" }, { status: 400 });
        }
        updateData.interests = JSON.stringify(interests);
      }
    }

    if (zones !== undefined) {
      if (Array.isArray(zones)) {
        if (zones.length !== 3) {
          return NextResponse.json({ error: "باید دقیقاً ۳ منطقه انتخاب شود" }, { status: 400 });
        }
        updateData.zones = JSON.stringify(zones);
      }
    }

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: "پروفایل با موفقیت بروزرسانی شد", user });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
