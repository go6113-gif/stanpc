# Supabase 클라우드 PostgreSQL 빠른 설정 (5분)

## Step 1: Supabase 프로젝트 생성

1. https://supabase.com 접속
2. "New project" 클릭
3. 정보 입력:
   - Project name: `stanpc-prod`
   - Database Password: 복잡한 비밀번호 입력 (기억하세요)
   - Region: **Singapore** (또는 가장 가까운 지역)
4. "Create new project" 클릭
5. **2-3분 대기** (데이터베이스 초기화)

## Step 2: 연결 문자열 복사

Supabase 대시보드에서:
1. 좌측 메뉴: "Settings"
2. "Database" 탭
3. "Connection string" 섹션 → "URI" 탭
4. 연결 문자열 복사 (아래 형식)

```
postgresql://postgres.xxxxx:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

## Step 3: 로컬 .env 파일 수정

D:\StanPC\poca-exchange\.env 파일을 열고:

```env
# Supabase Production 클라우드
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# 나머지는 유지
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
AUTH_SECRET="Y/rbGz58y4UzI4xdL5WJVUqtjQWie9++26GVlhiSVwQ="
# ... 기타 설정
```

## Step 4: 배포 실행

```powershell
cd D:\StanPC\poca-exchange

# 1. Prisma 스키마 동기화 (테이블 생성)
npx prisma db push --accept-data-loss

# 2. 실데이터 시딩 (Groups, Members, PhotoCards, PriceHistory, SKU)
npm run db:seed

# 3. 로컬 개발 서버 시작
npm run dev
```

## Step 5: 검증

브라우저에서:
- http://localhost:3000/gallery → 12개 카드 표시 확인
- http://localhost:3000/photocard/twice-tzuyu-Feel-Special → 가격 차트 확인

API 응답에서 `"source": "database"` 표시 확인

---

**정상 완료 신호:**
✅ API 응답: `"source": "database"`
✅ /gallery: 12개 카드 + 필터링 동작
✅ /photocard/[id]: PriceHistory 차트 표시

**문제 발생 시:** docs/DEPLOYMENT_CHECKLIST.md의 "🆘 트러블슈팅" 참고
