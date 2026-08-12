# StanPC — K-POP 포토카드 도감 & 거래 플랫폼

## 🎯 프로젝트 개요

**StanPC**는 포토카드 수집가를 위한 올인원 플랫폼입니다.

- **My Vault**: 개인 컬렉션 관리 & 자랑 (SNS 공유용 카드 생성)
- **덕후 Wiki**: 멤버별 포카 도감 & 시세 검색
- **WTT Playground**: 1:1 카드 교환 (1단계 MVP)
- **Hall of Fame**: 실물 인증 완성 시 전광판 노출

---

## 📂 폴더 구조

```
D:\StanPC/
├── poca-exchange/               ← 정본 Next.js 16 앱
│   ├── app/                    (App Router, API, 페이지)
│   ├── components/             (React 컴포넌트)
│   ├── lib/                    (유틸리티, 타입 정의)
│   ├── prisma/                 (마이그레이션)
│   └── package.json
│
├── data/                        ← 포토카드 마스터 & 수집 데이터
│   ├── biasroom_*.csv          (931개 그룹, 6,646개 앨범)
│   ├── poca_master_db_mb.csv   (3,860개 카드 SKU)
│   ├── ebay_photocard_posts.json (9,643건 시세 데이터)
│   ├── naver_photocard_posts.json (6,707건 커뮤니티)
│   ├── bluesky_kpop_*.csv      (2,372건 SNS)
│   └── global_photocard_stats.json
│
├── scripts/                     ← Python 스크립트 (수집, 분석)
│   ├── collect_ebay_data.py
│   ├── analyze_global_photocard.py
│   ├── extract_members.py
│   └── ...
│
├── docs/                        ← 문서 & 가이드
│   ├── PHOTOCARD_BOT_SETUP.md
│   ├── REDDIT_SETUP_SUMMARY.md
│   └── ...
│
├── legacy/                      ← 레거시 코드 (비활성)
│   ├── test-bot/
│   ├── models/
│   └── ...
│
├── assets/                      ← 이미지 자산
├── sample_images/              ← 샘플 이미지
├── .claude/                    ← Claude Code 설정
│
├── CLAUDE.md                   ← 프로젝트 마스터 지침 ⭐
├── .env                        ← 환경 변수 (Git 제외)
├── docker-compose.yml          ← 로컬 개발 (Postgres)
├── requirements.txt            ← Python 의존성
└── README.md                   ← 이 파일
```

---

## 🚀 빠른 시작

### 1️⃣ 정본 앱 실행 (poca-exchange)

```bash
cd poca-exchange
npm install
npm run dev
# http://localhost:3000 접속
```

### 2️⃣ DB 초기화 (Seed)

```bash
# 마스터 데이터로 DB 채우기
cd poca-exchange
npx prisma db seed

# 마이그레이션 적용
npx prisma migrate deploy
```

### 3️⃣ 개발 서버 재시작

```bash
npm run dev
```

---

## 📊 현재 진행 상황

### ✅ 완료 (Stage 1 MVP)

- [x] **Card Generator API** — SNS 자랑용 카드 생성 (`GET /api/card-generator/user-data`)
- [x] **My Vault UI** — 바인더 관리 및 필터 (`/vault`)
- [x] **My Vault DB 연동** — 실제 DB 쿼리 (`GET /api/vault`)
- [x] **덕후 Wiki API** — 그룹/멤버 도감 검색 (`/api/wiki/*`)
- [x] **덕후 Wiki 페이지** — pSEO 동적 라우트 (`/wiki/[group]/[member]`)

### 🔄 진행 중

- [ ] DB Seed 작업 (9K+ 포카 마스터 데이터 입력)
- [ ] 인증 & 권한 구현 (NextAuth)
- [ ] Hall of Fame 페이지 & 실물 인증 가이드

### 📋 다음 (Stage 2)

- [ ] WTT (카드 교환) 매칭 알고리즘
- [ ] 실시간 알림 (Web Push API)
- [ ] Collector Index & 배지 시스템

---

## 🔑 핵심 데이터 출처

| 데이터 | 규모 | 출처 | 활용 |
|---|---:|---|---|
| **eBay 시세** | 9,643건 | Browse API | `PhotoCard.estimatedPrice` |
| **마스터 그룹/앨범** | 931 그룹, 6,646 앨범 | Biasroom | `Group`, `Album` 테이블 |
| **카드 SKU** | 3,860건 | poca_master_db_mb.csv | `PhotoCard` 테이블 |
| **Naver 커뮤니티** | 6,707건 | 블로그/카페 크롤링 | 시사점 (미통합) |

---

## 📋 마스터 지침

**⚠️ 모든 개발자는 먼저 읽을 것:**

→ [`CLAUDE.md`](./CLAUDE.md) — 프로젝트 목표, 기술 스택, 데이터 스키마, 개발 워크플로우

---

## 🛠 개발 환경

- **런타임**: Node.js 18+, Python 3.9+
- **프레임워크**: Next.js 16 (App Router)
- **DB**: PostgreSQL (Prisma ORM)
- **인증**: NextAuth.js (Google, Twitter, Kakao, Naver)
- **스타일링**: Tailwind CSS v4
- **스크립트**: Python (데이터 수집)

---

## 💾 마이그레이션 & Seed

### 기존 마이그레이션 조회

```bash
ls -la poca-exchange/prisma/migrations/
```

### 새 마이그레이션 생성

```bash
cd poca-exchange
npx prisma migrate dev --name <description>
```

### DB Seed 실행

```bash
cd poca-exchange
npx prisma db seed
```

---

## 📝 기여 가이드

1. 새 기능은 **별도 브랜치**에서 개발
2. **타입 체크** 통과: `npx tsc --noEmit`
3. **마이그레이션**은 `migrate dev` 사용 (기존 파일 편집 금지)
4. **Commit 메시지**: `feat:`, `fix:`, `docs:` 프리픽스
5. **PR 전**: 로컬에서 `npm run dev` 테스트

---

## 🚨 주의사항

- ⛔ `D:\StanPC\prisma/`, `D:\StanPC\app/` 절대 수정 금지 (레거시 사본)
- ✅ 작업 대상: `D:\StanPC\poca-exchange/`만
- 🔐 `.env` 파일은 Git 제외 (secrets 포함)

---

## 📞 문의

- **프로젝트 매니저**: StanPC
- **이메일**: support@stanpc.com
- **GitHub**: [stanpc-kpop](https://github.com/stanpc-kpop)

---

**Last Updated**: 2026-08-12  
**Latest Commit**: feat: parallel construction of Card Generator DB binding & My Vault UI/API
