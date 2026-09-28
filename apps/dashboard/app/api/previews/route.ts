import { NextRequest, NextResponse } from "next/server";
import { isAdmin, isSameOrigin } from "../../../src/lib/auth";
import { flyConfig } from "../../../src/lib/fly";
import { createPreview, listPreviews, previewInput } from "../../../src/lib/previews";

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = flyConfig();
  if (!config) return NextResponse.json({ error: "Fly is not configured" }, { status: 503 });
  const repo = request.nextUrl.searchParams.get("repo");
  if (!repo || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))
    return NextResponse.json({ error: "Invalid repository" }, { status: 400 });
  try { return NextResponse.json({ previews: await listPreviews(repo, config) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Fly request failed" }, { status: 502 }); }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const config = flyConfig();
  if (!config) return NextResponse.json({ error: "Fly is not configured" }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = previewInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a repository, ref, and PR or branch" }, { status: 400 });
  try { return NextResponse.json(await createPreview(parsed.data, config), { status: 202 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Preview build failed" }, { status: 502 }); }
}
