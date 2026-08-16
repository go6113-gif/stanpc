import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  VaultState,
  Binder,
  VaultAsset,
  AssetStatus,
  CardCondition,
  BinderVisibility,
  AssetHistoryEntry,
} from "./vault-types";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createHistoryEntry = (
  action: AssetHistoryEntry["action"],
  newStatus?: AssetStatus,
  previousStatus?: AssetStatus,
  note?: string
): AssetHistoryEntry => ({
  id: generateId(),
  date: Date.now(),
  action,
  newStatus,
  previousStatus,
  note,
});

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      binders: [],
      assets: [],

      // ==================== Binder Actions ====================

      createBinder: (title: string, userId: string) => {
        const binderId = generateId();
        const newBinder: Binder = {
          id: binderId,
          userId,
          title,
          visibility: "PRIVATE",
          assetCount: 0,
          totalEstimatedValue: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          binders: [...state.binders, newBinder],
        }));

        return binderId;
      },

      updateBinderVisibility: (binderId: string, visibility: BinderVisibility) => {
        set((state) => ({
          binders: state.binders.map((b) =>
            b.id === binderId
              ? { ...b, visibility, updatedAt: Date.now() }
              : b
          ),
        }));
      },

      updateBinderMetadata: (binderId: string, title?: string, description?: string) => {
        set((state) => ({
          binders: state.binders.map((b) =>
            b.id === binderId
              ? {
                  ...b,
                  ...(title && { title }),
                  ...(description && { description }),
                  updatedAt: Date.now(),
                }
              : b
          ),
        }));
      },

      deleteBinder: (binderId: string) => {
        set((state) => ({
          binders: state.binders.filter((b) => b.id !== binderId),
          assets: state.assets.filter((a) => a.binderId !== binderId),
        }));
      },

      // ==================== Asset Actions (단건) ====================

      addAsset: (
        binderId: string,
        masterCardId: string,
        status: AssetStatus,
        condition: CardCondition,
        quantity: number,
        purchasePrice?: number
      ) => {
        const assetId = generateId();
        const now = Date.now();

        const newAsset: VaultAsset = {
          id: assetId,
          binderId,
          masterCardId,
          status,
          condition,
          quantity,
          purchasePrice: purchasePrice || null,
          estimatedValue: 0, // 실제로는 masterCardId와 연결해 글로벌 시세에서 계산
          isVerified: false,
          physicalLocation: "",
          createdAt: now,
          updatedAt: now,
          history: [
            createHistoryEntry("ACQUIRED", status, undefined, `Added ${quantity} card(s)`)
          ],
        };

        set((state) => {
          const newAssets = [...state.assets, newAsset];
          // 바인더 통계 업데이트
          const binderAssets = newAssets.filter((a) => a.binderId === binderId);
          const totalValue = binderAssets.reduce((sum, a) => sum + a.estimatedValue, 0);

          return {
            assets: newAssets,
            binders: state.binders.map((b) =>
              b.id === binderId
                ? {
                    ...b,
                    assetCount: binderAssets.length,
                    totalEstimatedValue: totalValue,
                    updatedAt: now,
                  }
                : b
            ),
          };
        });

        return assetId;
      },

      updateAssetStatus: (assetId: string, newStatus: AssetStatus, note?: string) => {
        set((state) => {
          const asset = state.assets.find((a) => a.id === assetId);
          if (!asset) return state;

          const updatedAssets = state.assets.map((a) =>
            a.id === assetId
              ? {
                  ...a,
                  status: newStatus,
                  updatedAt: Date.now(),
                  history: [
                    ...a.history,
                    createHistoryEntry("STATUS_CHANGED", newStatus, asset.status, note),
                  ],
                }
              : a
          );

          return { assets: updatedAssets };
        });
      },

      updateAssetCondition: (assetId: string, condition: CardCondition) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === assetId
              ? {
                  ...a,
                  condition,
                  updatedAt: Date.now(),
                  history: [
                    ...a.history,
                    createHistoryEntry(
                      "STATUS_CHANGED",
                      undefined,
                      undefined,
                      `Condition changed to ${condition}`
                    ),
                  ],
                }
              : a
          ),
        }));
      },

      verifyAsset: (assetId: string) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === assetId
              ? {
                  ...a,
                  isVerified: true,
                  updatedAt: Date.now(),
                  history: [
                    ...a.history,
                    createHistoryEntry("VERIFIED", undefined, undefined, "Asset verified"),
                  ],
                }
              : a
          ),
        }));
      },

      updateAssetLocation: (assetId: string, location: string) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === assetId
              ? {
                  ...a,
                  physicalLocation: location,
                  updatedAt: Date.now(),
                  history: [
                    ...a.history,
                    createHistoryEntry(
                      "LOCATION_UPDATED",
                      undefined,
                      undefined,
                      `Location: ${location}`
                    ),
                  ],
                }
              : a
          ),
        }));
      },

      removeAsset: (assetId: string) => {
        set((state) => {
          const asset = state.assets.find((a) => a.id === assetId);
          if (!asset) return state;

          const newAssets = state.assets.filter((a) => a.id !== assetId);
          // 바인더 통계 업데이트
          const binderAssets = newAssets.filter((a) => a.binderId === asset.binderId);
          const totalValue = binderAssets.reduce((sum, a) => sum + a.estimatedValue, 0);

          return {
            assets: newAssets,
            binders: state.binders.map((b) =>
              b.id === asset.binderId
                ? {
                    ...b,
                    assetCount: binderAssets.length,
                    totalEstimatedValue: totalValue,
                    updatedAt: Date.now(),
                  }
                : b
            ),
          };
        });
      },

      // ==================== Asset Actions (대량 처리) ====================

      bulkUpdateAssets: (
        assetIds: string[],
        updates: {
          status?: AssetStatus;
          condition?: CardCondition;
          location?: string;
          note?: string;
        }
      ) => {
        set((state) => {
          const now = Date.now();
          const updatedAssets = state.assets.map((asset) => {
            if (!assetIds.includes(asset.id)) return asset;

            const newHistory = [...asset.history];

            if (updates.status && updates.status !== asset.status) {
              newHistory.push(
                createHistoryEntry(
                  "STATUS_CHANGED",
                  updates.status,
                  asset.status,
                  updates.note
                )
              );
            }

            if (updates.condition && updates.condition !== asset.condition) {
              newHistory.push(
                createHistoryEntry(
                  "STATUS_CHANGED",
                  undefined,
                  undefined,
                  `Condition: ${updates.condition}`
                )
              );
            }

            if (updates.location && updates.location !== asset.physicalLocation) {
              newHistory.push(
                createHistoryEntry(
                  "LOCATION_UPDATED",
                  undefined,
                  undefined,
                  `Location: ${updates.location}`
                )
              );
            }

            return {
              ...asset,
              ...(updates.status && { status: updates.status }),
              ...(updates.condition && { condition: updates.condition }),
              ...(updates.location && { physicalLocation: updates.location }),
              updatedAt: now,
              history: newHistory,
            };
          });

          return { assets: updatedAssets };
        });
      },

      bulkVerifyAssets: (assetIds: string[]) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            assetIds.includes(a.id)
              ? {
                  ...a,
                  isVerified: true,
                  updatedAt: Date.now(),
                  history: [
                    ...a.history,
                    createHistoryEntry("VERIFIED", undefined, undefined, "Bulk verified"),
                  ],
                }
              : a
          ),
        }));
      },

      // ==================== Query & Stats ====================

      getAssetsByBinderId: (binderId: string) => {
        return get().assets.filter((a) => a.binderId === binderId);
      },

      getAssetsByStatus: (status: AssetStatus) => {
        return get().assets.filter((a) => a.status === status);
      },

      getTotalPortfolioValue: () => {
        return get().assets.reduce((sum, a) => sum + a.estimatedValue, 0);
      },

      getBinderStats: (binderId: string) => {
        const assets = get().assets.filter((a) => a.binderId === binderId);

        const byStatus = {
          VAULTED: 0,
          DUPLICATE: 0,
          WTT: 0,
          WTS: 0,
          WTB: 0,
          INCOMING: 0,
        } as Record<AssetStatus, number>;

        const byCondition = {
          MINT: 0,
          NM: 0,
          LP: 0,
          POOR: 0,
        } as Record<CardCondition, number>;

        let totalValue = 0;
        let verifiedCount = 0;

        assets.forEach((a) => {
          byStatus[a.status]++;
          byCondition[a.condition]++;
          totalValue += a.estimatedValue;
          if (a.isVerified) verifiedCount++;
        });

        return {
          totalCards: assets.length,
          verifiedCount,
          totalValue,
          byStatus,
          byCondition,
        };
      },
    }),
    {
      name: "stanpc-vault-store",
      storage: createJSONStorage(
        () => typeof window !== "undefined" ? window.localStorage : ({
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        } as any)
      ),
      skipHydration: true,
    }
  )
);
