import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "../../../../../src/lib/auth";
import { appResources, flyConfig } from "../../../../../src/lib/fly";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ app: string }> },
) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = flyConfig();
  if (!config)
    return NextResponse.json(
      { error: "Set FLY_API_TOKEN and FLY_ORG_SLUG" },
      { status: 503 },
    );
  const { app } = await context.params;
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(app))
    return NextResponse.json({ error: "Invalid app" }, { status: 400 });
  try {
    return NextResponse.json(await appResources(app, config));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fly request failed" },
      { status: 502 },
    );
  }
}
