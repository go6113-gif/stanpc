// Sprint 01 — pSEO directory MVP. The CSV import seeded 931 groups, but the
// MVP only ships these 5: enough long-tail keyword coverage to validate
// indexing without curating price/badge data for the entire catalog.
// Every group/member/card query is scoped through this allowlist so a
// non-MVP slug 404s instead of falling through to the full dataset.
export const MVP_GROUP_SLUGS = [
  "seventeen",
  "stray-kids",
  "bts",
  "aespa",
  "newjeans",
] as const;
