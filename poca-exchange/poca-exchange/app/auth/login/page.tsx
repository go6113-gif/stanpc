import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function SupabaseSetupWarning() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-300 bg-slate-50 p-8 shadow-lg dark:border-slate-600 dark:bg-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          로그인 준비 중
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          현재 로그인 기능은 준비 중입니다. 잠시 후 다시 시도해주세요.
        </p>
        <a
          href="/"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2.5 font-medium hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
        >
          홈으로 돌아가기
        </a>
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
