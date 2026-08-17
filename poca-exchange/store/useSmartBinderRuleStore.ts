import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SmartBinderRule {
  id: string;
  name: string;
  systemFilters: Record<string, string[]>;
  customTagFilters: string[];
  displayMode: string;
  createdAt: Date;
}

interface SmartBinderRuleStore {
  rules: SmartBinderRule[];
  activeRuleId: string | null;

  // Actions
  addRule: (rule: Omit<SmartBinderRule, 'id' | 'createdAt'>) => void;
  updateRule: (id: string, rule: Partial<SmartBinderRule>) => void;
  deleteRule: (id: string) => void;
  setActiveRule: (id: string | null) => void;
  getActiveRule: () => SmartBinderRule | null;
}

export const useSmartBinderRuleStore = create<SmartBinderRuleStore>()(
  persist(
    (set, get) => ({
      rules: [],
      activeRuleId: null,

      addRule: (rule) => {
        const newRule: SmartBinderRule = {
          ...rule,
          id: `rule_${Date.now()}`,
          createdAt: new Date(),
        };
        set((state) => ({
          rules: [...state.rules, newRule],
          activeRuleId: newRule.id,
        }));
      },

      updateRule: (id, updates) => {
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === id ? { ...rule, ...updates } : rule
          ),
        }));
      },

      deleteRule: (id) => {
        set((state) => ({
          rules: state.rules.filter((rule) => rule.id !== id),
          activeRuleId: state.activeRuleId === id ? null : state.activeRuleId,
        }));
      },

      setActiveRule: (id) => {
        set({ activeRuleId: id });
      },

      getActiveRule: () => {
        const state = get();
        if (!state.activeRuleId) return null;
        return state.rules.find((rule) => rule.id === state.activeRuleId) || null;
      },
    }),
    {
      name: 'smart-binder-rules',
    }
  )
);
