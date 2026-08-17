import { VaultCardItem } from '@/lib/api-types';
import { SmartBinderRule } from '@/store/useSmartBinderRuleStore';

/**
 * SmartBinderRule에 따라 카드를 필터링합니다.
 * systemFilters (그룹, 멤버)와 customTagFilters (사용자 태그)를 모두 확인합니다.
 */
export function filterCardsByRule(
  cards: VaultCardItem[],
  rule: SmartBinderRule | null
): VaultCardItem[] {
  if (!rule) return cards;

  return cards.filter((card) => {
    // System Filters (Groups & Members)
    if (rule.systemFilters.groups && rule.systemFilters.groups.length > 0) {
      if (!rule.systemFilters.groups.includes(card.groupName)) {
        return false;
      }
    }

    if (rule.systemFilters.members && rule.systemFilters.members.length > 0) {
      if (!card.memberName || !rule.systemFilters.members.includes(card.memberName)) {
        return false;
      }
    }

    // Custom Tag Filters (using tags field)
    if (rule.customTagFilters && rule.customTagFilters.length > 0) {
      // 카드의 tags 필드에 필터 태그 중 하나라도 포함되어야 함
      const cardTags = (card.tags || []) as string[];
      const hasMatchingTag = rule.customTagFilters.some((filterTag) =>
        cardTags.some((cardTag) =>
          cardTag.toLowerCase().includes(filterTag.toLowerCase())
        )
      );

      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 카드가 보유되지 않은 경우를 확인합니다.
 * 이는 실루엣 렌더링에 사용됩니다.
 */
export function isCardNotOwned(card: VaultCardItem): boolean {
  return !card.ownedCount || card.ownedCount === 0;
}
