/**
 * Single source of truth for turning a stored photocard image path into a
 * loadable <img src>.
 *
 * Photocard rows carry two image fields: `thumbImagePath` (a ~350px WebP built
 * by scripts/generate-thumbnails.ts) and `imageUrl` (the crawler's full-size
 * original, up to ~1.2 MB). Grids must prefer the thumbnail; the original is
 * only a fallback for rows the generator has not reached yet.
 *
 * Both are root-relative POSIX paths under the StanPC root ("thumbs/..." /
 * "downloaded_pcs/...") which live outside /public, so they are served through
 * app/api/image/route.ts rather than linked directly.
 *
 * This used to be copy-pasted into four components and had already drifted —
 * one wrapped the path but ignored the thumbnail, another picked the thumbnail
 * but skipped the wrapping and 404'd. Route every call site through here.
 */

/** Wraps one stored path, or returns null when there is nothing to show. */
function toSrc(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Remote or inline images are already loadable as-is.
  if (/^(https?:\/\/|data:)/i.test(trimmed)) return trimmed;

  // Already app-absolute — a /public asset, or a pre-built "/api/image?path=..."
  // URL. Wrapping these again double-encodes them into a 403 (an earlier import
  // stored rendered API URLs in imageUrl for every SEVENTEEN row, which is
  // exactly how that broke).
  if (trimmed.startsWith("/")) return trimmed;

  // Root-relative crawler path — needs the proxy route.
  return `/api/image?path=${encodeURIComponent(trimmed)}`;
}

/**
 * Resolves a photocard's display image, preferring the lightweight thumbnail.
 *
 * Pass both fields; `thumbImagePath` wins whenever it is set.
 */
export function resolvePhotoCardImageSrc(
  thumbImagePath: string | null | undefined,
  imageUrl?: string | null | undefined
): string | null {
  return toSrc(thumbImagePath) ?? toSrc(imageUrl);
}
