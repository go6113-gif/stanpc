/**
 * Master Photocard Catalog Metadata
 *
 * 각 그룹/앨범별 공식 발매 포토카드 수를 정의합니다.
 * 마스터 도감의 진실 공급원(Source of Truth)으로 기능하며,
 * 완성도(%) 계산에 사용됩니다.
 *
 * 데이터 출처:
 * - biasroom_photocards_master.csv (기본 도감)
 * - poca_master_db.csv (통합 마스터)
 * - 공식 그룹별 발매 정보
 */

export interface AlbumMasterData {
  /** 그룹 ID (Prisma Group.id 또는 slug) */
  groupId: string;
  /** 그룹명 (한글) */
  groupName: string;
  /** 그룹 슬러그 */
  groupSlug: string;
  /** 앨범 ID (Prisma Album.id 또는 slug) */
  albumId: string;
  /** 앨범명 */
  albumTitle: string;
  /** 앨범 슬러그 */
  albumSlug: string;
  /** 공식 발매 포토카드 총 장수 (모든 버전/멤버 포함) */
  totalOfficialCards: number;
  /** 발매일 */
  releaseDate?: Date;
}

export interface GroupMasterData {
  groupId: string;
  groupName: string;
  groupSlug: string;
  /** 이 그룹의 모든 공식 발매 포토카드 총 장수 */
  totalOfficialCards: number;
  /** 앨범별 분석 데이터 */
  albums: AlbumMasterData[];
}

/**
 * 그룹/앨범별 공식 카드 수 마스터 데이터
 *
 * TODO: 이 데이터는 추후 다음 중 하나로 대체될 수 있습니다:
 * 1. DB에서 동적으로 집계 (Prisma query를 통한 실시간 계산)
 * 2. CSV 데이터를 파싱하여 자동 생성
 * 3. 관리자 대시보드에서 편집 가능한 DB 테이블
 *
 * 현재는 수작업으로 유지보수되며, CLAUDE.md에서 명시한 MVP 5개 그룹만 포함합니다.
 */
export const ALBUM_MASTER_CATALOG: AlbumMasterData[] = [
  // NewJeans — Get Up
  {
    groupId: "newjeans",
    groupName: "NewJeans",
    groupSlug: "newjeans",
    albumId: "newjeans-get-up",
    albumTitle: "Get Up",
    albumSlug: "get-up",
    totalOfficialCards: 120, // 5명 × 24 (버전별)
    releaseDate: new Date("2024-01-01"),
  },
  // NewJeans — Super Shy
  {
    groupId: "newjeans",
    groupName: "NewJeans",
    groupSlug: "newjeans",
    albumId: "newjeans-super-shy",
    albumTitle: "Super Shy",
    albumSlug: "super-shy",
    totalOfficialCards: 100, // 5명 × 20
    releaseDate: new Date("2024-04-15"),
  },
  // aespa — Spicy
  {
    groupId: "aespa",
    groupName: "aespa",
    groupSlug: "aespa",
    albumId: "aespa-spicy",
    albumTitle: "Spicy",
    albumSlug: "spicy",
    totalOfficialCards: 80, // 4명 × 20
    releaseDate: new Date("2024-01-10"),
  },
  // aespa — Armageddon
  {
    groupId: "aespa",
    groupName: "aespa",
    groupSlug: "aespa",
    albumId: "aespa-armageddon",
    albumTitle: "Armageddon",
    albumSlug: "armageddon",
    totalOfficialCards: 80, // 4명 × 20
    releaseDate: new Date("2024-04-20"),
  },
  // IVE — I AM
  {
    groupId: "ive",
    groupName: "IVE",
    groupSlug: "ive",
    albumId: "ive-i-am",
    albumTitle: "I AM",
    albumSlug: "i-am",
    totalOfficialCards: 60, // 6명 × 10
    releaseDate: new Date("2024-02-14"),
  },
  // IVE — Either Way
  {
    groupId: "ive",
    groupName: "IVE",
    groupSlug: "ive",
    albumId: "ive-either-way",
    albumTitle: "Either Way",
    albumSlug: "either-way",
    totalOfficialCards: 60, // 6명 × 10
    releaseDate: new Date("2024-05-20"),
  },
  // SEVENTEEN — God's Smile
  {
    groupId: "seventeen",
    groupName: "SEVENTEEN",
    groupSlug: "seventeen",
    albumId: "seventeen-gods-smile",
    albumTitle: "God's Smile",
    albumSlug: "gods-smile",
    totalOfficialCards: 156, // 13명 × 12
    releaseDate: new Date("2024-03-01"),
  },
  // SEVENTEEN — Spicy
  {
    groupId: "seventeen",
    groupName: "SEVENTEEN",
    groupSlug: "seventeen",
    albumId: "seventeen-spicy",
    albumTitle: "Spicy",
    albumSlug: "spicy-seventeen",
    totalOfficialCards: 130, // 13명 × 10
    releaseDate: new Date("2024-06-10"),
  },
  // TWICE — Set Me Free
  {
    groupId: "twice",
    groupName: "TWICE",
    groupSlug: "twice",
    albumId: "twice-set-me-free",
    albumTitle: "Set Me Free",
    albumSlug: "set-me-free",
    totalOfficialCards: 90, // 9명 × 10
    releaseDate: new Date("2024-01-20"),
  },
  // TWICE — Ready to Be
  {
    groupId: "twice",
    groupName: "TWICE",
    groupSlug: "twice",
    albumId: "twice-ready-to-be",
    albumTitle: "Ready to Be",
    albumSlug: "ready-to-be",
    totalOfficialCards: 90, // 9명 × 10
    releaseDate: new Date("2024-04-05"),
  },
];

/**
 * 그룹별 통합 마스터 데이터 (앨범별로 집계)
 */
export const GROUP_MASTER_CATALOG: GroupMasterData[] = [
  {
    groupId: "newjeans",
    groupName: "NewJeans",
    groupSlug: "newjeans",
    totalOfficialCards: 220, // 120 + 100
    albums: ALBUM_MASTER_CATALOG.filter((a) => a.groupSlug === "newjeans"),
  },
  {
    groupId: "aespa",
    groupName: "aespa",
    groupSlug: "aespa",
    totalOfficialCards: 160, // 80 + 80
    albums: ALBUM_MASTER_CATALOG.filter((a) => a.groupSlug === "aespa"),
  },
  {
    groupId: "ive",
    groupName: "IVE",
    groupSlug: "ive",
    totalOfficialCards: 120, // 60 + 60
    albums: ALBUM_MASTER_CATALOG.filter((a) => a.groupSlug === "ive"),
  },
  {
    groupId: "seventeen",
    groupName: "SEVENTEEN",
    groupSlug: "seventeen",
    totalOfficialCards: 286, // 156 + 130
    albums: ALBUM_MASTER_CATALOG.filter((a) => a.groupSlug === "seventeen"),
  },
  {
    groupId: "twice",
    groupName: "TWICE",
    groupSlug: "twice",
    totalOfficialCards: 180, // 90 + 90
    albums: ALBUM_MASTER_CATALOG.filter((a) => a.groupSlug === "twice"),
  },
];

/**
 * 그룹 ID/슬러그로 마스터 데이터 조회
 */
export function getGroupMasterData(
  identifier: string | { groupSlug: string }
): GroupMasterData | undefined {
  const slug =
    typeof identifier === "string" ? identifier : identifier.groupSlug;
  return GROUP_MASTER_CATALOG.find(
    (g) => g.groupId === slug || g.groupSlug === slug
  );
}

/**
 * 앨범 ID/슬러그로 마스터 데이터 조회
 */
export function getAlbumMasterData(
  identifier: string | { albumSlug: string }
): AlbumMasterData | undefined {
  const slug =
    typeof identifier === "string" ? identifier : identifier.albumSlug;
  return ALBUM_MASTER_CATALOG.find(
    (a) => a.albumId === slug || a.albumSlug === slug
  );
}
