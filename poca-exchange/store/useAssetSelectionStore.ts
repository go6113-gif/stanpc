import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AssetStatus } from "@/lib/types/asset";

interface AssetSelectionState {
  selectedCardIds: Set<string>;
  isSelectMode: boolean;

  // Actions
  toggleCardSelection: (cardId: string) => void;
  selectMultiple: (cardIds: string[]) => void;
  clearSelection: () => void;
  isCardSelected: (cardId: string) => boolean;
  getSelectedCount: () => number;
  toggleSelectMode: () => void;
}

export const useAssetSelectionStore = create<AssetSelectionState>()(
  devtools(
    (set, get) => ({
      selectedCardIds: new Set(),
      isSelectMode: false,

      toggleCardSelection: (cardId: string) => {
        set((state) => {
          const newSelected = new Set(state.selectedCardIds);
          if (newSelected.has(cardId)) {
            newSelected.delete(cardId);
          } else {
            newSelected.add(cardId);
          }
          return {
            selectedCardIds: newSelected,
            isSelectMode: newSelected.size > 0,
          };
        });
      },

      selectMultiple: (cardIds: string[]) => {
        set((state) => ({
          selectedCardIds: new Set([...state.selectedCardIds, ...cardIds]),
          isSelectMode: true,
        }));
      },

      clearSelection: () => {
        set({
          selectedCardIds: new Set(),
          isSelectMode: false,
        });
      },

      isCardSelected: (cardId: string) => {
        return get().selectedCardIds.has(cardId);
      },

      getSelectedCount: () => {
        return get().selectedCardIds.size;
      },

      toggleSelectMode: () => {
        set((state) => ({
          isSelectMode: !state.isSelectMode,
          selectedCardIds: !state.isSelectMode ? state.selectedCardIds : new Set(),
        }));
      },
    }),
    { name: "AssetSelectionStore" }
  )
);
