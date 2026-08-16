/**
 * My Vault 2.0 데이터 스키마 (Zustand + Prisma 호환)
 * Mock 단계에서 Supabase로 마이그레이션 가능한 구조
 */

// Asset 상태 열거형
export type AssetStatus = "VAULTED" | "DUPLICATE" | "WTT" | "WTS" | "WTB" | "INCOMING";

// 카드 상태 (실물 상태)
export type CardCondition = "MINT" | "NM" | "LP" | "POOR";

// 바인더 공개 권한
export type BinderVisibility = "PUBLIC" | "LINK_ONLY" | "PRIVATE";

/**
 * 자산 히스토리 기록 (개별 트랜잭션)
 * 예: 카드 입고, 상태 변경, 인증 처리, 판매 등
 */
export interface AssetHistoryEntry {
  id: string;
  date: number; // timestamp
  action: "ACQUIRED" | "STATUS_CHANGED" | "VERIFIED" | "SOLD" | "TRADED" | "LOCATION_UPDATED";
  previousStatus?: AssetStatus;
  newStatus?: AssetStatus;
  note?: string;
}

/**
 * 개별 카드 자산 (Vault의 최소 단위)
 * 한 장의 물리적 카드를 추적하며, 상태/조건/인증을 관리함
 */
export interface VaultAsset {
  id: string; // UUID - 개별 실물 카드 식별자
  binderId: string; // 소속 바인더
  masterCardId: string; // 시세 및 메타 연결용 도감 카드 ID

  // 상태 관리
  status: AssetStatus; // 현재 상태
  condition: CardCondition; // 실물 상태
  quantity: number; // 동일 상태/조건의 수량 (다량 보유 시)

  // 가치 추적
  purchasePrice: number | null; // 매입 단가 (null = 가격 미기록)
  estimatedValue: number; // 현재 추정 시세 (마스터 카드의 글로벌 시세 기반)

  // 인증 및 보관
  isVerified: boolean; // 빛반사/QR/워터마크 인증 여부
  physicalLocation: string; // 보관 위치 (예: "#탑로더_A박스")

  // 타임스탐프
  createdAt: number;
  updatedAt: number;

  // 히스토리 추적 (후술 Bulk Update 기능 지원)
  history: AssetHistoryEntry[];
}

/**
 * 바인더 (Asset 컨테이너)
 * 사용자가 자신의 카드들을 주제/전시 목적에 따라 그룹화
 */
export interface Binder {
  id: string; // UUID
  userId: string; // 소유자 ID (향후 다중 사용자 지원)
  title: string; // 바인더 제목 (예: "뉴진스 올컬렉")
  description?: string; // 바인더 설명
  coverImage?: string; // 표지 이미지 URL

  // 권한 및 테마
  visibility: BinderVisibility; // PUBLIC / LINK_ONLY / PRIVATE
  theme?: string; // 바인더 고유 테마색 (hex)

  // 통계 (캐시 용도로, 실제는 assets에서 계산 가능)
  assetCount: number;
  totalEstimatedValue: number;

  // 타임스탬프
  createdAt: number;
  updatedAt: number;
}

/**
 * 상태 관리 (Zustand store)
 */
export interface VaultState {
  // 데이터
  binders: Binder[];
  assets: VaultAsset[];

  // Binder 액션
  createBinder: (title: string, userId: string) => string; // 바인더 생성, ID 반환
  updateBinderVisibility: (binderId: string, visibility: BinderVisibility) => void;
  updateBinderMetadata: (binderId: string, title?: string, description?: string) => void;
  deleteBinder: (binderId: string) => void;

  // Asset 액션 (단건)
  addAsset: (
    binderId: string,
    masterCardId: string,
    status: AssetStatus,
    condition: CardCondition,
    quantity: number,
    purchasePrice?: number
  ) => string; // 자산 추가, Asset ID 반환
  updateAssetStatus: (assetId: string, newStatus: AssetStatus, note?: string) => void;
  updateAssetCondition: (assetId: string, condition: CardCondition) => void;
  verifyAsset: (assetId: string) => void; // 인증 처리
  updateAssetLocation: (assetId: string, location: string) => void;
  removeAsset: (assetId: string) => void;

  // Asset 액션 (대량 처리)
  bulkUpdateAssets: (
    assetIds: string[],
    updates: {
      status?: AssetStatus;
      condition?: CardCondition;
      location?: string;
      note?: string;
    }
  ) => void;
  bulkVerifyAssets: (assetIds: string[]) => void;

  // 쿼리 & 통계
  getAssetsByBinderId: (binderId: string) => VaultAsset[];
  getAssetsByStatus: (status: AssetStatus) => VaultAsset[];
  getTotalPortfolioValue: () => number;
  getBinderStats: (binderId: string) => {
    totalCards: number;
    verifiedCount: number;
    totalValue: number;
    byStatus: Record<AssetStatus, number>;
    byCondition: Record<CardCondition, number>;
  };
}
