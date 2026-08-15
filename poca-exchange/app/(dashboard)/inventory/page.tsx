import { prisma } from "@/lib/prisma";
import { InventoryTabs } from "./components/inventory-tabs";
import { InventoryStats } from "./components/inventory-stats";
import { InventoryGrid } from "./components/inventory-grid";
import { UserBinderCardStatus } from "@/app/generated/prisma/client";

interface InventoryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface BinderCardRow {
  id: string;
  status: UserBinderCardStatus;
  note: string | null;
  card: {
    id: string;
    slug: string;
    cardName: string | null;
    imageUrl: string | null;
    thumbImagePath: string | null;
  };
  createdAt: Date;
}

export default async function InventoryPage({
  searchParams,
}: InventoryPageProps) {
  const params = await searchParams;
  const statusFilter =
    typeof params.status === "string" ? params.status : undefined;

  // TODO: 세션에서 사용자 ID를 가져와야 합니다
  // 현재는 임시로 처리됩니다
  const userId = params.userId as string | undefined;

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">로그인 필요</h1>
          <p className="text-gray-600">인벤토리를 보려면 먼저 로그인하세요.</p>
        </div>
      </div>
    );
  }

  // 사용자의 모든 바인더 카드 조회 (Server Component 내에서만 Prisma 호출)
  let binderCards: BinderCardRow[] = [];
  let allCards: Array<{ status: UserBinderCardStatus }> = [];

  try {
    [binderCards, allCards] = await Promise.all([
      prisma.userBinderCard.findMany({
        where: {
          userId,
          ...(statusFilter && {
            status: statusFilter as UserBinderCardStatus,
          }),
        },
        select: {
          id: true,
          status: true,
          note: true,
          card: {
            select: {
              id: true,
              slug: true,
              cardName: true,
              imageUrl: true,
              thumbImagePath: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.userBinderCard.findMany({
        where: { userId },
        select: { status: true },
      }),
    ]);
  } catch (err) {
    console.error("Failed to fetch inventory data:", err);
  }

  // 통계 계산 — 클라이언트로는 순수 직렬화 가능한 데이터만 전달
  const stats = {
    total: allCards.length,
    owned: allCards.filter(
      (c) => c.status === UserBinderCardStatus.OWNED
    ).length,
    wtt: allCards.filter(
      (c) => c.status === UserBinderCardStatus.WTT
    ).length,
    wts: allCards.filter(
      (c) => c.status === UserBinderCardStatus.WTS
    ).length,
    wtb: allCards.filter((c) => c.status === UserBinderCardStatus.WTB).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            My Vault
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            포토카드 컬렉션을 관리하고 거래 상태를 설정하세요
          </p>
        </div>

        {/* 통계 */}
        <InventoryStats stats={stats} className="mb-8" />

        {/* 탭 및 필터 */}
        <InventoryTabs
          currentStatus={statusFilter as UserBinderCardStatus | undefined}
        />

        {/* 그리드 */}
        <InventoryGrid cards={binderCards} userId={userId} />
      </div>
    </div>
  );
}
