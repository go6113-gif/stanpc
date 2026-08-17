/**
 * API 응답 타입 정의 (FE/BE 공용 인터페이스)
 * Card Generator 및 My Vault 병렬 개발용
 */

// ============================================================================
// Card Generator 타입
// ============================================================================

export interface CardGeneratorUserData {
  user: {
    id: string;
    name: string;
    email: string | null;
    image: string | null;
    collectorIndex: number;
    mannerScore: number;
  };
  binderStats: {
    totalCards: number;
    completeSets: number;
    wishlistCount: number;
    rareCardCount: number;
  };
  recentCard?: {
    slug: string;
    cardName: string | null;
    groupName: string;
    memberName: string | null;
    imageUrl: string | null;
  };
  timestamp: string;
}

export interface CardEditorPreviewData {
  memberName: string;
  title: string;
  stats: Record<string, string | number>;
  hashtags: string[];
  qrCodeUrl?: string; // deeplink to user vault
  watermark?: string; // username@stanpc.com
}

// ============================================================================
// My Vault 타입
// ============================================================================

export interface VaultCardItem {
  id: string;
  cardId: string;
  cardSlug: string;
  cardName: string | null;
  groupName: string;
  memberName: string | null;
  albumTitle: string | null;
  imageUrl: string | null;
  thumbImagePath: string | null;

  // Binder 상태
  tags: string[]; // ["In Hand", "ISO", "#드볼중", "Trade Bait"]
  note: string | null;

  // 카드 규격 정보
  dimensions?: {
    width: number;  // mm
    height: number; // mm
  };
  compatibleSleeves: string[]; // ["Standard 56x87mm", "Premium 60x90mm"]

  // 마켓 정보
  estimatedPrice: number | null;
  ownedCount: number;
  wishedCount: number;

  // 타임스탬프
  addedAt: string;
  updatedAt: string;
}

export interface VaultStats {
  totalCards: number;
  inHandCount: number;
  wishlistCount: number;
  tradeCount: number;
  completeSetCount: number;
}

export interface VaultResponse {
  user: {
    id: string;
    name: string;
    image: string | null;
    collectorIndex: number;
  };
  stats: VaultStats;
  cards: VaultCardItem[];
  filters: {
    tags: string[]; // 사용자가 사용한 모든 태그
    groups: string[]; // 사용자의 포토카드 그룹 목록
  };
  timestamp: string;
}

// ============================================================================
// 규격 호환성 가이드 타입
// ============================================================================

export interface SleevSpecification {
  name: string;
  width: number;  // mm
  height: number; // mm
  typeKr: string; // "표준 슬리브", "프리미엄 슬리브", "매직 카드용" 등
  commonBrands: string[];
  notes?: string;
}

export interface CardDimensionGuide {
  width: number; // mm
  height: number; // mm
  thickness: number; // mm (optional)
  compatibleSleeves: SleevSpecification[];
}

export interface CompatibilityGuideResponse {
  guide: Record<string, CardDimensionGuide>; // indexed by card slug or dimension key
  sleeves: SleevSpecification[]; // 모든 가능한 슬리브 사양
  userPreferences?: {
    preferredSleeve: string; // 사용자 선호 슬리브
    isOptional: boolean; // 슬리브 추천 강제 여부
  };
}

// ============================================================================
// API 요청 파라미터 타입
// ============================================================================

export interface GetCardGeneratorUserDataQuery {
  userId?: string; // 미지정시 현재 로그인 사용자
}

export interface GetVaultQuery {
  userId?: string;
  sortBy?: 'recent' | 'popular' | 'price-high' | 'price-low';
  filterTags?: string[]; // 태그 필터
  filterGroups?: string[]; // 그룹 필터
}

// ============================================================================
// Wiki 포토카드 도감 타입 (Pokedex 형식)
// ============================================================================

export interface WikiCardOfficialData {
  releaseDate: string | null;      // 발매일 (YYYY-MM-DD)
  manufacturer: string | null;     // 제조사 (예: SM Entertainment)
  serialNumber: string | null;     // 일련번호
  totalPrintRun: number | null;    // 총 발행량
}

export type CardRarity = 'SSR' | 'UR' | 'Mythic' | 'Normal';

export interface WikiCard {
  id: string;
  slug: string;
  cardName: string | null;
  version: string | null;
  imageUrl: string | null;

  // 분류 정보
  artistGroup: string;              // 아티스트/그룹명 (예: SEVENTEEN)
  member: string | null;            // 멤버명
  albumEra: string | null;          // 앨범/활동기 (예: "God's Menu Era")
  cardType: string;                 // 포카 종류 (예: "Standard", "Hologram", "Emboss")

  // 수집 상태
  isOwned: boolean;                 // 내 바인더 보유 여부
  isVerified: boolean;              // AI/관리자 팩트 검증 여부

  // 팩트 데이터
  officialData: WikiCardOfficialData;

  // 팬덤 레벨 데이터
  bestLore: string | null;          // 팬덤 베스트 댓글/스토리

  // 마켓 정보
  estimatedPrice: number | null;
  viewCount: number;

  // 🆕 Discovery UX 필드
  rarity: CardRarity;               // 희귀도 등급
  vibeTags: string[];               // 비주얼 태그 (예: ['만두볼콕', '안경선배'])
  highestPrice: number | null;      // 역사적 최고가
  wishCount: number;                // 실시간 위시 카운트
  dominantColor: string;            // hex 코드 (배경 블러용, 예: '#FF69B4')
}

export interface WikiCardDetailResponse {
  card: WikiCard;
  relatedCards: WikiCard[];           // 같은 멤버/그룹의 다른 카드
  tradingUsers: Array<{               // 교환 중인 유저 (샘플)
    userId: string;
    userName: string;
    userImage: string | null;
    tradingStatus: string;
  }>;
}

// ============================================================================
// API 에러 타입
// ============================================================================

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}
