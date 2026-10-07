import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/shared/ServiceWorkerRegistrar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CoLiv · 合租管家",
  description: "让合租不再因为「谁该做什么」和「谁欠谁多少」而消耗关系",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CoLiv",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#22c55e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
