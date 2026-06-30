import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { ACTIVITY, logUserActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get("selfie") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "فایل سلفی الزامی است" },
        { status: 400 }
      );
    }

    // Validate file type (camera captures on mobile may have empty MIME type)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    let mimeType = file.type;
    if (!mimeType || mimeType === "application/octet-stream") {
      const name = file.name.toLowerCase();
      if (name.endsWith(".png")) mimeType = "image/png";
      else if (name.endsWith(".webp")) mimeType = "image/webp";
      else mimeType = "image/jpeg";
    }
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "فرمت فایل نامعتبر است. فقط JPEG، PNG یا WebP مجاز هستند" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "حجم فایل نباید بیشتر از ۵ مگابایت باشد" },
        { status: 400 }
      );
    }

    // Save file to public/uploads/selfies/
    const ext = mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1];
    const filename = `${auth.user.id}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "selfies");
    
    await mkdir(uploadDir, { recursive: true });
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadDir, filename), buffer);

    const selfieUrl = `/uploads/selfies/${filename}`;

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        selfieUrl,
        selfieStatus: "PENDING",
        isVerified: false,
      },
    });

    await logUserActivity({
      userId: auth.user.id,
      type: ACTIVITY.SELFIE_UPLOADED,
      title: "بارگذاری سلفی",
      metadata: { selfieUrl },
    });

    return NextResponse.json({
      success: true,
      message: "سلفی بارگذاری شد و در انتظار تایید مدیریت است",
      user,
    });
  } catch (error: any) {
    console.error("Selfie upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
