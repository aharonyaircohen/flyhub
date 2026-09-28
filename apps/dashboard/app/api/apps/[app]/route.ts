import { NextRequest, NextResponse } from "next/server";
import { isAdmin, isSameOrigin } from "../../../../src/lib/auth";
import { destroyManagedApp, flyConfig, isManagedApp } from "../../../../src/lib/fly";

export async function DELETE(request: NextRequest, context: { params: Promise<{ app: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const config = flyConfig();
  if (!config) return NextResponse.json({ error: "Fly is not configured" }, { status: 503 });
  const { app } = await context.params;
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(app) || !isManagedApp(app))
    return NextResponse.json({ error: "Only Flyhub managed apps can be destroyed here" }, { status: 400 });
  try { await destroyManagedApp(app, config); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Destroy failed" }, { status: 502 }); }
}
