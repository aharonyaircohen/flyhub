import { NextRequest, NextResponse } from "next/server";
import { isAdmin, isSameOrigin } from "../../../src/lib/auth";
import { browserInput, createBrowser } from "../../../src/lib/browsers";
import { flyConfig } from "../../../src/lib/fly";

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const config = flyConfig();
  if (!config) return NextResponse.json({ error: "Fly is not configured" }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = browserInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a repository and public URL" }, { status: 400 });
  try { return NextResponse.json(await createBrowser(parsed.data, config), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Browser creation failed" }, { status: 502 }); }
}
