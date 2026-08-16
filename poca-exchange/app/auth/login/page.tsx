import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function SupabaseSetupWarning() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md rounded-lg border border-amber-300 bg-amber-50 p-8 shadow-lg dark:border-amber-700 dark:bg-amber-950">
        <h1 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-2">
          ⚠️ 데이터베이스(Supabase) 설정이 필요합니다
        </h1>
        <p className="text-sm text-amber-800 dark:text-amber-300">
          로그인 기능을 사용하려면 <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.local</code>에
          {" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">NEXT_PUBLIC_SUPABASE_URL</code>
          {" "}및{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          {" "}값을 설정해주세요.
        </p>
      </div>
    </div>
  );
}

export default async function LoginPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <SupabaseSetupWarning />;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/");
  }

  const handleSignInWithGoogle = async () => {
    "use server";
    const supabase = await createClient();
    if (!supabase) {
      console.error("Supabase is not configured");
      return;
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (data.url) {
      redirect(data.url);
    }

    if (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            포토카드 컬렉션에 로그인하세요
          </p>
        </div>

        <form action={handleSignInWithGoogle} className="space-y-4">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:hover:bg-slate-600 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <text x="2" y="20" fontSize="12" fill="currentColor">
                Google
              </text>
            </svg>
            Google로 로그인
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>로그인하면 서비스 약관에 동의하게 됩니다</p>
        </div>
      </div>
    </div>
  );
}
