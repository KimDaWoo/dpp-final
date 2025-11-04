import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";

import { CurrencyProvider } from "@/contexts/currency-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "사전 거래 분석 도구",
  description: "원칙에 기반한 트레이딩을 위한 사전 분석 및 관리 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <SessionProvider>
          <CurrencyProvider>
            {children}
            <Toaster />
          </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}