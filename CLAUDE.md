# StanPC 개발 규칙

> 이 파일은 새 세션마다 자동 로드됩니다. 긴 배경 설명을 다시 붙여넣지 마세요.
> 작업 지시는 "무엇을 만들지"만 쓰고, "어디에/어떻게"는 이 문서를 따릅니다.

---

## ⚠️ 작업 전 필독 (사고 방지 3항목)

### 1. 작업 대상은 `poca-exchange/` 입니다. 루트가 아닙니다.

레포에 Next.js 프로젝트가 **2개** 있습니다. 실수로 루트를 고치면 배포에 반영되지 않습니다.

| | `D:\StanPC\` (루트) | **`D:\StanPC\poca-exchange\`** |
|---|---|---|
| package name | `stanpc-main` | **`stanpc`** (homepage: stanpc.com) |
| Next / React | 14 / 18 | **16.3.0 / 19.2.8** |
| Prisma | 5.12 | **7.9.1** |
| Tailwind | 3 | **4** |
| 마이그레이션 | 없음 | **5개 적용됨** |
| 인증 | 없음 | **next-auth v5 (Auth.js)** |
| 판정 | 레거시 사본 — **수정 금지** | ✅ **정본(canonical)** |

- **모든 스키마·API·컴포넌트 작업은 `poca-exchange/` 안에서 합니다.**
- 루트의 `prisma/schema.prisma`, `app/` 은 건드리지 않습니다.
- 루트에 남는 것: 데이터 수집·분석 Python (`scripts/`, `data/`, `*.py`), 문서(`docs/`).

### 2. Next.js 16 / Prisma 7 — 학습 데이터와 다릅니다

`poca-exchange/AGENTS.md`가 경고하듯 이 버전은 breaking change가 많습니다.
API 라우트·`params` 처리·캐싱 규약을 **추측하지 말고** `poca-exchange/node_modules/next/dist/docs/` 의 해당 가이드를 먼저 읽으세요. Prisma 클라이언트는 `poca-exchange/app/generated/prisma/` 로 생성됩니다(기본 경로 아님).

### 3. Git 저장소가 아직 없습니다

`D:\StanPC`, `poca-exchange` 모두 `.git`이 없어 **단계별 커밋으로 롤백하는 안전망이 현재 작동하지 않습니다.** 1단계 착수 전에 초기화하세요.

```bash
cd D:/StanPC && git init && git add -A && git commit -m "chore: baseline before schema work"
```

`.gitignore`에 `.env`, `poca-exchange/.env`, `.ebay_token_cache.json`, `node_modules/`, `.next/`가 포함되는지 확인하세요. (**`.env`에 실 eBay 프로덕션 키와 `AUTH_SECRET`이 들어 있습니다.**)

---

## 서비스 정체성

**수집·자랑 중심의 팬덤 커뮤니티.** 거래 마켓플레이스가 아닙니다.

근거 (5개 플랫폼 19,386건 분석, `data/global_photocard_final_report.md`):
- 커뮤니티 4개 플랫폼 기준 수집/자랑 **39.7%** vs 거래 **40.2%** — 정확히 동률
- Bluesky 인게이지먼트: 소통글 평균 **11.43** vs 판매글 **5.09** (2.2배)
- 바인더·보관 니즈 **6,886건(35.5%)** — 5개 플랫폼 전부에서 상위 2위 이내인 유일한 니즈

### 상업적 리딩 금지 원칙

수익화(제휴 링크)는 **존재하되 UX를 주도하지 않습니다.**

| 금지 | 허용 |
|---|---|
| "지금 구매하기" 류 CTA를 1차 액션으로 배치 | 가격 텍스트 클릭 시 제휴 라우터 경유 |
| 가격을 카드 타일의 주 정보로 강조 | 상세 페이지 보조 정보로 표시 |
| 구매 유도 배너·팝업 | 규격(mm) 툴팁처럼 **소극적** 노출 |
| 판매글 우선 노출 피드 | 자랑/컬렉션 우선 피드 |

기본 액션 우선순위: **자랑 > 리액션 > 수집 기록 > (교환) > 구매**

---

## 스택

| 레이어 | 기술 |
|---|---|
| 프레임워크 | Next.js **16.3.0** (App Router) / React **19.2.8** / TypeScript 5 |
| 스타일 | Tailwind CSS **v4** (`@tailwindcss/postcss`) |
| ORM / DB | Prisma **7.9.1** + `@prisma/adapter-pg` / **PostgreSQL** |
| 인증 | next-auth **v5 beta** (`@auth/prisma-adapter`) — Google / Twitter / Kakao / Naver |
| 데이터 수집·분석 | Python 3 (`scripts/`, 루트) |
| 배포 | stanpc.com |

명령어는 모두 `poca-exchange/`에서 실행합니다.

```bash
npm run dev
npx prisma migrate dev --name <설명>
npx prisma generate
npm run db:seed
```

---

## 확정된 데이터 모델

### 기존 스키마 (마이그레이션 적용 완료 — 이 위에 얹습니다)

`poca-exchange/prisma/schema.prisma`

- **인증**: `User`(`isVerified`, `reputationScore`, `countryCode`) / `Account` / `Session` / `VerificationToken`
- **카탈로그(pSEO)**: `Group` → `Member` → `PhotoCard`, `Group` → `Album` → `PhotoCard`
  - `PhotoCard`: `slug`, `version`(POB/Weverse 등), `estimatedPrice`, `haveCount`, `wantCount`, `viewCount`, `badge`, `clickCount`
- **시세·마켓**: `PriceHistory`, `GlobalSKUMapping`(eBay/Mercari/Buyee SKU 매핑), `PriceReport`(유저 시세 제보), `OutboundClick`(제휴 클릭 로그)
- **컬렉션**: `UserBinderCard` (User ↔ PhotoCard, `tags[]`: `In Hand` / `ISO` / `#드볼중` / `Trade Bait`)

**중요**: `estimatedPrice`는 편집자가 수동으로 채웁니다. `PriceReport` 제출이 자동으로 덮어쓰지 않습니다.
**중요**: 모든 group/member/card 쿼리는 `lib/mvp-scope.ts`의 `MVP_GROUP_SLUGS` 5개(seventeen, stray-kids, bts, aespa, newjeans)로 스코프됩니다. 범위 밖 슬러그는 404입니다.

### 신규 확정 모델 (1단계에서 구축)

**Collector Index (덕력 포인트)** — `User.collector_index`, `User.manner_score`, `Badges` 매핑 테이블

**6종 감정 리액션** — enum 값은 아래로 고정. 순서·표기 임의 변경 금지.

```
부럽다 / 레전드 / 영롱하다 / 미쳤다 / 리스펙 / 나도갖고싶다
```

**Notifications** — enum: `HOF_EXPOSURE`, `DAILY_REACTION_SUMMARY`, `TRADE_MATCH` + 알림 상태 테이블

**WTT 미래 스키마** — `bundle_matches`, `trade_rooms`, `trade_items` 를 **사전 생성하되 MVP에서는 비활성화**합니다. 테이블만 만들고 UI·API는 노출하지 않습니다.

**Affiliate Link Router** — 외부 마켓 파트너 파라미터 주입 라우팅. 대상: **eBay / Buyee / DK Shop**. 기존 `OutboundClick` 로그와 연결합니다.

---

## MVP 우선순위 (변경 금지)

의존 구조상 순서가 고정입니다. WTT는 "보유 목록"(Vault)과 "카드 식별자"(Wiki) 없이 매칭이 불가능합니다.

| 순위 | MVP | 근거 수치 |
|:--:|---|---|
| **P1** | **My Vault** (디지털 바인더) | 바인더·보관 니즈 6,886건(35.5%) — 횡단 1위 |
| **P2** | **덕후 Wiki** (카드 식별 DB) | 정품·진위 4,395건(22.7%), eBay 상태 미기재 71.8% |
| **P3** | **WTT Playground** (교환 매칭) | 교환 2,000건(10.3%), 배송비/상품가 **40.9%** |

기능 명세 전문: `data/global_photocard_final_report.md` §4

### 규격 표준 스키마 (My Vault 핵심)

시장에 표준이 없습니다 — eBay 9,643건 중 A5 206 / pocket 359 / 3x3 40 / mm표기 121 / **B5 1건**, Naver 6,707건 중 **"디바이더" 0건**.
포켓 규격은 **3x3(9) / 2x2(4) / 4x4(16) / A5 / A4 / 커스텀 mm** 를 동시 지원하는 스키마로 설계합니다.

---

## 코딩 규약

- 주석·식별자는 영어, UI 문자열은 한국어(글로벌 확장 대비 i18n 키 분리 고려).
- 기존 스키마 주석 스타일을 따릅니다 — 모델 블록 위에 `// ---` 구분선 + 설계 의도와 **의도적 이탈 사유**를 명시.
- 마이그레이션은 `npx prisma migrate dev --name <설명>` 으로 생성. 기존 마이그레이션 파일 편집 금지.
- 리액션/알림 enum은 DB enum으로 정의하고 문자열 리터럴을 코드에 흩뿌리지 않습니다.
- 새 파일 추가 전 `lib/`에 유사 유틸이 있는지 먼저 확인 (`queries.ts`, `ebay.ts`, `slugify.ts`, `site-config.ts`, `mvp-scope.ts`).

---

## 환경변수 (`poca-exchange/.env`)

`DATABASE_URL` · `NEXT_PUBLIC_SITE_URL` · `EBAY_CLIENT_ID` · `EBAY_CLIENT_SECRET` · `AUTH_SECRET` · `AUTH_{GOOGLE,TWITTER,KAKAO,NAVER}_{ID,SECRET}`

- eBay는 **Browse API(OAuth client_credentials)** 를 씁니다. **Finding API는 은퇴하여 HTTP 418을 반환합니다** — 사용 금지.
- 소셜 로그인 키는 현재 **빈 값**입니다. 인증 실동작 테스트 전에 발급이 필요합니다.
- 신규 외부 연동 추가 시 `.env.example`에도 키 이름을 추가하세요.

---

## 데이터 자산 (루트)

| 경로 | 내용 |
|---|---|
| `data/global_photocard_final_report.md` | 5개 플랫폼 19,386건 최종 분석 보고서 (기획 근거) |
| `data/global_photocard_stats.json` | 위 보고서의 원천 수치 |
| `data/ebay_photocard_posts.json` | eBay 매물 9,643건 |
| `scripts/collect_ebay_data.py` | eBay 수집 (Finding→Browse 자동 전환) |
| `scripts/analyze_global_photocard.py` | 5개 플랫폼 통합 분석 |
| `biasroom_photocards_master.csv`, `poca_master_db_mb.csv` | 덕후 Wiki 시드 후보 |

Python 실행 시 콘솔이 cp949라 한글이 깨집니다. `PYTHONIOENCODING=utf-8` 을 붙이세요.
