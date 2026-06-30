import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LuckyTwo - بلایند دیت هوشمند",
  description: "اولین اپلیکیشن بلایند دیت هوشمند ایرانی بر پایه سازگاری شخصیتی و منطقه‌ای",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
