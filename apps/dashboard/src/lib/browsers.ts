import { randomUUID } from "node:crypto";
import { z } from "zod";
import { deriveBrowserKey } from "../../../../src/browsers/ticket";
import { validatePublicBrowserUrl } from "../../../../src/browsers/security";
import { flyBrowserProvider } from "../../../../src/plugin/browsers";
import type { FlyPreviewConfig } from "../../../../src/plugin/previews/machines-client";

export const browserInput = z.object({
  repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/).max(200),
  initialUrl: z.string().url().max(4096),
});

export async function createBrowser(input: z.infer<typeof browserInput>, config: FlyPreviewConfig) {
  const master = process.env.FLYHUB_MASTER_KEY?.trim();
  if (!master) throw new Error("Set FLYHUB_MASTER_KEY");
  const initialUrl = await validatePublicBrowserUrl(input.initialUrl);
  const [owner, repo] = input.repository.split("/") as [string, string];
  const session = await flyBrowserProvider.createSession({
    owner,
    repo,
    actorId: "flyhub-admin",
    sessionId: randomUUID(),
    initialUrl,
    image: process.env.FLYHUB_BROWSER_IMAGE || "ghcr.io/aharonyaircohen/flyhub-browser:latest",
    config,
    verifyKey: deriveBrowserKey(master).toString("hex"),
  });
  return { appName: session.appName, machineId: session.machineId, state: session.state, endpoint: session.endpoint };
}
