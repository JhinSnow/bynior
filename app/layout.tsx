import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
    <html lang="th" className={`dark h-full ${fcLuxurious.variable}`}>
      <body className={`${fcLuxurious.className} min-h-full flex flex-col bg-slate-950 text-white selection:bg-amber-500 selection:text-black antialiased`}>
        {children}
      </body>
    </html>
  );
}
