import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Collector/Pro 구독 체크아웃 세션 생성
// stripe가 null이면(환경변수 미설정) 503으로 방어 — 빌드 타임에는 절대 호출되지 않고
// 런타임 요청 시에만 평가되므로 빌드를 깨뜨리지 않음
export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe가 설정되지 않았습니다" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { userId, priceId } = body as { userId?: string; priceId?: string };

    if (!userId || !priceId) {
      return NextResponse.json(
        { error: "userId와 priceId가 필요합니다" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, stripeCustomerId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 기존 Stripe 고객이 없으면 새로 생성 후 User에 연결
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/vault?checkout=success`,
      cancel_url: `${siteUrl}/vault?checkout=canceled`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Stripe checkout session creation failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
