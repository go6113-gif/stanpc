// Next.js App Router type definitions for Next.js 16+
export interface PageProps<P extends Record<string, string> = Record<string, string>> {
  params: Promise<P>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export interface LayoutProps<P extends Record<string, string> = Record<string, string>> {
  params: Promise<P>;
  children: React.ReactNode;
}
