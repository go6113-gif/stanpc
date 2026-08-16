import { ImageResponse } from "@vercel/og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const username = searchParams.get("username") || "StanPC Collector";
    const title = searchParams.get("title") || "My Photocard Binder";
    const ownedCount = searchParams.get("ownedCount") || "0";
    const wishCount = searchParams.get("wishCount") || "0";
    const theme = (searchParams.get("theme") || "neon") as
      | "neon"
      | "pastel"
      | "hologram"
      | "black";

    // Theme color definitions
    const themes = {
      neon: {
        bg: "linear-gradient(135deg, #0F0F12 0%, #1A1A1E 100%)",
        accent1: "#FF2A55",
        accent2: "#00D9FF",
        glowColor: "#FF2A55",
      },
      pastel: {
        bg: "linear-gradient(135deg, #FDE4EC 0%, #E1BEE7 50%, #C5CAE9 100%)",
        accent1: "#EC407A",
        accent2: "#AB47BC",
        glowColor: "#EC407A",
      },
      hologram: {
        bg: "linear-gradient(135deg, #00D4FF 0%, #8A2BE2 50%, #FF1493 100%)",
        accent1: "#00D4FF",
        accent2: "#FF1493",
        glowColor: "#00D4FF",
      },
      black: {
        bg: "#000000",
        accent1: "#FFFFFF",
        accent2: "#CCCCCC",
        glowColor: "#666666",
      },
    };

    const currentTheme = themes[theme];
    const isDark = theme !== "pastel";

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            background: currentTheme.bg,
            fontFamily: '"Segoe UI", sans-serif',
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative background elements */}
          {theme === "neon" && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: "-200px",
                  right: "-200px",
                  width: "500px",
                  height: "500px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(255, 42, 85, 0.2) 0%, transparent 70%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-200px",
                  left: "-200px",
                  width: "500px",
                  height: "500px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(0, 217, 255, 0.2) 0%, transparent 70%)",
                }}
              />
            </>
          )}

          {theme === "hologram" && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    "linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />
            </>
          )}

          {/* Main content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              padding: "60px",
              position: "relative",
              zIndex: 10,
              color: isDark ? "white" : "#000",
              justifyContent: "space-between",
            }}
          >
            {/* Top section - Title & Username */}
            <div>
              <div
                style={{
                  fontSize: "56px",
                  fontWeight: "900",
                  marginBottom: "12px",
                  background:
                    theme === "pastel"
                      ? `linear-gradient(135deg, ${currentTheme.accent1} 0%, ${currentTheme.accent2} 100%)`
                      : "none",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: theme === "pastel" ? "transparent" : "inherit",
                  lineHeight: "1.2",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: "24px",
                  opacity: isDark ? 0.7 : 0.6,
                  fontWeight: "500",
                }}
              >
                stanpc.com/@{username}
              </div>
            </div>

            {/* Middle section - Stats */}
            <div
              style={{
                display: "flex",
                gap: "40px",
                justifyContent: "flex-start",
              }}
            >
              {/* Owned Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 24px",
                  borderRadius: "12px",
                  background: isDark
                    ? "rgba(255, 42, 85, 0.15)"
                    : "rgba(236, 64, 122, 0.1)",
                  border: `2px solid ${currentTheme.accent1}`,
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "900",
                  }}
                >
                  ◆
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      opacity: isDark ? 0.6 : 0.7,
                      fontWeight: "500",
                    }}
                  >
                    OWNED
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "900",
                      color: currentTheme.accent1,
                    }}
                  >
                    {ownedCount}
                  </div>
                </div>
              </div>

              {/* Wish Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 24px",
                  borderRadius: "12px",
                  background: isDark
                    ? "rgba(0, 217, 255, 0.15)"
                    : "rgba(171, 71, 188, 0.1)",
                  border: `2px solid ${currentTheme.accent2}`,
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: "900",
                  }}
                >
                  ♡
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      opacity: isDark ? 0.6 : 0.7,
                      fontWeight: "500",
                    }}
                  >
                    WISH
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: "900",
                      color: currentTheme.accent2,
                    }}
                  >
                    {wishCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom section - Logo & Branding */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                paddingTop: "20px",
                borderTop: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  opacity: isDark ? 0.5 : 0.6,
                  fontWeight: "500",
                }}
              >
                K-pop 포토카드 도감
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "900",
                    background:
                      theme === "pastel"
                        ? `linear-gradient(135deg, ${currentTheme.accent1} 0%, ${currentTheme.accent2} 100%)`
                        : "none",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: theme === "pastel" ? "transparent" : "inherit",
                  }}
                >
                  StanPC
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation error:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
