import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface BinderCard {
  cardId: string;
  cardName: string;
  groupName: string;
  memberName?: string;
  imageUrl?: string | null;
  addedAt: number; // timestamp
}

export type QuickCollectionFilter = "wishlist" | "owned" | "wtt" | "wts" | null;

interface BinderState {
  ownedCards: BinderCard[];
  wishCards: BinderCard[];
  wttCards: BinderCard[];
  wtsCards: BinderCard[];

  // Actions for owned cards
  addOwnedCard: (card: Omit<BinderCard, "addedAt">) => void;
  removeOwnedCard: (cardId: string) => void;
  toggleOwnedCard: (card: Omit<BinderCard, "addedAt">) => void;
  clearOwnedCards: () => void;

  // Actions for wish cards
  addWishCard: (card: Omit<BinderCard, "addedAt">) => void;
  removeWishCard: (cardId: string) => void;
  toggleWishCard: (card: Omit<BinderCard, "addedAt">) => void;
  clearWishCards: () => void;

  // Actions for WTT (교환 가능) cards
  addWttCard: (card: Omit<BinderCard, "addedAt">) => void;
  removeWttCard: (cardId: string) => void;
  toggleWttCard: (card: Omit<BinderCard, "addedAt">) => void;
  clearWttCards: () => void;

  // Actions for WTS (판매 중) cards
  addWtsCard: (card: Omit<BinderCard, "addedAt">) => void;
  removeWtsCard: (cardId: string) => void;
  toggleWtsCard: (card: Omit<BinderCard, "addedAt">) => void;
  clearWtsCards: () => void;

  // Utility
  isCardOwned: (cardId: string) => boolean;
  isCardWished: (cardId: string) => boolean;
  isCardWtt: (cardId: string) => boolean;
  isCardWts: (cardId: string) => boolean;
  getOwnedCount: () => number;
  getWishedCount: () => number;
  getWttCount: () => number;
  getWtsCount: () => number;

  // Landing page quick-filter UI state — lives here (not persisted, see
  // `partialize` below) rather than a separate store, because
  // InstantMultiSearch's mega-dropdown selections need to reach the landing
  // grid without prop drilling through LandingFilterBar, and the grid
  // filters directly against this store's card arrays anyway.
  activeQuickFilter: QuickCollectionFilter;
  setActiveQuickFilter: (filter: QuickCollectionFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  resetQuickFilter: () => void;
}

export const useBinderStore = create<BinderState>()(
  persist(
    (set, get) => ({
      ownedCards: [],
      wishCards: [],
      wttCards: [],
      wtsCards: [],

      // Owned Cards
      addOwnedCard: (card) => {
        set((state) => {
          const exists = state.ownedCards.some((c) => c.cardId === card.cardId);
          if (exists) return state;

          return {
            ownedCards: [
              ...state.ownedCards,
              { ...card, addedAt: Date.now() },
            ],
          };
        });
      },

      removeOwnedCard: (cardId) => {
        set((state) => ({
          ownedCards: state.ownedCards.filter((c) => c.cardId !== cardId),
        }));
      },

      toggleOwnedCard: (card) => {
        const state = get();
        if (state.isCardOwned(card.cardId)) {
          state.removeOwnedCard(card.cardId);
        } else {
          state.addOwnedCard(card);
        }
      },

      clearOwnedCards: () => {
        set({ ownedCards: [] });
      },

      // Wish Cards
      addWishCard: (card) => {
        set((state) => {
          const exists = state.wishCards.some((c) => c.cardId === card.cardId);
          if (exists) return state;

          return {
            wishCards: [
              ...state.wishCards,
              { ...card, addedAt: Date.now() },
            ],
          };
        });
      },

      removeWishCard: (cardId) => {
        set((state) => ({
          wishCards: state.wishCards.filter((c) => c.cardId !== cardId),
        }));
      },

      toggleWishCard: (card) => {
        const state = get();
        if (state.isCardWished(card.cardId)) {
          state.removeWishCard(card.cardId);
        } else {
          state.addWishCard(card);
        }
      },

      clearWishCards: () => {
        set({ wishCards: [] });
      },

      // WTT Cards
      addWttCard: (card) => {
        set((state) => {
          const exists = state.wttCards.some((c) => c.cardId === card.cardId);
          if (exists) return state;

          return {
            wttCards: [
              ...state.wttCards,
              { ...card, addedAt: Date.now() },
            ],
          };
        });
      },

      removeWttCard: (cardId) => {
        set((state) => ({
          wttCards: state.wttCards.filter((c) => c.cardId !== cardId),
        }));
      },

      toggleWttCard: (card) => {
        const state = get();
        if (state.isCardWtt(card.cardId)) {
          state.removeWttCard(card.cardId);
        } else {
          state.addWttCard(card);
        }
      },

      clearWttCards: () => {
        set({ wttCards: [] });
      },

      // WTS Cards
      addWtsCard: (card) => {
        set((state) => {
          const exists = state.wtsCards.some((c) => c.cardId === card.cardId);
          if (exists) return state;

          return {
            wtsCards: [
              ...state.wtsCards,
              { ...card, addedAt: Date.now() },
            ],
          };
        });
      },

      removeWtsCard: (cardId) => {
        set((state) => ({
          wtsCards: state.wtsCards.filter((c) => c.cardId !== cardId),
        }));
      },

      toggleWtsCard: (card) => {
        const state = get();
        if (state.isCardWts(card.cardId)) {
          state.removeWtsCard(card.cardId);
        } else {
          state.addWtsCard(card);
        }
      },

      clearWtsCards: () => {
        set({ wtsCards: [] });
      },

      // Utility functions
      isCardOwned: (cardId) => {
        return get().ownedCards.some((c) => c.cardId === cardId);
      },

      isCardWished: (cardId) => {
        return get().wishCards.some((c) => c.cardId === cardId);
      },

      isCardWtt: (cardId) => {
        return get().wttCards.some((c) => c.cardId === cardId);
      },

      isCardWts: (cardId) => {
        return get().wtsCards.some((c) => c.cardId === cardId);
      },

      getOwnedCount: () => {
        return get().ownedCards.length;
      },

      getWishedCount: () => {
        return get().wishCards.length;
      },

      getWttCount: () => {
        return get().wttCards.length;
      },

      getWtsCount: () => {
        return get().wtsCards.length;
      },

      // Quick-filter UI state
      activeQuickFilter: null,
      setActiveQuickFilter: (filter) => {
        set((state) => ({
          activeQuickFilter: state.activeQuickFilter === filter ? null : filter,
        }));
      },
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),
      resetQuickFilter: () => set({ activeQuickFilter: null, searchQuery: "" }),
    }),
    {
      name: "stanpc-binder-store",
      storage: createJSONStorage(
        () => typeof window !== "undefined" ? window.localStorage : ({
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        } as any)
      ),
      skipHydration: true,
      // Only card collections persist — activeQuickFilter/searchQuery are
      // ephemeral UI state that should reset on reload, not stick around.
      partialize: (state) => ({
        ownedCards: state.ownedCards,
        wishCards: state.wishCards,
        wttCards: state.wttCards,
        wtsCards: state.wtsCards,
      }),
    }
  )
);
