// 10-core eBay group MVP — scoped to 2,991 eBay-sourced photocard listings.
// Every group/member/card query is scoped through this allowlist so a
// non-MVP slug 404s instead of falling through to the full dataset.
export const MVP_GROUP_SLUGS = [
  "bts",
  "seventeen",
  "stray-kids",
  "enhypen",
  "tomorrow-x-together",
  "newjeans",
  "ive",
  "aespa",
  "le-sserafim",
  "twice",
] as const;
