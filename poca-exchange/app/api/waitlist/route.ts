import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const KNOWN_SOURCES = new Set([
  "pro_upgrade_header",
  "ai_scan",
  "multi_binder",
  "wiki_report",
]);

export async function POST(request: NextRequest) {
  let body: { email?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const source = typeof body.source === "string" ? body.source : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!KNOWN_SOURCES.has(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  await prisma.waitlistSignup.upsert({
    where: { email_source: { email, source } },
    create: { email, source },
    update: {},
  });

  return NextResponse.json({ success: true });
}
