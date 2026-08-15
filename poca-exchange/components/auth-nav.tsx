"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";

/**
 * Safe Auth Navigation Component
 * Handles missing auth gracefully without crashing
 */
export function AuthNav() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  // Loading state - show minimal UI
  if (isLoading) {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-600" />
    );
  }

  // No session - show sign in link
  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className="inline-flex items-center gap-2 rounded-lg bg-[#FF2A55] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        <User size={16} />
        Sign In
      </Link>
    );
  }

  // Session exists - show user menu
  return (
    <div className="flex items-center gap-3">
      {session.user.image && (
        <img
          src={session.user.image}
          alt={session.user.name || "User"}
          className="h-8 w-8 rounded-full"
        />
      )}
      <span className="text-sm font-medium text-white">
        {session.user.name || session.user.email}
      </span>
      <Link
        href="/api/auth/signout"
        className="inline-flex items-center gap-1 rounded-lg hover:bg-neutral-800 px-2 py-1 transition-colors"
      >
        <LogOut size={16} />
      </Link>
    </div>
  );
}
