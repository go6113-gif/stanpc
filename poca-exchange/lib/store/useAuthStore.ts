import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  tier: string;
  bias?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, nickname?: string) => void;
  signup: (email: string, nickname: string, bias?: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (email: string, nickname?: string) => {
        const mockUser: AuthUser = {
          id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          email,
          nickname: nickname || email.split("@")[0],
          tier: "basic",
        };
        set({ user: mockUser, isAuthenticated: true });
      },

      signup: (email: string, nickname: string, bias?: string) => {
        const mockUser: AuthUser = {
          id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          email,
          nickname,
          tier: "basic",
          bias,
        };
        set({ user: mockUser, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      hydrate: () => {
        // Zustand persist가 자동으로 처리함
        // 명시적 호출 불필요하나, SSR 호환성을 위해 함수 제공
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return window.localStorage;
        }
        // SSR 환경에서는 메모리 스토리지 사용
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      skipHydration: true,
    }
  )
);
