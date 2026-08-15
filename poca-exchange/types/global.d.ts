declare global {
  type PageProps<P = Record<string, string>> = {
    params: Promise<P>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  };

  type LayoutProps<P = Record<string, string>> = {
    params: Promise<P>;
    children: React.ReactNode;
  };
}

export {};
