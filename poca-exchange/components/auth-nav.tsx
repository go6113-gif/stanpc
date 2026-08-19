"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, BookOpen } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { getSupabaseClient } from "@/lib/supabase/client";

export function AuthNav() {
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, logout, login } = useAuthStore();

  useEffect(() => {
    useAuthStore.persist.rehydrate();

    // Supabase 세션 확인 및 로컬 스토어 동기화
    const checkSupabaseSession = async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setHydrated(true);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // Supabase 세션이 있으면 로컬 스토어 업데이트
          const displayName =
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "User";

          useAuthStore.setState({
            user: {
              id: session.user.id,
              email: session.user.email || "",
              nickname: displayName,
              tier: "basic",
            },
            isAuthenticated: true,
          });
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setHydrated(true);
      }
    };

    checkSupabaseSession();
  }, []);

  if (!hydrated) {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-600" />
    );
  }

  // 비로그인 상태
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/vault?mode=guest"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
        >
          <BookOpen size={16} />
          📖 내 바인더
        </Link>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
        >
          <User size={16} />
          로그인
        </Link>
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 rounded-lg bg-[#FF2A55] px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
        >
          회원가입
        </Link>
      </div>
    );
  }

  // 로그인 상태
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/vault"
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
      >
        <BookOpen size={16} />
        📖 내 바인더
      </Link>
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
      >
        <User size={16} />
        👤 {user?.nickname}
      </Link>
      <button
        onClick={() => {
          logout();
          router.push("/");
        }}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors hover:bg-neutral-800/50"
      >
        <LogOut size={16} />
        로그아웃
      </button>
    </div>
  );
}
