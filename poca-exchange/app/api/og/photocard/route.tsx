import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCardBySlug } from "@/lib/queries";
import { siteConfig } from "@/lib/site-config";

export const contentType = "image/png";

const PRICE_TBA_LABEL = "시세 미정(TBA)";

// Subsetted to just the glyphs used by PRICE_TBA_LABEL above — Satori's
// default font has no Hangul coverage, and a full Noto Sans KR file runs
// several MB, so this route only ever needs this handful of characters.
// Regenerate via Google Fonts' css2 API (with an old-browser User-Agent to
// get a `format('woff')` URL instead of woff2, since ImageResponse only
// accepts ttf/otf/woff) if PRICE_TBA_LABEL's text ever changes.
const notoSansKrSubset = await readFile(
  join(process.cwd(), "lib/fonts/noto-sans-kr-subset.woff")
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardSlug = searchParams.get("cardSlug");
  if (!cardSlug) {
    return new Response("Missing cardSlug query parameter", { status: 400 });
  }

  const card = await getCardBySlug(cardSlug);
  if (!card) {
    return new Response("Card not found", { status: 404 });
  }

  const memberName = card.member?.nameEn ?? null;
  const albumName = card.album?.title ?? card.cardName ?? null;
  const hasPrice = card.estimatedPrice != null;
  const priceLabel = hasPrice
    ? `Est. $${card.estimatedPrice!.toFixed(2)}`
    : PRICE_TBA_LABEL;
  const image = card.imageUrl ?? card.thumbImagePath;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a0a",
        }}
      >
        <div style={{ width: 470, height: 630, display: "flex" }}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              width={470}
              height={630}
              style={{ objectFit: "cover" }}
              alt=""
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#1a1a1a",
                color: "#666666",
                fontSize: 28,
              }}
            >
              No Image
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "56px 64px",
            color: "#ffffff",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <span
              style={{
                display: "flex",
                padding: "6px 18px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {card.group.nameEn}
            </span>
            {card.badge && (
              <span
                style={{
                  display: "flex",
                  padding: "6px 18px",
                  borderRadius: 999,
                  background: "#e11d8c",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {card.badge}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.15,
              marginTop: 28,
            }}
          >
            {memberName ?? card.group.nameEn}
          </div>

          {albumName && (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                color: "#a3a3a3",
                marginTop: 10,
              }}
            >
              {albumName}
            </div>
          )}

          <div
            style={{
              display: "flex",
              fontSize: 40,
              fontWeight: 700,
              marginTop: 40,
              color: hasPrice ? "#4ade80" : "#a3a3a3",
              fontFamily: hasPrice ? undefined : "Noto Sans KR",
            }}
          >
            {priceLabel}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#737373",
              marginTop: "auto",
            }}
          >
            {siteConfig.domain}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Noto Sans KR",
          data: notoSansKrSubset,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );
}
