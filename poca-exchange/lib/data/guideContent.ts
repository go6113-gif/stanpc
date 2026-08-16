/**
 * StanPC 메인 랜딩 'Guide & Insights' 카드 콘텐츠
 * 4가지 핵심 가치/가이드 항목
 */

export type GuideTag = "VALUE" | "COMMUNITY" | "PRODUCT" | "VIRAL";

export interface GuideCard {
  id: string;
  tag: GuideTag;
  title: string;
  subtitle: string;
  icon: string;
  summary: string;
  details: {
    description: string;
    keyPoints: string[];
  };
  actionLabel: string;
  actionType: "navigate" | "modal" | "external";
  actionTarget?: string;
  gradient: {
    from: string;
    to: string;
  };
}

export const GUIDE_CARDS: GuideCard[] = [
  {
    id: "global-pricing",
    tag: "VALUE",
    title: "글로벌 3개국 실시간 시세",
    subtitle: "한국·미국·일본 3개 시장 가격을 한 곳에서 비교하세요.",
    icon: "💰",
    summary: "한국·미국·일본 3개 시장 가격 비교 및 1:1 자동 매칭 시스템",
    details: {
      description:
        "StanPC는 eBay(미국), Buyee(일본), DK Shop(한국) 3개 플랫폼의 실시간 시세를 수집하여 한눈에 비교할 수 있도록 제공합니다. 글로벌 크로스보더 거래 시 호갱 방지와 공정한 가격 형성을 돕습니다.",
      keyPoints: [
        "실시간 시세 추적: 24시간 자동 수집 및 업데이트",
        "1:1 자동 매칭: 3장 이상 중복 카드 보유 시 교환 상대 자동 탐지",
        "공정거래 보호: 시세 기반 교환 가격 산정 알고리즘",
        "크로스보더 안내: 국가별 배송료, 관세, 환율 계산기",
      ],
    },
    actionLabel: "실시간 시세 둘러보기",
    actionType: "navigate",
    actionTarget: "/vault",
    gradient: {
      from: "from-emerald-500/20",
      to: "from-teal-600/20",
    },
  },
  {
    id: "community-wiki",
    tag: "COMMUNITY",
    title: "집단지성 글로벌 위키 도감",
    subtitle: "전 세계 팬들이 함께 채워가는 가장 완벽한 포토카드 데이터베이스",
    icon: "🌐",
    summary: "19,386개 포토카드를 5개 플랫폼 데이터로 검증한 글로벌 마스터 데이터베이스",
    details: {
      description:
        "StanPC Wiki는 팬 커뮤니티의 집단지성으로 운영됩니다. 누락된 특전 정보, 잘못된 데이터를 직접 제보하고 검증 과정을 거쳐 커뮤니티 기여자(Contributor)로 인정받을 수 있습니다.",
      keyPoints: [
        "데이터 제보: R2 Direct 업로드를 통한 원본 이미지 직접 제출",
        "관리자 검증: 실물 사진 및 메타데이터 기반 사실 확인",
        "Contributor 뱃지: 10개 이상 제보 시 프로필에 뱃지 획득",
        "명예의 전당: 100% 완성 달성 시 실시간 웹 푸시 알림 및 폭죽 축하",
      ],
    },
    actionLabel: "누락된 포카 제보하기",
    actionType: "modal",
    gradient: {
      from: "from-violet-500/20",
      to: "from-purple-600/20",
    },
  },
  {
    id: "live-binder",
    tag: "PRODUCT",
    title: "앱 설치 없는 10초 라이브 바인더",
    subtitle: "브라우저만 열면 내 바인더가 그대로. 설치 없이 어디서든.",
    icon: "📱",
    summary: "가입 없이 로컬스토리지 기반 안전한 보관 및 실시간 자산 평가",
    details: {
      description:
        "StanPC 라이브 바인더는 설치 없이 브라우저에서 즉시 시작할 수 있습니다. 로컬스토리지에 안전하게 저장되며, 완성도(%)와 총자산 평가액(KRW/USD)을 실시간으로 계산해줍니다.",
      keyPoints: [
        "즉시 시작: 가입 불필요, 10초 만에 바인더 생성",
        "안전한 저장: 로컬스토리지 기반 개인정보 보호",
        "실시간 평가: 완성도(%) 및 총자산(KRW/USD) 자동 산정",
        "1:1 교환 매칭: 위시리스트 기반 자동 교환 상대 탐지",
      ],
    },
    actionLabel: "내 바인더 열어보기",
    actionType: "navigate",
    actionTarget: "/vault",
    gradient: {
      from: "from-blue-500/20",
      to: "from-cyan-600/20",
    },
  },
  {
    id: "sns-viral",
    tag: "VIRAL",
    title: "SNS 인증 샷 3초 완성 & 1초 퀵토글",
    subtitle: "하트·마름모 1초 퀵토글 및 X(트위터) 교환 폼 자동 생성",
    icon: "📸",
    summary: "280자 제한 맞춤형 WTT 트윗 자동 포맷팅 및 SNS 공유 기능",
    details: {
      description:
        "내 포카 Have vs 원하는 포카 Wish를 선택하면, 280자 제한을 맞춘 WTT 트윗 텍스트가 자동 생성됩니다. X(트위터)의 트윗 작성창에 즉시 연동하여 한 클릭으로 공유할 수 있습니다.",
      keyPoints: [
        "자동 텍스트 생성: Have/Wish 카드 정보 → 280자 최적화 트윗",
        "해시태그 자동화: #wtt #포카교환 #StanPC 등 자동 포함",
        "1초 퀵토글: 소장/위시 상태를 하트, 마름모 아이콘으로 1초에 변경",
        "X 직접 연동: 트윗 작성창 자동 열기 (twitter.com/intent/tweet)",
      ],
    },
    actionLabel: "X(트위터) 교환 폼 만들기",
    actionType: "external",
    gradient: {
      from: "from-pink-500/20",
      to: "from-rose-600/20",
    },
  },
];

export const TAG_LABELS: Record<GuideTag, string> = {
  VALUE: "가치",
  COMMUNITY: "커뮤니티",
  PRODUCT: "제품",
  VIRAL: "바이럴",
};

export const TAG_COLORS: Record<GuideTag, { bg: string; text: string }> = {
  VALUE: { bg: "bg-emerald-500/20", text: "text-emerald-300" },
  COMMUNITY: { bg: "bg-violet-500/20", text: "text-violet-300" },
  PRODUCT: { bg: "bg-blue-500/20", text: "text-blue-300" },
  VIRAL: { bg: "bg-pink-500/20", text: "text-pink-300" },
};
