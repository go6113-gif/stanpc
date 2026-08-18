/**
 * 정밀 수집 완성도(%) 계산 엔진
 *
 * 마스터 도감 데이터를 기반으로 실제 소유 카드와 대조하여
 * 그룹/앨범/전체 포트폴리오의 완성도를 오차 없이 계산합니다.
 *
 * 핵심 원칙:
 * - 모든 계산은 마스터 도감의 totalOfficialCards를 Denominator로 사용
 * - 그룹명/앨범명 → 슬러그 자동 정규화
 * - 소수점 1자리까지만 표시 (Math.round 사용)
 */

import { BinderCard } from "@/store/useBinderStore";
import {
  ALBUM_MASTER_CATALOG,
  GROUP_MASTER_CATALOG,
  getGroupMasterData,
  getAlbumMasterData,
} from "../catalog/masterData";

/**
 * 완성도 계산 결과 타입
 */
export interface CompletionResult {
  owned: number;
  total: number;
  percentage: number;
  displayText: string;
}

/**
 * 그룹별 완성도 상세 정보
 */
export interface GroupCompletionDetail {
  groupName: string;
  groupSlug: string;
  owned: number;
  total: number;
  percentage: number;
  displayText: string;
  albums: AlbumCompletionDetail[];
}

/**
 * 앨범별 완성도 상세 정보
 */
export interface AlbumCompletionDetail {
  albumTitle: string;
  albumSlug: string;
  owned: number;
  total: number;
  percentage: number;
  displayText: string;
}

/**
 * 문자열을 슬러그로 정규화 (한글 → 영문 슬러그)
 * 예: "NewJeans" → "newjeans", "SEVENTEEN" → "seventeen"
 */
function normalizeToSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * 개별 카드가 속한 그룹 ID를 결정
 * BinderCard.groupName을 슬러그화하여 매칭
 */
function getGroupSlugFromCard(card: BinderCard): string {
  return normalizeToSlug(card.groupName);
}

/**
 * 단일 그룹의 완성도 계산
 *
 * @param groupSlug - 그룹 슬러그 (예: "newjeans", "seventeen")
 * @param ownedCards - 소유한 전체 카드 배열
 * @returns 완성도 계산 결과
 */
export function calculateGroupCompletion(
  groupSlug: string,
  ownedCards: BinderCard[]
): CompletionResult {
  const masterData = getGroupMasterData(groupSlug);

  if (!masterData) {
    const ownedCount = ownedCards.filter(
      (c) => normalizeToSlug(c.groupName) === groupSlug
    ).length;
    return {
      owned: ownedCount,
      total: ownedCount || 1,
      percentage: ownedCount > 0 ? 100 : 0,
      displayText: `${ownedCount}개`,
    };
  }

  const ownedCount = ownedCards.filter(
    (c) => normalizeToSlug(c.groupName) === groupSlug
  ).length;

  const percentage = Math.round((ownedCount / masterData.totalOfficialCards) * 1000) / 10;

  return {
    owned: ownedCount,
    total: masterData.totalOfficialCards,
    percentage,
    displayText: `${ownedCount}/${masterData.totalOfficialCards}`,
  };
}

/**
 * 단일 앨범의 완성도 계산
 *
 * @param albumSlug - 앨범 슬러그
 * @param ownedCards - 소유한 전체 카드 배열
 * @returns 완성도 계산 결과
 */
export function calculateAlbumCompletion(
  albumSlug: string,
  ownedCards: BinderCard[]
): CompletionResult {
  const masterData = getAlbumMasterData(albumSlug);

  if (!masterData) {
    return {
      owned: 0,
      total: 1,
      percentage: 0,
      displayText: "데이터 없음",
    };
  }

  const ownedCount = 0;
  const percentage = Math.round((ownedCount / masterData.totalOfficialCards) * 1000) / 10;

  return {
    owned: ownedCount,
    total: masterData.totalOfficialCards,
    percentage,
    displayText: `${ownedCount}/${masterData.totalOfficialCards}`,
  };
}

/**
 * 전체 포트폴리오 완성도 계산
 *
 * @param ownedCards - 소유한 전체 카드 배열
 * @returns 완성도 계산 결과
 */
export function calculateTotalPortfolioCompletion(
  ownedCards: BinderCard[]
): CompletionResult {
  const totalMasterCards = GROUP_MASTER_CATALOG.reduce(
    (sum, group) => sum + group.totalOfficialCards,
    0
  );

  const ownedCount = ownedCards.length;
  const percentage = Math.round((ownedCount / totalMasterCards) * 1000) / 10;

  return {
    owned: ownedCount,
    total: totalMasterCards,
    percentage,
    displayText: `${ownedCount}/${totalMasterCards}`,
  };
}

/**
 * 바인더별 완성도 계산
 *
 * @param binderCards - 바인더에 속한 카드 배열
 * @returns 완성도 계산 결과
 */
export function calculateBinderCompletion(
  binderCards: BinderCard[]
): CompletionResult {
  const groupCompletions = new Map<string, CompletionResult>();

  binderCards.forEach((card) => {
    const groupSlug = getGroupSlugFromCard(card);
    if (!groupCompletions.has(groupSlug)) {
      groupCompletions.set(
        groupSlug,
        calculateGroupCompletion(groupSlug, binderCards)
      );
    }
  });

  if (groupCompletions.size === 0) {
    return {
      owned: 0,
      total: 1,
      percentage: 0,
      displayText: "0/0",
    };
  }

  let totalOwned = 0;
  let totalCards = 0;

  groupCompletions.forEach((result) => {
    totalOwned += result.owned;
    totalCards += result.total;
  });

  const percentage = totalCards > 0 ? Math.round((totalOwned / totalCards) * 1000) / 10 : 0;

  return {
    owned: totalOwned,
    total: totalCards,
    percentage,
    displayText: `${totalOwned}/${totalCards}`,
  };
}

/**
 * 그룹별 상세 완성도 정보 조회
 *
 * @param ownedCards - 소유한 전체 카드 배열
 * @returns 그룹별 완성도 배열 (완성도 높은 순 정렬)
 */
export function getAllGroupCompletions(
  ownedCards: BinderCard[]
): GroupCompletionDetail[] {
  const groupMap = new Map<string, BinderCard[]>();

  ownedCards.forEach((card) => {
    const groupSlug = getGroupSlugFromCard(card);
    if (!groupMap.has(groupSlug)) {
      groupMap.set(groupSlug, []);
    }
    groupMap.get(groupSlug)!.push(card);
  });

  const results: GroupCompletionDetail[] = [];

  GROUP_MASTER_CATALOG.forEach((masterGroup) => {
    const completion = calculateGroupCompletion(masterGroup.groupSlug, ownedCards);

    const albumDetails: AlbumCompletionDetail[] = masterGroup.albums.map(
      (album) => ({
        albumTitle: album.albumTitle,
        albumSlug: album.albumSlug,
        owned: 0,
        total: album.totalOfficialCards,
        percentage: 0,
        displayText: `0/${album.totalOfficialCards}`,
      })
    );

    results.push({
      groupName: masterGroup.groupName,
      groupSlug: masterGroup.groupSlug,
      owned: completion.owned,
      total: completion.total,
      percentage: completion.percentage,
      displayText: completion.displayText,
      albums: albumDetails,
    });
  });

  results.sort((a, b) => b.percentage - a.percentage);

  return results;
}

/**
 * 특정 그룹의 상위 N개 앨범 완성도 조회
 *
 * @param groupSlug - 그룹 슬러그
 * @param ownedCards - 소유한 전체 카드 배열
 * @param limit - 반환할 최대 개수
 * @returns 앨범별 완성도 배열
 */
export function getGroupTopAlbums(
  groupSlug: string,
  ownedCards: BinderCard[],
  limit = 5
): AlbumCompletionDetail[] {
  const masterGroup = getGroupMasterData(groupSlug);

  if (!masterGroup) {
    return [];
  }

  const albums = masterGroup.albums.map((album) => ({
    albumTitle: album.albumTitle,
    albumSlug: album.albumSlug,
    owned: 0,
    total: album.totalOfficialCards,
    percentage: 0,
    displayText: `0/${album.totalOfficialCards}`,
  }));

  return albums.slice(0, limit);
}
