import { NextRequest, NextResponse } from "next/server";
import { flyConfig } from "../../../../src/lib/fly";
import { handleGitHubPreviewEvent, verifyGitHubSignature } from "../../../../src/lib/github-webhook";

export async function POST(request: NextRequest) {
  const secret = process.env.FLYHUB_GITHUB_WEBHOOK_SECRET?.trim();
  if (!secret || secret.length < 16) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  const config = flyConfig();
  if (!config) return NextResponse.json({ error: "Fly is not configured" }, { status: 503 });
  const body = await request.text();
  if (body.length > 1_000_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  if (!verifyGitHubSignature(body, request.headers.get("x-hub-signature-256"), secret))
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let payload: unknown;
  try { payload = JSON.parse(body); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  try {
    const result = await handleGitHubPreviewEvent(request.headers.get("x-github-event") || "", payload, config);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook failed" }, { status: 502 });
  }
}
