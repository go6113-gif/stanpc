# StanPC 전사 전수 감사 보고서 (Gemini 총괄 검토용)

**작성일**: 2026-08-14
**조사 방식**: 코드베이스 전체 직접 열람(2개 병렬 서브에이전트 + 직접 조사), 추측 없이 파일:라인 근거만 채택
**대상**: `D:\StanPC\poca-exchange` (Next.js 16, 정본 앱) + `D:\StanPC\data\*.csv` + Supabase DB(현재 접속 불가)

---

## 0. 총괄 요약 — 가장 심각한 3가지

1. **시드 파이프라인이 두 개로 쪼개져 서로 다른 데이터를 만들고 있다.** `prisma/seed.ts`(Prisma 공식 훅)와 `prisma/import-csv.ts`(오늘 Wikidata로 정리한 스크립트)가 서로 다른 CSV·다른 slug 체계로 Member/PhotoCard를 만든다. 같은 멤버가 "Kim Chaewon"(seed.ts)과 "Chaewon"(import-csv.ts) 두 개의 별도 행으로 갈라질 수 있다. 지난 세션의 "파이프라인 완전 종결" 선언은 `import-csv.ts`에만 유효하고 `seed.ts`는 손대지 않았다.
2. **소장/위시/조회 수가 진짜 유저 행동이 아니라 난수다.** `prisma/seed.ts:296-298`이 `wantCount`/`haveCount`/`viewCount`를 `Math.random()`으로 채운다. 이 데이터를 기반으로 한 랭킹·트렌드 기능은 전부 노이즈 위에 서 있다.
3. **원본 데이터 자체가 그룹당 24건으로 캡핑되어 있다.** `biasroom_photocards_master.csv`는 662개 그룹 중 137개(20.7%)가 정확히 24건, 최댓값도 24건 — 페이지네이션 상한에 걸린 것으로 보인다. BTS·세븐틴 등 10개 핵심 그룹 전부 예외 없이 24건에서 잘려 있다.

부가 발견: 저장소 루트 `db_count_check.py`(git 미추적)에 **Supabase DB 비밀번호가 평문 하드코딩**되어 있음 — 즉시 삭제 권장.

DB(`db.odocxoxthfokcmwieibn.supabase.co`)는 이번 세션 전체에서 **DNS 조회 자체가 안 되는 상태**로, 모든 "실제 DB 적재 건수"는 확인 불가하다. 아래 표의 모든 수치는 CSV 원본 기준이며, 실제 DB 반영 여부는 별도로 명시한다.

> **업데이트 로그 (2026-08-14, 감사 직후 조치)**
> - **위 1·2번 항목 해결**: `prisma/seed.ts` 파일을 완전히 삭제하고 `data/poca_master_db_mb.csv`를 `data/_deprecated/`로 격리. `Math.random()` 난수 카운터 로직도 함께 제거됨. `package.json`의 `db:seed`/`prisma.seed`는 이제 `import-csv.ts`만 가리킨다. **"3,860건"이라는 숫자는 이후 폐기 — 인용하지 않는다.**
> - **위 3번 항목 부분 해결**: 10개 핵심 그룹에 한해 `scripts/collect_10core_groups_ebay.py`로 eBay Browse API에서 그룹당 297~300건(총 2,991건) 실 매물을 직접 수집해 24건 상한을 우회했다. 상세는 4-2절 참조. 나머지 652개 비핵심 그룹은 여전히 24건 상한 상태.
> - 자세한 내용은 메모리 [[full-audit-and-ebay-collection]] 참조.

---

## 1. 가전제품 (핵심 구동 엔진)

| 기능 | 판정 | 핵심 근거 |
|---|---|---|
| 스마트 시세 차트기 | 🟡 **부분 구현** | 차트 라이브러리(recharts/d3/chart.js 등) 미설치. `components/price-trend-chart.tsx`는 `<div style={{width: N%}}>`로 막대를 흉내내는 CSS bar. 기간 선택(7D/30D/60D/ALL) UI 없음, `lib/photocard-price.ts`는 30일 고정. 이상치(outlier) 필터링 코드 0건 |
| 1:1 Have-Wish 자동 매칭기 | 🔴 **기획만 존재** | `lib/wtt-scope.ts`의 `WTT_ENABLED = false` + 순수 헬퍼 함수뿐. 매칭 점수 계산 로직, API 라우트, cron 전부 없음. `app/api/`에 bundle/match/trade 관련 라우트 0건 |
| 실시간 알림 파이프라인 | 🔴 **기획만 존재** | `public/`에 service worker 파일 없음, VAPID/web-push 패키지 미설치, `Notification` 모델에 실제로 write하는 코드 0건. enum도 3종뿐이라 "위시 카드 매물 등록" 트리거 타입 자체가 없음 |
| Zero-Scam 실물 인증 모듈 | 🔴 **기획만 존재** | `User.isVerified`/`verifiedAt` 필드는 있으나 세팅 코드 0건(schema 주석에 "Phase 2"로 명시). 인증샷 업로드 UI, EXIF/해시 검증 코드 전부 없음 |

**근거 상세**:
- `components/price-trend-chart.tsx:100-104` — `<div className={...} style={{ width: \`${Math.max(20, normalizedHeight)}%\` }}>`
- `app/api/price-history/route.ts` — days/market 파라미터를 받는 API가 존재하나 **호출하는 클라이언트 코드가 없는 고아 엔드포인트**
- `lib/wtt-scope.ts:4-8` — `// WTT is P3 and stays dark through the MVP ... export const WTT_ENABLED = false;` (이 상수를 참조하는 곳도 이 파일 자신뿐)
- `prisma/schema.prisma:642-648` — `NotificationType` enum 3종(HOF_EXPOSURE/DAILY_REACTION_SUMMARY/TRADE_MATCH)만 존재
- `prisma/schema.prisma:20` — `isVerified`/`verifiedAt`는 "reserved for Phase 2 (Stripe Identity / PASS) and stay nullable for now"

---

## 2. 가구 (수납·컬렉션 도구)

| 기능 | 판정 | 핵심 근거 |
|---|---|---|
| 디지털 바인더 (포켓 그리드, 드래그앤드롭) | 🔴 **미구현** | `components/vault/collection-grid.tsx:118`은 고정 CSS grid 나열뿐. dnd-kit/react-dnd 등 드래그 라이브러리 미설치. "pocket"/"4-pocket" 키워드 전체 검색 0건 |
| 대량 관리 툴 (CSV/엑셀 Import/Export) | 🔴 **미구현** | `csv-parse`/`csv-parser` 의존성은 있으나 사용처가 관리자용 시드 스크립트(`import-csv.ts`, `_migrate_schema.ts`) 2곳뿐. 유저 대상 업로드/다운로드 라우트·버튼 0건 |
| 위시보드 (체크리스트 바둑판) | 🟡 **부분 구현** | `app/api/user/vault/route.ts:60-100`이 앨범별 그룹핑 + have/want 통계를 실제로 계산, `collection-grid.tsx`가 미보유 카드를 회색조+"?" 오버레이로 렌더링(실 데이터 연동 확인). 단, **멤버별** 그리드는 없고 앨범 단위뿐이며 `app/api/vault/route.ts:131`의 `completeSetCount: 0, // TODO: 구현`은 하드코딩 미완성 |

---

## 3. 커튼 및 소품 (감성 인터랙션 연출)

| 기능 | 판정 | 핵심 근거 |
|---|---|---|
| 3D 카드 플립 & 홀로그램 | 🟡 **부분 구현** | `components/high-density/photocard-card.tsx:66-74`에 `preserve-3d` + framer-motion `rotateY`로 실제 플립 구현. 단 이 컴포넌트는 랜딩/갤러리에서만 쓰이고 **카드 상세 페이지(`app/card/[cardSlug]/page.tsx:61-74`)는 정적 `<img>` 한 장뿐**. "Hologram"은 실제 쉐이더가 아니라 텍스트 뱃지 |
| 슬리브/탑로더 규격 맞춤 커머스 연동 | 🔴 **미구현 (죽은 컴포넌트)** | `components/sleeve-compatibility-guide.tsx`가 56×87mm 규격 안내 UI로 완성돼 있으나 **어떤 페이지에서도 import되지 않는 고아 컴포넌트**. `lib/affiliate.ts`도 대상이 카드 자체 구매처(eBay/포카마켓/DK샵)일 뿐 슬리브·탑로더 채널은 없음 |
| SNS 예절샷 카드 생성기 (`/card-generator`) | 🟢 **완성 (약 75%)** | 9:16/1:1 비율 전환(`lib/card-generator/cardSizes.ts`), `html2canvas` 실제 캡처+다운로드, 헤더/푸터/QR 브랜딩 고정 렌더까지 실동작. 미구현: 인스타 다이렉트 공유 API·Web Share API 연동 없음 |

---

## 4. 기초 골조 및 10개 핵심 그룹 데이터

### 4-1. 정규화 스키마 (Artist → Member → Album → Version → PhotoCard)

- 스키마 자체는 `prisma/schema.prisma`에 완성돼 있고, `Artist`/`Version`은 **additive**(Group을 대체하지 않고 병행) 구조로 22개 파일이 여전히 `Group`을 참조 중이라는 사실이 스키마 주석에 명시돼 있음.
- **오늘 완료한 것**: `import-csv.ts`의 Member 소스를 `group_members_wikidata.csv`(1,927명/416개 그룹)로 교체, 노이즈 필터(`member-name-denylist.ts`, 200여 개 블랙리스트) 삭제, `nameKr` 동시 반영, 오염 멤버 정리 스윕을 전체 그룹으로 확장. `tsc --noEmit` 통과 확인.
- **✅ 종결 (2026-08-14 후속 조치)**: `prisma/seed.ts`를 완전히 삭제해 이원화 문제 자체를 제거했다. `import-csv.ts`가 유일한 정본 파이프라인이다.
- **DB 실제 반영 여부: 확인 불가** — Supabase 접속 불가로 `import-csv.ts` 재실행 및 카운트 검증을 하지 못했다. 지난 턴에서 이미 이 블로커를 보고했고, 이번 세션 내내 해소되지 않았다.

### 4-2. 10개 핵심 그룹 소싱 현황 (CSV 원본 기준 — DB 미반영)

| 그룹 | biasroom 원본(24건 상한) | **eBay 실물 수집 (2026-08-14)** | eBay 전체 매물 수 | Wikidata 멤버 | MVP 스코프 |
|---|---:|---:|---:|---:|:---:|
| BTS | 24 | **299** | 47,091 | 7 | ✅ |
| SEVENTEEN | 24 | **300** | 19,724 | 13 | ✅ |
| Stray Kids | 24 | **300** | 38,446 | 10 | ✅ |
| ENHYPEN | 24 | **299** | 15,258 | 7 | ❌ |
| TOMORROW X TOGETHER | 24 | **299** | 3,153 | 5 | ❌ |
| NewJeans | 24 | **300** | 5,737 | 5 | ✅ |
| IVE | 24 | **299** | 8,694 | 6 | ❌ |
| aespa | 24 | **300** | 12,120 | 4 | ✅ |
| LE SSERAFIM | 24 | **297** | 8,149 | 6 | ❌ |
| TWICE | 24 | **298** | 24,354 | 9 | ❌ |
| **합계** | 240 | **2,991** | 182,726 | — | — |

옛 "가격 있는 카드(poca_master_db_mb.csv)" 컬럼은 해당 파일 폐기와 함께 표에서 제거했다. `data/ebay_10core_groups.json`에 저장된 이 2,991건은 eBay Browse API 실 매물(이미지 URL/가격/판매자/item_id 포함)이며, 아직 DB에는 적재되지 않았고 Member/Version 태깅도 되어 있지 않다 — 상세는 [[full-audit-and-ebay-collection]] 참조.

**중대 발견 — 그룹당 24건 상한**: `biasroom_photocards_master.csv` 전체(662개 그룹)를 집계한 결과 **137개 그룹(20.7%)이 정확히 24건이고, 어떤 그룹도 24건을 넘지 않는다**(min=1, max=24, 평균=10.0). 10개 핵심 그룹 전부가 이 상한에 걸려 있다 — 이는 실제 카탈로그 크기가 아니라 **원본 수집 단계의 페이지네이션 상한(1페이지=24건)** 으로 보인다. BTS·세븐틴처럼 실제로는 수백 종의 포토카드가 존재하는 그룹도 원본 소스 자체가 24건에서 끊겨 있다는 뜻이다.

**MVP 스코프 갭**: `lib/mvp-scope.ts`의 `MVP_GROUP_SLUGS`는 5개(seventeen/stray-kids/bts/aespa/newjeans)뿐이다. 사용자가 지정한 10개 핵심 그룹 중 **ENHYPEN, TXT, IVE, LE SSERAFIM, TWICE 5개는 현재 MVP 스코프 밖**이라 `lib/queries.ts`의 모든 조회가 이들을 404 처리한다.

가격 데이터는 여전히 별도 과제로 남아있다 — eBay 수집분에는 매물별 실거래 희망가(`price` 필드)가 있지만 이를 `PriceHistory`로 정규화하는 작업은 아직 하지 않았다.

---

## 5. 출입문 및 중단점 (인증 및 코드 프리즈)

### 5-1. 소셜 로그인(OAuth) 현황

`.env` 실제 값 확인 결과 (값은 노출하지 않고 설정 여부만 표기):

| 키 | 상태 |
|---|---|
| `AUTH_SECRET` | ✅ 설정됨 |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | ❌ 빈 값 |
| `AUTH_TWITTER_ID` / `AUTH_TWITTER_SECRET` | ❌ 빈 값 |
| `AUTH_KAKAO_ID` / `AUTH_KAKAO_SECRET` | ❌ 빈 값 |
| `AUTH_NAVER_ID` / `AUTH_NAVER_SECRET` | ❌ 빈 값 |

세션 암호화 시크릿만 세팅돼 있고 **4개 소셜 프로바이더 전부 더미 키조차 없는 완전 미설정 상태**다. `auth.ts`의 주석 규칙("Each provider only activates once BOTH its ID and SECRET are set")에 따르면 지금 상태로는 로그인 버튼을 눌러도 활성화된 프로바이더가 하나도 없다. 즉시 가동하려면 최소 1개 프로바이더(카카오 또는 구글 권장 — 한국 팬덤 앱이므로 카카오 우선)의 개발자 콘솔 키 발급이 필요하다.

### 5-2. 코드 프리즈 위치

- **HEAD 커밋**: `72a6590` — "feat: Wikidata 멤버 마스터, Gallery/Vault/Search API, P0 필터 UI 통합" (2026-08-14 00:29:50 +0900)
- **HEAD 이후 워킹트리 변경사항** (이번 세션 작업분 포함, 전부 미커밋):
  - 수정: `import-csv.ts`(Wikidata 소스 전환), `schema.prisma`, `card-tabs.tsx`, `PhotocardDetailModal.tsx`, `photocard-guide.ts`, `ko.json`, `package.json`
  - 삭제: `prisma/member-name-denylist.ts`
  - 미추적 신규: `prisma/_migrate_schema.ts`, `prisma/migrations/20260814045522_add_photocard_guide_content/`, `Tab2_Price.tsx`, `photocard-price.ts`, `image-processor.ts`, `query-builder.ts`, `dev-modal-preview/` 외 다수
  - **⚠️ 별도 세션 산출물로 추정되는 미추적 파일**: `CURRENT_STATUS.md`, `CURRENT_STATUS_DB_DETAILED.md`, `RUN_COUNT_CHECK.md`, `db_count_check.py`(**DB 비밀번호 평문 포함 — 즉시 삭제 권장**), `poca-exchange/count_check.ts` — 이 대화 세션에서 만든 파일이 아님

이 상태 그대로 "코드 프리즈"를 선언하면 위 미커밋 변경사항(특히 오늘의 Wikidata 파이프라인 교체)이 커밋되지 않은 채로 남는다. 프리즈를 확정하려면 리뷰 후 커밋이 필요하다.

### 5-3. 세션 메모리 미반영 사항

**✅ 이번 후속 조치로 메모리에 기록 완료**: import-csv.ts Wikidata 전환, seed.ts 이원화 문제와 그 해결(완전 삭제), Math.random() 난수 문제, 24건 상한 발견과 10개 그룹 eBay 수집(2,991건)까지 — [[data-cleaning-process]], [[full-audit-and-ebay-collection]] 참조.

**여전히 미해결/미기록**:
1. Supabase DB가 이번 세션 내내 DNS 조회 불가 상태였다는 사실 (원인: 무활동 일시정지 추정) — 메모리에 아직 별도 기록 안 함, 사용자 확인 대기 중
2. `db_count_check.py`의 평문 DB 비밀번호 노출 건 — 보고만 했고 파일 삭제나 비밀번호 회전은 아직 실행 안 함
3. Bias Room 벤치마킹 UI/사업모델 진단서 2건(아티팩트로 공유됨) — 메모리에 아직 기록 안 함
4. eBay로 수집한 2,991건을 PhotoCard로 정규화(제목 파싱/멤버 매칭/중복 제거)하는 후속 작업 — 미착수

---

## 부록 — 상태 판정 기준

- 🟢 **완성**: 실제 로직/UI가 존재하고 페이지에 연결되어 동작
- 🟡 **부분 구현**: 코드는 존재하나 핵심 기능(인터랙션/자동화/전체 페이지 연결) 일부가 빠짐
- 🔴 **미구현**: 관련 코드가 전무하거나, 존재해도 어디에도 연결되지 않은 고아 코드
- **기획만 존재**: 스키마·상수·주석 수준에서만 설계돼 있고 실행 코드가 전혀 없음
