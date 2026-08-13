// Lightweight i18n hook and dictionary loader.
// Currently defaults to Korean (ko); prepare for future locale routing
// (app/[locale]/... or middleware-based detection).

import ko from "@/locales/ko.json";

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]> & string}`
          : K
        : never;
    }[keyof T]
  : never;

type Translations = typeof ko;
export type TranslationKey = NestedKeyOf<Translations>;

// Lightweight dictionary lookup: pass a dot-separated key like "hero.title"
// and get the translated value. Defaults to the key itself if not found
// (helps catch typos during development). `vars` fills `{placeholder}`
// tokens in the resolved string, e.g. t("filter.bar.resultCount", { count: 12 }).
export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  const keys = key.split(".");
  let value: unknown = ko;
  for (const k of keys) {
    value = value && typeof value === "object" ? (value as Record<string, unknown>)[k] : undefined;
  }
  if (typeof value !== "string") return key;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (match, token) => {
    const replacement = vars[token];
    return replacement === undefined ? match : String(replacement);
  });
}

// Client-side hook stub for potential next-intl or custom context integration.
// For now just wraps t(). Future expansions (pluralization, date formatting,
// currency formatting per locale) go here without touching consumer code.
export function useTranslations(namespace?: string) {
  return {
    t: (key: string, vars?: Record<string, string | number>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return t(fullKey as TranslationKey, vars);
    },
  };
}
