import { ReactNode } from "react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { seoFormulas } from "@/lib/seo-config";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const userName = session?.user?.name ?? "Creator";

  const title = seoFormulas.cardGeneratorTitle(userName);
  const description = seoFormulas.cardGeneratorDescription();

  return {
    title,
    description,
    openGraph: {
      ...siteConfig.ogDefaults,
      title,
      description,
      type: "website",
      url: `${siteConfig.url}/card-generator`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function CardGeneratorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
