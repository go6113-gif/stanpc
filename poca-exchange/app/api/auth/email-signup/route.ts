import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력해주세요" },
        { status: 400 }
      );
    }

    // Password: 최소 8자, 영문 + 숫자 조합
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: "비밀번호는 최소 8자 이상이며 영문과 숫자를 포함해야 합니다" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "인증 시스템이 준비되지 않았습니다" },
        { status: 500 }
      );
    }

    // Supabase 회원가입 (이메일 확인 비활성화)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "회원가입 처리 중 오류가 발생했습니다" },
        { status: 400 }
      );
    }

    // 회원가입 성공 → 로그인 페이지로 리다이렉트
    // (Supabase에서 자동으로 세션 생성)
    return NextResponse.json(
      {
        success: true,
        message: "회원가입이 완료되었습니다",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
