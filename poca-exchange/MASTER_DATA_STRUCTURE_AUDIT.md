# 📊 StanPC 마스터 데이터 구조 감사 보고서

**작성일**: 2026-08-17  
**데이터 출처**: `lib/wiki-mock-data.ts`  
**형식**: 아파트 단지 메타포 기준 구조화 데이터

---

## 🏢 아파트 단지 메타포 요약

| 계층 | 메타포 | 실제 데이터 모델 | 현황 |
|------|--------|------------------|------|
| **L0 (Root)** | 단지 | StanPC 전체 위키 도감 | ✅ 확정 |
| **L1 (Building)** | 동 | 아티스트 그룹 (`Group`) | ✅ 확정 |
| **L2 (Unit)** | 호수 | 앨범 / 활동기 (`Album/Era`) | ✅ 확정 |
| **L3 (Room)** | 방 | 소속 멤버 (`Member`) | ✅ 확정 |
| **L4 (Furniture)** | 가구/소품 | 개별 포토카드 (`Photocard`) | 🔄 확장형 인덱스 |

---

## 1️⃣ 마스터 데이터 구조 (L0~L3: 확정 데이터)

### 동(Group) 목록: 6개

| 동번호 | 그룹명 | 멤버 수 | 활동기(Era) 수 | 상태 |
|--------|--------|---------|-----------------|------|
| 1 | **SEVENTEEN** | 6명 | 3개 | ✅ 확정 |
| 2 | **Stray Kids** | 6명 | 3개 | ✅ 확정 |
| 3 | **NewJeans** | 5명 | 3개 | ⚠️ 데이터 오류 (Hybe 포함) |
| 4 | **IVE** | 5명 | 3개 | ✅ 확정 |
| 5 | **TWICE** | 6명 | 3개 | ✅ 확정 |
| 6 | **ENHYPEN** | 5명 | 3개 | ✅ 확정 |

**총 6개 동** | **총 33명 멤버** | **총 18개 활동기**

---

### 호수(Album/Era) 목록

#### SEVENTEEN (3개 호수)
```
- God's Menu Era (v1)
- SEVENTEEN Era (v2)
- Maestro Era (v3)
```

#### Stray Kids (3개 호수)
```
- God's Menu Era (v1)
- UNFORGIVEN Era (v2)
- 특 Album Era (v3)
```

#### NewJeans (3개 호수)
```
- Attention, Cats! Era (v1)
- New Jeans Era (v2)
- Hype Boy Era (v3)
```

#### IVE (3개 호수)
```
- I AM Era (v1)
- Baddie Era (v2)
- Magnetic Era (v3)
```

#### TWICE (3개 호수)
```
- Tomboy Era (v1)
- Set Me Free Era (v2)
- Formula of Love Era (v3)
```

#### ENHYPEN (3개 호수)
```
- Blessed-Cursed Era (v1)
- Dimension Era (v2)
- Border: Carnival Era (v3)
```

---

### 방(Member) 목록

#### SEVENTEEN (6명)
```
1. Seungkwan
2. DK
3. Jeonghan
4. Joshua
5. Jun
6. Hoshi
```

#### Stray Kids (6명)
```
1. Felix
2. Bang Chan
3. Changbin
4. Hyunjin
5. Jeongin
6. Seungmin
```

#### NewJeans (5명) ⚠️ 데이터 오류
```
1. Hanni
2. Hybe          ← ❌ 잘못된 데이터 (사람명 아님)
3. Danielle
4. Minji
5. Jisoo
```

**정정 필요**: `Hybe` → 올바른 멤버명 (e.g., 혜인)

#### IVE (5명)
```
1. Wonyoung
2. Leeseo
3. Rei
4. Liz
5. Yujin
```

#### TWICE (6명)
```
1. Jihyo
2. Nayeon
3. Sana
4. Momo
5. Tzuyu
6. Chaeyoung
```

#### ENHYPEN (5명)
```
1. Sunghoon
2. Jungkook
3. Jake
4. Heeseung
5. Ni-ki
```

---

## 2️⃣ 가구(Photocard) 데이터 구조 (L4: 확장형 인덱스)

### 카드 기본 속성

#### 가구ID (CardID)
- **형식**: `card-0` ~ `card-99`
- **범위**: 100개 (현재 Mock 데이터 기준)
- **생성 로직**: ID 기반 순차 번호 (`card-${id}`)

#### 가구종류 (CardType): 5종류
```
1. Standard      - 기본형 포토카드
2. Hologram      - 홀로그램 특장 (고급)
3. Emboss        - 엠보싱 처리 (고급)
4. Glitter       - 글리터/반짝이 (프리미엄)
5. Special Edition - 특별판 (최상급)
```

#### 발매처/특전 (Manufacturer)
```
- 현재 모든 카드: "Big Hit Entertainment"
- 향후 확장: 다양한 제조사 추가 예정
```

#### 비주얼태그 (VisualTags): 5가지 조합
```
조합 1: ['만두볼콕', '안경선배']
조합 2: ['인형모자', '흑발냉미녀']
조합 3: ['전설의미공포', '역대최고가']
조합 4: ['급상승', '교복착장']
조합 5: ['캐주얼룩', '레전드미공포']
```

#### 예상가격 (EstimatedPrice)
- **범위**: 50,000 KRW ~ 550,000 KRW
- **생성 로직**: `Math.floor(Math.random() * 500000) + 50000`
- **특성**: 무작위 할당, 매번 새로고침 시 변경

#### 역대최고가 (HighestPrice)
- **범위**: 100,000 KRW ~ 1,300,000 KRW
- **생성 로직**: `Math.floor(Math.random() * 1000000) + 100000`
- **용도**: 시세 추적 최고가 기록

#### 희귀도 (Rarity): 4등급
```
- Mythic  (최고 희귀도) → Top 2-3%
- SSR     (높음) → Top 15-20%
- UR      (중간) → Top 35-40%
- Normal  (보통) → Top 45-50%
```

#### 보유상태 (IsOwned)
- **확률**: 40% (무작위, `Math.random() > 0.6`)
- **의미**: 사용자가 실제 소유 여부

#### 인증여부 (IsVerified)
- **확률**: 70% (무작위, `Math.random() > 0.3`)
- **의미**: 실물 인증 완료 여부

#### 위시수 (WishCount)
- **범위**: 0 ~ 5,000
- **생성 로직**: `Math.floor(Math.random() * 5000)`

#### 조회수 (ViewCount)
- **범위**: 0 ~ 10,000
- **생성 로직**: `Math.floor(Math.random() * 10000)`

#### 발매일 (ReleaseDate)
- **형식**: `YYYY-MM-DD`
- **범위**: 2024년 전체 (임의 월일)
- **생성 로직**: `2024-${MM}-${DD}` (무작위)

#### 시리얼번호 (SerialNumber)
- **형식**: `SN-${8자리 영숫자}`
- **예시**: `SN-ABC1DEF2`
- **생성 로직**: `Math.random().toString(36).substring(2, 10).toUpperCase()`

#### 총인쇄량 (TotalPrintRun)
- **범위**: 10,000 ~ 110,000장
- **생성 로직**: `Math.floor(Math.random() * 100000) + 10000`

#### 배경색 (DominantColor): 7가지
```
1. #FF69B4 - Hot Pink
2. #9D4EDD - Purple
3. #3A86FF - Blue
4. #FB5607 - Orange
5. #FFBE0B - Yellow
6. #8338EC - Violet
7. #FF006E - Red
```

#### 이미지 URL (ImageUrl): 8가지
```
1. photo-1514525253161-7a46d19cd819 (Portrait 1)
2. photo-1539571696357-5a69c006ae30 (Portrait 2)
3. photo-1494790108377-be9c29b29330 (Lifestyle)
4. photo-1507003211169-0a1dd7228f2d (Portrait 3)
5. photo-1517070213202-1e1119d278af (Portrait 4)
6. photo-1541961017774-22a216e50389 (Portrait 5)
7. photo-1529626455594-4ff0802cfb7e (Portrait 6)
8. photo-1517457373614-b7152f800fd1 (Portrait 7)

출처: Unsplash (royalty-free 포트레이트)
```

---

## 3️⃣ 현재 인벤토리 통계 (100장 Mock 데이터)

### 그룹별 분포 (예상)
```
SEVENTEEN:  ~17장 (17%)
Stray Kids: ~17장 (17%)
NewJeans:   ~17장 (17%)
IVE:        ~17장 (17%)
TWICE:      ~17장 (17%)
ENHYPEN:    ~15장 (15%)
```

### 희귀도 분포 (무작위 선택)
```
Mythic:  ~25장 (25%)
SSR:     ~25장 (25%)
UR:      ~25장 (25%)
Normal:  ~25장 (25%)
```

### 카드종류 분포 (무작위 선택)
```
Standard:       ~20장 (20%)
Hologram:       ~20장 (20%)
Emboss:         ~20장 (20%)
Glitter:        ~20장 (20%)
Special Edition:~20장 (20%)
```

### 보유/인증 통계 (확률 기반)
```
보유카드:    ~40장 (40%)
미보유카드:  ~60장 (60%)

인증완료:    ~70장 (70%)
미인증카드:  ~30장 (30%)
```

### 가격대 분포
```
예상가격 평균:     ~300,000 KRW
역대최고가 평균:   ~600,000 KRW
최고/최저 가격비:  약 13:1
```

---

## 📋 데이터 품질 평가

### ✅ 정상 항목
- 그룹/멤버/앨범 마스터 데이터 (5개 그룹)
- 카드 속성 다양성 (5종류 × 4등급 × 5태그)
- 메타데이터 완정성 (가격, 이미지, 인증 정보)

### ⚠️ 개선 필요 항목
- **NewJeans 멤버 오류**: `Hybe` → 올바른 멤버명으로 정정 필요
- **이미지 URL 한정**: 8개 URL × 100장 = 평균 12.5회 반복
- **가격 무작위성**: 새로고침마다 예상가격 변경 (일관성 부족)

### 🔄 향후 확장 계획
- 실제 K-pop 포토카드 메타데이터 연동
- 제조사 다양화 (Hanteo, Korean Craze 등)
- 이미지 CDN 연동 (실제 포토카드 이미지)
- 동적 가격 엔진 (시장 시세 반영)

---

## 📊 CSV 데이터 매핑

**출력 파일**: `INVENTORY_MASTER_DATA_AUDIT.csv`

**컬럼 매핑**:
```
CSV 컬럼 ↔ 코드 필드
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
동(Group)                 ← artistGroup
호수(Album/Era)           ← albumEra
방(Member)                ← member
가구ID(CardID)            ← id
가구종류(CardType)        ← cardType
발매처/특전(Manufacturer) ← officialData.manufacturer
비주얼태그(VisualTags)    ← vibeTags (배열 → 문자열 변환)
예상가격KRW               ← estimatedPrice
역대최고가KRW             ← highestPrice
희귀도(Rarity)            ← rarity
보유상태(IsOwned)         ← isOwned (boolean → 네말 변환)
인증여부(IsVerified)      ← isVerified (boolean → 네말 변환)
위시수(WishCount)         ← wishCount
조회수(ViewCount)         ← viewCount
```

---

## 🎯 결론

### 현재 상태
- ✅ **마스터 데이터**: 6개 그룹, 33명 멤버, 18개 활동기 모두 구조화됨
- 🔄 **포토카드 인벤토리**: 100장 Mock 데이터로 운영 중
- ⚠️ **데이터 품질**: 일부 오류 및 의존성 문제 있음

### 즉시 조치 필요
1. NewJeans 멤버 데이터 정정 (Hybe → 정규 멤버명)
2. 이미지 URL 풀 확대 (일관성 개선)
3. 가격 데이터 결정적 할당 (무작위성 제거)

### 중기 개선
- 상용 K-pop 메타데이터 연동
- 실제 포토카드 이미지 CDN 연결
- 동적 시세 엔진 구현

---

**보고서 생성일**: 2026-08-17  
**데이터 출처**: `poca-exchange/lib/wiki-mock-data.ts`  
**CSV 파일**: `poca-exchange/INVENTORY_MASTER_DATA_AUDIT.csv`
