"use client";

import { SessionProvider } from "next-auth/react";

// No `session` prop is passed on purpose: that would require calling
// auth()/cookies() in the (server) root layout, which forces every page
// — including the statically-generated /[group] and /card pSEO pages — into
// full per-request dynamic rendering. Fetching client-side after mount
// keeps the rest of the app static.
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
