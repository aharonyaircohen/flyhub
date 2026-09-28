import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { destroyApp, type FlyPreviewConfig } from "../../../../src/plugin/previews/machines-client";
import { previewAppName } from "../../../../src/previews/preview-key";
import { createPreview } from "./previews";

export function verifyGitHubSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  const actual = Buffer.from(signature.slice(7), "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const pullRequestEvent = z.object({
  action: z.string(),
  repository: z.object({ full_name: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/) }),
  number: z.number().int().positive(),
  pull_request: z.object({ head: z.object({ sha: z.string().regex(/^[a-f0-9]{40}$/i) }) }),
});

export async function handleGitHubPreviewEvent(event: string, body: unknown, config: FlyPreviewConfig) {
  if (event !== "pull_request") return { ignored: true };
  const parsed = pullRequestEvent.safeParse(body);
  if (!parsed.success) throw new Error("Invalid pull request event");
  const { action, repository, number, pull_request } = parsed.data;
  if (["opened", "reopened", "synchronize"].includes(action)) {
    return createPreview({ repo: repository.full_name, pr: number, ref: pull_request.head.sha }, config);
  }
  if (action === "closed") {
    await destroyApp(previewAppName({ repo: repository.full_name, pr: number }), config);
    return { destroyed: true };
  }
  return { ignored: true };
}
