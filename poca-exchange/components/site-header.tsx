"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNav } from "@/components/auth-nav";
import { BinderStats } from "@/components/binder/BinderStats";
import { siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    // Filters + search live further down the page on landing (see
    // components/landing/landing-filter-bar.tsx) — the header here displays
    // brand, binder stats, and profile links.
    return (
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0F0F12]/90 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link href="/" className="shrink-0 font-bold text-white">
            {siteConfig.name}
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <BinderStats />
            <AuthNav />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 w-full border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-black/80">
      <div className="flex w-full items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" className="font-bold">
          {siteConfig.name}
        </Link>
        <AuthNav />
      </div>
    </header>
  );
}
