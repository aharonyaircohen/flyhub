import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "../../../src/lib/auth";
import { flyConfig, listApps } from "../../../src/lib/fly";

export async function GET(request: NextRequest) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = flyConfig();
  if (!config)
    return NextResponse.json(
      { error: "Set FLY_API_TOKEN and FLY_ORG_SLUG" },
      { status: 503 },
    );
  try {
    return NextResponse.json({ apps: await listApps(config) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fly request failed" },
      { status: 502 },
    );
  }
}
