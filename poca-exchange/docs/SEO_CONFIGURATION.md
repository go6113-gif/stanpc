# pSEO Configuration Guide

Central management of metadata formulas and keyword strategies for stanpc.com. All dynamic page titles, descriptions, and structured data flow through this system.

## Architecture

### Files

- **`lib/seo-config.ts`** — Centralized SEO formulas and keyword strategy
- **`lib/seo-generator.ts`** — Metadata generation utility functions
- **Page-level `generateMetadata()`** — Apply seo-generator to each route

### Data Flow

```
Route generateMetadata()
    ↓
Fetch card/group/member data
    ↓
Call generateCardMetadata() / generateGroupMetadata() / etc.
    ↓
Use seoFormulas from seo-config.ts
    ↓
Return metadata (title, description, schema, OG tags)
```

## Current Formulas

### Card Page

**Title Template:**
```
{memberName} {albumName} [{badge}] Photocard Price & Buy - StanPC
```

**Description Template:**
```
{groupName} · {memberName} · {albumName} · {version} · {price}
```

**Schema:**
Product schema with pricing and availability

### Group Page

**Title Template:**
```
{groupName} Photocards — Complete Collection | StanPC
```

**Description Template:**
```
Complete {groupName} photocard guide. {cardCount} cards with prices, versions, and trading info.
```

### Member Page

**Title Template:**
```
{memberName} — {groupName} Photocards | StanPC
```

**Description Template:**
```
{memberName} {groupName} photocard collection. {cardCount} versions with market prices and trading guide.
```

## Updating SEO Formulas

When you have new keyword data (global search volume, competitor analysis), follow these steps:

### 1. Update `seoFormulas` in `lib/seo-config.ts`

```typescript
export const seoFormulas = {
  cardTitle: (data: CardSeoData): string => {
    // Modify formula here
    // Example: Prioritize keywords based on search volume
    return newFormula;
  },
  // ...
};
```

### 2. Update `keywordStrategy` for priority/weights

```typescript
export const keywordStrategy = {
  // Add global search volume data
  globalKeywordMetrics: {
    "kpop_photocard": { monthlySearchVolume: 12000, competitionLevel: "high" },
    "member_name_photocard": { monthlySearchVolume: 8500, competitionLevel: "medium" },
  },
};
```

### 3. Deploy

No code changes needed elsewhere — all pages automatically use the new formulas.

**Before deployment, verify with:**
- `npm run build` — Ensures all static pages generate correctly
- Check a few generated pages in `.next/server/pages/` to confirm metadata changed
- Test in Google Search Console Preview (Inspect URL)

## Adding New Page Types

When creating a new dynamic route with metadata:

### 1. Create a generator function in `lib/seo-generator.ts`

```typescript
export function generateWikiMetadata(
  groupName: string,
  memberCount: number
): { title: string; description: string } {
  return {
    title: seoFormulas.wikiTitle(groupName),
    description: seoFormulas.wikiDescription(groupName, memberCount),
  };
}
```

### 2. Add the formula to `lib/seo-config.ts`

```typescript
export const seoFormulas = {
  // ...
  wikiTitle: (groupName: string): string => {
    return `${groupName} Wiki — Complete Member Directory | StanPC`;
  },
  wikiDescription: (groupName: string, count: number): string => {
    return `${groupName} complete wiki with ${count} members and detailed photocard history.`;
  },
};
```

### 3. Use in your page's `generateMetadata()`

```typescript
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { groupSlug } = await props.params;
  const group = await getGroupBySlug(groupSlug);

  const seoData = generateWikiMetadata(group.nameEn, group.members.length);

  return {
    title: seoData.title,
    description: seoData.description,
    // ... rest of metadata
  };
}
```

## Global Keyword Metrics

When you have access to Google Search Volume data:

```typescript
export const keywordStrategy = {
  globalKeywordMetrics: {
    "kpop_photocard": {
      monthlySearchVolume: 12000,
      competitionLevel: "high",
      conversionWeight: 0.8,
    },
    "photocards_for_sale": {
      monthlySearchVolume: 8500,
      competitionLevel: "medium",
      conversionWeight: 0.9,
    },
  },
};
```

Then modify formula functions to use these metrics:

```typescript
cardTitle: (data: CardSeoData): string => {
  const groupVolume = keywordStrategy.globalKeywordMetrics[data.groupName]?.monthlySearchVolume ?? 0;
  const shouldPrioritizeGroup = groupVolume > 5000;

  if (shouldPrioritizeGroup) {
    return `${data.groupName} ${data.memberName} Photocard - StanPC`;
  }
  // fallback
  return `${data.memberName} ${data.groupName} Photocard - StanPC`;
};
```

## Testing

### Build-time validation

```bash
npm run build
```

Ensures all static pages generate with valid metadata.

### Local testing

```bash
npm run dev
# Visit http://localhost:3000/[group]/[member]
# Open DevTools → Elements → <head>
# Verify <title>, <meta name="description">, og:* tags
```

### Search Console Preview

1. Go to Google Search Console
2. Inspect URL → See how Google renders your page
3. Check that title and description match your formula

## Future: A/B Testing Keywords

Once metrics are in place, consider:

1. Store multiple formula variants in seo-config.ts
2. Feature-flag or canary deploy to a subset of pages
3. Track CTR from search results
4. Promote best-performing formula

Example:

```typescript
export const formulaVariants = {
  v1: { cardTitle: (d) => /* original */ },
  v2: { cardTitle: (d) => /* optimized */ },
};
```

## Related

- [Global Keyword Strategy](../data/global_photocard_final_report.md) — 5-platform market analysis
- [CLAUDE.md](../CLAUDE.md) — Core project philosophy & constraints
