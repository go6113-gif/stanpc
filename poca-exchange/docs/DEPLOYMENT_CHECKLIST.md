# StanPC MVP 프로덕션 배포 체크리스트

## 📋 개요
이 문서는 StanPC MVP를 프로덕션 환경으로 배포하기 위한 단계별 가이드입니다.

**예상 소요 시간:** 15-30분 (DB 선택 후)
**배포 준비도:** ✅ 100% 완료 (개발 코드 준비됨)

---

## 🎯 배포 목표
- [x] Prisma 스키마 검증 (`npx prisma format`)
- [x] 실제 PostgreSQL 데이터베이스 연결 설정
- [ ] 데이터베이스 스키마 적용 (`npx prisma db push`)
- [ ] 실데이터 시딩 (`npm run db:seed`)
- [ ] API 엔드포인트 검증 (실데이터 응답 확인)
- [ ] 프론트엔드 페이지 테스트 (/gallery, /photocard/[id])
- [ ] 배포 완료 상태 업데이트

---

## 📊 현재 환경 상태

### ✅ 완료된 항목
| 항목 | 상태 |
|------|------|
| Prisma 스키마 | ✅ 완성 |
| seed.ts 스크립트 | ✅ 완성 |
| seed_data.json | ✅ 준비 (10개 PriceHistory + 10개 SKU) |
| Mock API 엔드포인트 | ✅ 완성 |
| /api/photocards | ✅ Fallback 로직 포함 |
| /api/photocards/[id] | ✅ 완성 |
| /api/price-history | ✅ 완성 |
| /api/sku-mapping | ✅ GET/POST 완성 |

### ❌ 진행 중인 항목
| 항목 | 현재 상태 |
|------|---------|
| 실제 PostgreSQL 연결 | ⏳ 대기 중 |
| 데이터베이스 스키마 적용 | ⏳ 대기 중 |
| 실데이터 시딩 | ⏳ 대기 중 |

---

## 🚀 Step 1: PostgreSQL 데이터베이스 선택 및 설정

### 옵션 A: Supabase (권장 - 프로덕션)

Supabase는 클라우드 PostgreSQL 호스팅 서비스로, 프로덕션 환경에 최적화되어 있습니다.

#### 1.1 Supabase 프로젝트 생성
1. https://supabase.com 에 접속
2. "New project" 클릭
3. 프로젝트 이름: `stanpc-prod`
4. Database Password: 강력한 비밀번호 설정
5. Region: 가장 가까운 지역 선택 (한국 → Singapore 권장)
6. "Create new project" 클릭 (약 2-3분 소요)

#### 1.2 연결 문자열 복사
1. Supabase 대시보드에서 "Settings" → "Database" 클릭
2. "Connection string" 섹션 아래 "URI" 탭 선택
3. 연결 문자열 복사 (아래 형식)

```
postgresql://postgres.xxxxx:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

#### 1.3 .env 파일 업데이트
```bash
cd D:\StanPC\poca-exchange
```

`.env` 파일의 DATABASE_URL을 다음과 같이 수정:

```env
# Supabase Production
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

**⚠️ 주의:** 연결 문자열에 실제 비밀번호가 포함됩니다. 절대 공개 저장소에 커밋하지 마세요.

---

### 옵션 B: 로컬 PostgreSQL (개발 전용)

로컬 PostgreSQL을 설치하여 사용할 수 있습니다.

#### 2.1 Windows에 PostgreSQL 설치
1. https://www.postgresql.org/download/windows/ 에서 PostgreSQL 15 이상 다운로드
2. 설치 진행 (Password: 기억하기 쉬운 비밀번호 설정)
3. 포트: 5432 (기본값)
4. 설치 완료 후 서비스 시작 확인

#### 2.2 로컬 데이터베이스 생성
```powershell
# PostgreSQL 시작
Get-Service postgresql-x64-15 | Start-Service

# 데이터베이스 생성
psql -U postgres
```

PostgreSQL 프롬프트에서:
```sql
CREATE DATABASE stanpc_prod;
CREATE USER stanpc WITH PASSWORD 'your_secure_password';
ALTER ROLE stanpc WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE stanpc_prod TO stanpc;
\q
```

#### 2.3 .env 파일 업데이트
```env
DATABASE_URL="postgresql://stanpc:your_secure_password@localhost:5432/stanpc_prod"
```

---

### 옵션 C: Docker PostgreSQL (개발용)

Docker를 이용한 PostgreSQL 실행 (Docker 설치 필수):

```bash
cd D:\StanPC
docker-compose up -d
```

`.env` 파일:
```env
DATABASE_URL="postgresql://stanpc:stanpc_dev_password@localhost:5432/stanpc_db"
```

---

## 🛠️ Step 2: 프리즘 스키마 검증

Prisma 스키마 구문 검증 및 포맷팅:

```bash
cd D:\StanPC\poca-exchange

# 스키마 검증 및 자동 포맷팅
npx prisma format

# 출력 예시:
# ✔ Generated Prisma Client (7.9.1)
```

---

## 🗄️ Step 3: 데이터베이스 스키마 적용

Prisma 스키마를 실제 데이터베이스에 적용합니다:

```bash
cd D:\StanPC\poca-exchange

# Prisma 마이그레이션 (초기 설정)
npx prisma db push --accept-data-loss
```

**예상 출력:**
```
✔ Your database is now in sync with your Prisma schema

✔ Generated Prisma Client (7.9.1)

The following migrations have been applied:

migrations/
  └─ 20240811000000_init/
    └─ migration.sql

✨ All done!
```

### 오류 해결

#### 에러: "Can't reach database server (P1001)"
```bash
# 데이터베이스 연결 테스트
psql "postgresql://user:password@host:5432/database"

# Supabase의 경우, 데이터베이스가 실제로 생성될 때까지 대기 (2-3분)
```

#### 에러: "Authentication failed for user 'postgres'"
- 비밀번호가 올바른지 확인
- .env 파일에 특수 문자가 있는 경우 URL 인코딩 확인

---

## 🌱 Step 4: 데이터베이스 시딩 (실데이터 적재)

미리 준비된 seed_data.json 파일의 데이터를 데이터베이스에 적재합니다:

```bash
cd D:\StanPC\poca-exchange

# 시드 실행 (Groups, Members, PhotoCards, PriceHistory, GlobalSKUMapping 모두 포함)
npm run db:seed
```

**예상 출력:**
```
============================================================
STANPC DATABASE SEEDING
============================================================

🌱 Starting directory content seeding...
✅ Seeded 11 groups
✅ Seeded members
✅ Seeded photo cards

💰 Seeding PriceHistory...
✅ Seeded 10 PriceHistory records

🔗 Seeding GlobalSKUMapping...
✅ Seeded 10 GlobalSKUMapping records

============================================================
✨ All seeding completed successfully!
============================================================
```

### 시드 내용
- **Groups:** TWICE, BLACKPINK, EXO, Stray Kids, SEVENTEEN, Red Velvet, TXT, aespa, NCT Dream, NewJeans, IVE (총 11개)
- **Members:** 각 그룹별 대표 멤버 (총 12명)
- **PhotoCards:** 각 멤버별 포토카드 (총 12개)
- **PriceHistory:** 10개의 시계열 가격 기록 (eBay, Mercari, Buyee 포함)
- **GlobalSKUMapping:** 10개의 다중 마켓 SKU 매핑

---

## ✅ Step 5: 데이터베이스 검증

Prisma Studio를 통해 데이터가 올바르게 적재되었는지 확인:

```bash
cd D:\StanPC\poca-exchange

# Prisma Studio 열기 (브라우저에서 http://localhost:5555 에서 자동 열림)
npx prisma studio
```

### 확인 사항
1. **Groups 테이블**
   - 11개의 그룹이 모두 생성되었는지 확인
   - 각 그룹에 올바른 이름과 정보가 있는지 확인

2. **Members 테이블**
   - 각 그룹별로 멤버가 올바르게 연결되었는지 확인

3. **PhotoCards 테이블**
   - 12개의 포토카드가 생성되었는지 확인
   - 각 카드의 estimatedPrice와 badge 확인

4. **PriceHistory 테이블**
   - 10개의 가격 기록이 생성되었는지 확인
   - market (ebay, mercari, buyee) 다양성 확인

5. **GlobalSKUMapping 테이블**
   - 10개의 SKU 매핑이 생성되었는지 확인
   - 각 카드별 여러 마켓의 SKU가 있는지 확인

---

## 🔌 Step 6: API 엔드포인트 검증

백엔드 서버를 시작하고 API 응답을 테스트합니다:

```bash
cd D:\StanPC\poca-exchange

# 개발 서버 시작
npm run dev
```

서버가 실행되면 (http://localhost:3000):

### 6.1 /api/photocards 테스트 (모든 포토카드 조회)

```bash
curl -X GET "http://localhost:3000/api/photocards"
```

**예상 응답:**
```json
{
  "status": "success",
  "source": "database",
  "total": 12,
  "data": [
    {
      "id": "cuid...",
      "slug": "twice-tzuyu-Feel-Special",
      "cardName": "TZUYU - Feel Special",
      "groupName": "TWICE",
      "memberName": "TZUYU",
      "estimatedPrice": 45.99,
      "priceHistory": [
        { "date": "2024-08-10", "price": 45.99, "market": "ebay" },
        { "date": "2024-08-09", "price": 48.50, "market": "mercari" }
      ],
      "skuMappings": [
        { "market": "ebay", "sku": "123456789", "skuUrl": "https://ebay.com/..." },
        { "market": "mercari", "sku": "m-987654321", "skuUrl": "https://mercari.com/..." }
      ]
    }
    // ... 더 많은 카드
  ]
}
```

### 6.2 /api/photocards/[id] 테스트 (개별 포토카드)

```bash
curl -X GET "http://localhost:3000/api/photocards/twice-tzuyu-Feel-Special"
```

**예상 응답:**
```json
{
  "status": "success",
  "source": "database",
  "data": {
    "id": "cuid...",
    "slug": "twice-tzuyu-Feel-Special",
    "cardName": "TZUYU - Feel Special",
    "groupName": "TWICE",
    "memberName": "TZUYU",
    "estimatedPrice": 45.99,
    "priceHistory": [ ... ],
    "skuMappings": [ ... ]
  }
}
```

### 6.3 /api/price-history 테스트 (가격 이력 조회)

```bash
curl -X GET "http://localhost:3000/api/price-history?cardId=twice-tzuyu-Feel-Special&days=90"
```

### 6.4 /api/sku-mapping 테스트 (SKU 매핑 조회)

```bash
curl -X GET "http://localhost:3000/api/sku-mapping?cardId=twice-tzuyu-Feel-Special"
```

---

## 🎨 Step 7: 프론트엔드 페이지 검증

브라우저에서 다음 페이지들을 방문하여 실데이터가 올바르게 표시되는지 확인합니다:

### 7.1 갤러리 페이지 (/gallery)
```
http://localhost:3000/gallery
```

**확인 사항:**
- [ ] 12개의 포토카드가 그리드로 표시됨
- [ ] 각 카드에 이미지, 가격, 배지가 표시됨
- [ ] Sticky Filter가 동작함 (가격대, 그룹, 정렬)
- [ ] 응답 헤더에 `source: "database"` 표시됨

### 7.2 포토카드 상세 페이지 (/photocard/[slug])
```
http://localhost:3000/photocard/twice-tzuyu-Feel-Special
```

**확인 사항:**
- [ ] 포토카드 기본 정보 표시
- [ ] 가격 변동 차트 표시 (PriceHistory 데이터)
- [ ] 다중 마켓 구매 링크 표시 (eBay, Mercari, Buyee, Bunjang)
- [ ] SKU 매핑 데이터 올바르게 표시됨
- [ ] 상세 페이지에서 `source: "database"` 확인

### 7.3 필터링 테스트
```
http://localhost:3000/gallery?priceRange=30-60&sortBy=price-asc
```

**확인 사항:**
- [ ] 가격대 필터가 적용됨 (30-60 USD)
- [ ] 정렬이 올바르게 적용됨 (낮은 가격 순)

---

## 📈 Step 8: 배포 완료 확인

모든 단계가 완료되었음을 확인합니다:

### 체크리스트
- [ ] PostgreSQL 데이터베이스 생성 및 연결
- [ ] .env DATABASE_URL 설정
- [ ] `npx prisma db push` 실행 성공
- [ ] `npm run db:seed` 실행 성공
- [ ] Prisma Studio에서 데이터 확인
- [ ] `/api/photocards` 응답에서 `source: "database"` 확인
- [ ] `/gallery` 페이지에서 실데이터 표시
- [ ] `/photocard/[id]` 페이지에서 PriceHistory 차트 표시
- [ ] API 필터링 및 정렬 정상 동작

### 배포 상태 업데이트
모든 체크리스트를 완료한 후:

```bash
# docs/SESSION_HANDOFF.md의 마스터 상태를 다음과 같이 업데이트:
# "🎉 **프로덕션 라이브 완료** ✅ (실데이터 DB 연결, 모든 엔드포인트 검증 완료)"
```

---

## 🆘 트러블슈팅

### 문제: "Can't connect to database"

**원인:** DATABASE_URL이 잘못되었거나 데이터베이스 서버가 실행 중이 아님

**해결방법:**
```bash
# 1. .env 파일의 DATABASE_URL 확인
cat .env | grep DATABASE_URL

# 2. 연결 문자열 테스트 (Supabase)
psql "postgresql://user:password@db.xxxxx.supabase.co:5432/postgres"

# 3. Supabase의 경우, Status 대시보드 확인
# https://status.supabase.com
```

### 문제: "PhotoCard not found for slug: xxx"

**원인:** seed_data.json의 photocard_slug가 실제 PhotoCard 레코드와 일치하지 않음

**해결방법:**
```bash
# 1. 현재 생성된 PhotoCard 확인
npx prisma studio

# 2. seed_data.json에서 slug 확인
cat scripts/seed_data/seed_data.json | grep photocard_slug

# 3. 일치하지 않으면 seed_data.json 또는 seed.ts 수정 후 재실행
npm run db:seed
```

### 문제: "Duplicate key value violates unique constraint"

**원인:** 같은 데이터를 두 번 시드하려고 시도

**해결방법:**
```bash
# 1. 데이터베이스 리셋 (주의: 모든 데이터 삭제)
npx prisma db push --skip-generate --force-reset

# 2. 다시 시드
npm run db:seed
```

---

## 📚 참고 문서

- [Prisma 공식 문서](https://www.prisma.io/docs/)
- [Supabase 설정 가이드](https://supabase.com/docs)
- [SESSION_HANDOFF.md](./SESSION_HANDOFF.md)
- [SEEDING_GUIDE.md](./SEEDING_GUIDE.md)

---

## 📝 체크리스트 요약

배포 과정을 추적하기 위해 다음 체크리스트를 사용하세요:

```
배포 단계:
- [ ] Step 1: PostgreSQL 선택 및 설정 완료
- [ ] Step 2: Prisma 스키마 검증 완료
- [ ] Step 3: 데이터베이스 스키마 적용 완료
- [ ] Step 4: 데이터베이스 시딩 완료
- [ ] Step 5: 데이터베이스 검증 완료
- [ ] Step 6: API 엔드포인트 검증 완료
- [ ] Step 7: 프론트엔드 페이지 검증 완료
- [ ] Step 8: 배포 완료 확인 및 문서 업데이트
```

---

**최종 업데이트:** 2026-08-11 / **상태:** ✅ 배포 준비 완료
