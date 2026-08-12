import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const BROWSE_SEARCH_URL =
  "https://api.ebay.com/buy/browse/v1/item_summary/search";
const APP_SCOPE = "https://api.ebay.com/oauth/api_scope";

// Client Credentials Grant app token, cached two ways: an in-memory
// variable for same-instance reuse (fastest), and a tmpdir file so a warm
// serverless instance restart doesn't re-request a token it already has —
// eBay app tokens last ~2 hours, far longer than a single request.
const TOKEN_CACHE_FILE = join(tmpdir(), "stanpc-ebay-token-cache.json");
const EXPIRY_SAFETY_MARGIN_MS = 60_000;

type TokenCache = { accessToken: string; expiresAt: number };

let memoryCache: TokenCache | null = null;

function isValid(cache: TokenCache | null): cache is TokenCache {
  return cache !== null && cache.expiresAt - EXPIRY_SAFETY_MARGIN_MS > Date.now();
}

async function readFileCache(): Promise<TokenCache | null> {
  try {
    const raw = await readFile(TOKEN_CACHE_FILE, "utf-8");
    return JSON.parse(raw) as TokenCache;
  } catch {
    return null;
  }
}

async function writeFileCache(cache: TokenCache) {
  try {
    await writeFile(TOKEN_CACHE_FILE, JSON.stringify(cache), "utf-8");
  } catch {
    // Best-effort — a read-only filesystem just means every cold start
    // re-requests a token, which still works, only slower.
  }
}

async function fetchFreshToken(): Promise<TokenCache> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "EBAY_CLIENT_ID / EBAY_CLIENT_SECRET are not configured"
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: APP_SCOPE,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`eBay OAuth token request failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

async function getAppToken(): Promise<string> {
  if (isValid(memoryCache)) return memoryCache.accessToken;

  const fileCache = await readFileCache();
  if (isValid(fileCache)) {
    memoryCache = fileCache;
    return fileCache.accessToken;
  }

  const fresh = await fetchFreshToken();
  memoryCache = fresh;
  await writeFileCache(fresh);
  return fresh.accessToken;
}

export type EbayListing = {
  id: string;
  title: string;
  price: { value: string; currency: string } | null;
  imageUrl: string | null;
  itemWebUrl: string;
  condition: string | null;
};

export async function searchEbayPhotocards(
  query: string,
  limit = 4
): Promise<EbayListing[]> {
  const token = await getAppToken();

  const url = new URL(BROWSE_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`eBay Browse API search failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    itemSummaries?: Array<{
      itemId: string;
      title: string;
      price?: { value: string; currency: string };
      image?: { imageUrl?: string };
      // Despite the name, thumbnailImages carries the higher-resolution
      // (s-l1600) variant — image.imageUrl is the small (s-l225) one.
      thumbnailImages?: Array<{ imageUrl?: string }>;
      itemWebUrl: string;
      condition?: string;
    }>;
  };

  return (data.itemSummaries ?? []).map((item) => ({
    id: item.itemId,
    title: item.title,
    price: item.price ?? null,
    imageUrl: item.thumbnailImages?.[0]?.imageUrl ?? item.image?.imageUrl ?? null,
    itemWebUrl: item.itemWebUrl,
    condition: item.condition ?? null,
  }));
}
