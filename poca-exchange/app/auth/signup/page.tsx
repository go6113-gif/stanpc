"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validatePassword = (pwd: string): boolean => {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    return regex.test(pwd);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요");
      return;
    }

    if (!validatePassword(password)) {
      setError("비밀번호는 최소 8자 이상이며 영문과 숫자를 포함해야 합니다");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/email-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "회원가입 중 오류가 발생했습니다");
        return;
      }

      setSuccess(true);
      setEmail("");
      setPassword("");

      // 회원가입 성공 후 2초 뒤 홈으로 리다이렉트
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      setError("서버 오류가 발생했습니다");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpWithGoogle = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("인증 시스템이 준비되지 않았습니다");
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });

      if (data.url) {
        window.location.href = data.url;
      }

      if (error) {
        setError("Google 로그인 중 오류가 발생했습니다");
        console.error("Google signup error:", error);
      }
    } catch (err) {
      setError("Google 로그인 중 오류가 발생했습니다");
      console.error("Google signup error:", err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              회원가입
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              stanpc에 가입하고 포토카드 도감을 시작하세요
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-400">
                회원가입이 완료되었습니다! 잠시 후 홈으로 이동합니다...
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSignUpWithGoogle}
            disabled={loading || success}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <text x="2" y="20" fontSize="12" fill="currentColor">
                Google
              </text>
            </svg>
            Google로 가입
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600"></div>
            <span className="text-xs text-slate-500 dark:text-slate-400">또는</span>
            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-600"></div>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="your@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || success}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="8자 이상 (영문 + 숫자)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || success}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                최소 8자, 영문과 숫자 포함
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "처리 중..." : "회원가입"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              이미 계정이 있으신가요?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                로그인
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <p>가입하면 서비스 약관 및 개인정보처리방침에 동의하게 됩니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}
