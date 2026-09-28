import { NextRequest, NextResponse } from "next/server";
import { isAdmin, isSameOrigin } from "../../../../../../../src/lib/auth";
import { browserDirectUrl, findMachine, flyConfig } from "../../../../../../../src/lib/fly";

export async function POST(request: NextRequest, context: { params: Promise<{ app: string; id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const config = flyConfig();
  if (!config) return NextResponse.json({ error: "Fly is not configured" }, { status: 503 });
  const { app, id } = await context.params;
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(app) || !/^[A-Za-z0-9_-]{1,80}$/.test(id))
    return NextResponse.json({ error: "Invalid browser machine" }, { status: 400 });
  try {
    const machine = await findMachine(app, id, config);
    if (!machine) return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    if (machine.state !== "started") return NextResponse.json({ error: "Start the machine first" }, { status: 409 });
    return NextResponse.json({ url: browserDirectUrl(app, machine) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Browser link failed" }, { status: 502 });
  }
}
