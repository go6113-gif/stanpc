import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// Serves photocard images that live outside the Next.js app dir (the crawler
// writes them to <StanPC root>/downloaded_pcs/...), since /public can't reach
// them and PhotoCard.imageUrl stores root-relative POSIX paths.
function resolveStanpcRoot(): string {
  // Note: dotenv only unescapes \n and \r, so a Windows path written with
  // doubled backslashes in .env survives verbatim and never matches a
  // path.resolve()d path. Normalize here rather than trusting the raw value.
  const fromEnv = process.env.STANPC_ROOT;
  if (fromEnv) {
    return path.resolve(fromEnv.replace(/\\/g, "\\"));
  }

  const cwd = process.cwd();
  const stanpcIndex = cwd.toLowerCase().indexOf("stanpc");
  if (stanpcIndex !== -1) {
    return path.resolve(cwd.substring(0, stanpcIndex + "stanpc".length));
  }
  return path.resolve(cwd, "..");
}

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(request: NextRequest) {
  try {
    const filePath = request.nextUrl.searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "Missing path parameter" },
        { status: 400 }
      );
    }

    const stanpcRoot = resolveStanpcRoot();
    const fullPath = path.resolve(stanpcRoot, filePath);

    // Containment check via path.relative — string prefix comparison breaks on
    // separator/case differences, and this also covers "..", absolute paths and
    // drive-relative paths in one go.
    const relative = path.relative(stanpcRoot, fullPath);
    if (
      relative === "" ||
      relative.startsWith("..") ||
      path.isAbsolute(relative)
    ) {
      return NextResponse.json({ error: "Path out of bounds" }, { status: 403 });
    }

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const contentType =
      CONTENT_TYPES[path.extname(fullPath).toLowerCase()] ??
      "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Image API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
