import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const previewImage = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    title: {
      default: "且慢产品研究页面库｜2026-07",
      template: "%s｜且慢产品研究页面库",
    },
    description:
      "OneTab 22 个页面的统一生产入口：投顾页改版、产品全景、AI 原生转型、OAP 规划与工具对比。",
    openGraph: {
      title: "且慢产品研究页面库｜2026-07",
      description: "22 个产品研究、分析与规划页面的统一稳定入口。",
      type: "website",
      locale: "zh_CN",
      images: [{ url: previewImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "且慢产品研究页面库｜2026-07",
      description: "22 个产品研究、分析与规划页面的统一稳定入口。",
      images: [previewImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
