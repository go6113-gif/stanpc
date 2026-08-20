'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Check, Menu, X, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { VaultResponse, VaultCardItem } from '@/lib/api-types';
import { BulkActionBar } from '@/components/vault/BulkActionBar';
import { CreatableTagInput } from '@/components/vault/CreatableTagInput';
import { PhotoCardImage, Placeholder } from '@/components/PhotoCardImage';
import { useAssetSelectionStore } from '@/store/useAssetSelectionStore';
import { useBinderStore as useCollectionBinderStore } from '@/store/useBinderStore';

// ===== Types & Constants =====

type ViewTab = 'all' | 'owned' | 'trade' | 'wish';
type GridPocketSize = 1 | 4 | 9 | 16 | 25 | 36 | 'list';

interface SmartBinderRule {
  id: string;
  name: string;
  members: string[];
  groups: string[];
  categories: string[];
  status: string[];
  eras: string[];
  createdAt: Date;
}

interface SmartBinderTab {
  id: string;
  name: string;
  rule: SmartBinderRule;
  matchedCount: number;
}

interface VaultPageClientProps {
  initialUserName?: string;
  isDemoMode?: boolean;
}

// ===== Grid Configuration =====

const GRID_CONFIG: Record<
  GridPocketSize,
  { cols: string; maxWidth: string; showText: boolean; showBadges: boolean }
> = {
  1: {
    cols: 'grid-cols-1',
    maxWidth: 'max-w-sm',
    showText: true,
    showBadges: true,
  },
  4: {
    cols: 'grid-cols-2',
    maxWidth: 'max-w-2xl',
    showText: true,
    showBadges: true,
  },
  9: {
    cols: 'grid-cols-3',
    maxWidth: 'max-w-4xl',
    showText: true,
    showBadges: true,
  },
  16: {
    cols: 'grid-cols-4',
    maxWidth: 'max-w-5xl',
    showText: false,
    showBadges: true,
  },
  25: {
    cols: 'grid-cols-5',
    maxWidth: 'max-w-6xl',
    showText: false,
    showBadges: false,
  },
  36: {
    cols: 'grid-cols-6',
    maxWidth: 'max-w-7xl',
    showText: false,
    showBadges: false,
  },
  list: {
    cols: 'w-full',
    maxWidth: 'max-w-full',
    showText: true,
    showBadges: true,
  },
};

function getPocketCount(size: GridPocketSize): number {
  if (size === 'list') return 100;
  return size;
}

// ===== Rule Matching Engine =====

function matchCardToRule(card: VaultCardItem, rule: SmartBinderRule): boolean {
  // members 필터
  if (rule.members.length > 0 && card.memberName) {
    if (!rule.members.includes(card.memberName)) {
      return false;
    }
  }

  // groups 필터
  if (rule.groups.length > 0) {
    if (!rule.groups.includes(card.groupName)) {
      return false;
    }
  }

  // categories 필터 (tags 기반)
  if (rule.categories.length > 0) {
    const cardTags = card.tags || [];
    const hasMatchingCategory = rule.categories.some((cat) =>
      cardTags.some((tag) =>
        tag.toLowerCase().includes(cat.toLowerCase()) ||
        cat.toLowerCase().includes(tag.toLowerCase())
      )
    );
    if (!hasMatchingCategory) return false;
  }

  // status 필터 (Owned/Wish 기반)
  if (rule.status.length > 0) {
    const cardStatus: string[] = [];
    if (card.ownedCount && card.ownedCount > 0) cardStatus.push('owned');
    if (card.wishedCount && card.wishedCount > 0) cardStatus.push('wish');
    if (cardStatus.length === 0) cardStatus.push('other');

    const hasMatchingStatus = rule.status.some((status) =>
      cardStatus.includes(status.toLowerCase())
    );
    if (!hasMatchingStatus) return false;
  }

  // eras 필터 (albumTitle 기반)
  if (rule.eras.length > 0) {
    if (!card.albumTitle) return false;
    const hasMatchingEra = rule.eras.some((era) =>
      card.albumTitle!.toLowerCase().includes(era.toLowerCase())
    );
    if (!hasMatchingEra) return false;
  }

  return true;
}

// ===== Guest Onboarding Modal Component =====

interface GuestOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function GuestOnboardingModal({ isOpen, onClose }: GuestOnboardingModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-neutral-800 dark:to-neutral-800 p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              🎉 게스트 바인더에 오신 것을 환영합니다!
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">포카 수집 시작</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    갤러리에서 포카를 선택하고 "보유"에 추가해보세요.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-2xl">❤️</span>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">위시리스트 관리</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    갖고 싶은 포카를 "위시리스트"에 담으세요.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">스마트 바인더 생성</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    멤버, 그룹, 태그로 자동 분류하는 스마트 바인더를 만드세요.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                💡 <strong>팁:</strong> 모든 데이터는 브라우저 로컬스토리지에 저장됩니다. 로그인하면 클라우드에 백업되고 여러 기기에서 동기화됩니다.
              </p>
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800 p-6 border-t border-neutral-200 dark:border-neutral-700 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition font-semibold"
            >
              시작하기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ===== Smart Binder Modal Component =====

interface CreateSmartBinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rule: SmartBinderRule) => void;
  availableMembers: string[];
  availableGroups: string[];
  availableCategories: string[];
  availableEras: string[];
}

function CreateSmartBinderModal({
  isOpen,
  onClose,
  onSubmit,
  availableMembers,
  availableGroups,
  availableCategories,
  availableEras,
}: CreateSmartBinderModalProps) {
  const [binderName, setBinderName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedEras, setSelectedEras] = useState<string[]>([]);

  const handleToggle = (value: string, selected: string[], setSelected: (s: string[]) => void) => {
    setSelected(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    );
  };

  const handleSubmit = () => {
    if (!binderName.trim()) {
      alert('바인더 이름을 입력해주세요');
      return;
    }

    const rule: SmartBinderRule = {
      id: `smart-${Date.now()}`,
      name: binderName,
      members: selectedMembers,
      groups: selectedGroups,
      categories: selectedCategories,
      status: selectedStatus,
      eras: selectedEras,
      createdAt: new Date(),
    };

    onSubmit(rule);
    setBinderName('');
    setSelectedMembers([]);
    setSelectedGroups([]);
    setSelectedCategories([]);
    setSelectedStatus([]);
    setSelectedEras([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-neutral-800 dark:to-neutral-800 p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Sparkles className="text-pink-600" size={24} />
              스마트 바인더 만들기
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 바인더 이름 입력 */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                바인더 이름
              </label>
              <input
                type="text"
                value={binderName}
                onChange={(e) => setBinderName(e.target.value)}
                placeholder="예: 정국 & 뷔 미공포 모음"
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              />
            </div>

            {/* 멤버 선택 */}
            {availableMembers.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                  멤버
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableMembers.map((member) => (
                    <button
                      key={member}
                      onClick={() =>
                        handleToggle(member, selectedMembers, setSelectedMembers)
                      }
                      className={`px-4 py-2 rounded-full transition ${
                        selectedMembers.includes(member)
                          ? 'bg-pink-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300'
                      }`}
                    >
                      {member}
                      {selectedMembers.includes(member) && (
                        <Check size={16} className="inline ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 그룹 선택 */}
            {availableGroups.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                  그룹
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableGroups.map((group) => (
                    <button
                      key={group}
                      onClick={() =>
                        handleToggle(group, selectedGroups, setSelectedGroups)
                      }
                      className={`px-4 py-2 rounded-full transition ${
                        selectedGroups.includes(group)
                          ? 'bg-purple-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300'
                      }`}
                    >
                      {group}
                      {selectedGroups.includes(group) && (
                        <Check size={16} className="inline ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 커스텀 태그 입력 — Creatable Tag Input */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                커스텀 태그
                <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400 ml-2">
                  (자유롭게 입력하거나 기존 태그 선택)
                </span>
              </label>
              <CreatableTagInput
                tags={selectedCategories}
                onTagsChange={setSelectedCategories}
                availableTags={availableCategories}
                maxTags={10}
                placeholder="태그 입력 또는 생성... (예: #메이크스타, #갈망포카)"
              />
              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                포카를 분류하기 위한 커스텀 태그를 만들거나 선택할 수 있습니다.
              </p>
            </div>

            {/* 보유 상태 선택 */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                보유 상태
              </label>
              <div className="flex flex-wrap gap-2">
                {['owned', 'wish', 'trade'].map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      handleToggle(status, selectedStatus, setSelectedStatus)
                    }
                    className={`px-4 py-2 rounded-full transition ${
                      selectedStatus.includes(status)
                        ? 'bg-green-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300'
                    }`}
                  >
                    {status === 'owned'
                      ? '보유'
                      : status === 'wish'
                        ? '위시리스트'
                        : '교환용'}
                    {selectedStatus.includes(status) && (
                      <Check size={16} className="inline ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 앨범/활동기 선택 */}
            {availableEras.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                  앨범/활동기
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableEras.map((era) => (
                    <button
                      key={era}
                      onClick={() =>
                        handleToggle(era, selectedEras, setSelectedEras)
                      }
                      className={`px-4 py-2 rounded-full transition text-sm ${
                        selectedEras.includes(era)
                          ? 'bg-orange-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300'
                      }`}
                    >
                      {era}
                      {selectedEras.includes(era) && (
                        <Check size={16} className="inline ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-neutral-50 dark:bg-neutral-800 p-6 border-t border-neutral-200 dark:border-neutral-700 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-neutral-300 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-400 dark:hover:bg-neutral-600 transition"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <Sparkles size={18} />
              바인더 생성
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ===== Density Selector =====

interface DensitySelectorProps {
  currentSize: GridPocketSize;
  onChange: (size: GridPocketSize) => void;
}

function DensitySelector({ currentSize, onChange }: DensitySelectorProps) {
  const sizes: GridPocketSize[] = [1, 4, 9, 16, 25, 36, 'list'];
  const labels: Record<GridPocketSize, string> = {
    1: '1',
    4: '4',
    9: '9',
    16: '16',
    25: '25',
    36: '36',
    list: '목록',
  };

  return (
    <div className="flex items-center gap-2">
      <ZoomOut size={18} className="text-neutral-600 dark:text-neutral-400" />
      <div className="flex gap-1">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onChange(size)}
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              currentSize === size
                ? 'bg-pink-600 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-600'
            }`}
          >
            {labels[size]}
          </button>
        ))}
      </div>
      <ZoomIn size={18} className="text-neutral-600 dark:text-neutral-400" />
    </div>
  );
}

// ===== Main Component =====

interface SmartBinder {
  id: string;
  name: string;
  rule: SmartBinderRule;
  matchedCount: number;
}

export default function VaultPageClient({
  initialUserName = '바인더 수집가',
  isDemoMode = false,
}: VaultPageClientProps) {
  const [vaultData, setVaultData] = useState<VaultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'default' | string>('default');
  const [smartBinders, setSmartBinders] = useState<SmartBinder[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGuestOnboarding, setShowGuestOnboarding] = useState(false);
  const [gridPocketSize, setGridPocketSize] = useState<GridPocketSize>(9);

  const selectedCardIdsSet = useAssetSelectionStore((state) => state.selectedCardIds);
  const selectedCardIds = useMemo(() => Array.from(selectedCardIdsSet), [selectedCardIdsSet]);
  const toggleCardSelection = useAssetSelectionStore((state) => state.toggleCardSelection);
  const clearSelection = useAssetSelectionStore((state) => state.clearSelection);

  const ownedCards = useCollectionBinderStore((state) => state.ownedCards);
  const wishCards = useCollectionBinderStore((state) => state.wishCards);

  // Show guest onboarding on first visit
  useEffect(() => {
    if (isDemoMode && typeof window !== 'undefined') {
      const hasSeenGuestOnboarding = sessionStorage.getItem('guest_onboarding_shown');
      if (!hasSeenGuestOnboarding) {
        setShowGuestOnboarding(true);
        sessionStorage.setItem('guest_onboarding_shown', 'true');
      }
    }
  }, [isDemoMode]);

  // Fetch vault data
  useEffect(() => {
    const fetchVaultData = async () => {
      try {
        setLoading(true);

        // Demo mode: use fallback empty binder
        if (isDemoMode && ownedCards.length === 0 && wishCards.length === 0) {
          const mockData: VaultResponse = {
            user: {
              id: 'demo',
              name: initialUserName,
              image: null,
              collectorIndex: 0,
            },
            cards: [],
            stats: {
              totalCards: 0,
              inHandCount: 0,
              wishlistCount: 0,
              tradeCount: 0,
              completeSetCount: 0,
            },
            filters: { tags: [], groups: [] },
            timestamp: new Date().toISOString(),
          };
          setVaultData(mockData);
          setError(null);
          setLoading(false);
          return;
        }

        if (ownedCards.length > 0 || wishCards.length > 0) {
          const mockData: VaultResponse = {
            user: {
              id: 'guest',
              name: initialUserName,
              image: null,
              collectorIndex: 0,
            },
            cards: [
              ...ownedCards.map((card) => ({
                id: card.cardId,
                cardId: card.cardId,
                cardSlug: card.cardId,
                cardName: card.cardName,
                memberName: card.memberName || 'Unknown',
                groupName: card.groupName,
                albumTitle: null,
                imageUrl: card.imageUrl || null,
                thumbImagePath: null,
                tags: ['Owned'],
                note: null,
                estimatedPrice: null,
                ownedCount: 1,
                wishedCount: 0,
                addedAt: new Date(card.addedAt).toISOString(),
                updatedAt: new Date(card.addedAt).toISOString(),
                compatibleSleeves: [],
              })),
              ...wishCards.map((card) => ({
                id: card.cardId,
                cardId: card.cardId,
                cardSlug: card.cardId,
                cardName: card.cardName,
                memberName: card.memberName || 'Unknown',
                groupName: card.groupName,
                albumTitle: null,
                imageUrl: card.imageUrl || null,
                thumbImagePath: null,
                tags: ['Wish'],
                note: null,
                estimatedPrice: null,
                ownedCount: 0,
                wishedCount: 1,
                addedAt: new Date(card.addedAt).toISOString(),
                updatedAt: new Date(card.addedAt).toISOString(),
                compatibleSleeves: [],
              })),
            ],
            stats: {
              totalCards: ownedCards.length + wishCards.length,
              inHandCount: ownedCards.length,
              wishlistCount: wishCards.length,
              tradeCount: 0,
              completeSetCount: 0,
            },
            filters: { tags: [], groups: [] },
            timestamp: new Date().toISOString(),
          };
          setVaultData(mockData);
          setError(null);
          return;
        }

        if (isDemoMode) {
          // Demo mode: don't call API, just set empty state
          setVaultData(null);
          setError(null);
          return;
        }

        const res = await fetch('/api/vault/get-vault');
        if (!res.ok) throw new Error('Failed to fetch vault data');
        const data: VaultResponse = await res.json();
        setVaultData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching vault:', err);
        if (!isDemoMode) {
          setError('바인더를 불러올 수 없습니다');
        }
        setVaultData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVaultData();
  }, [ownedCards, wishCards, initialUserName]);

  // Extract available options from cards with fallback data
  const {
    availableMembers,
    availableGroups,
    availableCategories,
    availableEras,
  } = useMemo(() => {
    const members = new Set<string>();
    const groups = new Set<string>();
    const categories = new Set<string>();
    const eras = new Set<string>();

    if (vaultData && vaultData.cards.length > 0) {
      vaultData.cards.forEach((card) => {
        if (card.memberName) members.add(card.memberName);
        groups.add(card.groupName);
        if (card.tags) card.tags.forEach((tag) => categories.add(tag));
        if (card.albumTitle) eras.add(card.albumTitle);
      });
    }

    // Fallback demo data for UI testing
    if (members.size === 0) {
      ['정국', '뷔', '진', '지민', '슈가', '제이홉'].forEach((m) => members.add(m));
    }
    if (groups.size === 0) {
      ['BTS', 'aespa', 'SEVENTEEN', 'Stray Kids'].forEach((g) => groups.add(g));
    }
    if (categories.size === 0) {
      ['Owned', 'Wish', '미공포', '럭키드로우', '앨범포카', '사녹'].forEach((c) =>
        categories.add(c)
      );
    }
    if (eras.size === 0) {
      ['Map of the Soul', 'Butter', 'Dynamite', '정규 1집'].forEach((e) => eras.add(e));
    }

    return {
      availableMembers: Array.from(members).filter((m) => m).sort(),
      availableGroups: Array.from(groups).sort(),
      availableCategories: Array.from(categories).sort(),
      availableEras: Array.from(eras).sort(),
    };
  }, [vaultData]);

  // Filter cards based on active tab
  const filteredCards = useMemo(() => {
    if (!vaultData) return [];

    if (activeTab === 'default') {
      return vaultData.cards;
    }

    const binder = smartBinders.find((b) => b.id === activeTab);
    if (!binder) return [];

    return vaultData.cards.filter((card) => matchCardToRule(card, binder.rule));
  }, [vaultData, activeTab, smartBinders]);

  // Card display with grid pocket size
  const displayedCards = useMemo(() => {
    const pocketCount = getPocketCount(gridPocketSize);
    return filteredCards.slice(0, pocketCount);
  }, [filteredCards, gridPocketSize]);

  const handleCreateSmartBinder = useCallback(
    (rule: SmartBinderRule) => {
      const matchedCount = vaultData?.cards.filter((card) => matchCardToRule(card, rule))
          .length || 0;
      const newBinder: SmartBinder = {
        id: rule.id,
        name: rule.name,
        rule,
        matchedCount,
      };
      setSmartBinders((prev) => [...prev, newBinder]);
      setActiveTab(newBinder.id);
    },
    [vaultData]
  );

  const handleDeleteSmartBinder = useCallback((binderId: string) => {
    setSmartBinders((prev) => prev.filter((b) => b.id !== binderId));
    setActiveTab('default');
  }, []);

  const handleSelectAll = useCallback(() => {
    if (filteredCards.length > 0) {
      filteredCards.forEach((card) => {
        if (!selectedCardIds.includes(card.id)) {
          toggleCardSelection(card.id);
        }
      });
    }
  }, [filteredCards, selectedCardIds, toggleCardSelection]);

  const handleDeselectAll = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const gridConfig = GRID_CONFIG[gridPocketSize];
  const pocketCount = getPocketCount(gridPocketSize);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin">
              <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full" />
            </div>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400">Vault 로드 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isDemoMode) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* 헤더 */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-neutral-800 dark:to-neutral-800 rounded-lg p-4 sm:p-6 mb-8 shadow-sm">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600 mb-2">
            StanPC Vault : 나만의 디지털 바인더
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-neutral-700 dark:text-neutral-300">
            보유·위시·교환 카드를 체계적으로 아카이빙하고 관리하세요.
          </p>
        </div>

        {/* 통계 바 */}
        {vaultData && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
            {[
              { label: '전체', value: vaultData.stats.totalCards },
              { label: '보유', value: vaultData.stats.inHandCount },
              { label: '원함', value: vaultData.stats.wishlistCount },
              { label: '거래용', value: vaultData.stats.tradeCount },
              { label: '완성', value: vaultData.stats.completeSetCount },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-neutral-800 rounded-lg p-4 text-center border border-neutral-200 dark:border-neutral-700"
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* 스마트 바인더 탭 */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {/* 기본 탭 */}
            <button
              onClick={() => setActiveTab('default')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                activeTab === 'default'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300'
              }`}
            >
              전체 포카
            </button>

            {/* 생성된 스마트 바인더 탭 */}
            {smartBinders.map((binder) => (
              <button
                key={binder.id}
                onClick={() => setActiveTab(binder.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === binder.id
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300'
                }`}
              >
                <Sparkles size={14} />
                {binder.name}
                <span className="text-xs ml-1">({binder.matchedCount})</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSmartBinder(binder.id);
                  }}
                  className="ml-1 hover:opacity-70"
                >
                  <X size={14} />
                </button>
              </button>
            ))}

            {/* + 스마트 바인더 만들기 버튼 */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-full whitespace-nowrap bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition flex items-center gap-2"
            >
              <Plus size={16} />
              스마트 바인더
            </button>
          </div>
        </div>

        {/* 액션 바 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="text-lg font-bold text-white w-full sm:w-auto text-center sm:text-left">
            {filteredCards.length}개 포카
            {selectMode && selectedCardIds.length > 0 && (
              <span className="ml-2 text-white font-bold">
                ({selectedCardIds.length}개 선택)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end flex-wrap">
            <DensitySelector currentSize={gridPocketSize} onChange={setGridPocketSize} />

            {/* 전체 선택/해제 버튼 (선택 모드 시에만) */}
            {selectMode && filteredCards.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                  title={`${filteredCards.length}개 모두 선택`}
                >
                  ☑️ 전체 선택 ({filteredCards.length})
                </button>
                {selectedCardIds.length > 0 && (
                  <button
                    onClick={handleDeselectAll}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title="선택 해제"
                  >
                    해제
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setSelectMode(!selectMode);
                if (selectMode) clearSelection();
              }}
              className={`px-4 py-2 rounded-lg transition ${
                selectMode
                  ? 'bg-pink-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300'
              }`}
            >
              ✏️ {selectMode ? '종료' : '선택 모드'}
            </button>
          </div>
        </div>

        {/* 그리드 뷰 */}
        {gridPocketSize !== 'list' ? (
          <div
            className={`gap-2 mb-8 mx-auto ${gridConfig.maxWidth} ${
              gridConfig.cols === 'w-full' ? 'w-full' : `grid ${gridConfig.cols}`
            }`}
          >
            {Array.from({ length: pocketCount }).map((_, idx) => {
              const card = displayedCards[idx];
              const isCompact = gridPocketSize === 25 || gridPocketSize === 36;

              return (
                <motion.div
                  key={`slot-${idx}`}
                  className={`relative aspect-square rounded overflow-hidden border-2 transition cursor-pointer ${
                    card && selectMode && selectedCardIds.includes(card.id)
                      ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20'
                      : card
                        ? 'border-neutral-300 dark:border-neutral-600 hover:border-pink-400'
                        : 'border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800'
                  }`}
                  onClick={() => {
                    if (card && selectMode) {
                      toggleCardSelection(card.id);
                    }
                  }}
                  whileHover={card && selectMode ? { scale: 1.05 } : {}}
                  whileTap={card && selectMode ? { scale: 0.95 } : {}}
                >
                  {card ? (
                    <>
                      <PhotoCardImage
                        src={card.imageUrl}
                        thumbSrc={card.thumbImagePath}
                        alt={card.cardName || 'card'}
                        memberName={card.memberName}
                        albumTitle={card.albumTitle}
                        fill={true}
                        className="object-cover"
                      />
                      {!isCompact && gridConfig.showText && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2 opacity-0 hover:opacity-100 transition">
                          <p className="text-white text-xs font-semibold truncate">
                            {card.memberName}
                          </p>
                          <p className="text-white/80 text-xs truncate">{card.groupName}</p>
                        </div>
                      )}
                      {selectMode && selectedCardIds.includes(card.id) && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Check size={isCompact ? 20 : 32} className="text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Plus
                          size={isCompact ? 16 : 32}
                          className="text-neutral-400 mx-auto mb-1"
                        />
                        {!isCompact && (
                          <p className="text-xs text-neutral-500">포카 꽂기</p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          // List View
          <div className="mb-8 space-y-2">
            {displayedCards.map((card) => (
              <motion.div
                key={card.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition cursor-pointer ${
                  selectMode && selectedCardIds.includes(card.id)
                    ? 'border-pink-600 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-pink-400'
                }`}
                onClick={() => {
                  if (selectMode) {
                    toggleCardSelection(card.id);
                  }
                }}
              >
                <div className="relative w-16 h-20 flex-shrink-0 rounded overflow-hidden">
                  <PhotoCardImage
                    src={card.imageUrl}
                    thumbSrc={card.thumbImagePath}
                    alt={card.cardName || 'card'}
                    memberName={card.memberName}
                    albumTitle={card.albumTitle}
                    fill={true}
                    className="object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">
                    {card.memberName}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                    {card.groupName}
                  </p>
                  {card.albumTitle && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 truncate">
                      {card.albumTitle}
                    </p>
                  )}
                </div>
                {selectMode && selectedCardIds.includes(card.id) && (
                  <Check size={24} className="text-pink-600 flex-shrink-0" />
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* BulkActionBar */}
        {selectMode && selectedCardIds.length > 0 && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 shadow-lg z-40"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              {/* 선택 정보 (좌측) */}
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {selectedCardIds.length}개 카드 선택됨
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {filteredCards.length}개 중 {Math.round((selectedCardIds.length / filteredCards.length) * 100)}%
                  </p>
                </div>
                <button
                  onClick={handleDeselectAll}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                >
                  ✕ 선택 취소
                </button>
              </div>

              {/* 액션 바 (중앙~우측) */}
              <BulkActionBar
                selectedCount={selectedCardIds.length}
                selectedCards={displayedCards
                  .filter((card) => selectedCardIds.includes(card.id))
                  .map((card) => ({
                    memberName: card.memberName || 'Unknown',
                    groupName: card.groupName,
                  }))}
                cardImages={displayedCards
                  .filter((card) => selectedCardIds.includes(card.id))
                  .map((card) => card.imageUrl || '')}
                vaultUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/vault`}
                userNickname={vaultData?.user.name || initialUserName}
                userReferralCode="STANPC-REF"
                collectionCompletion={100}
                onClose={() => {
                  setSelectMode(false);
                  clearSelection();
                }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* 게스트 온보딩 모달 */}
      <GuestOnboardingModal
        isOpen={showGuestOnboarding}
        onClose={() => setShowGuestOnboarding(false)}
      />

      {/* 스마트 바인더 생성 모달 */}
      <CreateSmartBinderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSmartBinder}
        availableMembers={availableMembers}
        availableGroups={availableGroups}
        availableCategories={availableCategories}
        availableEras={availableEras}
      />
    </div>
  );
}
