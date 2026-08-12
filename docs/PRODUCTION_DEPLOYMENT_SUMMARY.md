# 🚀 StanPC MVP 프로덕션 배포 요약

**상태:** ✅ 프로덕션 라이브 준비 완료  
**업데이트:** 2026-08-11  
**담당자:** AI Assistant  

---

## 📌 배포 준비 현황

### ✅ 완료된 항목
| 항목 | 상태 | 위치 |
|------|------|------|
| Prisma 스키마 | ✅ 완성 | `poca-exchange/prisma/schema.prisma` |
| Node.js 시더 스크립트 | ✅ 완성 | `poca-exchange/prisma/seed.ts` |
| 시드 데이터 (JSON) | ✅ 준비 | `poca-exchange/scripts/seed_data/seed_data.json` |
| Mock API 엔드포인트 | ✅ 완성 | `poca-exchange/app/api/photocards/*` |
| 배포 가이드 | ✅ 작성 완료 | `docs/DEPLOYMENT_CHECKLIST.md` |
| 프로젝트 핸드오프 | ✅ 업데이트 | `docs/SESSION_HANDOFF.md` |

### 📊 시드 데이터 내용
```
- Groups: 11개 (TWICE, BLACKPINK, EXO, Stray Kids, SEVENTEEN, 등)
- Members: 12명 (각 그룹 대표 멤버)
- PhotoCards: 12개 (각 멤버별 포토카드)
- PriceHistory: 10개 (eBay, Mercari, Buyee 가격 기록)
- GlobalSKUMapping: 10개 (다중 마켓 SKU 매핑)
```

---

## 🎯 3가지 배포 옵션

### 🏆 옵션 1: Supabase (권장 - 프로덕션)

**소요 시간:** 5-10분  
**난이도:** ⭐⭐☆

```bash
# 1. Supabase 프로젝트 생성 (https://supabase.com)
#    - Project name: stanpc-prod
#    - Region: Singapore (한국 권장)
#    - 생성 후 2-3분 대기

# 2. 연결 문자열 복사
#    Settings → Database → Connection string (URI)

# 3. .env 파일 업데이트
echo 'DATABASE_URL="postgresql://postgres.xxxxx:PASSWORD@db.xxxxx.supabase.co:5432/postgres"' > .env

# 4. 스키마 적용
npx prisma db push --accept-data-loss

# 5. 데이터 시딩
npm run db:seed
```

**장점:**
- ✅ 프로덕션 수준의 안정성
- ✅ 자동 백업 및 모니터링
- ✅ 글로벌 인프라

---

### 💻 옵션 2: 로컬 PostgreSQL

**소요 시간:** 10-15분  
**난이도:** ⭐⭐⭐

```bash
# 1. PostgreSQL 15+ 다운로드 및 설치
#    https://www.postgresql.org/download/windows/

# 2. 로컬 데이터베이스 생성
psql -U postgres
# 프롬프트에서:
# CREATE DATABASE stanpc_prod;
# CREATE USER stanpc WITH PASSWORD 'password';
# GRANT ALL PRIVILEGES ON DATABASE stanpc_prod TO stanpc;
# \q

# 3. .env 파일 업데이트
echo 'DATABASE_URL="postgresql://stanpc:password@localhost:5432/stanpc_prod"' > .env

# 4. 스키마 적용
npx prisma db push --accept-data-loss

# 5. 데이터 시딩
npm run db:seed
```

**장점:**
- ✅ 개발 환경 구축 용이
- ✅ 인터넷 불필요 (로컬)
- ✅ 빠른 속도

---

### 🐳 옵션 3: Docker PostgreSQL

**소요 시간:** 5-10분 (Docker 설치 필요)  
**난이도:** ⭐☆☆

```bash
# 1. Docker 설치 (https://www.docker.com/products/docker-desktop)

# 2. PostgreSQL 시작
cd D:\StanPC
docker-compose up -d

# 3. 스키마 적용
npx prisma db push --accept-data-loss

# 4. 데이터 시딩
npm run db:seed
```

**장점:**
- ✅ 환경 동일성 보장
- ✅ 빠른 설정
- ✅ 재현 가능

---

## 🔄 배포 절차 (선택한 옵션 후)

### Step 1: 프로젝트 디렉터리 이동
```bash
cd D:\StanPC\poca-exchange
```

### Step 2: Prisma 스키마 검증
```bash
npx prisma format
# 출력: ✔ Generated Prisma Client
```

### Step 3: 데이터베이스 스키마 적용
```bash
npx prisma db push --accept-data-loss
# 출력: ✔ Your database is now in sync with your Prisma schema
```

### Step 4: 데이터 시딩 (실데이터 적재)
```bash
npm run db:seed
# 출력:
# 🌱 Starting directory content seeding...
# ✅ Seeded 11 groups
# ✅ Seeded members
# ✅ Seeded photo cards
# 💰 Seeding PriceHistory...
# ✅ Seeded 10 PriceHistory records
# 🔗 Seeding GlobalSKUMapping...
# ✅ Seeded 10 GlobalSKUMapping records
# ✨ All seeding completed successfully!
```

### Step 5: Prisma Studio에서 검증
```bash
npx prisma studio
# 브라우저에서 http://localhost:5555 자동 열림
# ✓ Groups: 11개 확인
# ✓ Members: 12명 확인
# ✓ PhotoCards: 12개 확인
# ✓ PriceHistory: 10개 확인
# ✓ GlobalSKUMapping: 10개 확인
```

### Step 6: 개발 서버 시작 및 API 검증
```bash
npm run dev
# http://localhost:3000 에서 접근
```

---

## ✅ API 엔드포인트 검증

### /api/photocards (모든 포토카드)
```bash
curl "http://localhost:3000/api/photocards"
```

**예상 응답:**
```json
{
  "status": "success",
  "source": "database",  ← ⭐ 중요: "database" 확인
  "total": 12,
  "data": [...]
}
```

### /api/photocards/[id] (개별 포토카드)
```bash
curl "http://localhost:3000/api/photocards/twice-tzuyu-Feel-Special"
```

### /api/price-history (가격 이력)
```bash
curl "http://localhost:3000/api/price-history?cardId=twice-tzuyu-Feel-Special"
```

### /api/sku-mapping (SKU 매핑)
```bash
curl "http://localhost:3000/api/sku-mapping?cardId=twice-tzuyu-Feel-Special"
```

---

## 🎨 UI 페이지 검증

### /gallery (포토카드 갤러리)
```
http://localhost:3000/gallery
```

**확인 사항:**
- [ ] 12개 포토카드 표시
- [ ] 필터링 동작 (가격대, 그룹, 정렬)
- [ ] 실데이터 표시 (가격, 배지)
- [ ] 개별 카드 클릭하면 상세 페이지 이동

### /photocard/[slug] (포토카드 상세)
```
http://localhost:3000/photocard/twice-tzuyu-Feel-Special
```

**확인 사항:**
- [ ] 포토카드 기본 정보 표시
- [ ] 가격 변동 차트 표시 (PriceHistory)
- [ ] 다중 마켓 링크 표시 (eBay, Mercari, Buyee, Bunjang)
- [ ] SKU 매핑 정보 올바르게 표시

---

## 📋 최종 체크리스트

배포 완료 후 다음을 확인하세요:

```
프로덕션 배포 체크리스트:
- [ ] PostgreSQL 데이터베이스 생성
- [ ] .env DATABASE_URL 설정
- [ ] npx prisma db push --accept-data-loss 실행 (✅ 성공)
- [ ] npm run db:seed 실행 (✅ 성공)
- [ ] Prisma Studio에서 데이터 확인
- [ ] /api/photocards 응답에서 "source": "database" 확인
- [ ] /gallery 페이지에서 12개 카드 표시 확인
- [ ] /photocard/[id] 페이지에서 PriceHistory 차트 표시 확인
- [ ] API 필터링 및 정렬 정상 동작 확인
- [ ] docs/SESSION_HANDOFF.md 최종 상태 확인 (프로덕션 라이브 완료)
```

---

## 📚 참고 문서

| 문서 | 설명 | 위치 |
|------|------|------|
| DEPLOYMENT_CHECKLIST.md | 8단계 상세 배포 가이드 | docs/ |
| SESSION_HANDOFF.md | 프로젝트 전체 상태 | docs/ |
| SEEDING_GUIDE.md | 데이터 시딩 가이드 | docs/ |
| schema.prisma | DB 스키마 정의 | poca-exchange/prisma/ |

---

## 🆘 문제 해결

### "Can't reach database (P1001)"
```bash
# 1. .env 파일의 DATABASE_URL 확인
cat .env | grep DATABASE_URL

# 2. 연결 문자열 테스트 (psql 또는 MySQL Workbench 사용)
psql "postgresql://user:password@host:5432/database"

# 3. Supabase의 경우 대시보드에서 Database 상태 확인
```

### "PhotoCard not found for slug: xxx"
```bash
# 1. Prisma Studio에서 PhotoCard 확인
npx prisma studio

# 2. seed_data.json의 photocard_slug와 일치 확인

# 3. DB 재설정 필요한 경우:
npx prisma db push --skip-generate --force-reset
npm run db:seed
```

### API 응답이 Mock 데이터인 경우 (source: "mock")
```bash
# 1. 데이터베이스 연결 확인
# 2. PriceHistory/GlobalSKUMapping 데이터 시딩 재실행
# 3. npm run dev 재시작
```

---

## 📈 성공 신호

배포가 성공했다면:

✅ API 응답에 `"source": "database"` 표시  
✅ `/gallery` 페이지에 실데이터 포토카드 표시  
✅ `/photocard/[id]` 페이지에 PriceHistory 차트 표시  
✅ Prisma Studio에서 Groups, Members, PhotoCards 모두 표시  
✅ 필터링 및 정렬 기능 정상 동작  

---

## 🎉 배포 완료!

모든 단계를 완료하면 StanPC MVP는 **프로덕션 라이브 상태**입니다.

**다음 단계:**
- Phase 4: 이미지 파이프라인 (Supabase Storage 통합)
- 실시간 가격 업데이트 (WebSocket)
- 스케줄된 크롤링 (자동 실행)

---

**문제 발생 시:**  
📘 `docs/DEPLOYMENT_CHECKLIST.md` 의 "🆘 트러블슈팅" 섹션 참고

**마지막 업데이트:** 2026-08-11  
**상태:** ✅ 프로덕션 라이브 준비 완료
