import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SavedView {
  id: string;
  name: string;
  groups: string[];
  members: string[];
  statuses: string[];
  tags: string[];
  createdAt: number;
}

interface VaultFilterState {
  groups: string[];
  members: string[];
  statuses: string[];
  tags: string[];
  searchQuery: string;
  sortBy: 'recent' | 'price-high' | 'price-low';
  savedViews: SavedView[];
  activeViewId: string | null;

  setGroups: (groups: string[]) => void;
  setMembers: (members: string[]) => void;
  setStatuses: (statuses: string[]) => void;
  setTags: (tags: string[]) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'recent' | 'price-high' | 'price-low') => void;
  saveCurrentView: (name: string) => void;
  loadView: (viewId: string) => void;
  deleteView: (viewId: string) => void;
  renameView: (viewId: string, newName: string) => void;
  getSavedView: (viewId: string) => SavedView | undefined;
  resetFilters: () => void;
  resetToDefaultView: () => void;
  getCurrentFilterState: () => Omit<SavedView, 'id' | 'name' | 'createdAt'>;
}

export const useVaultFilterStore = create<VaultFilterState>()(
  persist(
    (set, get) => ({
      groups: [],
      members: [],
      statuses: [],
      tags: [],
      searchQuery: '',
      sortBy: 'recent',
      activeViewId: 'view-all',
      savedViews: [
        {
          id: 'view-wtt',
          name: '🔵🔴 교환용 (WTT)',
          groups: [],
          members: [],
          statuses: ['wtt'],
          tags: [],
          createdAt: Date.now(),
        },
        {
          id: 'view-wts',
          name: '💰 판매용 (WTS)',
          groups: [],
          members: [],
          statuses: ['wts'],
          tags: [],
          createdAt: Date.now(),
        },
        {
          id: 'view-all',
          name: '전체',
          groups: [],
          members: [],
          statuses: [],
          tags: [],
          createdAt: Date.now(),
        },
      ],

      setGroups: (groups) => set({ groups }),
      setMembers: (members) => set({ members }),
      setStatuses: (statuses) => set({ statuses }),
      setTags: (tags) => set({ tags }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSortBy: (sortBy) => set({ sortBy }),

      saveCurrentView: (name) => {
        const state = get();
        const newView: SavedView = {
          id: `view-${Date.now()}`,
          name,
          groups: state.groups,
          members: state.members,
          statuses: state.statuses,
          tags: state.tags,
          createdAt: Date.now(),
        };
        set({
          savedViews: [...state.savedViews, newView],
          activeViewId: newView.id,
        });
      },

      loadView: (viewId) => {
        const state = get();
        const view = state.savedViews.find((v) => v.id === viewId);
        if (view) {
          set({
            groups: view.groups,
            members: view.members,
            statuses: view.statuses,
            tags: view.tags,
            activeViewId: viewId,
          });
        }
      },

      deleteView: (viewId) => {
        const state = get();
        const updatedViews = state.savedViews.filter((v) => v.id !== viewId);
        const newActiveViewId = state.activeViewId === viewId ? 'view-all' : state.activeViewId;
        set({
          savedViews: updatedViews,
          activeViewId: newActiveViewId,
        });
      },

      renameView: (viewId, newName) => {
        const state = get();
        const updatedViews = state.savedViews.map((v) =>
          v.id === viewId ? { ...v, name: newName } : v
        );
        set({ savedViews: updatedViews });
      },

      getSavedView: (viewId) => {
        return get().savedViews.find((v) => v.id === viewId);
      },

      resetFilters: () => {
        set({
          groups: [],
          members: [],
          statuses: [],
          tags: [],
          searchQuery: '',
          sortBy: 'recent',
          activeViewId: null,
        });
      },

      resetToDefaultView: () => {
        get().loadView('view-all');
      },

      getCurrentFilterState: () => {
        const state = get();
        return {
          groups: state.groups,
          members: state.members,
          statuses: state.statuses,
          tags: state.tags,
        };
      },
    }),
    {
      name: 'vault-filter-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        savedViews: state.savedViews,
      }),
    }
  )
);
