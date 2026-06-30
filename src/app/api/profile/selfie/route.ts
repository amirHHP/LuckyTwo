import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
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
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
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
