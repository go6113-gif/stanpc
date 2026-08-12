/** Lowercase-hyphen SEO-friendly slug, e.g. "&TEAM" -> "and-team". */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/** Appends a deterministic `-2`, `-3`, ... suffix if the base slug was already taken. */
export function dedupeSlug(base: string, used: Set<string>): string {
  let candidate = base || "item";
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  used.add(candidate);
  return candidate;
}
