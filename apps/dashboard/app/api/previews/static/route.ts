import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, isSameOrigin } from "../../../../src/lib/auth";
import { flyConfig } from "../../../../src/lib/fly";
import { createStaticPreview, removeStaticPreview, staticPreviewInput } from "../../../../src/lib/static-preview";

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const config = flyConfig();
  if (!config) return NextResponse.json({ error: "Fly is not configured" }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = staticPreviewInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid static preview file" }, { status: 400 });
  try { return NextResponse.json(await createStaticPreview(parsed.data, config), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Static preview failed" }, { status: 502 }); }
}

const deleteInput = z.object({ repo: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/), staticId: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/) });

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const config = flyConfig();
  if (!config) return NextResponse.json({ error: "Fly is not configured" }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = deleteInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid static preview" }, { status: 400 });
  try { await removeStaticPreview(parsed.data.repo, parsed.data.staticId, config); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Delete failed" }, { status: 502 }); }
}
