# StanPC - 프로젝트 마스터 설정 및 개발 지침 (Single Source of Truth)

## 1. 프로젝트 정체성 & 핵심 철학
- **핵심 가치**: 포토카드 수집·보관(Vault) 및 자랑(Showcase) 중심의 팬덤 놀이터 (상업적 리딩 전면 금지).
- **기본 액션 우선순위**: 자랑 > 리액션 > 수집 기록 > 교환 > 구매
- **수익 모델 (Affiliate)**: 포카 상세 페이지 내 가격 클릭 시 외부 커머스(eBay, Buyee, DK Shop) 파트너 쿠키를 자동 부착하여 CPS 수수료 수입 획득 (OutboundClick 활용).
- **가이드 철학**: 규격(mm) 정보는 소극적 툴팁(Silent Tooltip)으로만 제공하며, 유저의 보관 방식(슬리브/속지) 선택을 강제하거나 간섭하지 않음.

---

## 2. 기술 스택 & 개발 환경
- **Framework**: Next.js 16 (App Router / `node_modules/next/dist/docs/` 문서 기준 준수)
- **Styling**: Tailwind CSS v4
- **ORM & DB**: Prisma (`@prisma/adapter-pg` 사용, Client 경로는 `app/generated/prisma/` 필수)
- **알림 스택**: Web Push API + Service Worker (별도 모바일 앱 설치 없음) + 헤더 인-사이트 알림 센터
- **기존 주요 모델**: UserBinderCard, GlobalSKUMapping, OutboundClick, PriceReport 등 기존 12개 스키마 유지 및 확장
- **MVP 제약**: `MVP_GROUP_SLUGS` 5개 스코프 제약 준수

---

## 3. 핵심 모듈별 MVP 기능 명세

### P1. My Vault & 자랑 렌더러
- **SNS 자랑용 카드 (Multi-Ratio Generator)**: 100% 드래곤볼 시 9:16 (세로 풀스크린) 및 1:1 (정사각형) 멀티 비율 선택 지원.
- **비주얼 연출**: 3D 바인더 그리드 + 네온 글리터 프레임 + `stanpc.com/@username_vault` 하단 개인화 워터마크 자동 각인 + 클립보드 딥링크 복사.

### P2. 덕후 Wiki & 게이미피케이션
- **프론트 명예의 전당 (Hall of Fame)**: 100% 실물 인증 달성 시 최상단 전광판 노출 + 화면 전체 폭죽 애니메이션(Confetti) 실행.
- **Collector Index (덕력 스탯)**: 계급제 배제. (완성 템플릿 수 × 가중치) + (실물 인증 카운트 × 가중치) + (희귀 카드 수)를 계산하여 덕력 포인트 및 상징적 뱃지(Badges) 부여.
- **6종 감정 리액션**: `부럽다`, `레전드`, `영롱하다`, `미쳤다`, `리스펙`, `나도갖고싶다`
- **알림 트리거**: 명예의 전당 입성 즉시 실시간 웹 푸시 + 매일 저녁 일일 감정 리액션 요약 푸시(Batch Cron) 발송.
- **실물 인증 가이드**: 메타데이터(EXIF/Hash) 검증 적용. 예절샷(QR/날짜/브이)은 선택(Optional)이나 명예의 전당 노출 및 축하 유도 효과 상승 문구 안내.

### P3. WTT Playground (1:1 번들 교환)
- **MVP 정책**: 내부 거래 대화창은 백엔드 스키마만 사전 구축하고 비활성화(Off-switch).
- **소통 연결**: 3장 이상 위시-중복 일치 번들 매칭 탐지 시 알림을 발생시키며, 유저 프로필에 등록된 외부 소통 채널(X/Twitter ID, Insta DM, 오픈카톡) 버튼으로 바로 연결.

---

## 4. DB 스키마 확장 명세 (신규/수정)

```prisma
// User & Gamification
model User {
  // ...기존 필드 유지
  collector_index Int     @default(0)
  manner_score    Float   @default(36.5)
  user_badges     UserBadge[]
}

model Badge {
  id          String      @id @default(cuid())
  badge_name  String
  badge_icon  String
  user_badges UserBadge[]
}

model UserBadge {
  id          String   @id @default(cuid())
  user_id     String
  badge_id    String
  acquired_at DateTime @default(now())
  user        User     @relation(fields: [user_id], references: [id])
  badge       Badge    @relation(fields: [badge_id], references: [id])
}

// Reactions
enum ReactionType {
  ENVIED      // 부럽다
  LEGEND      // 레전드
  SPARKLING   // 영롱하다
  CRAZY       // 미쳤다
  RESPECT     // 리스펙
  WANT_IT     // 나도갖고싶다
}

model Reaction {
  id            String       @id @default(cuid())
  user_id       String
  target_post_id String
  reaction_type ReactionType
  created_at    DateTime     @default(now())
}

// Notifications
enum NotificationType {
  HOF_EXPOSURE
  DAILY_REACTION_SUMMARY
  TRADE_MATCH
}

model Notification {
  id         String           @id @default(cuid())
  user_id    String
  type       NotificationType
  title      String
  body       String
  payload    Json?            @default("{}")
  is_read    Boolean          @default(false)
  created_at DateTime         @default(now())
}

// Future WTT Schemas (MVP Prepared Only)
model BundleMatch {
  id          String   @id @default(cuid())
  user_a_id   String
  user_b_id   String
  matched_count Int
  created_at  DateTime @default(now())
}

model TradeRoom {
  id          String   @id @default(cuid())
  match_id    String
  status      String   @default("PENDING")
  created_at  DateTime @default(now())
}

model TradeItem {
  id          String   @id @default(cuid())
  trade_room_id String
  card_id     String
  owner_id    String
}
```

---

## 5. 개발 워크플로우 & 규약

### 파일 구조
- **작업 대상**: `D:\StanPC\poca-exchange\` (Next.js 16 정본 앱)
- **데이터·분석**: `D:\StanPC\scripts\`, `D:\StanPC\data\` (Python 루트 레벨)
- **금지**: 루트 `D:\StanPC\` 의 `prisma/`, `app/` 절대 수정 금지 (레거시 사본)

### 명령어 (poca-exchange/ 내에서 실행)
```bash
npm run dev                              # 개발 서버 시작
npx prisma migrate dev --name <설명>     # 마이그레이션 생성
npx prisma generate                      # Client 재생성
npm run db:seed                          # 데이터 시드
```

### 코딩 규약
- **주석/식별자**: 영어, **UI 문자열**: 한국어 (i18n 키 분리 고려)
- **Prisma 스키마 주석**: 모델 위에 `// ---` 구분선 + 설계 의도 및 **의도적 이탈 사유** 명시
- **Enum 관리**: DB enum으로 정의하고 문자열 리터럴을 코드에 흩뿌리지 않음
- **마이그레이션**: 기존 파일 편집 절대 금지 — 새 파일만 생성 (`migrate dev`)

### 검증 및 배포
- **타입 체크**: `npx tsc --noEmit`
- **린트**: ESLint 기본 설정 준수
- **배포 대상**: stanpc.com (Next.js 16 정본 앱만)

---

## 6. 환경변수 (poca-exchange/.env)

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SITE_URL=https://stanpc.com
EBAY_CLIENT_ID=<your-ebay-client-id>
EBAY_CLIENT_SECRET=<your-ebay-client-secret>
AUTH_SECRET=<your-auth-secret>
AUTH_GOOGLE_ID=<google-oauth-id>
AUTH_GOOGLE_SECRET=<google-oauth-secret>
AUTH_TWITTER_ID=<twitter-oauth-id>
AUTH_TWITTER_SECRET=<twitter-oauth-secret>
AUTH_KAKAO_ID=<kakao-oauth-id>
AUTH_KAKAO_SECRET=<kakao-oauth-secret>
AUTH_NAVER_ID=<naver-oauth-id>
AUTH_NAVER_SECRET=<naver-oauth-secret>
```

**중요**: `.env`에 실제 프로덕션 키 및 `AUTH_SECRET` 포함 → `.gitignore` 확인 필수

---

## 7. 데이터 자산 및 참고 문헌

| 경로 | 내용 |
|---|---|
| `D:\StanPC\data\global_photocard_final_report.md` | 5개 플랫폼 19,386건 최종 분석 보고서 (기획 근거) |
| `D:\StanPC\data\global_photocard_stats.json` | 위 보고서의 원천 수치 |
| `D:\StanPC\data\ebay_photocard_posts.json` | eBay 매물 9,643건 |
| `D:\StanPC\scripts\collect_ebay_data.py` | eBay Browse API 자동 수집 |
| `D:\StanPC\scripts\analyze_global_photocard.py` | 5개 플랫폼 통합 분석 |
| 덕후 Wiki 시드 CSV | `biasroom_photocards_master.csv`, `poca_master_db_mb.csv` |

**Python 실행 시**: `PYTHONIOENCODING=utf-8` 환경변수 설정 (한글 인코딩)

---

## 8. 배포 체크리스트 (Go/No-Go)

- [ ] 마이그레이션 모두 적용됨 (`npx prisma migrate deploy`)
- [ ] `MVP_GROUP_SLUGS` 범위 내에서만 쿼리 스코프됨
- [ ] 상업 CTA 최소화 (메인 액션 우선순위 준수)
- [ ] 환경변수 `.env.example` 동기화됨
- [ ] Web Push 구독 메커니즘 테스트 완료
- [ ] 웹훅 및 Batch Cron 작동 확인
- [ ] 알림 페이로드 및 심볼 매핑 검증
- [ ] 배포 전 `npm run db:seed` 실행하여 기본 배지/리액션 타입 삽입

---

## 9. 의사결정 히스토리 & 핵심 원칙

- **계급제 배제**: Collector Index는 순수 포인트 기반 (Leveling System 아님)
- **예절샷 Optional**: 명예의 전당 진입을 강요하지 않되, 달성 시 축하 연출로 유도
- **WTT 미래 준비**: 1단계(P1/P2) MVP에서는 스키마만 사전 구축, UI/API 비활성화
- **Affiliate Transparency**: 외부 링크는 투명하게 표시하되 UX 주도하지 않음
