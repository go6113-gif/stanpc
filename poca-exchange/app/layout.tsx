import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthSessionProvider } from "@/components/session-provider";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rootTitle = `${siteConfig.name} — K-pop 포토카드 도감 & 거래`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: rootTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: { canonical: "/" },
  // Page-level generateMetadata calls (group/member/card) override title,
  // description, url, and images below but inherit siteName/locale/card —
  // keeps every page's OG/Twitter tags consistent without repeating them.
  openGraph: {
    siteName: siteConfig.name,
    locale: "ko_KR",
    type: "website",
    url: siteConfig.url,
    title: rootTitle,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: rootTitle,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
  // Google Search Console / Naver 서치어드바이저 소유권 확인 메타태그.
  // 각 콘솔에서 발급받은 값을 .env의 NEXT_PUBLIC_*_SITE_VERIFICATION에 채우면
  // 자동으로 노출된다 (미설정 시 태그 자체가 생략됨).
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
      ? {
          other: {
            "naver-site-verification":
              process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION,
          },
        }
      : {}),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          <SiteHeader />
          <main className="flex-1 pb-16 sm:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
