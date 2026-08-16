'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useVaultFilterStore } from '@/store/useVaultFilterStore';

interface AdvancedFilterPanelProps {
  availableTags?: string[];
  availableGroups?: string[];
  availableMembers?: string[];
}

/**
 * 고급 필터 패널
 *
 * - 해시태그 클라우드 (다중 선택)
 * - 그룹/멤버 필터
 * - 상태 필터 (Owned, Wished, WTT, WTS)
 */
export function AdvancedFilterPanel({
  availableTags = [],
  availableGroups = [],
  availableMembers = [],
}: AdvancedFilterPanelProps) {
  const { groups, members, statuses, tags, setGroups, setMembers, setStatuses, setTags } =
    useVaultFilterStore();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tags: true,
    groups: true,
    members: false,
    statuses: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const statusOptions = [
    { value: 'owned', label: '🎴 보유 중' },
    { value: 'wished', label: '❤️ 원함' },
    { value: 'wtt', label: '🔵🔴 교환용' },
    { value: 'wts', label: '💰 판매용' },
  ];

  const hasActiveFilters = groups.length > 0 || members.length > 0 || statuses.length > 0 || tags.length > 0;

  return (
    <div className="space-y-4 bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
      {/* 활성 필터 표시 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          {groups.map((group) => (
            <span
              key={`group-${group}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs"
            >
              {group}
              <button
                onClick={() => setGroups(groups.filter((g) => g !== group))}
                className="hover:text-blue-900 dark:hover:text-blue-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {members.map((member) => (
            <span
              key={`member-${member}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs"
            >
              {member}
              <button
                onClick={() => setMembers(members.filter((m) => m !== member))}
                className="hover:text-purple-900 dark:hover:text-purple-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {tags.map((tag) => (
            <span
              key={`tag-${tag}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#FF2A55]/10 text-[#FF2A55] text-xs"
            >
              #{tag}
              <button
                onClick={() => setTags(tags.filter((t) => t !== tag))}
                className="hover:text-[#FF2A55]/80"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 상태 필터 */}
      <FilterSection
        title="상태"
        section="statuses"
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      >
        <div className="grid grid-cols-2 gap-2">
          {statusOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <input
                type="checkbox"
                checked={statuses.includes(option.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setStatuses([...statuses, option.value]);
                  } else {
                    setStatuses(statuses.filter((s) => s !== option.value));
                  }
                }}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* 그룹 필터 */}
      <FilterSection
        title="그룹"
        section="groups"
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      >
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {availableGroups.map((group) => (
            <label
              key={group}
              className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <input
                type="checkbox"
                checked={groups.includes(group)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setGroups([...groups, group]);
                  } else {
                    setGroups(groups.filter((g) => g !== group));
                  }
                }}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm truncate">{group}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* 멤버 필터 */}
      {availableMembers.length > 0 && (
        <FilterSection
          title="멤버"
          section="members"
          expandedSections={expandedSections}
          toggleSection={toggleSection}
        >
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {availableMembers.map((member) => (
              <label
                key={member}
                className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                <input
                  type="checkbox"
                  checked={members.includes(member)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMembers([...members, member]);
                    } else {
                      setMembers(members.filter((m) => m !== member));
                    }
                  }}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm truncate">{member}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* 해시태그 클라우드 */}
      {availableTags.length > 0 && (
        <FilterSection
          title="해시태그"
          section="tags"
          expandedSections={expandedSections}
          toggleSection={toggleSection}
        >
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = tags.includes(tag);
              const frequency = Math.floor(Math.random() * 10) + 1; // 가상의 빈도

              return (
                <button
                  key={tag}
                  onClick={() => {
                    if (isSelected) {
                      setTags(tags.filter((t) => t !== tag));
                    } else {
                      setTags([...tags, tag]);
                    }
                  }}
                  style={{
                    fontSize: `${0.75 + (frequency / 20) * 0.5}rem`,
                  }}
                  className={`px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#FF2A55] text-white font-semibold'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  section: string;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  children: React.ReactNode;
}

function FilterSection({
  title,
  section,
  expandedSections,
  toggleSection,
  children,
}: FilterSectionProps) {
  const isExpanded = expandedSections[section] ?? true;

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 last:border-b-0">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between py-3 font-semibold text-neutral-900 dark:text-white hover:text-[#FF2A55] transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      {isExpanded && <div className="pb-3">{children}</div>}
    </div>
  );
}
