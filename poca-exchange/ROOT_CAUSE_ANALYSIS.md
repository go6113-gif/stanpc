# 🔍 Wiki Mock 데이터 & 이미지 렌더링 원인 분석 보고서

**작성일**: 2026-08-17  
**분석 대상**: `wiki-mock-data.ts`, `WikiCard.tsx`, `WikiCurationRail.tsx`

---

## 📋 1. 데이터 소스 및 생성 로직 진단

### 1.1 데이터 왜곡 원인 (NewJeans 멤버명 오류)

#### 🔴 발견된 문제
**파일**: `lib/wiki-mock-data.ts` (36번 줄)
```typescript
'NewJeans': {
  members: ['Hanni', 'Hybe', 'Danielle', 'Minji', 'Jisoo'],  // ❌ 'Hybe' 는 사람이 아님
  eras: ['Attention, Cats! Era', 'New Jeans Era', 'Hype Boy Era'],
},
```

#### ❌ 왜곡된 데이터 흐름
1. **하드코딩된 인정되지 않은 값**: 'Hybe'는 NewJeans의 정규 멤버가 아니며, 뉘앙스상 HYBE(회사명)로 추정됨
2. **무작위 선택 로직** (53~55번 줄)
   ```typescript
   function getRandomElement<T>(array: T[]): T {
     return array[Math.floor(Math.random() * array.length)];
   }
   ```
   - `generateMockCard()` 호출 시마다 `getRandomElement(groupData.members)`로 'Hybe'가 선택될 확률 = **1/5 (20%)**
3. **반복성 없음**: 호출할 때마다 다른 멤버가 무작위로 선택되므로, 새로고침 시 카드 멤버명이 바뀜

#### 📊 영향 범위
- `generateMockCards(100)` 호출 시 평균 약 20개(100 × 20%) 카드에서 'Hybe'가 멤버로 표시됨
- 그리드/레일에서 **데이터 무결성 상실**

---

### 1.2 이미지 URL 매핑 문제

#### 🔴 발견된 문제
**파일**: `lib/wiki-mock-data.ts` (4~13번 줄)
```typescript
const IMAGE_URLS = [
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=500&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1539571696357-5a69c006ae30?w=400&h=500&fit=crop&crop=faces',
  // ... 총 8개 URL
];

function generateMockCard(id: number): WikiCardType {
  // ...
  imageUrl: getRandomElement(IMAGE_URLS),  // 82번 줄
  // ...
}

export function generateMockCards(count: number = 100): WikiCardType[] {
  return Array.from({ length: count }, (_, i) => generateMockCard(i));  // 108번 줄
}
```

#### ❌ 데이터 소비 구조
- **이미지 URL 풀**: 8개 (모두 Unsplash의 포트레이트 사진)
- **생성되는 카드 수**: 100개
- **결과**: 8개 URL이 100개 카드에 무작위 분배 → **평균 12.5회 반복**

#### 🎯 URL 출처 분석
- **출처**: Unsplash (royalty-free 이미지 플랫폼)
- **특성**: K-pop과 무관한 **일반 포트레이트 및 라이프스타일 사진**
  - `crop=faces` 파라미터로 얼굴 중심 크롭
  - 실제 K-pop 아이돌 사진이 아님
- **목적**: Mock/Demo 단계에서 **플레이스홀더로만 사용 (상용 데이터 준비 전)**

#### 📊 시각적 영향
- 모든 카드가 Unsplash의 임의 인물/풍경 사진으로 뜸
- K-pop 도감의 정체성 상실

---

## 🖼️ 2. 이미지 렌더링 및 에러 처리 실패 원인

### 2.1 WikiCard 컴포넌트의 에러 처리 로직

**파일**: `components/wiki/WikiCard.tsx`

#### ✅ 구현된 에러 처리
```typescript
const [imageLoaded, setImageLoaded] = useState(false);
const [imageFailed, setImageFailed] = useState(false);

const handleImageLoad = () => {
  setImageLoaded(true);
};

const handleImageError = () => {
  setImageFailed(true);  // ✅ 에러 상태 기록
};

// 이미지 태그 (47~59번 줄)
<img
  src={imageFailed ? PLACEHOLDER_IMAGE : imageUrl}
  alt={card.cardName || 'Photocard'}
  className={...}
  onLoad={handleImageLoad}
  onError={handleImageError}
/>
```

#### 🎯 폴백 메커니즘
1. **로딩 상태**: `!imageLoaded && !imageFailed` → "로딩 중..." placeholder 표시
2. **성공**: `imageLoaded === true` → 실제 이미지 노출
3. **실패**: `imageFailed === true` → SVG placeholder로 대체

```typescript
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg ... %3E이미지 없음%3C/svg%3E';
```

#### ❌ 그럼에도 불구하고 혼재되는 이유

**원인 1: 개별 카드별 상태 관리**
- WikiCard는 단독으로 `imageLoaded/imageFailed` 상태를 소유
- 동일 URL이 여러 카드에 반복 사용되어도, **각 카드가 독립적으로 로드 시도**
- 네트워크 상태에 따라 동일 URL도 어떤 카드는 로드 성공, 어떤 카드는 실패 가능

**원인 2: WikiCurationRail의 상태 관리 패턴**

```typescript
// components/wiki/WikiCurationRail.tsx (31번 줄)
const [imageStates, setImageStates] = useState<Record<string, { loaded: boolean; failed: boolean }>>({});

const handleImageLoad = (cardId: string) => {
  setImageStates((prev) => ({
    ...prev,
    [cardId]: { loaded: true, failed: false },
  }));
};

const handleImageError = (cardId: string) => {
  setImageStates((prev) => ({
    ...prev,
    [cardId]: { loaded: false, failed: true },
  }));
};
```

- ✅ **카드 ID별 상태 추적** (캐싱 효과)
- 그러나 **동일 URL의 여러 인스턴스가 각각 onLoad/onError 이벤트를 발생**

**원인 3: 동시 로드 및 네트워크 편차**
- Unsplash CDN에서 8개 URL을 100개 카드가 동시에 요청
- 이미지 서버 부하, 브라우저 동시 연결 제한(HTTP 2.0 멀티플렉싱 아래 ~6개), 네트워크 불안정성 → **로드 성공/실패가 확률적으로 분포**

#### 📊 실제 렌더링 상황
같은 레일/그리드에서 보이는 현상:
```
카드 1: ✅ 이미지 로드됨 (Unsplash 사진)
카드 2: ⏳ 로딩 중... (로드 대기)
카드 3: ❌ 이미지 없음 (SVG placeholder)
카드 4: ✅ 이미지 로드됨
```

---

## 🛠️ 3. 정상화를 위한 기술적 해결 방안

### 3.1 단기 해결 (Mock 단계 개선)

#### 방안 A: 멤버명 데이터 정제
```typescript
// ✅ 올바른 멤버명으로 수정
const STRUCTURED_DATA = {
  'NewJeans': {
    members: ['Hanni', 'Hanni', 'Danielle', 'Minji', 'Jisoo'], // Hybe → Hanni (중복 제거 후 다른 멤버 추가)
    // 또는
    members: ['Hanni', 'Danielle', 'Minji', 'Jisoo'], // 정규 멤버만
  },
};
```

**효과**: 데이터 왜곡 즉시 제거

---

#### 방안 B: 결정적 이미지 할당 (캐싱 강화)
```typescript
// ❌ 현재 (매번 무작위)
imageUrl: getRandomElement(IMAGE_URLS),

// ✅ 개선 (ID 기반 결정적 할당)
imageUrl: IMAGE_URLS[id % IMAGE_URLS.length],
```

**효과**:
- 같은 카드는 새로고침해도 동일 이미지 → 일관성 확보
- 렌더링 재시도 시에도 상태 유지

**코드 예**:
```typescript
function generateMockCard(id: number): WikiCardType {
  // ...
  imageUrl: IMAGE_URLS[id % IMAGE_URLS.length],  // 결정적 할당
  // ...
}
```

---

#### 방안 C: 이미지 URL 풀 확대 및 도메인별 분류
```typescript
// 목업 단계: 여러 도메인의 무료 포트레이트 활용
const IMAGE_URLS = {
  unsplash: [
    // 8개 기존 URL
  ],
  placeholderWithGradient: [
    // 색상/패턴 기반 데이터 URI SVG
    'data:image/svg+xml,...', // 분홍색 그래디언트
    'data:image/svg+xml,...', // 보라색 그래디언트
    // ... 16개 추가
  ],
};

function getImageUrlById(id: number, member: string): string {
  const pool = [...IMAGE_URLS.unsplash, ...IMAGE_URLS.placeholderWithGradient];
  return pool[id % pool.length];
}
```

**효과**: 더 많은 다양성 + 로드 실패율 분산

---

### 3.2 중기 해결 (에러 처리 강화)

#### 방안 D: 글로벌 이미지 캐시 및 폴백 체인
```typescript
// hooks/useImageCache.ts (신규 생성)
const useImageCache = () => {
  const cacheRef = useRef<Record<string, { status: 'success' | 'failed' }>>({});

  const getImageWithFallback = (url: string, fallbackUrl: string) => {
    if (cacheRef.current[url]?.status === 'failed') {
      return fallbackUrl; // 이전 실패 기록이 있으면 폴백
    }
    return url;
  };

  const recordImageLoad = (url: string, success: boolean) => {
    cacheRef.current[url] = { status: success ? 'success' : 'failed' };
  };

  return { getImageWithFallback, recordImageLoad };
};
```

**효과**: 
- 실패한 URL을 메모리에 기록 → 반복 실패 방지
- 동시 로드 시 빠른 폴백

---

#### 방안 E: 우아한 성능 저하 (Graceful Degradation)
```typescript
// WikiCard.tsx 수정
const imageSources = [
  card.imageUrl,           // 1순위: 원본
  `${card.imageUrl}?w=200&h=300&fit=crop`, // 2순위: 최적화 버전
  PLACEHOLDER_IMAGE_WITH_MEMBER_NAME,     // 3순위: 멤버명 + 배경색
  GENERIC_PLACEHOLDER,                    // 4순위: 제네릭 placeholder
];

// <img srcSet={imageSources.join(',')} ... />
```

---

### 3.3 장기 해결 (상용 데이터 전환)

#### 방안 F: 실제 K-pop 포토카드 이미지 데이터 연동
```typescript
// 상용 데이터 준비 후
const useRealPhotocardData = () => {
  const [cards, setCards] = useState<WikiCardType[]>([]);

  useEffect(() => {
    // API에서 실제 카드 데이터 로드
    // src 매핑: 
    //   - 고해상도 이미지: CDN (Cloudinary, AWS S3)
    //   - 썸네일: 자체 서버 캐시
    fetch('/api/wiki/cards')
      .then(r => r.json())
      .then(data => setCards(data));
  }, []);

  return cards;
};
```

**점진적 전환**:
1. 상용 데이터 준비 중: Mock 데이터 + 올바른 메타데이터
2. 상용 데이터 준비 완료: Real 데이터로 교체
3. Mock 파일 제거

---

## 📊 3.4 권장 우선순위

| 우선순위 | 방안 | 난이도 | 효과 | 실행 시간 |
|---------|------|--------|------|---------|
| **P0** | A (멤버명 정제) | ⭐ | 🟢 즉시 데이터 왜곡 제거 | 5분 |
| **P1** | B (결정적 URL 할당) | ⭐ | 🟢 일관성 확보 | 10분 |
| **P2** | C (URL 풀 확대) | ⭐⭐ | 🟡 다양성 향상 | 30분 |
| **P3** | D (글로벌 캐시) | ⭐⭐⭐ | 🟡 성능 최적화 | 2시간 |
| **P4** | E (우아한 성능 저하) | ⭐⭐⭐ | 🔵 사용자 경험 개선 | 3시간 |
| **중기/장기** | F (실제 데이터 연동) | ⭐⭐⭐⭐ | 🟢 상용 완성도 | 비즈니스 일정 |

---

## 🎯 결론

### 핵심 원인 3가지
1. **'Hybe' 오류**: 하드코딩된 잘못된 멤버명 → 무작위 선택으로 20% 확률 노출
2. **이미지 URL 풀 부족**: 8개 URL × 100개 카드 = 심한 반복 + 동시 로드 과부하
3. **개별 상태 관리의 한계**: 에러 처리는 구현되어 있으나, 네트워크 편차로 인한 불일관 렌더링 불가피

### 즉시 조치 사항
- **P0**: `wiki-mock-data.ts` 멤버명 정제 (5분)
- **P1**: 이미지 URL 결정적 할당 변경 (10분)

### 중기 개선 방향
- 이미지 URL 풀 다양화 + 로컬 SVG 기반 placeholder 활용
- 글로벌 이미지 캐시 및 폴백 체인 구현

### 장기 계획
- 상용 K-pop 포토카드 메타데이터 & 이미지 데이터 확보
- Mock → Real 점진적 전환
