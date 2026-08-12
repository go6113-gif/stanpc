/**
 * StanPC 다국어 표기 규칙 (Language Rules)
 *
 * 원칙:
 * 1. UI 요소 (메뉴, 필터, 버튼, 안내): 한국어 우선
 * 2. 고유명사 & 수집 용어: 영문 원문 유지
 */

export const LANGUAGE_RULES = {
  UI: {
    // 필터 명칭
    filters: {
      cardCondition: '카드 등급',
      vaultStatus: '보관 상태',
    },
    // 버튼 & CTA
    buttons: {
      addToVault: '내 보유에 추가',
      addToWishlist: '위시리스트 추가',
      markForTrade: '교환 가능 표시',
    },
    // 상태 설명
    status: {
      inVault: '내 보유 카드',
      iso: '구하는 카드',
      forTrade: '교환 가능',
      wishlist: '위시리스트',
    },
  },

  TERMS: {
    // 카드 상태 (Korean + English)
    conditions: {
      sealed: { ko: '미개봉', en: 'Sealed' },
      nm: { ko: '근민트', en: 'NM (Near Mint)' },
      lp: { ko: '경미한 하자', en: 'LP (Light Play)' },
      mp: { ko: '중간 하자', en: 'MP (Moderate Play)' },
      hp: { ko: '심각한 하자', en: 'HP (Heavy Play)' },
    },
    // 수집 전문 용어 (영문 유지)
    collecting: {
      iso: 'ISO (In Search Of)', // 찾는 카드
      pob: 'POB (Proof of Burn)', // 증명
      holo: 'Holo (Holographic)', // 홀로그램
      psa: 'PSA (Professional Sports Authenticator)', // 공식 감정
      gem: 'Gem Mint', // 보석급
      factory: 'Factory Defect', // 공장 하자
    },
    // 그룹/멤버 명칭 (영문 공식명 유지)
    artists: {
      aespa: 'aespa',
      twice: 'TWICE',
      newjeans: 'NewJeans',
      lesserafim: 'LE SSERAFIM',
    },
  },

  FORMATTING: {
    // 조합 규칙: 한글 + 영문 용어
    conditionBadge: (ko: string, en: string) => `${ko} (${en})`,
    // 예: "미개봉 (Sealed)"

    termLabel: (label: string) => label,
    // 영문 용어는 그대로 표시
  },
} as const;

/**
 * 사용 예시:
 *
 * import { LANGUAGE_RULES } from '@/lib/language-rules';
 *
 * // UI 텍스트 (한글)
 * const addButtonText = LANGUAGE_RULES.UI.buttons.addToVault;
 * // → "내 보유에 추가"
 *
 * // 조합된 배지 (한글 + 영문)
 * const badge = LANGUAGE_RULES.FORMATTING.conditionBadge(
 *   LANGUAGE_RULES.TERMS.conditions.sealed.ko,
 *   LANGUAGE_RULES.TERMS.conditions.sealed.en
 * );
 * // → "미개봉 (Sealed)"
 *
 * // 영문 전문 용어 (그대로 유지)
 * const collectingTerm = LANGUAGE_RULES.TERMS.collecting.iso;
 * // → "ISO (In Search Of)"
 */
