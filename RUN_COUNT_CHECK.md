# DB 현재 데이터 건수 조회 가이드

**상황**: 네트워크 제약으로 현재 세션에서 DB 직접 조회 불가능  
**해결**: 아래 두 가지 방법 중 택일

---

## 방법 1️⃣ : TypeScript 스크립트 실행 (권장)

```bash
cd D:\StanPC\poca-exchange
npx tsx count_check.ts
```

**출력 예시**:
```json
{
  "group": 920,
  "album": 4250,
  "photoCard": 3400,
  "priceHistory": 2900,
  "member": 450,
  "artist": 80,
  "version": 200,
  "user": 0,
  "binder": 0,
  "skuMapping": 0,
  "waitlist": 0,
  "badge": 0,
  "notification": 0,
  "photoCardWithGuide": 0,
  "photoCardWithImage": 3200,
  "photoCardWithMember": 2100,
  "photoCardWithAlbum": 3400,
  "photoCardWithPrice": 2800,
  "groupSample": [...]
}
```

**스크립트 위치**: `D:\StanPC\poca-exchange\count_check.ts` (이미 생성됨)

---

## 방법 2️⃣ : Prisma Studio (GUI)

```bash
cd D:\StanPC\poca-exchange
npx prisma studio
```

- 브라우저 http://localhost:5555 에서 각 테이블 확인
- 우측 상단 "Group", "Album" 등에 행 수 표시됨

---

## 방법 3️⃣ : Seed 먼저 실행 후 조회

만약 seed가 아직 안 되었다면:

```bash
cd D:\StanPC\poca-exchange

# 1. Seed 실행 (console output 기록)
npm run db:seed

# 2. 그 후 조회
npx tsx count_check.ts
```

**Seed 실행 시 기록해야 할 수치**:
- ✅ Seeded N groups from CSV
- ✅ Seeded M albums from CSV (deduped)  ← **이것이 중복 제거된 최종 건수**
- ✅ Created K cards, Updated L cards from CSV
- ✅ Seeded P price history records

---

## 다음 단계

1. 위 명령 실행 후 **JSON 출력 또는 화면 스크린샷** 전달
2. 그러면 메모리에 저장하고 보고서 수정

---

**현재 예상 수치** (비교용):
| 테이블 | 예상 범위 |
|-------|---------|
| Group | ~880-920 |
| Album | ~3,300-4,700 (dedup) |
| PhotoCard | ~3,300-3,600 |
| PriceHistory | ~2,700-3,100 |
