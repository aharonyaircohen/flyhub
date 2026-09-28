import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, isSameOrigin } from "../../../../src/lib/auth";
import { previewAppName } from "../../../../../../src/previews/preview-key";
import { mintBranchPreviewTicket, mintPreviewTicket } from "../../../../../../src/preview-token";

const identity = z.object({
  repo: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
  pr: z.number().int().positive().optional(),
  branch: z.string().min(1).max(255).optional(),
}).refine((value) => (value.pr !== undefined) !== (value.branch !== undefined));

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = identity.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid preview" }, { status: 400 });
  try {
    const key = parsed.data.pr !== undefined ? { repo: parsed.data.repo, pr: parsed.data.pr } : { repo: parsed.data.repo, branch: parsed.data.branch! };
    const appName = previewAppName(key);
    const result = parsed.data.pr !== undefined
      ? mintPreviewTicket(parsed.data.repo, parsed.data.pr, 4 * 60 * 60)
      : mintBranchPreviewTicket(parsed.data.repo, parsed.data.branch!, 4 * 60 * 60);
    return NextResponse.json({ url: `https://${appName}.fly.dev/?kp=${encodeURIComponent(result.ticket)}`, expiresAt: result.expiresAt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Preview link failed" }, { status: 503 });
  }
}
