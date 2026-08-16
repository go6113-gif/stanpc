import { create } from "zustand";

/**
 * 바인더 객체 타입
 */
export interface VaultBinder {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  totalValue: number;  // KRW
  completionPercentage: number;  // 0-100
  isPublic: boolean;
  coverImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vault Store 상태
 */
interface VaultState {
  binders: VaultBinder[];
  selectedBinderId: string | null;

  // 액션
  addBinder: (binder: VaultBinder) => void;
  removeBinder: (binderId: string) => void;
  updateBinder: (binderId: string, updates: Partial<VaultBinder>) => void;
  selectBinder: (binderId: string) => void;
  toggleBinderVisibility: (binderId: string) => void;
}

/**
 * Mock 바인더 데이터
 */
const MOCK_BINDERS: VaultBinder[] = [
  {
    id: "binder-001",
    name: "NewJeans 도감",
    description: "뉴진스 완전 수집",
    cardCount: 156,
    totalValue: 2_340_000,
    completionPercentage: 78,
    isPublic: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2026-08-16"),
  },
  {
    id: "binder-002",
    name: "에스파 컬렉션",
    description: "카리나 최애 바인더",
    cardCount: 124,
    totalValue: 1_860_000,
    completionPercentage: 62,
    isPublic: true,
    createdAt: new Date("2024-03-20"),
    updatedAt: new Date("2026-08-16"),
  },
  {
    id: "binder-003",
    name: "SEVENTEEN 보관",
    description: "서이추 개인 관리",
    cardCount: 89,
    totalValue: 1_335_000,
    completionPercentage: 45,
    isPublic: false,
    createdAt: new Date("2024-05-10"),
    updatedAt: new Date("2026-08-10"),
  },
  {
    id: "binder-004",
    name: "IVE 정보실",
    description: "정보 수집 및 분석",
    cardCount: 67,
    totalValue: 1_005_000,
    completionPercentage: 34,
    isPublic: false,
    createdAt: new Date("2024-06-25"),
    updatedAt: new Date("2026-08-12"),
  },
];

/**
 * Vault Store (멀티 바인더 관리)
 */
export const useVaultStore = create<VaultState>((set, get) => ({
  binders: MOCK_BINDERS,
  selectedBinderId: MOCK_BINDERS[0]?.id || null,

  addBinder: (binder) => {
    set((state) => ({
      binders: [...state.binders, binder],
    }));
  },

  removeBinder: (binderId) => {
    set((state) => ({
      binders: state.binders.filter((b) => b.id !== binderId),
      selectedBinderId:
        state.selectedBinderId === binderId
          ? state.binders[0]?.id || null
          : state.selectedBinderId,
    }));
  },

  updateBinder: (binderId, updates) => {
    set((state) => ({
      binders: state.binders.map((b) =>
        b.id === binderId ? { ...b, ...updates } : b
      ),
    }));
  },

  selectBinder: (binderId) => {
    set({ selectedBinderId: binderId });
  },

  toggleBinderVisibility: (binderId) => {
    set((state) => ({
      binders: state.binders.map((b) =>
        b.id === binderId ? { ...b, isPublic: !b.isPublic } : b
      ),
    }));
  },
}));
