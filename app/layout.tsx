import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Google Thai Sans สำหรับทุกหน้าของเว็บไซต์
const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-noto-thai",
  display: "swap",
});

// FC Luxurious สำหรับหน้า End Credit โดยเฉพาะ
const fcLuxurious = localFont({
  src: "./fonts/fc-luxurious.ttf",
  variable: "--font-fc-luxurious",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BYENIOR 2026 • Event Food Coupon & Activity Management",
  description: "ระบบคูปองอาหารและกิจกรรมงาน Byenior สโมสรนักศึกษา",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`dark h-full ${notoSansThai.variable} ${fcLuxurious.variable}`}
    >
      <body
        className={`${notoSansThai.className} min-h-full flex flex-col bg-black text-white selection:bg-amber-500 selection:text-black antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
