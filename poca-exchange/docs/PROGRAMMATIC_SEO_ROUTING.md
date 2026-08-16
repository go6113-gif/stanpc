# 프로그래매틱 SEO — 동적 라우팅 구현 가이드

StanPC의 **동적 라우팅 아키텍처**로 수천 개의 페이지를 자동 생성하고 검색엔진 최적화를 적용하는 방법을 설명합니다.

---

## 📋 목차

1. [개요](#개요)
2. [아키텍처](#아키텍처)
3. [그룹 페이지 구현](#그룹-페이지-구현)
4. [데이터 페칭 & 폴백 패턴](#데이터-페칭--폴백-패턴)
5. [정적 매개변수 생성](#정적-매개변수-생성)
6. [SEO 통합](#seo-통합)
7. [다음 확장](#다음-확장)

---

## 개요

### 🎯 목표

- **동적 페이지 생성**: URL 파라미터로 그룹/멤버/앨범 페이지 자동 생성
- **Database-driven**: DB에서 실시간으로 데이터 로드
- **Offline-safe**: DB 연결 실패 시 폴백 데이터로 페이지 렌더링
- **SEO-optimized**: 각 페이지에 동적 Meta/OG 태그 생성
- **Static optimization**: ISR(Incremental Static Regeneration)로 성능 최적화

### 📊 현재 구현 범위

| 라우트 | 파일 | 상태 | 페이지 수 |
|--------|------|------|----------|
| `/groups/[groupName]` | `app/groups/[groupName]/page.tsx` | ✅ 완성 | 5개 (MVP) |
| `/wiki/[group]/[member]` | `app/wiki/[group]/[member]/page.tsx` | ✅ 완성 | ~100개 |
| `/wiki/[group]/[member]/[album]` | `app/wiki/[group]/[member]/[album]/page.tsx` | ✅ 완성 | ~500개 |
| `/card/[cardSlug]` | `app/card/[cardSlug]/page.tsx` | ✅ 완성 | ~3,000개 |

---

## 아키텍처

### 계층 구조

```
URL 파라미터 → DB 쿼리 → 폴백 처리 → SEO 메타 생성 → UI 렌더링
   (params)    (try-catch)  (development)  (generateMetadata)  (JSX)
```

### 데이터 흐름

```typescript
// 1️⃣ URL 파라미터 추출 (Next.js 자동)
params: Promise<{ groupName: string }>

// 2️⃣ DB에서 데이터 로드 (try-catch)
const groupData = await fetchGroupData(groupName);

// 3️⃣ 폴백 처리 (개발 환경)
if (!groupData) {
  return createFallbackGroupData(groupName);
}

// 4️⃣ SEO 메타데이터 생성
const metadata = generateGroupMetadata(groupData.nameEn, groupData.cardCount);

// 5️⃣ UI 렌더링
return <GroupPageComponent data={groupData} />;
```

---

## 그룹 페이지 구현

### 파일 구조

```
app/
├── groups/
│   └── [groupName]/
│       └── page.tsx          ← 동적 라우트 파일
├── wiki/
│   └── [group]/
│       ├── page.tsx          ← 그룹 Wiki
│       └── [member]/
│           ├── page.tsx      ← 멤버 Wiki
│           └── [album]/
│               └── page.tsx  ← 앨범 Wiki
└── card/
    └── [cardSlug]/
        └── page.tsx          ← 카드 상세
```

### 타입 정의 (Next.js 16)

```typescript
// URL 파라미터 타입
interface GroupPageProps {
  params: Promise<{
    groupName: string;
  }>;
}

// 데이터 구조
interface GroupPageData {
  slug: string;
  nameEn: string;
  nameKr: string | null;
  imageUrl: string | null;
  photoCards: PhotoCardItem[];
  cardCount: number;
}

interface PhotoCardItem {
  slug: string;
  cardName: string | null;
  imageUrl: string | null;
  thumbImagePath: string | null;
  version: string | null;
  estimatedPrice: number | null;
  wishedCount: number;
  ownedCount: number;
  viewCount: number;
  badge: string | null;
}
```

### 예제: `app/groups/[groupName]/page.tsx`

```typescript
import { getGroupBySlug } from '@/lib/queries';
import { generateGroupMetadata } from '@/lib/seo-generator';
import { MVP_GROUP_SLUGS } from '@/lib/mvp-scope';

// 1️⃣ 메타데이터 생성
export async function generateMetadata(props: GroupPageProps): Promise<Metadata> {
  const params = await props.params;
  const groupData = await fetchGroupData(params.groupName);

  if (!groupData) {
    return { title: "Not Found" };
  }

  const metadata = generateGroupMetadata(groupData.nameEn, groupData.cardCount);

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: `https://www.stanpc.com/groups/${params.groupName}`,
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: `https://www.stanpc.com/groups/${params.groupName}`,
      type: "website",
    },
  };
}

// 2️⃣ 정적 페이지 생성 (빌드 타임)
export async function generateStaticParams() {
  try {
    const groups = await getMvpGroupDirectory();
    return groups.map((group) => ({ groupName: group.slug }));
  } catch (error) {
    // 쿼리 실패 시 MVP 범위만 생성
    return MVP_GROUP_SLUGS.map((slug) => ({ groupName: slug }));
  }
}

// 3️⃣ 페이지 렌더링
export default async function GroupPage(props: GroupPageProps) {
  const params = await props.params;
  const groupData = await fetchGroupData(params.groupName);

  if (!groupData) {
    notFound();
  }

  return (
    <main>
      <h1>{groupData.nameKr || groupData.nameEn}</h1>
      {/* Photo cards grid */}
      <div className="grid grid-cols-5 gap-4">
        {groupData.photoCards.map((card) => (
          <PhotoCardCell key={card.slug} card={card} />
        ))}
      </div>
    </main>
  );
}
```

---

## 데이터 페칭 & 폴백 패턴

### Try-Catch 래핑

**목표**: DB 연결 실패 시에도 페이지 렌더링 (404 방지)

```typescript
async function fetchGroupData(groupSlug: string): Promise<GroupPageData | null> {
  // 1️⃣ MVP 범위 검증 (보안)
  if (!MVP_GROUP_SLUGS.includes(groupSlug as (typeof MVP_GROUP_SLUGS)[number])) {
    return null;
  }

  try {
    // 2️⃣ DB 쿼리
    const group = await getGroupBySlug(groupSlug);

    if (!group) {
      return null; // 데이터 없음 → 404 발생
    }

    // 3️⃣ 데이터 변환
    return {
      slug: group.slug,
      nameEn: group.nameEn,
      nameKr: group.nameKr,
      imageUrl: group.imageUrl,
      photoCards: group.photoCards.map((card) => ({
        slug: card.slug,
        cardName: card.cardName,
        // ...
      })),
      cardCount: group.photoCards.length,
    };
  } catch (error) {
    // 4️⃣ 에러 로깅
    console.warn(`Failed to fetch group "${groupSlug}":`, error instanceof Error ? error.message : error);

    // 5️⃣ 개발 환경 폴백
    if (process.env.NODE_ENV === "development") {
      console.info(`ℹ️  Using fallback data for group "${groupSlug}"`);
      return createFallbackGroupData(groupSlug);
    }

    // 프로덕션: null 반환 → 404 발생
    return null;
  }
}
```

### 폴백 데이터 구조

```typescript
const FALLBACK_GROUPS = [
  { slug: "seventeen", nameKr: "세븐틴", nameEn: "SEVENTEEN" },
  { slug: "stray-kids", nameKr: "스트레이 키즈", nameEn: "Stray Kids" },
  { slug: "bts", nameKr: "방탄소년단", nameEn: "BTS" },
  { slug: "aespa", nameKr: "에스파", nameEn: "aespa" },
  { slug: "newjeans", nameKr: "뉴진스", nameEn: "NewJeans" },
];

function createFallbackGroupData(slug: string): GroupPageData {
  const group = FALLBACK_GROUPS.find((g) => g.slug === slug) || FALLBACK_GROUPS[0];
  return {
    slug: group.slug,
    nameEn: group.nameEn,
    nameKr: group.nameKr,
    imageUrl: null,
    photoCards: Array.from({ length: 12 }, (_, i) => ({
      slug: `${group.slug}-card-${i + 1}`,
      cardName: `${group.nameKr} 포토카드 ${i + 1}`,
      // ... 기타 필드
    })),
    cardCount: 12,
  };
}
```

### 에러 처리 전략

| 상황 | 동작 | 로그 |
|------|------|------|
| DB 연결 실패 (개발) | 폴백 데이터 반환 | ℹ️ Using fallback data |
| DB 연결 실패 (프로덕션) | `null` 반환 → 404 | ⚠️ Failed to fetch |
| 유효하지 않은 slug | `null` 반환 → 404 | (MVP 검증 실패) |
| 데이터 없음 | `null` 반환 → 404 | (DB 쿼리 반환값 없음) |

---

## 정적 매개변수 생성

### ISR (Incremental Static Regeneration)

```typescript
// 빌드 타임에 정적 페이지 생성
export async function generateStaticParams() {
  try {
    // 모든 MVP 그룹 로드
    const groups = await getMvpGroupDirectory();

    // Next.js에 전달할 파라미터 배열
    return groups.map((group) => ({
      groupName: group.slug,
    }));
  } catch (error) {
    console.warn("Failed to generate static params:", error);

    // 폴백: MVP_GROUP_SLUGS 사용
    return MVP_GROUP_SLUGS.map((slug) => ({
      groupName: slug,
    }));
  }
}
```

### 빌드 성능

```bash
# 페이지 생성 수
5 groups × 1 page = 5 페이지 (빠름)

# 다음 단계 예상
5 groups × 100 members = 500 페이지
500 members × 10 albums = 5,000 페이지
5,000 cards × 1 page = 5,000 페이지

# 총 ~10,500개 동적 페이지 (ISR로 증분 생성)
```

### 재검증 설정

```typescript
// 페이지 캐시 시간 설정
export const revalidate = 3600; // 1시간마다 재생성

// 또는 온디맨드 ISR
export const dynamicParams = true; // 미리 생성되지 않은 페이지는 요청 시 생성
```

---

## SEO 통합

### 동적 메타데이터

```typescript
export async function generateMetadata(
  props: GroupPageProps
): Promise<Metadata> {
  const params = await props.params;
  const groupData = await fetchGroupData(params.groupName);

  if (!groupData) {
    return { title: "Not Found" };
  }

  // seo-generator.ts의 함수 활용
  const metadata = generateGroupMetadata(
    groupData.nameEn || groupData.nameKr || params.groupName,
    groupData.cardCount
  );

  return {
    title: metadata.title,                                    // "SEVENTEEN Photocards — Complete Collection | StanPC"
    description: metadata.description,                        // "Complete SEVENTEEN photocard guide. 250 cards with prices, versions..."
    robots: "index, follow, max-image-preview:large",        // 크롤러 지시어
    alternates: {
      canonical: `https://www.stanpc.com/groups/${params.groupName}`, // 정규 URL
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: `https://www.stanpc.com/groups/${params.groupName}`,
      type: "website",
      locale: "en_US",
      images: groupData.imageUrl ? [{
        url: groupData.imageUrl,
        alt: `${groupData.nameKr || groupData.nameEn} Photocards`,
        width: 1200,
        height: 630,
      }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: groupData.imageUrl ? [groupData.imageUrl] : [],
      creator: "@stanpc_io",
      site: "@stanpc_io",
    },
  };
}
```

### 검색 결과 최적화

**Title Formula**:
```
{Group} Photocards — Complete Collection | StanPC
```

**Description Formula**:
```
Complete {Group} photocard guide. {CardCount} cards with prices, versions, and trading info.
```

**예제**:
- URL: `/groups/aespa`
- Title: `aespa Photocards — Complete Collection | StanPC`
- Desc: `Complete aespa photocard guide. 182 cards with prices, versions, and trading info.`

---

## 다음 확장

### 1️⃣ 멤버 페이지 동적 라우팅

```typescript
// app/members/[groupName]/[memberName]/page.tsx
interface MemberPageProps {
  params: Promise<{
    groupName: string;
    memberName: string;
  }>;
}

export async function generateStaticParams() {
  // 모든 (그룹, 멤버) 조합 생성
  const groups = await getMvpGroupDirectory();
  const params = [];
  for (const group of groups) {
    const members = await getMembersByGroup(group.slug);
    for (const member of members) {
      params.push({
        groupName: group.slug,
        memberName: member.slug,
      });
    }
  }
  return params;
}
```

### 2️⃣ 앨범 페이지 동적 라우팅

```typescript
// app/albums/[groupName]/[memberName]/[albumName]/page.tsx
export async function generateStaticParams() {
  // 모든 (그룹, 멤버, 앨범) 조합 생성
  // ~5,000 pages 예상
}
```

### 3️⃣ 카드 상세 페이지 온디맨드 생성

```typescript
export const dynamicParams = true; // 미리 생성되지 않은 카드는 요청 시 생성
export const revalidate = 3600;    // 1시간마다 재검증
```

### 4️⃣ 사이트맵 자동 생성

```typescript
// app/sitemap.ts
export default async function sitemap() {
  const groups = await getMvpGroupDirectory();
  
  return groups.map((group) => ({
    url: `https://www.stanpc.com/groups/${group.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));
}
```

### 5️⃣ RSS 피드 자동 생성

```typescript
// app/groups/feed.xml/route.ts
export async function GET() {
  const groups = await getMvpGroupDirectory();
  const xml = generateRssFeed(groups);
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
```

---

## 성능 최적화

### 캐시 전략

| 항목 | TTL | 방식 |
|------|-----|------|
| 페이지 HTML | 1시간 | ISR (Incremental Static Regeneration) |
| DB 쿼리 | 3600초 | Next.js `fetch` 캐시 |
| 이미지 | 7일 | Next.js Image Optimization |
| 메타데이터 | 1시간 | ISR 재검증 시 함께 생성 |

### 빌드 최적화

```bash
# 정적 매개변수 사전 생성 (빌드 타임)
npm run build
# Output: ✓ Collecting static params for 5 dynamic pages...

# 나머지 페이지는 온디맨드 + ISR로 생성
```

---

## 모니터링 & 디버깅

### 로그 확인

```bash
# 개발 환경
npm run dev
# ℹ️  Using fallback data for group "aespa"

# 프로덕션 빌드
npm run build
# ✓ Generating static params for groups...
# ✓ Generated 5 static pages in 2.3s

# 실시간 로그
tail -f .next/logs/build.log
```

### 검증

```bash
# URL 접근 테스트
curl https://www.stanpc.com/groups/aespa

# 메타데이터 확인
curl -I https://www.stanpc.com/groups/aespa | grep -E 'og:|twitter:'

# SEO 도구
# - Google Search Console: 색인 상태 확인
# - Meta OG Debugger: 메타데이터 프리뷰
```

---

## FAQ

### Q: DB 연결 없이 페이지가 렌더링되나?
**A**: 예, 개발 환경에서는 폴백 데이터로 렌더링됩니다. 프로덕션에서는 DB 연결이 필수입니다.

### Q: 새 그룹이 추가되면 어떻게 되나?
**A**: ISR이 활성화되면 다음 배포 시 자동 생성되거나, 온디맨드로 요청 시 생성됩니다.

### Q: 5,000개 페이지를 모두 미리 생성해야 하나?
**A**: 아니요. `dynamicParams: true`로 온디맨드 생성하고 `revalidate`로 캐시합니다.

### Q: 모바일 성능이 떨어지면?
**A**: `generateStaticParams`를 줄이거나, 클라이언트 컴포넌트로 분리하여 하이드레이션 최적화.

---

## 참고 자료

- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Next.js generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [Next.js Metadata](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [ISR (Incremental Static Regeneration)](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
