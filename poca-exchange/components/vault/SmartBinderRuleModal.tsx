'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { CreatableTagSelect } from './CreatableTagSelect';

interface SmartBinderRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: {
    name: string;
    systemFilters: Record<string, string[]>;
    customTagFilters: string[];
    displayMode: string;
  }) => void;
  groups?: Array<{ slug: string; nameKr: string; nameEn: string }>;
  members?: Array<{ slug: string; nameKr: string; nameEn: string }>;
}

export function SmartBinderRuleModal({
  isOpen,
  onClose,
  onSave,
  groups = [],
  members = [],
}: SmartBinderRuleModalProps) {
  const [ruleName, setRuleName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState('GRID');

  const handleSave = () => {
    if (!ruleName.trim()) {
      alert('규칙 이름을 입력하세요');
      return;
    }

    onSave({
      name: ruleName,
      systemFilters: {
        groups: selectedGroups,
        members: selectedMembers,
      },
      customTagFilters: customTags,
      displayMode,
    });

    // Reset form
    setRuleName('');
    setSelectedGroups([]);
    setSelectedMembers([]);
    setCustomTags([]);
    setDisplayMode('GRID');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-neutral-700 dark:to-neutral-700 p-6 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-600">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            새 스마트 바인더 규칙
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rule Name */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              규칙 이름 *
            </label>
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="예: 2024 컬렉션, 현수막 포카"
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-500"
            />
          </div>

          {/* System Filters: Groups */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              그룹 선택
            </label>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <button
                  key={group.slug}
                  onClick={() => {
                    if (selectedGroups.includes(group.slug)) {
                      setSelectedGroups(selectedGroups.filter((g) => g !== group.slug));
                    } else {
                      setSelectedGroups([...selectedGroups, group.slug]);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition ${
                    selectedGroups.includes(group.slug)
                      ? 'bg-pink-500 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300'
                  }`}
                >
                  {group.nameKr || group.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* System Filters: Members */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              멤버 선택
            </label>
            <div className="flex flex-wrap gap-2">
              {members.slice(0, 10).map((member) => (
                <button
                  key={member.slug}
                  onClick={() => {
                    if (selectedMembers.includes(member.slug)) {
                      setSelectedMembers(selectedMembers.filter((m) => m !== member.slug));
                    } else {
                      setSelectedMembers([...selectedMembers, member.slug]);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition text-sm ${
                    selectedMembers.includes(member.slug)
                      ? 'bg-purple-500 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-300'
                  }`}
                >
                  {member.nameKr || member.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Tags */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              커스텀 태그 필터
            </label>
            <CreatableTagSelect
              tags={customTags}
              onChange={setCustomTags}
              placeholder="#메이크스타, #갈망포카 등 자유롭게 입력하세요"
              mode="custom"
            />
          </div>

          {/* Display Mode */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              렌더링 방식
            </label>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            >
              <option value="GRID">그리드 (기본)</option>
              <option value="CHECKLIST">체크리스트</option>
              <option value="LIST">리스트</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-neutral-100 dark:bg-neutral-700 p-6 flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-600">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-neutral-300 dark:bg-neutral-600 text-neutral-900 dark:text-white hover:bg-neutral-400 transition"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 transition"
          >
            규칙 저장
          </button>
        </div>
      </div>
    </div>
  );
}
