# StanPC SEO 메타데이터 구현 가이드

완전한 검색엔진 최적화(SEO) 메타데이터 시스템이 구현되었습니다. 본 문서는 시스템 구조, 사용법, 확장 방법을 설명합니다.

---

## 📋 목차

1. [아키텍처](#아키텍처)
2. [포함된 메타데이터](#포함된-메타데이터)
3. [페이지별 구현](#페이지별-구현)
4. [JSON-LD 구조화 데이터](#json-ld-구조화-데이터)
5. [공식 커스터마이징](#공식-커스터마이징)
6. [테스트 및 검증](#테스트-및-검증)

---

## 아키텍처

SEO 메타데이터는 3개 계층으로 구성됩니다:

### 1️⃣ 공식 계층 (`lib/seo-config.ts`)

**역할**: 모든 메타데이터 생성 공식 정의

**주요 구성**:
- `seoFormulas`: Title, Description, Keywords 생성 함수
- `openGraphGenerators`: Open Graph 메타데이터 생성
- `twitterCardGenerators`: Twitter 카드 메타데이터 생성
- `structuredDataTemplates`: JSON-LD 스키마 템플릿

```typescript
// 예: 멤버 페이지 공식
seoFormulas.memberTitle(memberName, groupName)
// 출력: "TZUYU TWICE Photocard Template, Price & PC List | StanPC"

seoFormulas.memberDescription(memberName, groupName, cardCount)
// 출력: "Explore TZUYU (TWICE) photocard templates, rarest cards, prices & size. Browse 150+ cards. The ultimate K-pop PC wiki & wishlist on StanPC."
```

### 2️⃣ 생성기 계층 (`lib/seo-generator.ts`)

**역할**: 공식을 조합하여 완전한 메타데이터 객체 생성

**주요 함수**:
- `generateCardMetadata()` — 개별 카드 페이지
- `generateMemberMetadata()` — 멤버 위키 페이지
- `generateAlbumMetadata()` — 앨범 상세 페이지

각 함수는 다음을 반환합니다:
- Title, Description, Keywords
- Open Graph 메타데이터
- Twitter 카드 메타데이터
- JSON-LD 구조화 데이터
- 캐노니컬 URL, robots 태그

### 3️⃣ 페이지 계층 (`app/*/page.tsx`)

**역할**: 생성기 활용하여 Next.js Metadata 객체 생성

```typescript
// 멤버 페이지 예
export async function generateMetadata(props) {
  const metadata = generateMemberMetadata({
    memberName: "TZUYU",
    groupName: "TWICE",
    cardCount: 150,
    imageUrl: "...",
    groupSlug: "twice",
    memberSlug: "tzuyu",
  });

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    robots: metadata.robots,
    alternates: { canonical: `https://www.stanpc.com${metadata.canonicalUrl}` },
    openGraph: { ... },
    twitter: { ... },
  };
}
```

---

## 포함된 메타데이터

### HTML Meta 태그

| 태그 | 설명 | 예 |
|------|------|-----|
| `<title>` | 페이지 제목 (60-70자) | "TZUYU TWICE Photocard Template, Price & PC List \| StanPC" |
| `<meta name="description">` | 검색 결과 스니펫 (155-160자) | "Explore TZUYU (TWICE) photocard templates, rarest cards, prices & size. Browse 150+ cards..." |
| `<meta name="keywords">` | SEO 키워드 | "TZUYU, TWICE, photocard, template, trading card, K-pop, collectible" |
| `<meta name="robots">` | 크롤러 지시어 | "index, follow, max-image-preview:large, ..." |
| `<link rel="canonical">` | 정규 URL | "https://www.stanpc.com/wiki/twice/tzuyu" |

### Open Graph 태그

소셜 미디어(Facebook, Discord, LinkedIn 등) 공유 시 표시되는 정보:

```html
<meta property="og:title" content="TZUYU TWICE Photocard Template, Price & PC List | StanPC">
<meta property="og:description" content="Explore TZUYU (TWICE) photocard templates...">
<meta property="og:url" content="https://www.stanpc.com/wiki/twice/tzuyu">
<meta property="og:type" content="website">
<meta property="og:image" content="https://... (1200×630)">
<meta property="og:image:alt" content="TZUYU TWICE Photocard Template">
<meta property="og:locale" content="en_US">
```

### Twitter 카드 태그

Twitter/X 공유 시 표시되는 정보:

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="TZUYU TWICE Photocard Template, Price & PC List | StanPC">
<meta name="twitter:description" content="Explore TZUYU (TWICE) photocard templates...">
<meta name="twitter:image" content="https://... (1200×675)">
<meta name="twitter:image:alt" content="TZUYU TWICE Photocard Template">
<meta name="twitter:creator" content="@stanpc_io">
<meta name="twitter:site" content="@stanpc_io">
```

### JSON-LD 구조화 데이터

Google, Bing, Yandex가 이해하는 구조화 데이터:

**카드 페이지**:
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "TZUYU TWICE Photocard",
  "brand": "TWICE",
  "category": "TZUYU",
  "image": "https://...",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "15.99",
    "availability": "https://schema.org/LimitedAvailability",
    "url": "https://www.stanpc.com/card/..."
  }
}
```

**멤버/앨범 페이지**:
```json
{
  "@context": "https://schema.org",
  "@type": "Collection",
  "name": "TZUYU (TWICE)",
  "description": "Explore TZUYU (TWICE) photocard templates...",
  "numberOfItems": 150,
  "url": "https://www.stanpc.com/wiki/twice/tzuyu"
}
```

---

## 페이지별 구현

### 1. 멤버 위키 페이지 (`/wiki/[group]/[member]`)

**URL**: `/wiki/twice/tzuyu`

**메타데이터 생성**:
```typescript
const metadata = generateMemberMetadata({
  memberName: "TZUYU",
  groupName: "TWICE",
  cardCount: 150,
  imageUrl: memberImageUrl,
  groupSlug: "twice",
  memberSlug: "tzuyu",
});
```

**Title 형식**: `[Member] [Group] Photocard Template, Price & PC List | StanPC`

**Description 형식**: `Explore [Member] ([Group]) photocard templates, rarest cards, prices & size. Browse [N]+ cards. The ultimate K-pop PC wiki & wishlist on StanPC.`

---

### 2. 카드 상세 페이지 (`/card/[cardSlug]`)

**URL**: `/card/twice-tzuyu-cry-for-me-v1`

**메타데이터 생성**:
```typescript
const metadata = generateCardMetadata(
  {
    slug: cardSlug,
    cardName: "TZUYU Cry For Me",
    member: { nameEn: "TZUYU" },
    group: { nameEn: "TWICE" },
    album: { title: "Cry For Me" },
    badge: "Rare",
    version: "V1",
    estimatedPrice: 15.99,
    imageUrl: cardImageUrl,
    thumbImagePath: thumbPath,
  },
  ogImageUrl
);
```

**Title 형식**: `[Member] [Album] [Badge] Photocard Price & Buy - StanPC`

**Description 형식**: `[Group] · [Member] · [Album] · [Version] · Est. $[Price]`

---

### 3. 앨범 상세 페이지 (`/wiki/[group]/[member]/[album]`)

**URL**: `/wiki/twice/tzuyu/cry-for-me`

**메타데이터 생성**:
```typescript
const metadata = generateAlbumMetadata({
  memberName: "TZUYU",
  groupName: "TWICE",
  albumName: "Cry For Me",
  cardCount: 42,
  imageUrl: albumCoverUrl,
  groupSlug: "twice",
  memberSlug: "tzuyu",
  albumSlug: "cry-for-me",
});
```

**Title 형식**: `[Member] [Group] [Album] Photocard Template & PC List | StanPC`

---

## JSON-LD 구조화 데이터

### 페이지에 JSON-LD 주입하기

#### 방법 1: Client Component + Script 태그

멤버 페이지에 JSON-LD을 주입하는 예:

```typescript
// app/wiki/[group]/[member]/page.tsx
'use client'; // 클라이언트 컴포넌트로 변경
import Script from 'next/script';

export default function MemberWikiPage(props) {
  const { metadata } = await generateMemberMetadata(...);

  return (
    <>
      <Script
        id="member-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(metadata.jsonLd) }}
      />
      {/* 페이지 콘텐츠 */}
    </>
  );
}
```

#### 방법 2: Root Layout (사이트 전체)

`app/layout.tsx`에 조직 정보 주입:

```typescript
import { createOrganizationSchema, createWebsiteSchema } from '@/lib/json-ld-utils';
import Script from 'next/script';

export default function RootLayout() {
  return (
    <html>
      <head>
        <Script
          id="org-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(createOrganizationSchema())
          }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(createWebsiteSchema())
          }}
        />
      </head>
      <body>{/* ... */}</body>
    </html>
  );
}
```

#### 방법 3: 브레드크럼 네비게이션

멤버 페이지의 브레드크럼:

```typescript
import { createBreadcrumbSchema } from '@/lib/json-ld-utils';
import Script from 'next/script';

export default function MemberWikiPage(props) {
  const breadcrumbs = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.stanpc.com', position: 1 },
    { name: 'TWICE', url: 'https://www.stanpc.com/wiki/twice', position: 2 },
    { name: 'TZUYU', url: 'https://www.stanpc.com/wiki/twice/tzuyu', position: 3 },
  ]);

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {/* 페이지 콘텐츠 */}
    </>
  );
}
```

---

## 공식 커스터마이징

### 제목(Title) 공식 수정

`lib/seo-config.ts`의 `memberTitle` 함수를 수정:

```typescript
memberTitle: (memberName: string, groupName: string): string => {
  // 기존
  return `${memberName} ${groupName} Photocard Template, Price & PC List | StanPC`;

  // 새 버전 (예: 멤버 포지션 포함)
  return `${memberName} (${groupName}) Photocard Templates | Wiki & Price | StanPC`;
},
```

### 설명(Description) 공식 수정

```typescript
memberDescription: (memberName: string, groupName: string, cardCount?: number): string => {
  // 예: 더 짧은 설명
  const cardInfo = cardCount ? ` ${cardCount}+ cards.` : '';
  return `${memberName} K-pop photocard wiki.${cardInfo} Browse prices, templates & trading info on StanPC.`;
},
```

### 키워드 추가

```typescript
memberKeywords: (memberName: string, groupName: string): string => {
  // 예: 그룹 포지션/데뷔연도 등 추가 정보
  return [
    memberName,
    groupName,
    "photocard",
    "trading card",
    "K-pop idol",
    "collector",
    "stanpc",
  ].join(", ");
},
```

### Open Graph 이미지 크기 조정

카드 페이지의 OG 이미지 비율 변경:

```typescript
// app/card/[cardSlug]/page.tsx
openGraph: {
  ...metadata.openGraph,
  images: metadata.openGraph.image
    ? [
        {
          url: metadata.openGraph.image,
          alt: metadata.openGraph.imageAlt,
          width: 800,  // 변경
          height: 1200, // 변경
        },
      ]
    : [],
},
```

---

## 테스트 및 검증

### 1. 로컬 개발 환경에서 테스트

```bash
npm run dev
# http://localhost:3000/wiki/twice/tzuyu 접속
# 브라우저 DevTools > Elements 탭에서 <head> 섹션 확인
```

**확인 사항**:
- ✅ `<title>` 태그 올바른지
- ✅ `<meta name="description">` 존재하는지
- ✅ `<meta property="og:*">` 태그들 존재하는지
- ✅ `<meta name="twitter:*">` 태그들 존재하는지
- ✅ `<link rel="canonical">` 올바른 URL인지
- ✅ JSON-LD `<script type="application/ld+json">` 유효한 JSON인지

### 2. 온라인 검증 도구

#### Google Rich Results Test
- https://search.google.com/test/rich-results
- 페이지 URL 입력 → 구조화 데이터 검증

#### Open Graph Debugger (Meta)
- https://developers.facebook.com/tools/debug/
- OG 태그 미리보기 확인

#### Twitter Card Validator
- https://cards-dev.twitter.com/validator
- Twitter 카드 렌더링 확인

#### Schema.org Validator
- https://validator.schema.org/
- JSON-LD 유효성 검증

### 3. 프로덕션 배포 후 확인

```bash
# Google Search Console에서 색인 상태 확인
# 검색 성능 > 페이지 > 멤버 페이지 URL 선택
# "테스트" 버튼 클릭하여 재크롤링 요청

# Bing 웹마스터 도구에서도 유사하게 진행
```

### 4. 타입 체크

```bash
npx tsc --noEmit
```

SEO 관련 타입 에러가 없어야 합니다.

---

## 다음 단계

1. **JSON-LD 주입**: 모든 페이지에 Schema.org 구조화 데이터 주입
2. **동적 사이트맵**: 모든 동적 라우트를 사이트맵에 포함
3. **성능 모니터링**: Google Search Console 통합
4. **국제화(i18n)**: `og:locale` 태그로 다국어 지원
5. **소셜 공유 이미지**: OG 이미지 최적화 (1200×630px 권장)

---

## 참고 자료

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)
- [Google Rich Results](https://developers.google.com/search/docs/appearance/rich-results)
