import { NextRequest, NextResponse } from "next/server";
import { isAdmin, isSameOrigin } from "../../../../../../../src/lib/auth";
import { actOnMachine, flyConfig } from "../../../../../../../src/lib/fly";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ app: string; id: string }> },
) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const config = flyConfig();
  if (!config)
    return NextResponse.json({ error: "Fly is not configured" }, { status: 503 });
  const { app, id } = await context.params;
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(app) || !/^[A-Za-z0-9_-]{1,80}$/.test(id))
    return NextResponse.json({ error: "Invalid machine" }, { status: 400 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const action =
    body && typeof body === "object" && "action" in body
      ? (body as { action?: unknown }).action
      : undefined;
  if (!(["start", "stop", "suspend", "destroy"] as unknown[]).includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  try {
    await actOnMachine(app, id, action as "start" | "stop" | "suspend" | "destroy", config);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fly request failed" },
      { status: 502 },
    );
  }
}
