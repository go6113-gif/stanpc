/**
 * My Vault 2.0 Mock 데이터
 * 개발 및 테스트 단계의 초기 데이터 (localStorage persist)
 */

import { Binder, VaultAsset } from "./vault-types";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Mock: 바인더 데이터
export const MOCK_BINDERS: Binder[] = [
  {
    id: generateId(),
    userId: "user-001",
    title: "뉴진스 올컬렉",
    description: "뉴진스 멤버별 풀컬렉션",
    visibility: "PUBLIC",
    theme: "#FF1493",
    assetCount: 8,
    totalEstimatedValue: 450,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30일 전
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    userId: "user-001",
    title: "aespa 매직 박스 시리즈",
    description: "매직박스 한정판 컬렉션",
    visibility: "LINK_ONLY",
    theme: "#9370DB",
    assetCount: 12,
    totalEstimatedValue: 380,
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15일 전
    updatedAt: Date.now(),
  },
  {
    id: generateId(),
    userId: "user-001",
    title: "개인 보관 창고",
    description: "거래 대기 카드 및 중복본",
    visibility: "PRIVATE",
    theme: "#708090",
    assetCount: 24,
    totalEstimatedValue: 280,
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5일 전
    updatedAt: Date.now(),
  },
];

// Mock: 자산 데이터 (바인더에 분배)
export const generateMockAssets = (binderIds: string[]): VaultAsset[] => {
  const now = Date.now();
  const assets: VaultAsset[] = [];

  // Binder 1: 뉴진스 (8개)
  const newjeans = [
    {
      id: generateId(),
      binderId: binderIds[0],
      masterCardId: "newjeans-hanni-001",
      status: "VAULTED" as const,
      condition: "MINT" as const,
      quantity: 1,
      purchasePrice: 25000,
      estimatedValue: 35000,
      isVerified: true,
      physicalLocation: "#탑로더_A박스",
      createdAt: now - 20 * 24 * 60 * 60 * 1000,
      updatedAt: now,
      history: [
        {
          id: generateId(),
          date: now - 20 * 24 * 60 * 60 * 1000,
          action: "ACQUIRED" as const,
          newStatus: "VAULTED" as const,
          note: "Purchased from eBay",
        },
        {
          id: generateId(),
          date: now - 10 * 24 * 60 * 60 * 1000,
          action: "VERIFIED" as const,
          note: "Light reflection verified",
        },
      ],
    },
    {
      id: generateId(),
      binderId: binderIds[0],
      masterCardId: "newjeans-hanni-002",
      status: "WTT" as const,
      condition: "NM" as const,
      quantity: 1,
      purchasePrice: 20000,
      estimatedValue: 28000,
      isVerified: false,
      physicalLocation: "#슬리브_B박스",
      createdAt: now - 15 * 24 * 60 * 60 * 1000,
      updatedAt: now,
      history: [
        {
          id: generateId(),
          date: now - 15 * 24 * 60 * 60 * 1000,
          action: "ACQUIRED" as const,
          newStatus: "WTT" as const,
          note: "Looking for duplicates",
        },
      ],
    },
    {
      id: generateId(),
      binderId: binderIds[0],
      masterCardId: "newjeans-dani-pob",
      status: "VAULTED" as const,
      condition: "MINT" as const,
      quantity: 1,
      purchasePrice: 45000,
      estimatedValue: 65000,
      isVerified: true,
      physicalLocation: "#탑로더_A박스",
      createdAt: now - 8 * 24 * 60 * 60 * 1000,
      updatedAt: now,
      history: [
        {
          id: generateId(),
          date: now - 8 * 24 * 60 * 60 * 1000,
          action: "ACQUIRED" as const,
          newStatus: "VAULTED" as const,
          note: "Pre-order Photobook POB",
        },
      ],
    },
  ];

  // Binder 2: aespa (5개)
  const aespa = [
    {
      id: generateId(),
      binderId: binderIds[1],
      masterCardId: "aespa-karina-mb",
      status: "VAULTED" as const,
      condition: "MINT" as const,
      quantity: 2,
      purchasePrice: 15000,
      estimatedValue: 42000,
      isVerified: true,
      physicalLocation: "#매직박스_01",
      createdAt: now - 10 * 24 * 60 * 60 * 1000,
      updatedAt: now,
      history: [
        {
          id: generateId(),
          date: now - 10 * 24 * 60 * 60 * 1000,
          action: "ACQUIRED" as const,
          newStatus: "VAULTED" as const,
          note: "Magic Box full set",
        },
      ],
    },
    {
      id: generateId(),
      binderId: binderIds[1],
      masterCardId: "aespa-winter-sd",
      status: "WTS" as const,
      condition: "LP" as const,
      quantity: 1,
      purchasePrice: 12000,
      estimatedValue: 18000,
      isVerified: false,
      physicalLocation: "#판매대기_03",
      createdAt: now - 12 * 24 * 60 * 60 * 1000,
      updatedAt: now,
      history: [
        {
          id: generateId(),
          date: now - 12 * 24 * 60 * 60 * 1000,
          action: "ACQUIRED" as const,
          newStatus: "WTS" as const,
        },
        {
          id: generateId(),
          date: now - 2 * 24 * 60 * 60 * 1000,
          action: "STATUS_CHANGED" as const,
          newStatus: "WTS" as const,
          note: "Listed for sale",
        },
      ],
    },
  ];

  // Binder 3: 보관 창고 (일부)
  const storage = [
    {
      id: generateId(),
      binderId: binderIds[2],
      masterCardId: "random-001",
      status: "DUPLICATE" as const,
      condition: "LP" as const,
      quantity: 3,
      purchasePrice: 5000,
      estimatedValue: 12000,
      isVerified: false,
      physicalLocation: "#박스_정리중",
      createdAt: now - 30 * 24 * 60 * 60 * 1000,
      updatedAt: now,
      history: [
        {
          id: generateId(),
          date: now - 30 * 24 * 60 * 60 * 1000,
          action: "ACQUIRED" as const,
          newStatus: "DUPLICATE" as const,
          note: "Bulk purchase",
        },
      ],
    },
    {
      id: generateId(),
      binderId: binderIds[2],
      masterCardId: "wishlist-001",
      status: "WTB" as const,
      condition: "MINT" as const,
      quantity: 1,
      purchasePrice: null,
      estimatedValue: 55000,
      isVerified: false,
      physicalLocation: "",
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
      updatedAt: now,
      history: [
        {
          id: generateId(),
          date: now - 3 * 24 * 60 * 60 * 1000,
          action: "ACQUIRED" as const,
          newStatus: "WTB" as const,
          note: "High-value wishlist item",
        },
      ],
    },
  ];

  return [...assets, ...newjeans, ...aespa, ...storage];
};

/**
 * Mock 데이터를 초기화 (첫 실행 시만)
 * localStorage에 저장되지 않은 경우에만 실행
 */
export function initializeMockVaultData(store: any) {
  const currentState = store.getState?.();

  // 기존 데이터가 있으면 초기화하지 않음
  if (currentState?.binders?.length > 0) {
    return;
  }

  const mockBinders = MOCK_BINDERS;
  const binderIds = mockBinders.map(b => b.id);
  const mockAssets = generateMockAssets(binderIds);

  // 직접 상태 업데이트 (Zustand에서는 setState 사용 불가, hydrate 후 별도 init 함수 필요)
  // 다른 방법: 처음 /vault 페이지 로드 시 조건부로 초기화
}
