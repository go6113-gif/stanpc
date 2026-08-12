"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn, signOut, useSession } from "next-auth/react";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google로 로그인",
  twitter: "X로 로그인",
  kakao: "카카오로 로그인",
  naver: "네이버로 로그인",
};

export function AuthNav() {
  const { data: session, status } = useSession();
  const [providerIds, setProviderIds] = useState<string[] | null>(null);

  useEffect(() => {
    getProviders().then((providers) => {
      setProviderIds(providers ? Object.keys(providers) : []);
    });
  }, []);

  if (status === "loading" || providerIds === null) {
    return <div className="h-7 w-24 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name ?? "profile"}
            className="h-7 w-7 rounded-full"
          />
        ) : null}
        <span className="hidden text-sm text-neutral-600 sm:inline dark:text-neutral-300">
          {session.user.name ?? session.user.email}
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-full border border-neutral-200 px-3 py-1 text-sm hover:border-neutral-400 dark:border-neutral-700"
        >
          로그아웃
        </button>
      </div>
    );
  }

  if (providerIds.length === 0) {
    return (
      <span className="text-xs text-neutral-400">
        로그인 준비 중 (OAuth 설정 필요)
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
      {providerIds.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => signIn(id)}
          className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs whitespace-nowrap hover:border-neutral-400 sm:px-3 sm:text-sm dark:border-neutral-700"
        >
          {PROVIDER_LABELS[id] ?? `${id}로 로그인`}
        </button>
      ))}
    </div>
  );
}
