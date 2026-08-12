export const siteConfig = {
  name: "stanpc",
  domain: "stanpc.com",
  // Falls back to the production domain; override with NEXT_PUBLIC_SITE_URL
  // (e.g. http://localhost:3000) for local dev so canonical/OG URLs are correct.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.stanpc.com",
  description:
    "K-pop 그룹·멤버별 포토카드 전체 도감. 시세 비교와 안전한 맞교환까지.",
  supportEmail: "support@stanpc.com",
  // Next.js merges `openGraph` shallowly across layout/page metadata — a
  // page-level `openGraph` object fully replaces the root layout's, not
  // just the keys it sets. Every page-level generateMetadata spreads this
  // in so siteName/locale stay consistent instead of getting dropped.
  ogDefaults: { siteName: "stanpc", locale: "ko_KR" },
} as const;
