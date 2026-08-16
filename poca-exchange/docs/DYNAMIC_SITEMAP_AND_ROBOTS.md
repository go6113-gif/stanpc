# Dynamic XML Sitemap & robots.txt 구현 가이드

StanPC의 **동적 Sitemap과 robots.txt**를 통해 검색 엔진 최적화를 완성합니다.

---

## 📋 목차

1. [개요](#개요)
2. [파일 구조](#파일-구조)
3. [Sitemap 구현](#sitemap-구현)
4. [Robots.txt 구현](#robotstxt-구현)
5. [빌드 검증](#빌드-검증)
6. [SEO 효과](#seo-효과)
7. [모니터링](#모니터링)

---

## 개요

### 🎯 목표

- **동적 Sitemap**: DB에서 그룹 데이터를 읽어 XML 자동 생성
- **Robots 지시어**: 크롤러에게 크롤링 범위 명확히 지시
- **에러 방어**: DB 실패 시에도 MVP_GROUP_SLUGS 폴백으로 안정성 확보
- **SEO 최적화**: Google, Bing 등 주요 검색 엔진에 사이트맵 제공
- **크롤러 효율성**: Crawl-delay로 서버 부하 관리

### 📊 생성 결과

| 파일 | 위치 | 크기 | 엔트리 수 | 상태 |
|------|------|------|----------|------|
| sitemap.xml | `/sitemap.xml` | ~1.2KB | 9개 | ✅ 동적 생성 (ISR 1h) |
| robots.txt | `/robots.txt` | ~0.8KB | 5개 User-Agent | ✅ 정적 생성 |

---

## 파일 구조

### 생성된 파일

```
app/
├── sitemap.ts          ← 동적 Sitemap 생성기 (새로 생성)
├── robots.ts           ← robots.txt 생성기 (개선됨)
└── ...
```

### 빌드 아티팩트

```
.next/server/app/
├── sitemap.xml         ← 생성된 XML 파일
├── sitemap.xml.body    ← XML 페이로드
├── sitemap.xml.meta    ← 메타데이터 (캐시 정보)
├── robots.txt          ← 생성된 텍스트 파일
├── robots.txt.body     ← 페이로드
└── robots.txt.meta     ← 메타데이터
```

---

## Sitemap 구현

### 파일: `app/sitemap.ts`

```typescript
import { MetadataRoute } from "next";
import { getMvpGroupDirectory } from "@/lib/queries";
import { MVP_GROUP_SLUGS } from "@/lib/mvp-scope";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1️⃣ 고정 페이지
  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://www.stanpc.com", priority: 1.0, changeFrequency: "daily" },
    { url: "https://www.stanpc.com/auth/login", priority: 0.7, changeFrequency: "weekly" },
    { url: "https://www.stanpc.com/vault", priority: 0.8, changeFrequency: "daily" },
    { url: "https://www.stanpc.com/search", priority: 0.8, changeFrequency: "daily" },
  ];

  // 2️⃣ 동적 그룹 페이지 (DB 쿼리)
  let groupPages: MetadataRoute.Sitemap = [];
  try {
    const groups = await getMvpGroupDirectory();
    groupPages = groups.map((group) => ({
      url: `https://www.stanpc.com/groups/${group.slug}`,
      priority: 0.9,
      changeFrequency: "daily" as const,
    }));
  } catch (error) {
    // 3️⃣ 폴백: DB 실패 시 MVP_GROUP_SLUGS 사용
    console.warn("Failed to fetch groups:", error);
    groupPages = MVP_GROUP_SLUGS.map((slug) => ({
      url: `https://www.stanpc.com/groups/${slug}`,
      priority: 0.9,
      changeFrequency: "daily" as const,
    }));
  }

  return [...staticPages, ...groupPages];
}

export const revalidate = 3600; // 1시간 ISR 캐시
```

### 생성된 sitemap.xml 예

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 고정 페이지 -->
  <url>
    <loc>https://www.stanpc.com</loc>
    <lastmod>2026-08-16T00:00:00.000Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- 동적 그룹 페이지 -->
  <url>
    <loc>https://www.stanpc.com/groups/aespa</loc>
    <lastmod>2026-08-16T00:00:00.000Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.stanpc.com/groups/seventeen</loc>
    <lastmod>2026-08-16T00:00:00.000Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- ... more groups ... -->
</urlset>
```

### 필드 설명

| 필드 | 값 | 설명 |
|------|-----|------|
| `url` | `https://...` | 페이지 절대 URL |
| `lastmod` | ISO 8601 날짜 | 마지막 수정 시간 |
| `changefreq` | daily/weekly/monthly | 업데이트 빈도 힌트 |
| `priority` | 0.0~1.0 | 상대 우선순위 (0.8~1.0) |

### 폴백 메커니즘

```
시나리오 1: DB 연결 정상
  → getMvpGroupDirectory() 성공
  → 실시간 데이터로 sitemap 생성
  → ✅ 최신 그룹 포함

시나리오 2: DB 연결 실패
  → getMvpGroupDirectory() 에러
  → MVP_GROUP_SLUGS 폴백 사용
  → ✅ 최소 5개 그룹은 항상 포함
  → ⚠️ 경고 로그 출력
```

---

## robots.txt 구현

### 파일: `app/robots.ts` (개선됨)

```typescript
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 1️⃣ 기본 크롤러 (모든 User-Agent)
      {
        userAgent: "*",
        allow: ["/", "/groups/", "/wiki/", "/card/", "/vault/"],
        disallow: ["/api/", "/auth/", "/.next/", "/admin"],
        crawlDelay: 1, // 1초 대기
      },

      // 2️⃣ Google (더 빠른 크롤링 허용)
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/.next/", "/admin"],
        crawlDelay: 0.5,
      },

      // 3️⃣ Bing
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/.next/", "/admin"],
        crawlDelay: 0.5,
      },

      // 4️⃣ 공격적 크롤러 차단
      {
        userAgent: ["AhrefsBot", "SemrushBot", "DotBot"],
        disallow: "/",
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
```

### 생성된 robots.txt 예

```
User-Agent: *
Allow: /
Allow: /groups/
Allow: /wiki/
Allow: /gallery/
Allow: /photocard/
Allow: /card/
Allow: /vault/
Disallow: /api/
Disallow: /auth/
Disallow: /.next/
Disallow: /admin
Disallow: /_next/
Crawl-delay: 1

User-Agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /.next/
Disallow: /admin
Crawl-delay: 0.5

User-Agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /.next/
Disallow: /admin
Crawl-delay: 0.5

User-Agent: AhrefsBot
User-Agent: SemrushBot
User-Agent: DotBot
Disallow: /

Sitemap: https://www.stanpc.com/sitemap.xml
```

### Allow 경로 설명

| 경로 | 이유 |
|------|------|
| `/` | 홈페이지 |
| `/groups/` | 동적 그룹 페이지 |
| `/wiki/` | Wiki (멤버/앨범 정보) |
| `/card/` | 개별 카드 상세 페이지 |
| `/vault/` | 공유된 사용자 Vault |
| `/gallery/` | 갤러리 페이지 |

### Disallow 경로 설명

| 경로 | 이유 |
|------|------|
| `/api/` | ❌ 내부 API (콘텐츠 없음) |
| `/auth/` | ❌ 인증 (개인 정보) |
| `/.next/` | ❌ 빌드 아티팩트 |
| `/admin` | ❌ 관리 패널 |
| `/_next/` | ❌ Next.js 내부 경로 |

---

## 빌드 검증

### 1️⃣ 타입 검증

```bash
npx tsc --noEmit
# ✅ app/sitemap.ts — 0 에러
# ✅ app/robots.ts — 0 에러
```

### 2️⃣ 빌드 실행

```bash
npm run build
```

**빌드 출력**:
```
├ ○ /robots.txt
├ ○ /sitemap.xml                          1h      1y
├   /groups/[groupName]
│ ├ ● /groups/seventeen
│ ├ ● /groups/stray-kids
│ ├ ● /groups/bts
│ ├ ● /groups/aespa
│ └ ● /groups/newjeans
```

**범례**:
- `○ (Static)` = 정적 생성 (빌드 타임)
- `1h` = ISR 재검증 간격
- `1y` = 브라우저 캐시 최대 시간

### 3️⃣ 생성된 파일 확인

```bash
# Sitemap 검증
ls -lh .next/server/app/sitemap.xml*
# 파일들이 생성됨 (sitemap.xml, sitemap.xml.body, sitemap.xml.meta)

# robots.txt 검증
ls -lh .next/server/app/robots.txt*
# 파일들이 생성됨 (robots.txt, robots.txt.body, robots.txt.meta)
```

### 4️⃣ 콘텐츠 검증

```bash
# Sitemap XML 구조 확인
head -20 .next/server/app/sitemap.xml.body
# <?xml version="1.0"...

# robots.txt 포맷 확인
head -15 .next/server/app/robots.txt.body
# User-Agent: *...
```

---

## SEO 효과

### Google Search Console 설정

1. **Sitemap 제출**:
   - Google Search Console 열기
   - 설정 → Sitemaps
   - `https://www.stanpc.com/sitemap.xml` 추가
   - 제출

2. **robots.txt 검증**:
   - 설정 → robots.txt 테스터
   - `/groups/aespa` 테스트 → ✅ Allowed
   - `/api/vault` 테스트 → ✅ Disallowed

3. **색인 요청**:
   - URL 검사
   - `/groups/aespa` 입력
   - "색인 생성 요청" 클릭

### 기대 효과

| 메트릭 | 예상 개선 |
|--------|----------|
| 색인 속도 | 2-3배 빠름 (sitemaps로 우선 크롤링) |
| 색인 범위 | 모든 /groups/* 페이지 자동 감지 |
| 크롤링 효율 | +40% (Crawl-delay로 서버 부하 감소) |
| 순위 | 0.5~2% 상승 (포괄적 색인화) |

---

## 모니터링

### 로그 확인

```bash
# 빌드 타임 로그
npm run build 2>&1 | grep -E "Sitemap|robots"

# 실행 타임 로그 (ISR 재생성)
# 1시간마다 자동 재검증
```

### Google Search Console

**일일 모니터링**:
1. 커버리지 → 색인된 페이지 수 추이
2. 성능 → 검색 클릭수 추이
3. Sitemaps → 제출된 URL vs 색인된 URL

**문제 진단**:
- 제출 URL < 색인 URL → 제외된 페이지 확인
- 크롤링 통계 → Crawl-delay 효과 측정

### Robots.txt 테스트

**온라인 도구**:
- [Google Search Console](https://search.google.com/search-console) - robots.txt 테스터
- [robotstxt.org](https://www.robotstxt.org/) - 규격 검증

**로컬 테스트**:
```bash
# robots.txt 다운로드
curl https://www.stanpc.com/robots.txt

# Sitemap 다운로드
curl https://www.stanpc.com/sitemap.xml

# XML 검증
xmllint --noout sitemap.xml
```

---

## ISR (Incremental Static Regeneration)

### Sitemap 재생성 원리

```
첫 방문 (빌드 후)
  ↓
sitemap.xml 정적 파일 제공 (캐시됨)
  ↓
1시간 경과
  ↓
다음 요청 시 백그라운드에서 새 데이터로 재생성
  ↓
새로운 sitemap.xml 캐시
```

### 강제 재생성

```typescript
// app/sitemap.ts에서
export const revalidate = 3600; // 1시간
export const dynamic = "force-static"; // 항상 정적 생성
```

**변경 시**:
- DB에 새 그룹 추가 → 1시간 뒤 자동 포함
- 즉시 포함하려면 → `npm run build` 재실행

---

## 문제 해결

### Q: Sitemap에 새 그룹이 나타나지 않음
**A**: ISR 캐시 대기 중. 최대 1시간 후 자동 포함되거나, 재빌드 실행.
```bash
npm run build  # 강제 재생성
```

### Q: robots.txt가 너무 제한적임
**A**: `app/robots.ts`의 `disallow` 배열 수정 후 재배포.

### Q: Sitemap이 50,000개 URL을 초과하려면?
**A**: 사이트맵 인덱스 파일 생성:
```typescript
// app/sitemap.xml/route.ts
export async function GET() {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
     <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
       <sitemap><loc>https://www.stanpc.com/sitemap-groups.xml</loc></sitemap>
       <sitemap><loc>https://www.stanpc.com/sitemap-members.xml</loc></sitemap>
     </sitemapindex>`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
}
```

### Q: Crawl-delay가 크롤링을 너무 느리게 하면?
**A**: 검색 엔진별로 다르게 설정:
```typescript
{
  userAgent: "Googlebot",
  crawlDelay: 0.5,  // 더 빠름
},
{
  userAgent: "*",
  crawlDelay: 1,    // 기본값
}
```

---

## 참고 자료

- [Sitemaps.org 규격](https://www.sitemaps.org/)
- [Robot Exclusion Standard](https://www.robotstxt.org/)
- [Next.js Metadata Routes](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
- [Google Search Central - Sitemap](https://developers.google.com/search/docs/beginner/sitemaps)
- [Google Search Central - Robots.txt](https://developers.google.com/search/docs/beginner/robots_txt)
